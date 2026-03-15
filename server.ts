import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import { createClient } from '@supabase/supabase-js';
import QRCode from 'qrcode';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Initialize Supabase Client
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Help with BigInt serialization if needed, though Supabase returns numbers for BIGINT usually
(BigInt.prototype as any).toJSON = function () {
  return Number(this);
};

// Database initialization and seeding is now handled via migrations directly in Supabase

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
    app.post('/api/login', async (req, res) => {
      const { username, password } = req.body;
      const { data: user, error } = await supabase
        .from('users')
        .select('id, username, role, status, name, avatar')
        .eq('username', username)
        .eq('password', password)
        .single();

      if (user) {
        if (user.status === 'pending') {
          return res.status(403).json({ error: 'Cadastro pendente de aprovação' });
        }
        res.json(user);
      } else {
        res.status(401).json({ error: 'Credenciais inválidas' });
      }
    });

    app.post('/api/register', async (req, res) => {
      const { username, password, name, role, id_document, selfie, phone, cpf } = req.body;
      try {
        const status = role === 'client' ? 'pending' : 'approved';
        const { data, error } = await supabase
          .from('users')
          .insert({ username, password, role, status, name, id_document: id_document || null, selfie: selfie || null, phone: phone || null, cpf: cpf || null })
          .select()
          .single();
        
        if (error) throw error;
        res.json({ id: data.id, status });
      } catch (e) {
        console.error('Registration error:', e);
        res.status(400).json({ error: 'Usuário já existe ou erro no cadastro' });
      }
    });

    app.post('/api/users/:id/info', async (req, res) => {
      const { cpf, phone } = req.body;
      const userId = req.params.id;
      try {
        await supabase.from('users').update({ cpf, phone }).eq('id', userId);
        res.json({ success: true });
      } catch (e) {
        res.status(500).json({ error: 'Erro ao atualizar dados' });
      }
    });

    app.post('/api/users/:id/avatar', async (req, res) => {
      const { avatar } = req.body;
      const userId = req.params.id;
      try {
        await supabase.from('users').update({ avatar }).eq('id', userId);
        res.json({ success: true });
      } catch (e) {
        res.status(500).json({ error: 'Erro ao salvar avatar' });
      }
    });

    // Admin Routes
    app.get('/api/admin/pending-clients', async (req, res) => {
      const { data: clients } = await supabase
        .from('users')
        .select('id, username, name, role, status, id_document, selfie')
        .eq('role', 'client')
        .eq('status', 'pending');
      res.json(clients || []);
    });

    app.get('/api/admin/restaurants', async (req, res) => {
      try {
        const { data: restaurants, error } = await supabase
          .from('restaurants')
          .select(`
            id, userId, name, address, category, delivery_type, lat, lng,
            users (name, username, phone, cpf, avatar)
          `)
          .order('id', { ascending: false });

        if (error) throw error;

        // Flatten the nested user data to match original API format
        const formatted = restaurants.map((r: any) => ({
          ...r,
          ownerName: r.users?.name,
          ownerUsername: r.users?.username,
          phone: r.users?.phone,
          cpf: r.users?.cpf,
          ownerAvatar: r.users?.avatar
        }));

        res.json(formatted);
      } catch (err) {
        console.error('Admin restaurants fetch error:', err);
        res.status(500).json({ error: 'Erro ao buscar restaurantes' });
      }
    });

    app.get('/api/admin/drivers', async (req, res) => {
      try {
        const { data: drivers } = await supabase
          .from('users')
          .select('id, username, name, phone, cpf, status, avatar, id_document, selfie')
          .eq('role', 'driver')
          .order('id', { ascending: false });
        res.json(drivers || []);
      } catch (err) {
        console.error('Admin drivers fetch error:', err);
        res.status(500).json({ error: 'Erro ao buscar entregadores' });
      }
    });

    app.post('/api/admin/approve-client', async (req, res) => {
      const { userId } = req.body;
      await supabase.from('users').update({ status: 'approved' }).eq('id', userId);
      res.json({ success: true });
    });

    // Administrative Management Routes
    app.put('/api/admin/restaurants/:id', async (req, res) => {
      const { name, address, category, delivery_type, ownerName, phone, cpf } = req.body;
      const restaurantId = req.params.id;
      try {
        const { data: restaurant } = await supabase.from('restaurants').select('userId').eq('id', restaurantId).single();
        if (!restaurant) return res.status(404).json({ error: 'Restaurante não encontrado' });

        await supabase.from('restaurants').update({ name, address, category, delivery_type }).eq('id', restaurantId);
        await supabase.from('users').update({ name: ownerName, phone, cpf }).eq('id', restaurant.userId);

        res.json({ success: true });
      } catch (e) {
        console.error('Update restaurant error:', e);
        res.status(500).json({ error: 'Erro ao atualizar restaurante' });
    });

    app.delete('/api/admin/restaurants/:id', async (req, res) => {
      const restaurantId = req.params.id;
      try {
        const { data: restaurant } = await supabase.from('restaurants').select('userId').eq('id', restaurantId).single();
        if (restaurant) {
          // Delete in hierarchical order
          const { data: orders } = await supabase.from('orders').select('id').eq('restaurantId', restaurantId);
          const orderIds = (orders || []).map(o => o.id);

          if (orderIds.length > 0) {
            await supabase.from('order_items').delete().in('orderId', orderIds);
            await supabase.from('orders').delete().in('id', orderIds);
          }
          
          await supabase.from('menu_items').delete().eq('restaurantId', restaurantId);
          await supabase.from('restaurants').delete().eq('id', restaurantId);
          
          await supabase.from('orders').update({ clientId: null }).eq('clientId', restaurant.userId);
          await supabase.from('orders').update({ driverId: null }).eq('driverId', restaurant.userId);
          await supabase.from('users').delete().eq('id', restaurant.userId);
        }
        res.json({ success: true });
      } catch (e) {
        console.error('Delete restaurant error:', e);
        res.status(500).json({ error: 'Erro ao excluir restaurante' });
      }
    });

    app.post('/api/admin/restaurants/:id/reject', async (req, res) => {
      const restaurantId = req.params.id;
      try {
        const { data: restaurant } = await supabase.from('restaurants').select('userId').eq('id', restaurantId).single();
        if (restaurant) {
          await supabase.from('users').update({ status: 'pending' }).eq('id', restaurant.userId);
        }
        res.json({ success: true });
      } catch (e) {
        res.status(500).json({ error: 'Erro ao rejeitar restaurante' });
      }
    });

    app.put('/api/admin/drivers/:id', async (req, res) => {
      const { name, phone, cpf, status } = req.body;
      const userId = req.params.id;
      try {
        await supabase.from('users').update({ name, phone, cpf, status: status || 'approved' }).eq('id', userId);
        res.json({ success: true });
      } catch (e) {
        res.status(500).json({ error: 'Erro ao atualizar entregador' });
      }
    });

    app.delete('/api/admin/drivers/:id', async (req, res) => {
      const userId = req.params.id;
      try {
        await supabase.from('orders').update({ driverId: null }).eq('driverId', userId);
        await supabase.from('orders').update({ clientId: null }).eq('clientId', userId);
        await supabase.from('users').delete().eq('id', userId);
        res.json({ success: true });
      } catch (e) {
        console.error('Delete driver error:', e);
        res.status(500).json({ error: 'Erro ao excluir entregador' });
      }
    });

    app.post('/api/admin/drivers/:id/reject', async (req, res) => {
      const userId = req.params.id;
      try {
        await supabase.from('users').update({ status: 'pending' }).eq('id', userId);
        res.json({ success: true });
      } catch (e) {
        res.status(500).json({ error: 'Erro ao rejeitar entregador' });
      }
    });

    app.get('/api/admin/stats', async (req, res) => {
      try {
        const { data: restaurantStats } = await supabase
          .from('orders')
          .select('restaurantId, total_price, restaurants!inner(id, name)')
          .eq('status', 'delivered');

        const { data: driverStats } = await supabase
          .from('orders')
          .select('driverId, users!inner(id, name)')
          .eq('status', 'delivered');

        // Grouping would normally be done in SQL, but for simplicity and to match logic:
        const rStats = (restaurantStats || []).reduce((acc: any, curr: any) => {
          const id = curr.restaurants.id;
          if (!acc[id]) acc[id] = { id, name: curr.restaurants.name, total_earnings: 0 };
          acc[id].total_earnings += curr.total_price;
          return acc;
        }, {});

        const dStats = (driverStats || []).reduce((acc: any, curr: any) => {
          const id = curr.users.id;
          if (!acc[id]) acc[id] = { id, name: curr.users.name, total_deliveries: 0 };
          acc[id].total_deliveries += 1;
          return acc;
        }, {});

        res.json({ 
          restaurantStats: Object.values(rStats), 
          driverStats: Object.values(dStats) 
        });
      } catch (e) {
        res.status(500).json({ error: 'Erro ao buscar estatísticas' });
      }
    });

    // New Stats Endpoints
    app.get('/api/stats/restaurant/:userId', async (req, res) => {
      try {
        const { data: restaurant } = await supabase.from('restaurants').select('id').eq('userId', req.params.userId).single();
        if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });

        const { data: orders } = await supabase
          .from('orders')
          .select('total_price, delivery_fee, created_at')
          .eq('restaurantId', restaurant.id)
          .eq('status', 'delivered');

        const gross = (orders || []).reduce((sum, o) => sum + o.total_price, 0);
        const net = (orders || []).reduce((sum, o) => sum + (o.total_price - (o.delivery_fee || 0)) * 0.87, 0);
        
        // Simple daily grouping for the last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const daily = (orders || [])
          .filter(o => new Date(o.created_at) >= sevenDaysAgo)
          .reduce((acc: any, o) => {
            const day = new Date(o.created_at).toISOString().split('T')[0];
            if (!acc[day]) acc[day] = { day, count: 0, gross: 0 };
            acc[day].count += 1;
            acc[day].gross += o.total_price;
            return acc;
          }, {});

        res.json({
          gross,
          net,
          count: (orders || []).length,
          daily: Object.values(daily).sort((a: any, b: any) => a.day.localeCompare(b.day))
        });
      } catch (e) {
        res.status(500).json({ error: 'Erro ao buscar estatísticas do restaurante' });
      }
    });

    app.get('/api/stats/driver/:userId', async (req, res) => {
      try {
        const { data: orders } = await supabase
          .from('orders')
          .select('delivery_fee')
          .eq('driverId', req.params.userId)
          .eq('status', 'delivered');

        res.json({
          count: (orders || []).length,
          earnings: (orders || []).reduce((sum, o) => sum + (o.delivery_fee || 0), 0)
        });
      } catch (e) {
        res.status(500).json({ error: 'Erro ao buscar estatísticas do entregador' });
      }
    });

    // Restaurant Routes
    app.get('/api/restaurants', async (req, res) => {
      const { data: restaurants } = await supabase.from('restaurants').select('*');
      res.json(restaurants || []);
    });

    app.post('/api/restaurants', async (req, res) => {
      const { userId, name, address, category, delivery_type, lat, lng } = req.body;
      try {
        const { data, error } = await supabase
          .from('restaurants')
          .insert({ userId, name, address, category, delivery_type: delivery_type || 'platform', lat: lat || 0, lng: lng || 0 })
          .select()
          .single();
        if (error) throw error;
        res.json({ id: data.id });
      } catch (e) {
        console.error('Restaurant creation error:', e);
        res.status(500).json({ error: 'Erro ao criar restaurante' });
      }
    });

    app.post('/api/restaurants/:id/settings', async (req, res) => {
      const { delivery_type } = req.body;
      await supabase.from('restaurants').update({ delivery_type }).eq('id', req.params.id);
      res.json({ success: true });
    });

    app.get('/api/restaurants/:id/menu', async (req, res) => {
      const { data: menu } = await supabase.from('menu_items').select('*').eq('restaurantId', req.params.id);
      res.json(menu || []);
    });

    app.post('/api/restaurants/:id/menu', async (req, res) => {
      const { name, description, price, image } = req.body;
      const { data, error } = await supabase
        .from('menu_items')
        .insert({ restaurantId: req.params.id, name, description, price, image })
        .select()
        .single();
      if (error) throw error;
      res.json({ id: data.id });
    });

    // Order Routes
    app.post('/api/orders', async (req, res) => {
      const { clientId, restaurantId, items, totalPrice, deliveryFee, distance, lat, lng, address } = req.body;
      
      // Check if client is approved
      const { data: client } = await supabase.from('users').select('status').eq('id', clientId).single();
      if (!client || client.status !== 'approved') {
        return res.status(403).json({ error: 'Sua conta ainda não foi aprovada pelo administrador.' });
      }

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({ 
          clientId, restaurantId, status: 'pending', total_price: totalPrice, 
          delivery_fee: deliveryFee || 0, distance: distance || 0, 
          client_lat: lat, client_lng: lng, address 
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = items.map((item: any) => ({
        orderId: order.id,
        menuItemId: item.id,
        quantity: item.quantity,
        price: item.price
      }));

      await supabase.from('order_items').insert(orderItems);
      res.json({ orderId: order.id });
    });

    app.get('/api/orders/client/:clientId', async (req, res) => {
      const { data: orders } = await supabase
        .from('orders')
        .select(`
          *,
          restaurants (name, lat, lng, delivery_type)
        `)
        .eq('clientId', req.params.clientId)
        .order('created_at', { ascending: false });
      
      const formatted = (orders || []).map((o: any) => ({
        ...o,
        restaurantName: o.restaurants?.name,
        restaurantLat: o.restaurants?.lat,
        restaurantLng: o.restaurants?.lng,
        delivery_type: o.restaurants?.delivery_type
      }));

      res.json(formatted);
    });

    app.get('/api/orders/restaurant/:userId', async (req, res) => {
      const { data: restaurant } = await supabase.from('restaurants').select('id').eq('userId', req.params.userId).single();
      if (!restaurant) return res.json([]);

      const { data: orders } = await supabase
        .from('orders')
        .select('*, users!orders_clientId_fkey (name)')
        .eq('restaurantId', restaurant.id)
        .order('created_at', { ascending: false });

      const formatted = (orders || []).map((o: any) => ({
        ...o,
        clientName: o.users?.name
      }));

      res.json(formatted);
    });

    // Get driver's current active order (for restoring state after refresh)
    app.get('/api/orders/driver/:driverId/active', async (req, res) => {
      const { data: order } = await supabase
        .from('orders')
        .select(`
          *, 
          restaurants (name, address, lat, lng),
          users!orders_clientId_fkey (name)
        `)
        .eq('driverId', req.params.driverId)
        .eq('status', 'out_for_delivery')
        .single();
      
      if (!order) return res.json(null);

      const formatted = {
        ...order,
        restaurantName: order.restaurants?.name,
        restaurantAddress: order.restaurants?.address,
        restaurantLat: order.restaurants?.lat,
        restaurantLng: order.restaurants?.lng,
        clientName: order.users?.name
      };

      res.json(formatted);
    });

    app.get('/api/orders/driver/available', async (req, res) => {
      const { data: orders } = await supabase
        .from('orders')
        .select(`
          *, 
          restaurants (name, address, delivery_type)
        `)
        .eq('status', 'preparing')
        .is('driverId', null);
      
      const filtered = (orders || []).filter((o: any) => o.restaurants?.delivery_type === 'platform');
      const formatted = filtered.map((o: any) => ({
        ...o,
        restaurantName: o.restaurants?.name,
        restaurantAddress: o.restaurants?.address
      }));

      res.json(formatted);
    });

    app.post('/api/orders/:id/status', async (req, res) => {
      const { status, driverId } = req.body;
      const updateData: any = { status };
      if (driverId) updateData.driverId = driverId;

      await supabase.from('orders').update(updateData).eq('id', req.params.id);
      res.json({ success: true });
    });
    // PIX Payment Routes
    app.post('/api/payment/pix', async (req, res) => {
      const { clientId, restaurantId, items, totalPrice, deliveryFee, distance, lat, lng, address } = req.body;

      const { data: client } = await supabase.from('users').select('name, phone, cpf, status').eq('id', clientId).single();
      if (!client || client.status !== 'approved') {
        return res.status(403).json({ error: 'Sua conta ainda não foi aprovada.' });
      }

      // Create order with awaiting_payment status
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({ 
          clientId, restaurantId, status: 'pending', total_price: totalPrice, 
          delivery_fee: deliveryFee || 0, distance: distance || 0, 
          client_lat: lat || 0, client_lng: lng || 0, address, payment_status: 'awaiting_payment' 
        })
        .select()
        .single();
      
      if (orderError) throw orderError;
      const orderId = order.id;

      const orderItems = items.map((item: any) => ({
        orderId: orderId,
        menuItemId: item.id,
        quantity: item.quantity,
        price: item.price
      }));
      await supabase.from('order_items').insert(orderItems);

      // Create PIX charge via AbacatePay
      const amountInCents = Math.round(totalPrice * 100);

      try {
        const apiKey = process.env.ABACATEPAY_API_KEY || '';

        const payload = {
          amount: amountInCents,
          description: `Pedido DelivR #${orderId}`,
          expiresIn: 600,
          customer: {
            name: client.name || 'Cliente DelivR',
            email: 'cliente@delivr.app',
            taxId: (client.cpf || '00000000000').replace(/\D/g, ''),
            cellphone: (client.phone || '11999999999').replace(/\D/g, '')
          }
        };

        const resAbacate = await fetch('https://api.abacatepay.com/v1/pixQrCode/create', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        const data = await resAbacate.json();

        if (!resAbacate.ok) {
          console.error('--- AbacatePay API Error ---');
          console.error('Status:', resAbacate.status);
          console.error('Data:', JSON.stringify(data, null, 2));
          return res.status(400).json({
            error: 'Erro no AbacatePay: ' + (data.message || data.error || 'Erro desconhecido'),
            details: data
          });
        }

        // v1 response fields: brCode (copia-cola), brCodeBase64 (QR image), id
        const paymentId = data.data?.id || '';
        const pixText = data.data?.brCode || '';
        const brCodeBase64 = data.data?.brCodeBase64 || '';

        await supabase.from('orders').update({ payment_id: paymentId }).eq('id', orderId);

        // Use the base64 QR from AbacatePay directly, or generate from text
        let qrCodeBase64 = '';
        if (brCodeBase64) {
          qrCodeBase64 = brCodeBase64.startsWith('data:')
            ? brCodeBase64
            : `data:image/png;base64,${brCodeBase64}`;
        } else if (pixText) {
          qrCodeBase64 = await QRCode.toDataURL(pixText, { width: 300, margin: 2 });
        }

        res.json({ orderId, paymentId, pixText, qrCodeBase64 });
      } catch (err) {
        // Fallback to mock PIX when AbacatePay fails
        console.error('AbacatePay PIX error, using mock fallback:', err);
        const mockPixText = `00020126440014br.gov.bcb.pix0122mockpix@delivr.app5204000053039865802BR5916DelivR Delivery6009Sao Paulo62290525MockPixOrder${orderId}63041A2B`;
        try {
          const qrCodeBase64 = await QRCode.toDataURL(mockPixText, { width: 300, margin: 2 });
          res.json({ orderId, paymentId: 'mock_abacate_id', pixText: mockPixText, qrCodeBase64, isMock: true });
        } catch (qrErr) {
          res.status(500).json({ error: 'Erro ao gerar QR Code PIX de fallback.' });
        }
      }
    });

    // Endpoint for non-PIX (Dinheiro / Cartão)
    app.post('/api/payment/checkout', async (req, res) => {
      const { clientId, restaurantId, items, totalPrice, deliveryFee, distance, lat, lng, address, method } = req.body;

      const { data: client } = await supabase.from('users').select('status').eq('id', clientId).single();
      if (!client || client.status !== 'approved') {
        return res.status(403).json({ error: 'Sua conta ainda não foi aprovada.' });
      }

      // Create order with paid or pending status dependent on method
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({ 
          clientId, restaurantId, status: 'pending', total_price: totalPrice, 
          delivery_fee: deliveryFee || 0, distance: distance || 0, 
          client_lat: lat || 0, client_lng: lng || 0, address, payment_status: `${method}_at_door` 
        })
        .select()
        .single();
      
      if (orderError) throw orderError;
      const orderId = order.id;

      const orderItems = items.map((item: any) => ({
        orderId: orderId,
        menuItemId: item.id,
        quantity: item.quantity,
        price: item.price
      }));
      await supabase.from('order_items').insert(orderItems);

      res.json({ orderId, success: true });
    });

    app.get('/api/payment/status/:orderId', async (req, res) => {
      const { data: order } = await supabase.from('orders').select('payment_id, payment_status').eq('id', req.params.orderId).single();
      if (!order) return res.status(404).json({ error: 'Pedido não encontrado' });
      if (order.payment_status === 'paid') return res.json({ status: 'paid' });
      if (!order.payment_id || order.payment_id.startsWith('mock_')) return res.json({ status: 'awaiting_payment' });

      try {
        const apiKey = process.env.ABACATEPAY_API_KEY || '';

        const resAbacate = await fetch(`https://api.abacatepay.com/v1/pixQrCode/check?id=${order.payment_id}`, {
          headers: {
            'Authorization': `Bearer ${apiKey}`
          }
        });
        const data = await resAbacate.json();

        const status = data.data?.status || '';
        if (status === 'PAID' || status === 'paid') {
          await supabase.from('orders').update({ payment_status: 'paid' }).eq('id', req.params.orderId);
          return res.json({ status: 'paid' });
        }
        return res.json({ status: 'awaiting_payment' });
      } catch {
        return res.json({ status: order.payment_status || 'awaiting_payment' });
      }
    });

    app.post('/api/payment/webhook', async (req, res) => {
      const event = req.body;

      // AbacatePay sends billing.paid when PIX is confirmed
      if (event.event === 'billing.paid') {
        const abacateId = event.data?.id;

        if (abacateId) {
          const { data: localOrder } = await supabase.from('orders').select('id').eq('payment_id', abacateId).single();
          if (localOrder) {
            await supabase.from('orders').update({ payment_status: 'paid' }).eq('id', localOrder.id);
            console.log(`Payment confirmed for local order ${localOrder.id} (AbacatePay ID: ${abacateId})`);
          }
        }
      }
      res.sendStatus(200);
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

