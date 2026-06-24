-- ==========================================
-- MD photography - PRODUCTION POSTGRESQL SCHEMA (SUPABASE DIRECTIVE)
-- ==========================================

-- 1. users Table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  points INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. admins Table
CREATE TABLE IF NOT EXISTS admins (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL
);

-- 3. services Table
CREATE TABLE IF NOT EXISTS services (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  image_url TEXT,
  description TEXT,
  starting_price DOUBLE PRECISION NOT NULL
);

-- 4. equipments Table
CREATE TABLE IF NOT EXISTS equipments (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  price DOUBLE PRECISION NOT NULL,
  description TEXT,
  image_url TEXT,
  duration TEXT NOT NULL
);

-- 5. packages Table
CREATE TABLE IF NOT EXISTS packages (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  price DOUBLE PRECISION NOT NULL,
  description TEXT
);

-- 6. package_items Table
CREATE TABLE IF NOT EXISTS package_items (
  id SERIAL PRIMARY KEY,
  package_id INTEGER NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
  equipment_name TEXT NOT NULL,
  quantity INTEGER NOT NULL
);

-- 7. bookings Table
CREATE TABLE IF NOT EXISTS bookings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  event_name TEXT NOT NULL,
  event_date TEXT NOT NULL,
  event_location TEXT NOT NULL,
  package_id INTEGER,
  package_name TEXT,
  package_price DOUBLE PRECISION,
  subtotal DOUBLE PRECISION NOT NULL,
  discount DOUBLE PRECISION DEFAULT 0,
  total_price DOUBLE PRECISION NOT NULL,
  advance_paid DOUBLE PRECISION DEFAULT 0,
  status TEXT NOT NULL, -- 'draft', 'confirmed', 'completed', 'cancelled'
  payment_status TEXT NOT NULL, -- 'pending', '20_percent_paid', '90_percent_paid', 'fully_paid'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. booking_equipments Table
CREATE TABLE IF NOT EXISTS booking_equipments (
  id SERIAL PRIMARY KEY,
  booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  equipment_name TEXT NOT NULL,
  price DOUBLE PRECISION NOT NULL
);

-- 9. cart Table
CREATE TABLE IF NOT EXISTS cart (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_name TEXT,
  event_date TEXT,
  event_location TEXT,
  package_id INTEGER,
  equipment_ids TEXT -- JSON string array of equipment IDs
);

-- 10. payments Table
CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  booking_id INTEGER NOT NULL REFERENCES bookings(id),
  amount DOUBLE PRECISION NOT NULL,
  stage TEXT NOT NULL, -- '20_percent', '70_percent', '10_percent'
  transaction_id TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL, -- 'pending', 'completed', 'failed'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. rewards Table
CREATE TABLE IF NOT EXISTS rewards (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  booking_id INTEGER,
  points_earned INTEGER DEFAULT 0,
  points_redeemed INTEGER DEFAULT 0,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 12. gallery Table
CREATE TABLE IF NOT EXISTS gallery (
  id SERIAL PRIMARY KEY,
  image_url TEXT NOT NULL,
  title TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 13. studio_details Table
CREATE TABLE IF NOT EXISTS studio_details (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  tagline TEXT,
  logo_url TEXT,
  mobile TEXT,
  whatsapp TEXT,
  address TEXT,
  email TEXT,
  maps_url TEXT
);

-- 14. notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL, -- 'Email', 'WhatsApp', 'In-App'
  sent_via TEXT NOT NULL, -- 'Email', 'WhatsApp'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 15. booking_logs Table
CREATE TABLE IF NOT EXISTS booking_logs (
  id SERIAL PRIMARY KEY,
  booking_id INTEGER NOT NULL,
  username TEXT NOT NULL,
  event_name TEXT NOT NULL,
  event_date TEXT NOT NULL,
  total_price DOUBLE PRECISION NOT NULL,
  admin_read INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 16. password_retrievals Table
CREATE TABLE IF NOT EXISTS password_retrievals (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  username TEXT NOT NULL,
  phone TEXT NOT NULL,
  temp_password TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'declined'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 17. reviews Table
CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  booking_id INTEGER NOT NULL,
  username TEXT NOT NULL,
  event_name TEXT NOT NULL,
  rating INTEGER NOT NULL,
  review_text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
