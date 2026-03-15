import 'dotenv/config';
import Database from 'better-sqlite3';
import { createClient } from '@supabase/supabase-js';

const db = new Database('delivery.db');
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function migrateData() {
  console.log('--- Starting Data Migration ---');

  // Migrate Users
  const users = db.prepare('SELECT * FROM users').all();
  console.log(`Found ${users.length} users in SQLite.`);
  for (const user of users) {
    const { id, ...userData } = user as any;
    const { error } = await supabase.from('users').upsert({ id, ...userData });
    if (error) console.error(`Error migrating user ${id}:`, error.message);
  }

  // Migrate Restaurants
  const restaurants = db.prepare('SELECT * FROM restaurants').all();
  console.log(`Found ${restaurants.length} restaurants in SQLite.`);
  for (const res of restaurants) {
    const { id, ...resData } = res as any;
    const { error } = await supabase.from('restaurants').upsert({ id, ...resData });
    if (error) console.error(`Error migrating restaurant ${id}:`, error.message);
  }

  // Migrate Menu Items
  const menuItems = db.prepare('SELECT * FROM menu_items').all();
  console.log(`Found ${menuItems.length} menu items in SQLite.`);
  for (const item of menuItems) {
    const { id, ...itemData } = item as any;
    const { error } = await supabase.from('menu_items').upsert({ id, ...itemData });
    if (error) console.error(`Error migrating menu item ${id}:`, error.message);
  }

  // Migrate Orders
  const orders = db.prepare('SELECT * FROM orders').all();
  console.log(`Found ${orders.length} orders in SQLite.`);
  for (const order of orders) {
    const { id, ...orderData } = order as any;
    const { error } = await supabase.from('orders').upsert({ id, ...orderData });
    if (error) console.error(`Error migrating order ${id}:`, error.message);
  }

  // Migrate Order Items
  const orderItems = db.prepare('SELECT * FROM order_items').all();
  console.log(`Found ${orderItems.length} order items in SQLite.`);
  for (const item of orderItems) {
    const { id, ...itemData } = item as any;
    const { error } = await supabase.from('order_items').upsert({ id, ...itemData });
    if (error) console.error(`Error migrating order item ${id}:`, error.message);
  }

  console.log('--- Migration Finished ---');
}

migrateData();
