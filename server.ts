import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database('delivery.db');

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT, -- admin, client, restaurant, driver
    status TEXT DEFAULT 'approved', -- pending, approved
    name TEXT,
    id_document TEXT, -- base64 image
    selfie TEXT -- base64 image
  );

  CREATE TABLE IF NOT EXISTS restaurants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER,
    name TEXT,
    address TEXT,
    category TEXT,
    FOREIGN KEY(userId) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS menu_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    restaurantId INTEGER,
    name TEXT,
    description TEXT,
    price REAL,
    image TEXT,
    FOREIGN KEY(restaurantId) REFERENCES restaurants(id)
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    clientId INTEGER,
    restaurantId INTEGER,
    driverId INTEGER,
    status TEXT, -- pending, preparing, out_for_delivery, delivered
    total_price REAL,
    client_lat REAL,
    client_lng REAL,
    address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(clientId) REFERENCES users(id),
    FOREIGN KEY(restaurantId) REFERENCES restaurants(id),
    FOREIGN KEY(driverId) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    orderId INTEGER,
    menuItemId INTEGER,
    quantity INTEGER,
    price REAL,
    FOREIGN KEY(orderId) REFERENCES orders(id),
    FOREIGN KEY(menuItemId) REFERENCES menu_items(id)
  );
`);

// Migration: Add missing columns if they don't exist
const migrate = () => {
  const tables = {
    users: { id_document: 'TEXT', selfie: 'TEXT' },
    orders: { client_lat: 'REAL', client_lng: 'REAL', address: 'TEXT' }
  };

  for (const [table, columns] of Object.entries(tables)) {
    const info = db.prepare(`PRAGMA table_info(${table})`).all() as any[];
    const existingColumns = info.map(c => c.name);
    
    for (const [col, type] of Object.entries(columns)) {
      if (!existingColumns.includes(col)) {
        try {
          db.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${type}`);
          console.log(`Migration: Added column ${col} (${type}) to table ${table}`);
        } catch (e) {
          console.error(`Migration error on ${table}.${col}:`, e);
        }
      }
    }
  }
};
migrate();

// Seed Admin
const adminExists = db.prepare('SELECT * FROM users WHERE username = ?').get('marianodasilva');
if (!adminExists) {
  db.prepare('INSERT INTO users (username, password, role, status, name) VALUES (?, ?, ?, ?, ?)')
    .run('marianodasilva', 'M@1dasilva', 'admin', 'approved', 'Mariano da Silva');
}

