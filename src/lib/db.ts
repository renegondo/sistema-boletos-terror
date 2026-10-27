import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import bcrypt from 'bcryptjs';

const DB_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const DB_PATH = path.join(DB_DIR, 'boletos.db');

let dbInstance: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (!dbInstance) {
    dbInstance = new DatabaseSync(DB_PATH);
    initDb(dbInstance);
  }
  return dbInstance;
}

function initDb(db: DatabaseSync) {
  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'vendor',
      phone TEXT,
      commission_type TEXT NOT NULL DEFAULT 'percentage', -- 'percentage' | 'fixed'
      commission_rate REAL NOT NULL DEFAULT 10.0,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      location TEXT NOT NULL,
      event_date TEXT NOT NULL,
      event_time TEXT NOT NULL,
      banner_url TEXT,
      status TEXT NOT NULL DEFAULT 'active', -- 'active' | 'draft' | 'completed' | 'cancelled'
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ticket_tiers (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      capacity INTEGER NOT NULL,
      sold_count INTEGER NOT NULL DEFAULT 0,
      description TEXT,
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL,
      vendor_id TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      customer_email TEXT,
      payment_method TEXT NOT NULL, -- 'cash' | 'card' | 'transfer'
      total_amount REAL NOT NULL,
      vendor_commission_amount REAL NOT NULL,
      commission_type_applied TEXT NOT NULL,
      commission_rate_applied REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'completed',
      whatsapp_status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'sent' | 'failed'
      whatsapp_error TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (event_id) REFERENCES events(id),
      FOREIGN KEY (vendor_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS tickets (
      id TEXT PRIMARY KEY,
      ticket_code TEXT UNIQUE NOT NULL,
      order_id TEXT NOT NULL,
      tier_id TEXT NOT NULL,
      event_id TEXT NOT NULL,
      attendee_name TEXT NOT NULL,
      price REAL NOT NULL,
      qr_data TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'valid', -- 'valid' | 'used' | 'cancelled'
      used_at TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (tier_id) REFERENCES ticket_tiers(id),
      FOREIGN KEY (event_id) REFERENCES events(id)
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS commission_payouts (
      id TEXT PRIMARY KEY,
      vendor_id TEXT NOT NULL,
      amount REAL NOT NULL,
      notes TEXT,
      paid_at TEXT NOT NULL,
      created_by TEXT NOT NULL,
      FOREIGN KEY (vendor_id) REFERENCES users(id)
    );
  `);

  // Check if admin user exists
  const checkAdmin = db.prepare('SELECT id FROM users WHERE role = ? LIMIT 1');
  const adminExists = checkAdmin.get('admin');

  if (!adminExists) {
    const adminPasswordHash = bcrypt.hashSync('admin123', 10);
    const vendorPasswordHash = bcrypt.hashSync('vendedor123', 10);
    const now = new Date().toISOString();

    const insertUser = db.prepare(`
      INSERT INTO users (id, name, email, password_hash, role, phone, commission_type, commission_rate, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Admin default
    insertUser.run(
      'usr_admin_001',
      'Administrador Principal',
      'admin@boletos.com',
      adminPasswordHash,
      'admin',
      '+5215512345678',
      'percentage',
      0,
      1,
      now
    );

    // Vendor default 1 (comisión en porcentaje: 10%)
    insertUser.run(
      'usr_vendor_001',
      'Carlos Mendoza (RP)',
      'carlos@boletos.com',
      vendorPasswordHash,
      'vendor',
      '+5215598765432',
      'percentage',
      10.0,
      1,
      now
    );

    // Vendor default 2 (comisión fija: $50 MXN por boleto)
    insertUser.run(
      'usr_vendor_002',
      'Ana Sofía Torres',
      'ana@boletos.com',
      vendorPasswordHash,
      'vendor',
      '+5215576543210',
      'fixed',
      50.0,
      1,
      now
    );

    // Seed Demo Event
    const eventId = 'evt_demo_001';
    const insertEvent = db.prepare(`
      INSERT INTO events (id, title, description, location, event_date, event_time, banner_url, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertEvent.run(
      eventId,
      'Neon Beats Music Fest 2026',
      'El festival de música electrónica y experiencias inmersivas más esperado del año. Acceso exclusivo con pulsera y boleto digital.',
      'Auditorio Metropolitano / Foro Principal, Ciudad de México',
      '2026-11-20',
      '20:00',
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80',
      'active',
      now
    );

    // Seed Tiers
    const insertTier = db.prepare(`
      INSERT INTO ticket_tiers (id, event_id, name, price, capacity, sold_count, description)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    insertTier.run('tier_001', eventId, 'General Fase 1', 350.0, 500, 0, 'Acceso general al festival');
    insertTier.run('tier_002', eventId, 'VIP Lounge & Deck', 850.0, 150, 0, 'Acceso preferencial, barra exclusiva y baños VIP');
    insertTier.run('tier_003', eventId, 'Backstage All Access', 1500.0, 30, 0, 'Acceso total a escenario, hospitality y zona de artistas');

    // Default Settings
    const insertSetting = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
    insertSetting.run('evolution_api_url', 'https://api.bebot.click');
    insertSetting.run('evolution_api_key', 'lJkzchqWmDn9ZNyuKaQRogOFVOvCwhGfXARtIG9e9pv9WZsbjoRqo');
    insertSetting.run('evolution_instance_name', 'ayuntamiento');
    insertSetting.run('currency_symbol', '$');
    insertSetting.run('currency_code', 'MXN');
    insertSetting.run('business_name', 'Hi-Boletos Express');
    insertSetting.run('whatsapp_auto_send', '1');
  }

  // Ensure columns and seed Horror Fest event
  try {
    db.exec(`ALTER TABLE orders ADD COLUMN notes TEXT;`);
  } catch {
    // Column already exists
  }

  // Ensure Horror Fest 2026 event exists
  const checkHorrorEvent = db.prepare('SELECT id FROM events WHERE id = ?');
  const horrorEventExists = checkHorrorEvent.get('evt_rodada_terror_2026');

  if (!horrorEventExists) {
    const now = new Date().toISOString();
    const insertEvent = db.prepare(`
      INSERT INTO events (id, title, description, location, event_date, event_time, banner_url, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertEvent.run(
      'evt_rodada_terror_2026',
      'After de Rodada del Terror 2026 - HORROR FEST',
      'El after oficial más salvaje de la Rodada del Terror 2026 organizado por Flow Productions. Gran fiesta en Salón del Sindicato del IMSS tras la caravana masiva de 800+ motocicletas. Shows estelares de Vale Queen (@Valequeenoficial), DJ Jhonas (+300k oyentes Spotify), Dege (Trap), Pasatiempo & El Bala, Los Babys (Gogos Show) y DJ Fragot. Modalidad BYOB (Descorche Libre) + Rifas de cascos, accesorios biker y botellas.',
      'Salón del Sindicato del IMSS, Ciudad de México',
      '2026-11-01',
      '21:00',
      '/images/flyer-rodada-del-terror.jpg',
      'active',
      now
    );

    const insertTier = db.prepare(`
      INSERT INTO ticket_tiers (id, event_id, name, price, capacity, sold_count, description)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    insertTier.run(
      'tier_terror_001',
      'evt_rodada_terror_2026',
      'Cover General BYOB (Preventa Etapa 1)',
      150.0,
      400,
      0,
      'Acceso general al Salón del Sindicato del IMSS + Ingreso de tus propias botellas/bebidas (BYOB) sin cobro extra + Acceso a sorteos y rifas en vivo'
    );

    insertTier.run(
      'tier_terror_002',
      'evt_rodada_terror_2026',
      'VIP Horror Lounge & Terraza',
      450.0,
      80,
      0,
      'Zona preferencial elevada con vista frontal a escenario, servicio de meseros, barra rápida y pulsera conmemorativa coleccionable'
    );

    insertTier.run(
      'tier_terror_003',
      'evt_rodada_terror_2026',
      'Biker Pack All Access + Hospitality',
      800.0,
      30,
      0,
      'Pase preferente de caravana, estacionamiento privado para motocicleta, acceso hospitality backstage con Vale Queen & DJ Jhonas + Kit biker del terror'
    );
  }

  // Ensure Preventa Etapa 1 price is 150
  try {
    db.prepare(`
      UPDATE ticket_tiers 
      SET price = 150.0, name = 'Cover General BYOB (Preventa Etapa 1)'
      WHERE id = 'tier_terror_001' AND (price = 200.0 OR price != 150.0)
    `).run();
  } catch {
    // Ignore if table/record not yet initialized
  }
}

