import pg from "pg";
import bcrypt from "bcryptjs";
import dns from "dns";
import fs from "fs";
import path from "path";

const MEMORY_DB_FILE = path.join(process.cwd(), "memory_db_state.json");

// Force Node.js to prefer IPv4 over IPv6 when resolving DNS.
// This resolves the ECONNREFUSED error on environments that do not support IPv6.
if (dns && typeof dns.setDefaultResultOrder === "function") {
  dns.setDefaultResultOrder("ipv4first");
}

// Set up pg types to parse BigInt (COUNT(*)) and Numeric to numbers
pg.types.setTypeParser(20, (val) => parseInt(val, 10));
pg.types.setTypeParser(1700, (val) => parseFloat(val));

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn("WARNING: DATABASE_URL environment variable is not defined!");
}

export const pool = new Pool({
  connectionString,
  ssl: connectionString?.includes("localhost") || connectionString?.includes("127.0.0.1")
    ? false
    : { rejectUnauthorized: false },
});

export function convertPlaceholders(sql: string): string {
  let count = 1;
  return sql.replace(/\?/g, () => `$${count++}`);
}

// Transparent Fallback In-Memory Storage
export let useFallbackMemory = false;
export let dbConnectionError: string | null = null;

export const memoryDB: { [table: string]: any[] } = {
  users: [],
  admins: [],
  services: [],
  equipments: [],
  packages: [],
  package_items: [],
  bookings: [],
  booking_equipments: [],
  cart: [],
  payments: [],
  rewards: [],
  gallery: [],
  studio_details: [],
  notifications: [],
  booking_logs: [],
  password_retrievals: [],
  reviews: []
};

export function saveMemoryToDisc() {
  try {
    fs.writeFileSync(MEMORY_DB_FILE, JSON.stringify(memoryDB, null, 2), "utf8");
  } catch (err) {
    console.warn("Failed to write persistent local backup:", err);
  }
}

export function loadMemoryFromDisc(): boolean {
  try {
    if (fs.existsSync(MEMORY_DB_FILE)) {
      const raw = fs.readFileSync(MEMORY_DB_FILE, "utf8");
      const parsed = JSON.parse(raw);
      Object.keys(parsed).forEach(key => {
        memoryDB[key] = parsed[key];
      });
      console.log("💾 Successfully restored local backend records from disk persistence!");
      return true;
    }
  } catch (err) {
    console.warn("Could not restore local persistence backup:", err);
  }
  return false;
}