async function startServer() {
  try {
    const app = express();
    const server = createServer(app);
    const wss = new WebSocketServer({ server });

    app.use(express.json({ limit: '50mb' }));
    app.use(express.urlencoded({ limit: '50mb', extended: true }));

    // Health check
    app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

    // Auth Middleware
    app.post('/api/login', (req, res) => {
      const { username, password } = req.body;
      const user = db.prepare('SELECT id, username, role, status, name FROM users WHERE username = ? AND password = ?').get(username, password);
      if (user) {
        if (user.status === 'pending') {
          return res.status(403).json({ error: 'Cadastro pendente de aprovação' });
        }
        res.json(user);
      } else {
        res.status(401).json({ error: 'Credenciais inválidas' });
      }
    });

    app.post('/api/register', (req, res) => {
      const { username, password, name, role, id_document, selfie } = req.body;
      try {
        const status = role === 'client' ? 'pending' : 'approved';
        const result = db.prepare('INSERT INTO users (username, password, role, status, name, id_document, selfie) VALUES (?, ?, ?, ?, ?, ?, ?)')
          .run(username, password, role, status, name, id_document || null, selfie || null);
        res.json({ id: result.lastInsertRowid, status });
      } catch (e) {
        res.status(400).json({ error: 'Usuário já existe' });
      }
    });

    // Admin Routes
    app.get('/api/admin/pending-clients', (req, res) => {
      const clients = db.prepare("SELECT id, username, name, role, status, id_document, selfie FROM users WHERE role = 'client' AND status = 'pending'").all();
      res.json(clients);
    });

    app.post('/api/admin/approve-client', (req, res) => {
      const { userId } = req.body;
      db.prepare("UPDATE users SET status = 'approved' WHERE id = ?").run(userId);
      res.json({ success: true });
    });

    app.get('/api/admin/stats', (req, res) => {
      const restaurantStats = db.prepare(`
        SELECT r.name, SUM(o.total_price) as total_earnings
        FROM restaurants r
        JOIN orders o ON r.id = o.restaurantId
        WHERE o.status = 'delivered'
        GROUP BY r.id
      `).all();

      const driverStats = db.prepare(`
        SELECT u.name, COUNT(o.id) as total_deliveries
        FROM users u
        JOIN orders o ON u.id = o.driverId
        WHERE u.role = 'driver' AND o.status = 'delivered'
        GROUP BY u.id
      `).all();

      res.json({ restaurantStats, driverStats });
    });

    // Restaurant Routes
    app.get('/api/restaurants', (req, res) => {
      const restaurants = db.prepare('SELECT * FROM restaurants').all();
      res.json(restaurants);
    });

    app.post('/api/restaurants', (req, res) => {
      const { userId, name, address, category } = req.body;
      const result = db.prepare('INSERT INTO restaurants (userId, name, address, category) VALUES (?, ?, ?, ?)')
        .run(userId, name, address, category);
      res.json({ id: result.lastInsertRowid });
    });

    app.get('/api/restaurants/:id/menu', (req, res) => {
      const menu = db.prepare('SELECT * FROM menu_items WHERE restaurantId = ?').all(req.params.id);
      res.json(menu);
    });

    app.post('/api/restaurants/:id/menu', (req, res) => {
      const { name, description, price, image } = req.body;
      const result = db.prepare('INSERT INTO menu_items (restaurantId, name, description, price, image) VALUES (?, ?, ?, ?, ?)')
        .run(req.params.id, name, description, price, image);
      res.json({ id: result.lastInsertRowid });
    });

    // Order Routes
    app.post('/api/orders', (req, res) => {
      const { clientId, restaurantId, items, totalPrice, lat, lng, address } = req.body;
      
      // Check if client is approved
      const client = db.prepare('SELECT status FROM users WHERE id = ?').get(clientId);
      if (!client || client.status !== 'approved') {
        return res.status(403).json({ error: 'Sua conta ainda não foi aprovada pelo administrador.' });
      }

      const result = db.prepare('INSERT INTO orders (clientId, restaurantId, status, total_price, client_lat, client_lng, address) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .run(clientId, restaurantId, 'pending', totalPrice, lat, lng, address);
      const orderId = result.lastInsertRowid;

      const stmt = db.prepare('INSERT INTO order_items (orderId, menuItemId, quantity, price) VALUES (?, ?, ?, ?)');
      for (const item of items) {
        stmt.run(orderId, item.id, item.quantity, item.price);
      }
      res.json({ orderId });
    });

    app.get('/api/orders/client/:clientId', (req, res) => {
      const orders = db.prepare(`
        SELECT o.*, r.name as restaurantName
        FROM orders o
        JOIN restaurants r ON o.restaurantId = r.id
        WHERE o.clientId = ?
        ORDER BY o.created_at DESC
      `).all(req.params.clientId);
      res.json(orders);
    });

    app.get('/api/orders/restaurant/:userId', (req, res) => {
      const restaurant = db.prepare('SELECT id FROM restaurants WHERE userId = ?').get(req.params.userId);
      if (!restaurant) return res.json([]);
      const orders = db.prepare(`
        SELECT o.*, u.name as clientName
        FROM orders o
        JOIN users u ON o.clientId = u.id
        WHERE o.restaurantId = ?
        ORDER BY o.created_at DESC
      `).all(restaurant.id);
      res.json(orders);
    });

    // Get driver's current active order (for restoring state after refresh)
    app.get('/api/orders/driver/:driverId/active', (req, res) => {
      const order = db.prepare(`
        SELECT o.*, r.name as restaurantName, r.address as restaurantAddress
        FROM orders o
        JOIN restaurants r ON o.restaurantId = r.id
        WHERE o.driverId = ? AND o.status = 'out_for_delivery'
        LIMIT 1
      `).get(req.params.driverId) as any;
      res.json(order || null);
    });

    app.get('/api/orders/driver/available', (req, res) => {
      const orders = db.prepare(`
        SELECT o.*, r.name as restaurantName, r.address as restaurantAddress
        FROM orders o
        JOIN restaurants r ON o.restaurantId = r.id
        WHERE o.status = 'preparing' AND o.driverId IS NULL
      `).all();
      res.json(orders);
    });

    app.post('/api/orders/:id/status', (req, res) => {
      const { status, driverId } = req.body;
      if (driverId) {
        db.prepare('UPDATE orders SET status = ?, driverId = ? WHERE id = ?').run(status, driverId, req.params.id);
      } else {
        db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, req.params.id);
      }
      res.json({ success: true });
    });

    // WebSockets
    wss.on('connection', (ws) => {
      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message.toString());
          if (data.type === 'update_location') {
            wss.clients.forEach((client) => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(data));
              }
            });
          }
        } catch (e) {}
      });
    });

    // Vite middleware
    if (process.env.NODE_ENV !== 'production') {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } else {
      app.use(express.static(path.join(__dirname, 'dist')));
      app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, 'dist', 'index.html'));
      });
    }

    const PORT = 3000;
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
  }
}

startServer();