// Seeding standard mock data lists for the In-Memory engine
async function seedDefaultMemoryDB() {
  console.log("Seeding zero-dependency high-fidelity In-Memory engine fallback data...");

  // Seed default admin
  const adminHashed = await bcrypt.hash("admin123", 10);
  memoryDB.admins.push({
    id: 1,
    username: "admin",
    email: "admin@mdphotography.com",
    password: adminHashed
  });

  // Seed default studio details
  memoryDB.studio_details.push({
    id: 1,
    name: "MD Photography",
    tagline: "Capturing Memories Forever",
    logo_url: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&q=80&w=200",
    mobile: "+91 98765 43210",
    whatsapp: "+91 98765 43210",
    address: "123 Frame Lane, Memory Street, Hyderabad, Telangana, 500001",
    email: "contact@mdphotography.com",
    maps_url: "https://maps.google.com/?q=MD+Photography+Hyderabad"
  });

  // Seed default services
  const rawServices = [
    { id: 1, name: "Engagement", starting_price: 20000, description: "Capture the precious ring-exchange moment with pre-designed couple portraits. (100 pic with 1xAlbum and video)", image_url: "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&q=80&w=600" },
    { id: 2, name: "Pre/post Wedding shoot in outdoor", starting_price: 25000, description: "A creative cinematic session at aesthetic outdoor spots before your big day. (photo soft copy and vedio 3 min song with edit)", image_url: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=600" },
    { id: 3, name: "Haldi & Nalugu", starting_price: 20000, description: "Fun-filled candid portraits and reels covered in joyous turmeric colors (100 pic with IxAlbum and video)", image_url: "https://images.unsplash.com/photo-1607190074257-dd4b7af0309f?auto=format&fit=crop&q=80&w=600" },
    { id: 4, name: "Mehendi", starting_price: 20000, description: "Intricate henna detail photography paired with energetic group dancing clips. (100 pic with 1xAlbum and yldea)", image_url: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&q=80&w=600" },
    { id: 5, name: "Birthday Parties", starting_price: 20000, description: "Active games, party sessions, and quick candid photobooths for guests. (100 pic with 1xAlbum and video)", image_url: "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&q=80&w=600" },
    { id: 6, name: "Mini Events", starting_price: 12000, description: "Vibrant coverage of themed stages, laughter, and high-energy cake cuttings. only photos (100 pic with 1xAlbum)", image_url: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&q=80&w=600" },
    { id: 7, name: "Naming Ceremony", starting_price: 20000, description: "Candid family memories of the child's naming rituals and celebrations. (100 pic with 1xAlbum and video)", image_url: "https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&q=80&w=600" },
    { id: 8, name: "New Born Baby Shoot", starting_price: 12000, description: "Adorable baby portraits with safe thematic props and comforting set lighting. (only photo soft copy)", image_url: "https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&q=80&w=600" },
    { id: 9, name: "pre/Post outdoor photo shoot", starting_price: 15000, description: "Relaxed couple portraits post-ceremony designed for beautiful memory books. (soft copy only)", image_url: "https://images.unsplash.com/photo-1507504038482-7621c210ee20?auto=format&fit=crop&q=80&w=600" },
    { id: 10, name: "Public Events", starting_price: 20000, description: "Sharp event coverage with crowd interaction clips, banner designs, and live feeds. (soft copy only photo and video)", image_url: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&q=80&w=600" },
    { id: 11, name: "Reception", starting_price: 25000, description: "Elegant stage portraits and comprehensive coverage of evening banquets. (150 pic with 1xAlbum and video)", image_url: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=600" },
    { id: 12, name: "Short Films & Ads", starting_price: 35000, description: "Cinematic commercial and short media production with sound recording. wedding Promo's, Teasers", image_url: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&q=80&w=600" },
    { id: 13, name: "Srimantham / Seemantham", starting_price: 20000, description: "Beautifully capturing the traditional baby shower rituals with family blessings. (100 pic with 1xAlbum and video)", image_url: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&q=80&w=600" },
    { id: 14, name: "Wedding", starting_price: 25000, description: "Complete emotional and high-fidelity coverage of the sacred vows and rituals. (120 pic with 1xAlbum and video)", image_url: "https://images.unsplash.com/photo-1519225495810-7512c696505a?auto=format&fit=crop&q=80&w=600" }
  ];
  memoryDB.services.push(...rawServices);

  // Seed default equipment
  const rawEquips = [
    { id: 1, name: "Traditional Photography", price: 25000, description: "Standard candid stage coverage with raw backups.", duration: "Full Event", image_url: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=600" },
    { id: 2, name: "Candid Photography", price: 35000, description: "Premium documentary-style emotional captures.", duration: "Full Event", image_url: "https://images.unsplash.com/photo-1520390138845-1200dfa2790d?auto=format&fit=crop&q=80&w=600" },
    { id: 3, name: "Traditional Videography", price: 60000, description: "High quality full long-form wedding movie coverage.", duration: "Full Event", image_url: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&q=80&w=600" },
    { id: 4, name: "Candid Videography", price: 65000, description: "Aesthetic cinematic films & short high-intensity teaser.", duration: "Full Event", image_url: "https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&q=80&w=600" },
    { id: 5, name: "Drone Shoot", price: 70000, description: "Airborne scenic and sweeping entrance video captures.", duration: "4 Hours", image_url: "https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&q=80&w=600" },
    { id: 6, name: "Live Streaming + LED Screen", price: 85000, description: "Broadcast live streams to YouTube with crisp display screens on-site.", duration: "Full Event", image_url: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=600" },
    { id: 7, name: "Cinematic Shoot", price: 110000, description: "Ultra HD slow motion sequences, dedicated color grading.", duration: "2 Days", image_url: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=600" },
    { id: 8, name: "Total Cinematic Wedding", price: 170000, description: "A-Z documentary film crew with dual primary cams, drones & crane rigs.", duration: "3 Days", image_url: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=600" }
  ];
  memoryDB.equipments.push(...rawEquips);

  // Seed default Packages
  const rawPackages = [
    { id: 1, name: "Basic Package", price: 44000, description: "Includes Traditional Photography, Traditional Videography, 35+1 Album, Video Mixing, and 1 Family Photo Frame." },
    { id: 2, name: "Premium Package", price: 52000, description: "Includes Traditional Photography, Traditional Videography, 50+1 Album, Video Mixing, and 1 Family Photo Frame." },
    { id: 3, name: "Silver Package", price: 73000, description: "Includes Traditional Photography, Candid Photography, Traditional Videography, 60+2 Album, Video Mixing, and 2 Family Photo Frames." },
    { id: 4, name: "Silver Premium Package", price: 100000, description: "Includes Traditional Photography, Candid Photography, Traditional Videography, Audiocone sound recording, 2 Live LED TVs, 60+2 Album, Video Mixing, and 2 Family Photo Frames." },
    { id: 5, name: "Gold Package", price: 125000, description: "Includes Traditional Photography, Candid Photography, Traditional Videography, Audiocone sound recording, Drone Shoot, 80+2 Album, Video Mixing, and 2 Family Photo Frames." },
    { id: 6, name: "Diamond Package", price: 156000, description: "Includes Traditional Photography, Traditional Videography, Candid Photography, Audiocone sound recording, 1 Drone Shoot, 1 Live LED Screen, 100+2 Album, Video Mixing, and 2 Family Photo Frames." },
    { id: 7, name: "Luxury Package", price: 173000, description: "Includes Traditional Photography, Candid Photography, Candid Videography, Traditional Videography, Audiocone sound, Drone Shoot, 2 LED Screens, Pre Wedding Shoot, 120+3 Album, and Video Mixing." }
  ];
  memoryDB.packages.push(...rawPackages);

  const rawPackageItems = [
    { id: 1, package_id: 1, equipment_name: "Traditional Photography", quantity: 1 },
    { id: 2, package_id: 1, equipment_name: "Traditional Videography", quantity: 1 },
    { id: 3, package_id: 1, equipment_name: "Album (35+1)", quantity: 1 },
    { id: 4, package_id: 2, equipment_name: "Traditional Photography", quantity: 1 },
    { id: 5, package_id: 2, equipment_name: "Traditional Videography", quantity: 1 },
    { id: 6, package_id: 2, equipment_name: "Album (50+1)", quantity: 1 },
    { id: 7, package_id: 3, equipment_name: "Traditional Photography", quantity: 1 },
    { id: 8, package_id: 3, equipment_name: "Candid Photography", quantity: 1 },
    { id: 9, package_id: 3, equipment_name: "Traditional Videography", quantity: 1 },
    { id: 10, package_id: 4, equipment_name: "Candid Photography", quantity: 1 },
    { id: 11, package_id: 4, equipment_name: "Live LED Smart TV", quantity: 2 },
    { id: 12, package_id: 5, equipment_name: "Drone Shoot", quantity: 1 },
    { id: 13, package_id: 6, equipment_name: "Live LED Screen", quantity: 1 },
    { id: 14, package_id: 7, equipment_name: "Pre Wedding Shoot", quantity: 1 }
  ];
  memoryDB.package_items.push(...rawPackageItems);

  // Seed default gallery images
  const rawGallery = [
    { id: 1, image_url: "/backend/gallery/g1.jpg", title: "Premium Candid Shot", created_at: new Date().toISOString() },
    { id: 2, image_url: "/backend/gallery/g2.jpg", title: "Fatherly Affection", created_at: new Date().toISOString() },
    { id: 3, image_url: "/backend/gallery/g3.jpg", title: "Cinematic Outdoor Portrait", created_at: new Date().toISOString() },
    { id: 4, image_url: "/backend/gallery/g4.jpg", title: "Traditional Costume Portrait", created_at: new Date().toISOString() },
    { id: 5, image_url: "/backend/gallery/g5.jpg", title: "Cute Krishna Costume Shoot", created_at: new Date().toISOString() },
    { id: 6, image_url: "/backend/gallery/g6.jpg", title: "High-Tech Macro Framing", created_at: new Date().toISOString() },
    { id: 7, image_url: "/backend/gallery/g7.jpg", title: "Adorable Toddler Smile", created_at: new Date().toISOString() },
    { id: 8, image_url: "/backend/gallery/g8.jpg", title: "Heritage Street Decor", created_at: new Date().toISOString() }
  ];
  memoryDB.gallery.push(...rawGallery);

  // Seed reviews
  const rawReviews = [
    { id: 1, booking_id: 1, username: "Sanjana & Rahul", event_name: "Wedding Ceremony Booking", rating: 5, review_text: "MD Photography completely redefined our memories! The candid cinematography feels like a Bollywood movie, and their duplicate prevention billing saved us ₹40,000 in redundant gear costs! Highly endorse them.", created_at: new Date().toISOString() },
    { id: 2, booking_id: 2, username: "Venkat Rao", event_name: "Haldi & Upanayanam Shoots", rating: 5, review_text: "Extremely structured group. The crew arrived 30 minutes early, shot beautiful drone angles, and the website's stage payment model (paying 20% advance and 10% after actual album delivery) is very secure.", created_at: new Date().toISOString() },
    { id: 3, booking_id: 3, username: "Anjali Deshmukh", event_name: "New Born & Naming Ceremony", rating: 5, review_text: "So patient with my 1-month-old! They used secure soft lighting props and delivered a beautifully layouted family frame. Earned high loyalty rewards points that I'll use on his first birthday!", created_at: new Date().toISOString() }
  ];
  memoryDB.reviews.push(...rawReviews);

  console.log("In-Memory seed population completed successfully!");
}

// Memory database simulator functions
function queryMemory(sql: string, params: any[]): any[] {
  const cleanSql = sql.replace(/\s+/g, " ").trim();
  
  // 1. Resolve custom join queries
  if (/notifications\s+n\s+JOIN\s+users/i.test(cleanSql)) {
    return (memoryDB.notifications || []).map(n => {
      const u = (memoryDB.users || []).find(user => user.id === n.user_id) || {};
      return {
        ...n,
        username: u.username || "Guest",
        email: u.email || "guest@example.com"
      };
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  if (/SELECT\s+u\.\*,\s*c\.id\s+as\s+cart_id/i.test(cleanSql)) {
    return (memoryDB.users || []).map(u => ({
      id: u.id,
      username: u.username,
      email: u.email,
      phone: u.phone,
      points: u.points || 0,
      cart_id: u.id,
      created_at: u.created_at
    }));
  }

  // 2. Base Table Matcher
  const tableMatch = cleanSql.match(/from\s+([a-z0-9_]+)/i);
  if (!tableMatch) return [];
  const table = tableMatch[1].toLowerCase();
  
  let rows = [...(memoryDB[table] || [])];
  
  // 3. Filter WHERE variables
  const whereMatch = cleanSql.match(/where\s+(.+?)(?:order\s+by|limit|$)/i);
  if (whereMatch) {
    const filterExpr = whereMatch[1].trim();
    const conditions = filterExpr.split(/\s+AND\s+/i);
    let paramIndex = 0;
    
    rows = rows.filter(row => {
      let isMatch = true;
      for (const cond of conditions) {
        // match: column = ? or column LIKE ? etc
        const m = cond.match(/([a-z0-9_]+(?:\.[a-z0-9_]+)?)\s*(=|LIKE|IN)\s*(.+)/i);
        if (m) {
          let col = m[1].toLowerCase();
          if (col.includes(".")) {
            col = col.split(".")[1]; // remove table alias prefix
          }
          const op = m[2].toUpperCase();
          const pVal = params[paramIndex++];
          
          if (op === "=") {
            if (row[col] !== pVal && String(row[col]) !== String(pVal)) isMatch = false;
          } else if (op === "LIKE") {
            const pattern = String(pVal).replace(/%/g, "").toLowerCase();
            if (!String(row[col]).toLowerCase().includes(pattern)) {
              isMatch = false;
            }
          }
        }
      }
      return isMatch;
    });
  }

  // 4. Sort and limit parsing
  if (/order\s+by\s+id\s+desc/i.test(cleanSql)) {
    rows.sort((a, b) => b.id - a.id);
  } else if (/order\s+by\s+id\s+asc/i.test(cleanSql) || /order\s+by\s+n\.created_at\s+desc/i.test(cleanSql)) {
    rows.sort((a, b) => a.id - b.id);
  } else if (/order\s+by\s+created_at\s+desc/i.test(cleanSql)) {
    rows.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  const limitMatch = cleanSql.match(/limit\s+(\d+)/i);
  if (limitMatch) {
    rows = rows.slice(0, parseInt(limitMatch[1], 10));
  }
  
  return rows;
}

function insertMemory(sql: string, params: any[]): { lastID: number; changes: number } {
  const cleanSql = sql.replace(/\s+/g, " ").trim();
  const tableMatch = cleanSql.match(/insert\s+into\s+([a-z0-9_]+)/i);
  if (!tableMatch) return { lastID: 0, changes: 0 };
  const table = tableMatch[1].toLowerCase();
  
  const colMatch = cleanSql.match(/\(([^)]+)\)/);
  if (!colMatch) return { lastID: 0, changes: 0 };
  const columns = colMatch[1].split(",").map(c => c.trim().toLowerCase());
  
  const newRow: any = { 
    id: (memoryDB[table]?.length || 0) + 1, 
    created_at: new Date().toISOString() 
  };
  
  columns.forEach((col, i) => {
    newRow[col] = params[i];
  });
  
  if (!memoryDB[table]) {
    memoryDB[table] = [];
  }
  memoryDB[table].push(newRow);
  
  saveMemoryToDisc();
  return { lastID: newRow.id, changes: 1 };
}

function updateMemory(sql: string, params: any[]): { lastID: number; changes: number } {
  const cleanSql = sql.replace(/\s+/g, " ").trim();
  const tableMatch = cleanSql.match(/update\s+([a-z0-9_]+)/i);
  if (!tableMatch) return { lastID: 0, changes: 0 };
  const table = tableMatch[1].toLowerCase();
  
  const setMatch = cleanSql.match(/set\s+(.+?)\s+where/i);
  if (!setMatch) return { lastID: 0, changes: 0 };
  
  const setAssignments = setMatch[1].split(",").map(s => s.trim());
  
  // Find where filter
  let whereVal = params[params.length - 1];
  let changes = 0;
  
  const rows = memoryDB[table] || [];
  rows.forEach(row => {
    let isMatch = false;
    if (/where\s+id\s*=/i.test(cleanSql)) {
      isMatch = String(row.id) === String(whereVal);
    } else if (/where\s+user_id\s*=/i.test(cleanSql)) {
      isMatch = String(row.user_id) === String(whereVal);
    } else if (/where\s+email\s*=/i.test(cleanSql)) {
      isMatch = String(row.email) === String(whereVal);
    } else if (/where\s+booking_id\s*=/i.test(cleanSql)) {
      isMatch = String(row.booking_id) === String(whereVal);
    }
    
    if (isMatch) {
      changes++;
      setAssignments.forEach((assign, idx) => {
        const parts = assign.split("=");
        const col = parts[0].trim().toLowerCase();
        const expr = parts[1].trim();
        
        if (expr === "?") {
          row[col] = params[idx];
        } else if (expr.includes("points - ?")) {
          row[col] = (row[col] || 0) - Number(params[idx]);
        } else if (expr.includes("points + ?")) {
          row[col] = (row[col] || 0) + Number(params[idx]);
        }
      });
    }
  });

  saveMemoryToDisc();
  return { lastID: 0, changes };
}

function deleteMemory(sql: string, params: any[]): { lastID: number; changes: number } {
  const cleanSql = sql.replace(/\s+/g, " ").trim();
  const tableMatch = cleanSql.match(/delete\s+from\s+([a-z0-9_]+)/i);
  if (!tableMatch) return { lastID: 0, changes: 0 };
  const table = tableMatch[1].toLowerCase();
  
  const filterVal = params[0];
  let changes = 0;
  
  if (memoryDB[table]) {
    const startCount = memoryDB[table].length;
    if (/where\s+id\s*=/i.test(cleanSql)) {
      memoryDB[table] = memoryDB[table].filter(row => String(row.id) !== String(filterVal));
    } else if (/where\s+user_id\s*=/i.test(cleanSql)) {
      memoryDB[table] = memoryDB[table].filter(row => String(row.user_id) !== String(filterVal));
    } else if (/where\s+package_id\s*=/i.test(cleanSql)) {
      memoryDB[table] = memoryDB[table].filter(row => String(row.package_id) !== String(filterVal));
    } else if (/where\s+booking_id\s*=/i.test(cleanSql)) {
      memoryDB[table] = memoryDB[table].filter(row => String(row.booking_id) !== String(filterVal));
    } else {
      memoryDB[table] = [];
    }
    changes = startCount - memoryDB[table].length;
  }
  
  saveMemoryToDisc();
  return { lastID: 0, changes };
}

// Database wrapper implementing transparent hot-swappable fallback
export class Database {
  async run(sql: string, params: any[] = []): Promise<{ lastID: number; changes: number }> {
    if (useFallbackMemory) {
      if (/insert\s+/i.test(sql)) {
        return insertMemory(sql, params);
      } else if (/update\s+/i.test(sql)) {
        return updateMemory(sql, params);
      } else if (/delete\s+/i.test(sql)) {
        return deleteMemory(sql, params);
      }
      return { lastID: 0, changes: 0 };
    }

    const convertedSql = convertPlaceholders(sql);
    const isInsert = /^\s*insert\s+/i.test(convertedSql);
    
    // Auto-append RETURNING id for inserts if not already present in PostgreSQL
    let querySql = convertedSql;
    if (isInsert && !/returning\s+id/i.test(convertedSql)) {
      querySql += " RETURNING id";
    }

    try {
      const result = await pool.query(querySql, params);
      let lastID = 0;
      if (isInsert && result.rows && result.rows.length > 0) {
        lastID = Number(result.rows[0].id || 0);
      }
      return { lastID, changes: result.rowCount || 0 };
    } catch (error: any) {
      console.error("Database run error on SQL:", sql, "\nConverted:", querySql, "\nError:", error.message);
      throw error;
    }
  }

  async get<T>(sql: string, params: any[] = []): Promise<T | undefined> {
    if (useFallbackMemory) {
      const rows = queryMemory(sql, params);
      return rows[0] as T | undefined;
    }

    const convertedSql = convertPlaceholders(sql);
    try {
      const result = await pool.query(convertedSql, params);
      return result.rows[0] as T | undefined;
    } catch (error: any) {
      console.error("Database get error on SQL:", sql, "\nConverted:", convertedSql, "\nError:", error.message);
      throw error;
    }
  }

  async all<T>(sql: string, params: any[] = []): Promise<T[]> {
    if (useFallbackMemory) {
      return queryMemory(sql, params) as T[];
    }

    const convertedSql = convertPlaceholders(sql);
    try {
      const result = await pool.query(convertedSql, params);
      return result.rows as T[];
    } catch (error: any) {
      console.error("Database all error on SQL:", sql, "\nConverted:", convertedSql, "\nError:", error.message);
      throw error;
    }
  }

  async exec(sql: string): Promise<void> {
    if (useFallbackMemory) {
      // Exec operations are schema creation operations in this context; skip
      return;
    }

    try {
      await pool.query(sql);
    } catch (error: any) {
      console.error("Database exec error on SQL:", sql, "\nError:", error.message);
      throw error;
    }
  }
}

export const dbInstance = new Database();

export async function syncSequence(tableName: string) {
  if (useFallbackMemory) return;
  try {
    const checkSql = `
      SELECT setval(
        pg_get_serial_sequence('"${tableName}"', 'id'), 
        COALESCE((SELECT MAX(id) FROM "${tableName}"), 1)
      );
    `;
    await pool.query(checkSql);
  } catch (err: any) {
    // Non-blocking fallback
  }
}

export async function initDatabase() {
  console.log("Checking database connection and initiating setup...");

  if (!connectionString) {
    console.warn("=========================================================");
    console.warn("⚠️  DATABASE_URL environment variable is not defined or is empty.");
    console.warn("Automatically initializing Zero-Dependency In-Memory fallback database engine...");
    console.warn("This guarantees the application launches with pristine catalogs and 100% features available.");
    console.warn("=========================================================");
    useFallbackMemory = true;
    dbConnectionError = "DATABASE_URL environment variable is not defined or is empty.";
    const loaded = loadMemoryFromDisc();
    if (!loaded) {
      await seedDefaultMemoryDB();
      saveMemoryToDisc();
    }
    return;
  }

  // First verify if the database is reachable
  try {
    await pool.query("SELECT 1");
    console.log("✅ Remote database resolved successfully! Creating PostgreSQL tables...");
    dbConnectionError = null;
  } catch (err: any) {
    console.warn("=========================================================");
    console.warn("⚠️  REMOTE POSTGRESQL CONNECTION FAILING:", err.message);
    console.warn("Automatically initializing Zero-Dependency In-Memory fallback database engine...");
    console.warn("This guarantees the application launches with pristine catalogs and 100% features available.");
    console.warn("=========================================================");
    useFallbackMemory = true;
    dbConnectionError = err.message;
    const loaded = loadMemoryFromDisc();
    if (!loaded) {
      await seedDefaultMemoryDB();
      saveMemoryToDisc();
    }
    return;
  }

  // 1. users Table (PostgreSQL)
  await dbInstance.run(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      points INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 2. admins Table (PostgreSQL)
  await dbInstance.run(`
    CREATE TABLE IF NOT EXISTS admins (
      id SERIAL PRIMARY KEY,
      username TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    )
  `);

  // 3. services Table (PostgreSQL)
  await dbInstance.run(`
    CREATE TABLE IF NOT EXISTS services (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      image_url TEXT,
      description TEXT,
      starting_price DOUBLE PRECISION NOT NULL
    )
  `);

  // 4. equipments Table (PostgreSQL)
  await dbInstance.run(`
    CREATE TABLE IF NOT EXISTS equipments (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      price DOUBLE PRECISION NOT NULL,
      description TEXT,
      image_url TEXT,
      duration TEXT NOT NULL
    )
  `);

  // 5. packages Table (PostgreSQL)
  await dbInstance.run(`
    CREATE TABLE IF NOT EXISTS packages (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      price DOUBLE PRECISION NOT NULL,
      description TEXT
    )
  `);

  // 6. package_items Table (PostgreSQL)
  await dbInstance.run(`
    CREATE TABLE IF NOT EXISTS package_items (
      id SERIAL PRIMARY KEY,
      package_id INTEGER NOT NULL,
      equipment_name TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      FOREIGN KEY(package_id) REFERENCES packages(id) ON DELETE CASCADE
    )
  `);

  // 7. bookings Table (PostgreSQL)
  await dbInstance.run(`
    CREATE TABLE IF NOT EXISTS bookings (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
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
      status TEXT NOT NULL, 
      payment_status TEXT NOT NULL, 
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);

  // 8. booking_equipments Table (PostgreSQL)
  await dbInstance.run(`
    CREATE TABLE IF NOT EXISTS booking_equipments (
      id SERIAL PRIMARY KEY,
      booking_id INTEGER NOT NULL,
      equipment_name TEXT NOT NULL,
      price DOUBLE PRECISION NOT NULL,
      FOREIGN KEY(booking_id) REFERENCES bookings(id) ON DELETE CASCADE
    )
  `);

  // 9. cart Table (PostgreSQL)
  await dbInstance.run(`
    CREATE TABLE IF NOT EXISTS cart (
      id SERIAL PRIMARY KEY,
      user_id INTEGER UNIQUE NOT NULL,
      event_name TEXT,
      event_date TEXT,
      event_location TEXT,
      package_id INTEGER,
      equipment_ids TEXT, 
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // 10. payments Table (PostgreSQL)
  await dbInstance.run(`
    CREATE TABLE IF NOT EXISTS payments (
      id SERIAL PRIMARY KEY,
      booking_id INTEGER NOT NULL,
      amount DOUBLE PRECISION NOT NULL,
      stage TEXT NOT NULL, 
      transaction_id TEXT UNIQUE NOT NULL,
      status TEXT NOT NULL, 
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(booking_id) REFERENCES bookings(id)
    )
  `);

  // 11. rewards Table (PostgreSQL)
  await dbInstance.run(`
    CREATE TABLE IF NOT EXISTS rewards (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      booking_id INTEGER,
      points_earned INTEGER DEFAULT 0,
      points_redeemed INTEGER DEFAULT 0,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);

  // 12. gallery Table (PostgreSQL)
  await dbInstance.run(`
    CREATE TABLE IF NOT EXISTS gallery (
      id SERIAL PRIMARY KEY,
      image_url TEXT NOT NULL,
      title TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 13. studio_details Table (PostgreSQL)
  await dbInstance.run(`
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
    )
  `);

  // 14. notifications Table (PostgreSQL)
  await dbInstance.run(`
    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL, 
      sent_via TEXT NOT NULL, 
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);

  // 15. booking_logs Table for maintaining missed admin notifications (PostgreSQL)
  await dbInstance.run(`
    CREATE TABLE IF NOT EXISTS booking_logs (
      id SERIAL PRIMARY KEY,
      booking_id INTEGER NOT NULL,
      username TEXT NOT NULL,
      event_name TEXT NOT NULL,
      event_date TEXT NOT NULL,
      total_price DOUBLE PRECISION NOT NULL,
      admin_read INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 16. password_retrievals Table (PostgreSQL)
  await dbInstance.run(`
    CREATE TABLE IF NOT EXISTS password_retrievals (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      username TEXT NOT NULL,
      phone TEXT NOT NULL,
      temp_password TEXT NOT NULL,
      status TEXT DEFAULT 'pending', 
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);

  // 17. reviews Table for user feedback (PostgreSQL)
  await dbInstance.run(`
    CREATE TABLE IF NOT EXISTS reviews (
      id SERIAL PRIMARY KEY,
      booking_id INTEGER NOT NULL,
      username TEXT NOT NULL,
      event_name TEXT NOT NULL,
      rating INTEGER NOT NULL,
      review_text TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log("PostgreSQL tables checked/created successfully. Seeding default data...");

  // Seed default admin
  const adminExists = await dbInstance.get("SELECT * FROM admins WHERE email = ?", ["admin@mdphotography.com"]);
  if (!adminExists) {
    const adminHashedPassword = await bcrypt.hash("admin123", 10);
    await dbInstance.run(
      "INSERT INTO admins (username, email, password) VALUES (?, ?, ?)",
      ["admin", "admin@mdphotography.com", adminHashedPassword]
    );
    console.log("Default admin seeded: admin@mdphotography.com / admin123");
  }
  await syncSequence("admins");

  // Seed default studio_details
  const detailsExists = await dbInstance.get("SELECT * FROM studio_details LIMIT 1");
  if (!detailsExists) {
    await dbInstance.run(
      `INSERT INTO studio_details (name, tagline, logo_url, mobile, whatsapp, address, email, maps_url) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        "MD Photography",
        "Capturing Memories Forever",
        "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&q=80&w=200",
        "+91 98765 43210",
        "+91 98765 43210",
        "123 Frame Lane, Memory Street, Hyderabad, Telangana, 500001",
        "contact@mdphotography.com",
        "https://maps.google.com/?q=MD+Photography+Hyderabad"
      ]
    );
    console.log("Default studio details seeded.");
  }
  await syncSequence("studio_details");

  // Seed default services
  await dbInstance.run("DELETE FROM services");
  const defaultServices = [
    {
      name: "Engagement",
      starting_price: 20000,
      desc: "Capture the precious ring-exchange moment with pre-designed couple portraits. (100 pic with 1xAlbum and video)",
      img: "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&q=80&w=600"
    },
    {
      name: "Pre/post Wedding shoot in outdoor",
      starting_price: 25000,
      desc: "A creative cinematic session at aesthetic outdoor spots before your big day. (photo soft copy and vedio 3 min song with edit)",
      img: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=600"
    },
    {
      name: "Haldi & Nalugu",
      starting_price: 20000,
      desc: "Fun-filled candid portraits and reels covered in joyous turmeric colors (100 pic with IxAlbum and video)",
      img: "https://images.unsplash.com/photo-1607190074257-dd4b7af0309f?auto=format&fit=crop&q=80&w=600"
    },
    {
      name: "Mehendi",
      starting_price: 20000,
      desc: "Intricate henna detail photography paired with energetic group dancing clips. (100 pic with 1xAlbum and yldea)",
      img: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&q=80&w=600"
    },
    {
      name: "Birthday Parties",
      starting_price: 20000,
      desc: "Active games, party sessions, and quick candid photobooths for guests. (100 pic with 1xAlbum and video)",
      img: "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&q=80&w=600"
    },
    {
      name: "Mini Events",
      starting_price: 12000,
      desc: "Vibrant coverage of themed stages, laughter, and high-energy cake cuttings. only photos (100 pic with 1xAlbum)",
      img: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&q=80&w=600"
    },
    {
      name: "Naming Ceremony",
      starting_price: 20000,
      desc: "Candid family memories of the child's naming rituals and celebrations. (100 pic with 1xAlbum and video)",
      img: "https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&q=80&w=600"
    },
    {
      name: "New Born Baby Shoot",
      starting_price: 12000,
      desc: "Adorable baby portraits with safe thematic props and comforting set lighting. (only photo soft copy)",
      img: "https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&q=80&w=600"
    },
    {
      name: "pre/Post outdoor photo shoot",
      starting_price: 15000,
      desc: "Relaxed couple portraits post-ceremony designed for beautiful memory books. (soft copy only)",
      img: "https://images.unsplash.com/photo-1507504038482-7621c210ee20?auto=format&fit=crop&q=80&w=600"
    },
    {
      name: "Public Events",
      starting_price: 20000,
      desc: "Sharp event coverage with crowd interaction clips, banner designs, and live feeds. (soft copy only photo and video)",
      img: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&q=80&w=600"
    },
    {
      name: "Reception",
      starting_price: 25000,
      desc: "Elegant stage portraits and comprehensive coverage of evening banquets. (150 pic with 1xAlbum and video)",
      img: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=600"
    },
    {
      name: "Short Films & Ads",
      starting_price: 35000,
      desc: "Cinematic commercial and short media production with sound recording. wedding Promo's, Teasers",
      img: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&q=80&w=600"
    },
    {
      name: "Srimantham / Seemantham",
      starting_price: 20000,
      desc: "Beautifully capturing the traditional baby shower rituals with family blessings. (100 pic with 1xAlbum and video)",
      img: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&q=80&w=600"
    },
    {
      name: "Wedding",
      starting_price: 25000,
      desc: "Complete emotional and high-fidelity coverage of the sacred vows and rituals. (120 pic with 1xAlbum and video)",
      img: "https://images.unsplash.com/photo-1519225495810-7512c696505a?auto=format&fit=crop&q=80&w=600"
    }
  ];

  for (const service of defaultServices) {
    await dbInstance.run(
      "INSERT INTO services (name, image_url, description, starting_price) VALUES (?, ?, ?, ?)",
      [service.name, service.img, service.desc, service.starting_price]
    );
  }
  console.log("Seeded 14 default services successfully.");
  await syncSequence("services");

  // Seed default equipments (8 of them)
  const equipmentsCount = await dbInstance.get<{ count: number }>("SELECT COUNT(*) as count FROM equipments");
  if (equipmentsCount && equipmentsCount.count === 0) {
    const defaultEquipments = [
      { name: "Traditional Photography", price: 25000, desc: "Standard candid stage coverage with raw backups.", duration: "Full Event", img: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=600" },
      { name: "Candid Photography", price: 35000, desc: "Premium documentary-style emotional captures.", duration: "Full Event", img: "https://images.unsplash.com/photo-1520390138845-1200dfa2790d?auto=format&fit=crop&q=80&w=600" },
      { name: "Traditional Videography", price: 60000, desc: "High quality full long-form wedding movie coverage.", duration: "Full Event", img: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&q=80&w=600" },
      { name: "Candid Videography", price: 65000, desc: "Aesthetic cinematic films & short high-intensity teaser.", duration: "Full Event", img: "https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&q=80&w=600" },
      { name: "Drone Shoot", price: 70000, desc: "Airborne scenic and sweeping entrance video captures.", duration: "4 Hours", img: "https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&q=80&w=600" },
      { name: "Live Streaming + LED Screen", price: 85000, desc: "Broadcast live streams to YouTube with crisp display screens on-site.", duration: "Full Event", img: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=600" },
      { name: "Cinematic Shoot", price: 110000, desc: "Ultra HD slow motion sequences, dedicated color grading.", duration: "2 Days", img: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=600" },
      { name: "Total Cinematic Wedding", price: 170000, desc: "A-Z documentary film crew with dual primary cams, drones & crane rigs.", duration: "3 Days", img: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=600" }
    ];

    for (const eq of defaultEquipments) {
      await dbInstance.run(
        "INSERT INTO equipments (name, price, description, image_url, duration) VALUES (?, ?, ?, ?, ?)",
        [eq.name, eq.price, eq.desc, eq.img, eq.duration]
      );
    }
    console.log("Seeded 8 default equipments.");
  }
  await syncSequence("equipments");

  // Seed default Packages
  const packagesCount = await dbInstance.get<{ count: number }>("SELECT COUNT(*) as count FROM packages");
  if (packagesCount && packagesCount.count === 0) {
    const defaultPackages = [
      {
        id: 1,
        name: "Basic Package",
        price: 44000,
        desc: "Includes Traditional Photography, Traditional Videography, 35+1 Album, Video Mixing, and 1 Family Photo Frame.",
        items: [
          { name: "Traditional Photography", qty: 1 },
          { name: "Traditional Videography", qty: 1 },
          { name: "Album (35+1)", qty: 1 },
          { name: "Video Mixing", qty: 1 },
          { name: "Family Photo Frame", qty: 1 }
        ]
      },
      {
        id: 2,
        name: "Premium Package",
        price: 52000,
        desc: "Includes Traditional Photography, Traditional Videography, 50+1 Album, Video Mixing, and 1 Family Photo Frame.",
        items: [
          { name: "Traditional Photography", qty: 1 },
          { name: "Traditional Videography", qty: 1 },
          { name: "Album (50+1)", qty: 1 },
          { name: "Video Mixing", qty: 1 },
          { name: "Family Photo Frame", qty: 1 }
        ]
      },
      {
        id: 3,
        name: "Silver Package",
        price: 73000,
        desc: "Includes Traditional Photography, Candid Photography, Traditional Videography, 60+2 Album, Video Mixing, and 2 Family Photo Frames.",
        items: [
          { name: "Traditional Photography", qty: 1 },
          { name: "Candid Photography", qty: 1 },
          { name: "Traditional Videography", qty: 1 },
          { name: "Album (60+2)", qty: 1 },
          { name: "Video Mixing", qty: 1 },
          { name: "Family Photo Frame", qty: 2 }
        ]
      },
      {
        id: 4,
        name: "Silver Premium Package",
        price: 100000,
        desc: "Includes Traditional Photography, Candid Photography, Traditional Videography, Audiocone sound recording, 2 Live LED TVs, 60+2 Album, Video Mixing, and 2 Family Photo Frames.",
        items: [
          { name: "Traditional Photography", qty: 1 },
          { name: "Candid Photography", qty: 1 },
          { name: "Traditional Videography", qty: 1 },
          { name: "Traditional Videography (Audiocone)", qty: 1 },
          { name: "Live LED Smart TV", qty: 2 },
          { name: "Album (60+2)", qty: 1 },
          { name: "Video Mixing", qty: 1 },
          { name: "Family Photo Frame", qty: 2 }
        ]
      },
      {
        id: 5,
        name: "Gold Package",
        price: 125000,
        desc: "Includes Traditional Photography, Candid Photography, Traditional Videography, Audiocone sound recording, Drone Shoot, 80+2 Album, Video Mixing, and 2 Family Photo Frames.",
        items: [
          { name: "Traditional Photography", qty: 1 },
          { name: "Candid Photography", qty: 1 },
          { name: "Traditional Videography", qty: 1 },
          { name: "Traditional Videography (Audiocone)", qty: 1 },
          { name: "Drone Shoot", qty: 1 },
          { name: "Album (80+2)", qty: 1 },
          { name: "Video Mixing", qty: 1 },
          { name: "Family Photo Frame", qty: 2 }
        ]
      },
      {
        id: 6,
        name: "Diamond Package",
        price: 156000,
        desc: "Includes Traditional Photography, Traditional Videography, Candid Photography, Audiocone sound recording, 1 Drone Shoot, 1 Live LED Screen, 100+2 Album, Video Mixing, and 2 Family Photo Frames.",
        items: [
          { name: "Traditional Photography", qty: 1 },
          { name: "Traditional Videography", qty: 1 },
          { name: "Candid Photography", qty: 1 },
          { name: "Traditional Videography (Audiocone)", qty: 1 },
          { name: "Drone Shoot", qty: 1 },
          { name: "Live LED Screen", qty: 1 },
          { name: "Album (100+2)", qty: 1 },
          { name: "Video Mixing", qty: 1 },
          { name: "Family Photo Frame", qty: 2 }
        ]
      },
      {
        id: 7,
        name: "Luxury Package",
        price: 173000,
        desc: "Includes Traditional Photography, Candid Photography, Candid Videography, Traditional Videography, Audiocone sound, Drone Shoot, 2 LED Screens, Pre Wedding Shoot, 120+3 Album, and Video Mixing.",
        items: [
          { name: "Traditional Photography", qty: 1 },
          { name: "Candid Photography", qty: 1 },
          { name: "Candid Videography", qty: 1 },
          { name: "Traditional Videography", qty: 1 },
          { name: "Traditional Videography (Audiocone)", qty: 1 },
          { name: "Drone Shoot", qty: 1 },
          { name: "LED Screens", qty: 2 },
          { name: "Pre Wedding Shoot", qty: 1 },
          { name: "Album (120+3)", qty: 1 },
          { name: "Video Mixing", qty: 1 }
        ]
      }
    ];

    for (const pkg of defaultPackages) {
      await dbInstance.run(
        "INSERT INTO packages (id, name, price, description) VALUES (?, ?, ?, ?)",
        [pkg.id, pkg.name, pkg.price, pkg.desc]
      );

      for (const item of pkg.items) {
        await dbInstance.run(
          "INSERT INTO package_items (package_id, equipment_name, quantity) VALUES (?, ?, ?)",
          [pkg.id, item.name, item.qty]
        );
      }
    }
    console.log("Seeded 7 default packages and details.");
  }
  await syncSequence("packages");
  await syncSequence("package_items");

  // Seed default gallery images (8 of them)
  await dbInstance.run("DELETE FROM gallery");
  const defaultGallery = [
    { url: "/backend/gallery/g1.jpg", title: "Premium Candid Shot" },
    { url: "/backend/gallery/g2.jpg", title: "Fatherly Affection" },
    { url: "/backend/gallery/g3.jpg", title: "Cinematic Outdoor Portrait" },
    { url: "/backend/gallery/g4.jpg", title: "Traditional Costume Portrait" },
    { url: "/backend/gallery/g5.jpg", title: "Cute Krishna Costume Shoot" },
    { url: "/backend/gallery/g6.jpg", title: "High-Tech Macro Framing" },
    { url: "/backend/gallery/g7.jpg", title: "Adorable Toddler Smile" },
    { url: "/backend/gallery/g8.jpg", title: "Heritage Street Decor" }
  ];

  for (const gal of defaultGallery) {
    await dbInstance.run(
      "INSERT INTO gallery (image_url, title) VALUES (?, ?)",
      [gal.url, gal.title]
    );
  }
  console.log("Seeded 8 default gallery images.");
  await syncSequence("gallery");

  // Seed default reviews if table is empty
  const reviewsCount = await dbInstance.get<{ count: number }>("SELECT COUNT(*) as count FROM reviews");
  if (reviewsCount && reviewsCount.count === 0) {
    const defaultReviews = [
      {
        booking_id: 1,
        username: "Sanjana & Rahul",
        event_name: "Wedding Ceremony Booking",
        rating: 5,
        review_text: "MD Photography completely redefined our memories! The candid cinematography feels like a Bollywood movie, and their duplicate prevention billing saved us ₹40,000 in redundant gear costs! Highly endorse them."
      },
      {
        booking_id: 2,
        username: "Venkat Rao",
        event_name: "Haldi & Upanayanam Shoots",
        rating: 5,
        review_text: "Extremely structured group. The crew arrived 30 minutes early, shot beautiful drone angles, and the website's stage payment model (paying 20% advance and 10% after actual album delivery) is very secure."
      },
      {
        booking_id: 3,
        username: "Anjali Deshmukh",
        event_name: "New Born & Naming Ceremony",
        rating: 5,
        review_text: "So patient with my 1-month-old! They used secure soft lighting props and delivered a beautifully layouted family frame. Earned high loyalty rewards points that I'll use on his first birthday!"
      }
    ];
    for (const r of defaultReviews) {
      await dbInstance.run(
        "INSERT INTO reviews (booking_id, username, event_name, rating, review_text) VALUES (?, ?, ?, ?, ?)",
        [r.booking_id, r.username, r.event_name, r.rating, r.review_text]
      );
    }
  }
  await syncSequence("reviews");
  console.log("Database sequences synchronized successfully.");
}
