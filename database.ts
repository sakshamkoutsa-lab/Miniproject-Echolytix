import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'node:fs';
import crypto from 'node:crypto';

// Path to SQLite database file. Set DATABASE_PATH (e.g. a mounted disk like
// /data/echolytix.db on Render) so data persists across deploys/restarts.
const dbPath = process.env.DATABASE_PATH
  ? path.resolve(process.env.DATABASE_PATH)
  : path.resolve(process.cwd(), 'echolytix.db');
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const db = new DatabaseSync(dbPath);

// Enable WAL mode & foreign keys
try {
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');
} catch (e) {
  // Pragma warning catch
}

// Cryptographic Password Hashing Helpers (PBKDF2-HMAC-SHA512).
// The stored value is self-describing (`pbkdf2$iterations$salt$hash`) so the
// iteration count can be raised over time without breaking existing accounts.
const PBKDF2_ITERATIONS = 210000;
const PBKDF2_KEYLEN = 64;
const PBKDF2_DIGEST = 'sha512';

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, PBKDF2_KEYLEN, PBKDF2_DIGEST).toString('hex');
  return `pbkdf2$${PBKDF2_ITERATIONS}$${salt}$${hash}`;
}

export function verifyPassword(password: string, storedValue: string): boolean {
  // Current self-describing format.
  if (storedValue.startsWith('pbkdf2$')) {
    const [, iterStr, salt, originalHash] = storedValue.split('$');
    const iterations = parseInt(iterStr, 10) || PBKDF2_ITERATIONS;
    const hash = crypto.pbkdf2Sync(password, salt, iterations, PBKDF2_KEYLEN, PBKDF2_DIGEST).toString('hex');
    const a = Buffer.from(hash, 'hex');
    const b = Buffer.from(originalHash, 'hex');
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  }
  // Legacy `salt:hash` format (1000 iterations).
  if (storedValue.includes(':')) {
    const [salt, originalHash] = storedValue.split(':');
    const hash = crypto.pbkdf2Sync(password, salt, 1000, PBKDF2_KEYLEN, PBKDF2_DIGEST).toString('hex');
    return hash === originalHash;
  }
  // Legacy plain-text fallback.
  return password === storedValue;
}

// Initialize Database Tables
export function initDatabase() {
  // Patients Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS patients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      age INTEGER,
      medical_id TEXT,
      caregiver_name TEXT,
      caregiver_phone TEXT,
      emergency_email TEXT,
      tts_speed REAL DEFAULT 1.0,
      blink_threshold REAL DEFAULT 0.18,
      commit_delay INTEGER DEFAULT 1800
    );
  `);

  // Recent Spoken Phrases Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS recent_phrases (
      id TEXT PRIMARY KEY,
      text TEXT NOT NULL,
      mode TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Quick Morse & Assistive Phrases Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS quick_phrases (
      id TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      morse TEXT NOT NULL,
      category TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // TTS Phrase Categories Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Category Phrases Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS category_phrases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL,
      text TEXT NOT NULL,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
    );
  `);

  // User Settings & Calibration Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // SOS Emergency Alerts Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS sos_alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER,
      message TEXT NOT NULL,
      latitude REAL,
      longitude REAL,
      timestamp TEXT NOT NULL,
      status TEXT DEFAULT 'ACTIVE',
      address TEXT,
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE SET NULL
    );
  `);
  try {
    db.exec('ALTER TABLE sos_alerts ADD COLUMN address TEXT;');
  } catch (e) {
    // Column already exists
  }
  try {
    db.exec('ALTER TABLE sos_alerts ADD COLUMN caregiver_phone TEXT;');
  } catch (e) {
    // Column already exists
  }
  try {
    db.exec('ALTER TABLE sos_alerts ADD COLUMN broadcast_status TEXT;');
  } catch (e) {
    // Column already exists
  }
  try {
    db.exec('ALTER TABLE sos_alerts ADD COLUMN broadcast_channel TEXT;');
  } catch (e) {
    // Column already exists
  }

  // Sessions Table (For secure token-based authentication)
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      patient_id INTEGER NOT NULL,
      expires_at TEXT NOT NULL,
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
    );
  `);

  // Password Recovery OTP Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS password_resets (
      email TEXT PRIMARY KEY,
      token TEXT NOT NULL,
      expires_at TEXT NOT NULL
    );
  `);

  // Caregiver Feedback & Contact Support Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS support_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  // Accessible Video Call Contacts Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      category TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      avatar_initials TEXT,
      presence_status TEXT DEFAULT 'offline',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
    );
  `);

  // Video Calls Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS calls (
      id TEXT PRIMARY KEY,
      initiator_id INTEGER,
      initiator_name TEXT NOT NULL,
      recipient_id TEXT,
      recipient_name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'initiating',
      started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      answered_at DATETIME,
      ended_at DATETIME,
      duration INTEGER DEFAULT 0,
      end_reason TEXT
    );
  `);
  try {
    db.exec('ALTER TABLE patients ADD COLUMN phone TEXT;');
  } catch (e) {}
  try {
    db.exec('ALTER TABLE calls ADD COLUMN initiator_phone TEXT;');
  } catch (e) {}
  try {
    db.exec('ALTER TABLE calls ADD COLUMN recipient_phone TEXT;');
  } catch (e) {}
  try {
    db.exec("ALTER TABLE calls ADD COLUMN call_type TEXT DEFAULT 'video';");
  } catch (e) {}
  try {
    db.exec('ALTER TABLE calls ADD COLUMN ringing_at DATETIME;');
  } catch (e) {}

  // Call Transcript Messages Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS call_messages (
      id TEXT PRIMARY KEY,
      call_id TEXT NOT NULL,
      sender_name TEXT NOT NULL,
      sender_role TEXT NOT NULL DEFAULT 'user',
      method TEXT NOT NULL,
      text TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (call_id) REFERENCES calls(id) ON DELETE CASCADE
    );
  `);

  // Call Settings Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS call_settings (
      patient_id INTEGER PRIMARY KEY,
      auto_translate INTEGER DEFAULT 1,
      show_detected_gestures INTEGER DEFAULT 1,
      speak_translations INTEGER DEFAULT 1,
      noise_reduction INTEGER DEFAULT 1,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Morse Settings Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS morse_settings (
      patient_id INTEGER PRIMARY KEY,
      trigger_key TEXT DEFAULT ' ',
      trigger_code TEXT DEFAULT 'Space',
      dot_dash_threshold INTEGER DEFAULT 250,
      letter_gap_timeout INTEGER DEFAULT 1200,
      input_mode TEXT DEFAULT 'tap',
      auto_speak INTEGER DEFAULT 1,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Morse Translation History Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS morse_history (
      id TEXT PRIMARY KEY,
      patient_id INTEGER,
      text TEXT NOT NULL,
      morse_sequence TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  seedDefaultData();
}

// Seed initial data if tables are empty
function seedDefaultData() {
  // Seed default patient
  const patientCountRow = db.prepare('SELECT COUNT(*) as count FROM patients').get() as { count: number | bigint };
  const patientCount = Number(patientCountRow?.count || 0);
  if (patientCount === 0) {
    const insertPatient = db.prepare(`
      INSERT INTO patients (
        email, password, name, age, medical_id, 
        caregiver_name, caregiver_phone, emergency_email, 
        tts_speed, blink_threshold, commit_delay
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertPatient.run(
      'Sachingupta@gmail.com',
      hashPassword('123456789'),
      'Sachin Gupta',
      20,
      'XYZ',
      'Saksham',
      '+91 8130896226',
      'Sachingupta@gmail.com',
      1.0,
      0.18,
      1800
    );
  }

  // Ensure default patient has phone and seed secondary registered users for calling
  try {
    db.prepare(`UPDATE patients SET phone = '+919876543210' WHERE id = 1 AND (phone IS NULL OR phone = '');`).run();

    const sakshamCheck = db.prepare('SELECT id FROM patients WHERE email = ? OR phone = ?').get('saksham@echolytix.care', '+918130896226');
    if (!sakshamCheck) {
      db.prepare(`
        INSERT INTO patients (email, password, name, phone, caregiver_name, caregiver_phone, emergency_email)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        'saksham@echolytix.care',
        hashPassword('123456789'),
        'Saksham',
        '+918130896226',
        'Sachin Gupta',
        '+919876543210',
        'saksham@echolytix.care'
      );
    }

    const meeraCheck = db.prepare('SELECT id FROM patients WHERE email = ? OR phone = ?').get('dr.meera@aiims.edu', '+919811200000');
    if (!meeraCheck) {
      db.prepare(`
        INSERT INTO patients (email, password, name, phone, caregiver_name, caregiver_phone, emergency_email)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        'dr.meera@aiims.edu',
        hashPassword('123456789'),
        'Dr. Meera Sharma',
        '+919811200000',
        'Hospital AIIMS',
        '+919811200000',
        'dr.meera@aiims.edu'
      );
    }
  } catch (e) {}

  // Seed Recent Phrases
  const phraseCountRow = db.prepare('SELECT COUNT(*) as count FROM recent_phrases').get() as { count: number | bigint };
  const phraseCount = Number(phraseCountRow?.count || 0);
  if (phraseCount === 0) {
    const insertRecent = db.prepare(
      'INSERT INTO recent_phrases (id, text, mode, timestamp) VALUES (?, ?, ?, ?)'
    );
    insertRecent.run('1', '"I need some water please"', 'Blink', '2 mins ago');
    insertRecent.run('2', '"Hello, how are you today?"', 'Sign', '1 hr ago');
    insertRecent.run('3', '"Please turn on the light"', 'Morse', '3 hrs ago');
    insertRecent.run('4', '"Thank you for your assistance"', 'TTS', '5 hrs ago');
  }

  // Seed Quick Morse Phrases
  const quickCountRow = db.prepare('SELECT COUNT(*) as count FROM quick_phrases').get() as { count: number | bigint };
  const quickCount = Number(quickCountRow?.count || 0);
  if (quickCount === 0) {
    const insertQuick = db.prepare(
      'INSERT INTO quick_phrases (id, label, morse, category) VALUES (?, ?, ?, ?)'
    );
    const initialQuick = [
      { id: 'm1', label: 'Yes', morse: '— · — —   ·   · · ·', category: 'General' },
      { id: 'm2', label: 'No', morse: '— ·   — — —', category: 'General' },
      { id: 'm3', label: 'Help', morse: '· · · ·   ·   · — · ·   · — — ·', category: 'Urgent' },
      { id: 'm4', label: 'Water', morse: '· — —   · —   —   ·   · — ·', category: 'Urgent' },
      { id: 'm5', label: 'Thank You', morse: '—   · · · ·   · —   — ·   — · —   /   — · — —   — — —   · · —', category: 'Social' },
      { id: 'm6', label: 'Emergency', morse: '·   — —   ·   · — ·   — — ·   ·   — ·   — · — ·   — · — —', category: 'Urgent' },
    ];
    for (const q of initialQuick) {
      insertQuick.run(q.id, q.label, q.morse, q.category);
    }
  }

  // Seed Categories & Category Phrases
  const catCountRow = db.prepare('SELECT COUNT(*) as count FROM categories').get() as { count: number | bigint };
  const catCount = Number(catCountRow?.count || 0);
  if (catCount === 0) {
    const insertCat = db.prepare('INSERT INTO categories (name) VALUES (?)');
    const insertCatPhrase = db.prepare('INSERT INTO category_phrases (category_id, text) VALUES (?, ?)');

    const defaultCategories = [
      {
        category: 'Urgent Needs',
        phrases: [
          'I need my medicine immediately.',
          'I am feeling pain, please help.',
          'Please call my nurse or family.',
          'I need water or a drink.'
        ]
      },
      {
        category: 'Daily Comfort',
        phrases: [
          'Please adjust my pillow position.',
          'I am tired.',
          'I want to rest.',
          'I need to use the bathroom.'
        ]
      },
      {
        category: 'Social Conversations',
        phrases: [
          'Hello, it is great to see you today!',
          'Thank you so much for helping me.',
          'How are you doing today?',
          'Yes, that sounds good to me.'
        ]
      }
    ];

    for (const cat of defaultCategories) {
      const info = insertCat.run(cat.category);
      const catId = Number(info.lastInsertRowid);
      for (const phrase of cat.phrases) {
        insertCatPhrase.run(catId, phrase);
      }
    }
  }

  // Seed Default Settings
  const settingsCountRow = db.prepare('SELECT COUNT(*) as count FROM user_settings').get() as { count: number | bigint };
  const settingsCount = Number(settingsCountRow?.count || 0);
  if (settingsCount === 0) {
    const insertSetting = db.prepare('INSERT INTO user_settings (key, value) VALUES (?, ?)');
    insertSetting.run('ear_threshold', '0.22');
    insertSetting.run('tts_rate', '1.0');
    insertSetting.run('tts_pitch', '1.0');
    insertSetting.run('theme', 'dark');
    insertSetting.run('ai_expanded_phrases', 'enabled');
  }

  // Seed Default Contacts for Accessible Video Call
  const contactCountRow = db.prepare('SELECT COUNT(*) as count FROM contacts').get() as { count: number | bigint };
  const contactCount = Number(contactCountRow?.count || 0);
  if (contactCount === 0) {
    const insertContact = db.prepare(`
      INSERT INTO contacts (patient_id, name, role, category, phone, email, avatar_initials, presence_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertContact.run(1, 'Saksham', 'Primary Caretaker', 'caregivers', '+91 8130896226', 'saksham@echolytix.care', 'CG', 'online');
    insertContact.run(1, 'Dr. Meera Sharma', 'Neurologist', 'healthcare', '+91 9811200000', 'dr.meera@aiims.edu', 'DS', 'online');
    insertContact.run(1, 'Parent', 'Family Member', 'family', '+91 9811000000', 'parent@family.care', 'PA', 'offline');
    insertContact.run(1, 'Emergency Helpline', 'Medical Support', 'emergency', '112', 'emergency@echolytix.org', 'EH', '24/7');
  }

  // Seed Sample Call & Messages for initial transcript
  const callCountRow = db.prepare('SELECT COUNT(*) as count FROM calls').get() as { count: number | bigint };
  if (Number(callCountRow?.count || 0) === 0) {
    const defaultCallId = 'call_demo_default';
    db.prepare(`
      INSERT INTO calls (id, initiator_id, initiator_name, recipient_id, recipient_name, status, duration)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(defaultCallId, 1, 'Arjun Pratap', '1', 'Saksham', 'connected', 754);

    const insertMsg = db.prepare(`
      INSERT INTO call_messages (id, call_id, sender_name, sender_role, method, text, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    insertMsg.run('m1', defaultCallId, 'You', 'local', 'Sign', 'GOOD', '10:24 AM');
    insertMsg.run('m2', defaultCallId, 'Saksham', 'remote', 'Speech', "That's great! How are you feeling now?", '10:24 AM');
    insertMsg.run('m3', defaultCallId, 'You', 'local', 'Blink', 'I NEED WATER', '10:25 AM');
    insertMsg.run('m4', defaultCallId, 'Saksham', 'remote', 'Speech', 'Okay, I will get you some water.', '10:25 AM');
  }

  // Seed Default Morse Settings
  const morseSettingsCount = db.prepare('SELECT COUNT(*) as count FROM morse_settings').get() as { count: number | bigint };
  if (Number(morseSettingsCount?.count || 0) === 0) {
    db.prepare(`
      INSERT INTO morse_settings (patient_id, trigger_key, trigger_code, dot_dash_threshold, letter_gap_timeout, input_mode, auto_speak)
      VALUES (1, ' ', 'Space', 250, 1200, 'tap', 1)
    `).run();
  }

  // Seed Sample Morse History
  const morseHistoryCount = db.prepare('SELECT COUNT(*) as count FROM morse_history').get() as { count: number | bigint };
  if (Number(morseHistoryCount?.count || 0) === 0) {
    const insertMorseHist = db.prepare(`
      INSERT INTO morse_history (id, patient_id, text, morse_sequence)
      VALUES (?, ?, ?, ?)
    `);
    insertMorseHist.run('mh1', 1, 'YES', '— · — —   ·   · · ·');
    insertMorseHist.run('mh2', 1, 'WATER', '· — —   · —   —   ·   · — ·');
  }
}

// Data Access Layer (CRUD Helper Functions)

// Patients Auth & Profiles
export function getPatientByEmail(email: string) {
  const stmt = db.prepare('SELECT * FROM patients WHERE email = ?');
  return stmt.get(email);
}

export function updatePatientProfile(
  id: number,
  name: string,
  age: number,
  medicalId: string,
  caregiverName: string,
  caregiverPhone: string,
  emergencyEmail: string,
  ttsSpeed: number,
  blinkThreshold: number,
  commitDelay: number
) {
  const stmt = db.prepare(`
    UPDATE patients 
    SET name = ?, age = ?, medical_id = ?, caregiver_name = ?, 
        caregiver_phone = ?, emergency_email = ?, tts_speed = ?, 
        blink_threshold = ?, commit_delay = ?
    WHERE id = ?
  `);
  stmt.run(name, age, medicalId, caregiverName, caregiverPhone, emergencyEmail, ttsSpeed, blinkThreshold, commitDelay, id);
  
  // Return the updated row
  const getStmt = db.prepare('SELECT * FROM patients WHERE id = ?');
  return getStmt.get(id);
}

// Recent Phrases
export function getRecentPhrases(limit = 20) {
  const stmt = db.prepare('SELECT id, text, mode, timestamp FROM recent_phrases ORDER BY created_at DESC LIMIT ?');
  return stmt.all(limit);
}

export function addRecentPhrase(text: string, mode: string) {
  const id = Date.now().toString();
  const timestamp = 'Just now';
  const stmt = db.prepare('INSERT INTO recent_phrases (id, text, mode, timestamp) VALUES (?, ?, ?, ?)');
  stmt.run(id, text, mode, timestamp);
  return { id, text, mode, timestamp };
}

export function deleteRecentPhrase(id: string) {
  const stmt = db.prepare('DELETE FROM recent_phrases WHERE id = ?');
  return stmt.run(id);
}

export function clearRecentPhrases() {
  const stmt = db.prepare('DELETE FROM recent_phrases');
  return stmt.run();
}

// Quick Phrases
export function getQuickPhrases() {
  const stmt = db.prepare('SELECT id, label, morse, category FROM quick_phrases ORDER BY created_at ASC');
  return stmt.all();
}

export function addQuickPhrase(label: string, morse: string, category = 'Custom') {
  const id = 'q_' + Date.now();
  const stmt = db.prepare('INSERT INTO quick_phrases (id, label, morse, category) VALUES (?, ?, ?, ?)');
  stmt.run(id, label, morse, category);
  return { id, label, morse, category };
}

export function deleteQuickPhrase(id: string) {
  const dbStmt = db.prepare('DELETE FROM quick_phrases WHERE id = ?');
  return dbStmt.run(id);
}

// Categories & Phrases
export function getCategoriesWithPhrases() {
  const categories = db.prepare('SELECT id, name as category FROM categories ORDER BY id ASC').all() as any[];
  const getPhrases = db.prepare('SELECT text FROM category_phrases WHERE category_id = ?');

  return categories.map(cat => ({
    id: Number(cat.id),
    category: String(cat.category),
    phrases: (getPhrases.all(cat.id) as any[]).map(p => String(p.text))
  }));
}

export function addCategory(name: string) {
  const stmt = db.prepare('INSERT INTO categories (name) VALUES (?)');
  const info = stmt.run(name);
  return { id: Number(info.lastInsertRowid), category: name, phrases: [] };
}

export function addPhraseToCategory(categoryId: number, phrase: string) {
  const stmt = db.prepare('INSERT INTO category_phrases (category_id, text) VALUES (?, ?)');
  stmt.run(categoryId, phrase);
  return { categoryId, phrase };
}

export function deleteCategory(id: number) {
  db.prepare('DELETE FROM category_phrases WHERE category_id = ?').run(id);
  return db.prepare('DELETE FROM categories WHERE id = ?').run(id);
}

export function deletePhraseFromCategory(categoryId: number, phrase: string) {
  return db.prepare('DELETE FROM category_phrases WHERE category_id = ? AND text = ?').run(categoryId, phrase);
}

// TTS Preferences Helpers
export function getTtsPreferences(patientId = 1) {
  const voice = db.prepare("SELECT value FROM user_settings WHERE key = 'tts_voice'").get() as any;
  const rate = db.prepare("SELECT value FROM user_settings WHERE key = 'tts_rate'").get() as any;
  const pitch = db.prepare("SELECT value FROM user_settings WHERE key = 'tts_pitch'").get() as any;
  return {
    voice: voice?.value || '',
    rate: rate?.value ? parseFloat(rate.value) : 1.0,
    pitch: pitch?.value ? parseFloat(pitch.value) : 1.0,
  };
}

export function updateTtsPreferences(patientId = 1, prefs: { voice?: string; rate?: number; pitch?: number }) {
  if (prefs.voice !== undefined) updateSetting('tts_voice', prefs.voice);
  if (prefs.rate !== undefined) updateSetting('tts_rate', String(prefs.rate));
  if (prefs.pitch !== undefined) updateSetting('tts_pitch', String(prefs.pitch));
  return getTtsPreferences(patientId);
}

// Settings
export function getSettings() {
  const rows = db.prepare('SELECT key, value FROM user_settings').all() as any[];
  const settings: Record<string, string> = {};
  for (const row of rows) {
    settings[String(row.key)] = String(row.value);
  }
  return settings;
}

export function updateSetting(key: string, value: string) {
  const stmt = db.prepare('INSERT INTO user_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value');
  stmt.run(key, value);
  return { key, value };
}

// SOS Emergencies Logging
export function createSosAlert(
  patientId: number | null | undefined,
  message: string,
  latitude: number | null | undefined,
  longitude: number | null | undefined,
  address?: string | null,
  caregiverPhone?: string | null,
  broadcastStatus?: string | null,
  broadcastChannel?: string | null
) {
  // Validate patientId: check if patient exists in database to prevent FOREIGN KEY constraint violations
  let validPatientId: number | null = null;
  let resolvedPhone = caregiverPhone || null;

  const numId = Number(patientId);
  if (patientId != null && !Number.isNaN(numId) && numId > 0) {
    try {
      const pCheck = db.prepare('SELECT id, caregiver_phone FROM patients WHERE id = ?');
      const existing = pCheck.get(numId) as any;
      if (existing) {
        validPatientId = numId;
        if (!resolvedPhone && existing.caregiver_phone) {
          resolvedPhone = existing.caregiver_phone;
        }
      }
    } catch (e) {
      console.warn("Could not verify patientId for SOS alert, falling back to guest/null:", e);
    }
  }

  // If no patientId or phone, check if any registered patient has a caregiver phone
  if (!resolvedPhone) {
    try {
      const defaultPatient = db.prepare('SELECT caregiver_phone FROM patients ORDER BY id ASC LIMIT 1').get() as any;
      if (defaultPatient?.caregiver_phone) {
        resolvedPhone = defaultPatient.caregiver_phone;
      }
    } catch (e) {}
  }

  const cleanLat = (latitude != null && !Number.isNaN(Number(latitude))) ? Number(latitude) : 28.627;
  const cleanLng = (longitude != null && !Number.isNaN(Number(longitude))) ? Number(longitude) : 77.372;
  const cleanMsg = (typeof message === 'string' && message.trim().length > 0)
    ? message.trim()
    : "SOS Assistance Required";

  const insert = db.prepare(`
    INSERT INTO sos_alerts (
      patient_id, message, latitude, longitude, timestamp, status, 
      address, caregiver_phone, broadcast_status, broadcast_channel
    )
    VALUES (?, ?, ?, ?, ?, 'ACTIVE', ?, ?, ?, ?)
  `);
  const timestamp = new Date().toISOString();
  const info = insert.run(
    validPatientId, 
    cleanMsg, 
    cleanLat, 
    cleanLng, 
    timestamp, 
    address || null,
    resolvedPhone,
    broadcastStatus || 'PENDING',
    broadcastChannel || 'MULTI_CHANNEL'
  );
  return { 
    success: true, 
    id: Number(info.lastInsertRowid), 
    timestamp,
    patientId: validPatientId,
    latitude: cleanLat,
    longitude: cleanLng,
    address: address || null,
    caregiverPhone: resolvedPhone,
    broadcastStatus: broadcastStatus || 'PENDING',
    broadcastChannel: broadcastChannel || 'MULTI_CHANNEL'
  };
}

export function updateSosAlertBroadcast(
  alertId: number,
  status: string,
  channel?: string | null,
  recipientPhone?: string | null
) {
  const update = db.prepare(`
    UPDATE sos_alerts
    SET broadcast_status = ?,
        broadcast_channel = COALESCE(?, broadcast_channel),
        caregiver_phone = COALESCE(?, caregiver_phone)
    WHERE id = ?
  `);
  update.run(status, channel || null, recipientPhone || null, Number(alertId));
  return { success: true, id: Number(alertId), status, channel, recipientPhone };
}

export function updateSosAlertLocation(
  alertId: number,
  latitude: number,
  longitude: number,
  address?: string | null
) {
  const cleanLat = Number(latitude);
  const cleanLng = Number(longitude);
  const update = db.prepare(`
    UPDATE sos_alerts
    SET latitude = ?, longitude = ?, address = COALESCE(?, address)
    WHERE id = ?
  `);
  update.run(cleanLat, cleanLng, address || null, Number(alertId));
  return { 
    success: true, 
    id: Number(alertId), 
    latitude: cleanLat, 
    longitude: cleanLng, 
    address: address || null 
  };
}

export function getRecentSosAlerts(limit = 10) {
  const query = db.prepare(`
    SELECT s.*, 
           COALESCE(p.name, 'Guest User') as patient_name, 
           p.caregiver_name, 
           COALESCE(s.caregiver_phone, p.caregiver_phone) as caregiver_phone, 
           p.emergency_email
    FROM sos_alerts s
    LEFT JOIN patients p ON s.patient_id = p.id
    ORDER BY s.timestamp DESC
    LIMIT ?
  `);
  return query.all(limit);
}

// User Registration
export function createPatient(
  email: string,
  passwordHash: string,
  name: string,
  age?: number,
  medicalId?: string,
  caregiverName?: string,
  caregiverPhone?: string,
  emergencyEmail?: string
) {
  const stmt = db.prepare(`
    INSERT INTO patients (
      email, password, name, age, medical_id, 
      caregiver_name, caregiver_phone, emergency_email
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const info = stmt.run(
    email,
    passwordHash,
    name,
    age || null,
    medicalId || null,
    caregiverName || null,
    caregiverPhone || null,
    emergencyEmail || null
  );
  
  // Return the newly created patient record (excluding password field)
  const getStmt = db.prepare('SELECT id, email, name, age, medical_id, caregiver_name, caregiver_phone, emergency_email, tts_speed, blink_threshold, commit_delay FROM patients WHERE id = ?');
  return getStmt.get(Number(info.lastInsertRowid));
}

// Session Helpers
export function createSession(patientId: number, token: string, expiresAt: string) {
  const stmt = db.prepare(`
    INSERT INTO sessions (token, patient_id, expires_at)
    VALUES (?, ?, ?)
  `);
  stmt.run(token, patientId, expiresAt);
  return { token, patientId, expiresAt };
}

export function getSession(token: string) {
  const stmt = db.prepare(`
    SELECT s.token, s.expires_at, p.id, p.email, p.name, p.age, p.medical_id, p.phone,
           p.caregiver_name, p.caregiver_phone, p.emergency_email, 
           p.tts_speed, p.blink_threshold, p.commit_delay
    FROM sessions s
    JOIN patients p ON s.patient_id = p.id
    WHERE s.token = ?
  `);
  return stmt.get(token);
}

export function getPatientById(id: number | string) {
  const stmt = db.prepare('SELECT id, email, name, phone, age, medical_id, caregiver_name, caregiver_phone, emergency_email FROM patients WHERE id = ?');
  return stmt.get(Number(id));
}

export function getPatientByPhone(phone: string) {
  if (!phone) return null;
  const cleanDigits = phone.replace(/\D/g, '');
  const last10 = cleanDigits.slice(-10);

  const stmt = db.prepare(`
    SELECT id, email, name, phone, age, medical_id, caregiver_name, caregiver_phone
    FROM patients 
    WHERE phone = ? 
       OR phone = ? 
       OR (phone IS NOT NULL AND LENGTH(REPLACE(REPLACE(phone, ' ', ''), '-', '')) >= 10 AND REPLACE(REPLACE(phone, ' ', ''), '-', '') LIKE '%' || ?)
       OR (caregiver_phone IS NOT NULL AND REPLACE(REPLACE(caregiver_phone, ' ', ''), '-', '') LIKE '%' || ?)
    LIMIT 1
  `);
  return stmt.get(phone, `+${cleanDigits}`, last10, last10);
}

export function deleteSession(token: string) {
  const stmt = db.prepare('DELETE FROM sessions WHERE token = ?');
  return stmt.run(token);
}

// Password Reset Helpers
export function createPasswordReset(email: string, token: string, expiresAt: string) {
  const stmt = db.prepare(`
    INSERT INTO password_resets (email, token, expires_at)
    VALUES (?, ?, ?)
    ON CONFLICT(email) DO UPDATE SET token = excluded.token, expires_at = excluded.expires_at
  `);
  stmt.run(email, token, expiresAt);
  return { email, token, expiresAt };
}

export function getPasswordReset(email: string) {
  const stmt = db.prepare('SELECT * FROM password_resets WHERE email = ?');
  return stmt.get(email);
}

export function deletePasswordReset(email: string) {
  const stmt = db.prepare('DELETE FROM password_resets WHERE email = ?');
  return stmt.run(email);
}

export function updatePatientPassword(id: number, passwordHash: string) {
  const stmt = db.prepare('UPDATE patients SET password = ? WHERE id = ?');
  return stmt.run(passwordHash, id);
}

// Support Request Helpers
export function createSupportRequest(name: string, email: string, message: string) {
  const stmt = db.prepare(`
    INSERT INTO support_requests (name, email, message, created_at)
    VALUES (?, ?, ?, ?)
  `);
  const timestamp = new Date().toISOString();
  stmt.run(name, email, message, timestamp);
  return { name, email, message, created_at: timestamp };
}

export function getSupportRequests(limit = 50) {
  const stmt = db.prepare(`
    SELECT * FROM support_requests 
    ORDER BY created_at DESC 
    LIMIT ?
  `);
  return stmt.all(limit);
}

// Contacts Helpers
export function getContacts(patientId?: number, search?: string, category?: string) {
  let query = 'SELECT * FROM contacts WHERE 1=1';
  const params: any[] = [];
  if (patientId) {
    query += ' AND (patient_id = ? OR patient_id IS NULL)';
    params.push(patientId);
  }
  if (category && category !== 'all') {
    query += ' AND LOWER(category) = LOWER(?)';
    params.push(category);
  }
  if (search && search.trim()) {
    query += ' AND (LOWER(name) LIKE ? OR LOWER(role) LIKE ?)';
    const term = `%${search.trim().toLowerCase()}%`;
    params.push(term, term);
  }
  query += ' ORDER BY id ASC';
  return db.prepare(query).all(...params);
}

export function getContactById(contactId: number) {
  return db.prepare('SELECT * FROM contacts WHERE id = ?').get(contactId);
}

export function createContact(data: {
  patient_id?: number;
  name: string;
  role: string;
  category: string;
  phone?: string;
  email?: string;
  avatar_initials?: string;
  presence_status?: string;
}) {
  const initials = data.avatar_initials || data.name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase() || 'CT';
  const stmt = db.prepare(`
    INSERT INTO contacts (patient_id, name, role, category, phone, email, avatar_initials, presence_status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const info = stmt.run(
    data.patient_id ?? 1,
    data.name,
    data.role,
    data.category.toLowerCase(),
    data.phone || null,
    data.email || null,
    initials,
    data.presence_status || 'offline'
  );
  return getContactById(Number(info.lastInsertRowid));
}

export function deleteContact(contactId: number, patientId?: number) {
  if (patientId) {
    return db.prepare('DELETE FROM contacts WHERE id = ? AND (patient_id = ? OR patient_id IS NULL)').run(contactId, patientId);
  }
  return db.prepare('DELETE FROM contacts WHERE id = ?').run(contactId);
}

export function updateContactPresence(contactId: number, presence: string) {
  return db.prepare('UPDATE contacts SET presence_status = ? WHERE id = ?').run(presence, contactId);
}

export function updateContact(contactId: number, data: { phone?: string; name?: string; role?: string; email?: string }) {
  const current = getContactById(contactId) as any;
  if (!current) return null;
  const newPhone = data.phone !== undefined ? data.phone : current.phone;
  const newName = data.name !== undefined ? data.name : current.name;
  const newRole = data.role !== undefined ? data.role : current.role;
  const newEmail = data.email !== undefined ? data.email : current.email;

  const stmt = db.prepare(`
    UPDATE contacts
    SET phone = ?, name = ?, role = ?, email = ?
    WHERE id = ?
  `);
  stmt.run(newPhone, newName, newRole, newEmail, Number(contactId));
  return getContactById(contactId);
}

export function dismissSosAlert(alertId?: number) {
  if (alertId) {
    const update = db.prepare(`UPDATE sos_alerts SET status = 'DISMISSED' WHERE id = ?`);
    update.run(Number(alertId));
  } else {
    const update = db.prepare(`UPDATE sos_alerts SET status = 'DISMISSED' WHERE status = 'ACTIVE'`);
    update.run();
  }
  return { success: true };
}

// Calls Helpers
export function createCall(data: {
  id: string;
  initiator_id?: number;
  initiator_name: string;
  initiator_phone?: string;
  recipient_id?: string;
  recipient_name: string;
  recipient_phone?: string;
  status?: string;
  call_type?: string;
}) {
  const stmt = db.prepare(`
    INSERT INTO calls (
      id, initiator_id, initiator_name, initiator_phone, 
      recipient_id, recipient_name, recipient_phone, 
      status, call_type, started_at, ringing_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `);
  stmt.run(
    data.id,
    data.initiator_id ?? 1,
    data.initiator_name,
    data.initiator_phone || null,
    data.recipient_id || null,
    data.recipient_name,
    data.recipient_phone || null,
    data.status || 'initiating',
    data.call_type || 'video'
  );
  return getCallById(data.id);
}

export function getCallById(callId: string) {
  return db.prepare('SELECT * FROM calls WHERE id = ?').get(callId);
}

export function updateCallStatus(callId: string, status: string, endReason?: string, duration?: number) {
  let query = 'UPDATE calls SET status = ?';
  const params: any[] = [status];
  if (status === 'connected') {
    query += ', answered_at = COALESCE(answered_at, CURRENT_TIMESTAMP)';
  } else if (status === 'ended' || status === 'failed' || status === 'rejected' || status === 'cancelled') {
    query += ', ended_at = COALESCE(ended_at, CURRENT_TIMESTAMP)';
    if (endReason) {
      query += ', end_reason = ?';
      params.push(endReason);
    }
    if (duration !== undefined) {
      query += ', duration = ?';
      params.push(duration);
    }
  }
  query += ' WHERE id = ?';
  params.push(callId);
  db.prepare(query).run(...params);
  return getCallById(callId);
}

export function getCallHistory(userId?: number, limit = 30) {
  if (userId) {
    return db.prepare(`
      SELECT * FROM calls 
      WHERE initiator_id = ? OR recipient_id = ? 
      ORDER BY started_at DESC 
      LIMIT ?
    `).all(userId, String(userId), limit);
  }
  return db.prepare('SELECT * FROM calls ORDER BY started_at DESC LIMIT ?').all(limit);
}

// Call Messages Helpers
export function addCallMessage(data: {
  id?: string;
  call_id: string;
  sender_name: string;
  sender_role: string;
  method: string;
  text: string;
  timestamp?: string;
}) {
  const id = data.id || `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const time = data.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const stmt = db.prepare(`
    INSERT INTO call_messages (id, call_id, sender_name, sender_role, method, text, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(id, data.call_id, data.sender_name, data.sender_role, data.method, data.text, time);
  return { id, ...data, timestamp: time };
}

export function getCallMessages(callId: string) {
  return db.prepare('SELECT * FROM call_messages WHERE call_id = ? ORDER BY created_at ASC').all(callId);
}

// Call Settings Helpers
export function getCallSettings(patientId = 1) {
  let row = db.prepare('SELECT * FROM call_settings WHERE patient_id = ?').get(patientId) as any;
  if (!row) {
    db.prepare(`
      INSERT INTO call_settings (patient_id, auto_translate, show_detected_gestures, speak_translations, noise_reduction)
      VALUES (?, 1, 1, 1, 1)
    `).run(patientId);
    row = db.prepare('SELECT * FROM call_settings WHERE patient_id = ?').get(patientId);
  }
  return {
    auto_translate: Boolean(row.auto_translate),
    show_detected_gestures: Boolean(row.show_detected_gestures),
    speak_translations: Boolean(row.speak_translations),
    noise_reduction: Boolean(row.noise_reduction),
  };
}

export function updateCallSettings(patientId = 1, settings: {
  auto_translate?: boolean;
  show_detected_gestures?: boolean;
  speak_translations?: boolean;
  noise_reduction?: boolean;
}) {
  const current = getCallSettings(patientId);
  const updated = { ...current, ...settings };
  db.prepare(`
    INSERT INTO call_settings (patient_id, auto_translate, show_detected_gestures, speak_translations, noise_reduction, updated_at)
    VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(patient_id) DO UPDATE SET
      auto_translate = excluded.auto_translate,
      show_detected_gestures = excluded.show_detected_gestures,
      speak_translations = excluded.speak_translations,
      noise_reduction = excluded.noise_reduction,
      updated_at = CURRENT_TIMESTAMP
  `).run(
    patientId,
    updated.auto_translate ? 1 : 0,
    updated.show_detected_gestures ? 1 : 0,
    updated.speak_translations ? 1 : 0,
    updated.noise_reduction ? 1 : 0
  );
  return updated;
}

// Morse Settings Helpers
export function getMorseSettings(patientId = 1) {
  let row = db.prepare('SELECT * FROM morse_settings WHERE patient_id = ?').get(patientId) as any;
  if (!row) {
    db.prepare(`
      INSERT INTO morse_settings (patient_id, trigger_key, trigger_code, dot_dash_threshold, letter_gap_timeout, input_mode, auto_speak)
      VALUES (?, ' ', 'Space', 250, 1200, 'tap', 1)
    `).run(patientId);
    row = db.prepare('SELECT * FROM morse_settings WHERE patient_id = ?').get(patientId);
  }
  return {
    trigger_key: row.trigger_key || ' ',
    trigger_code: row.trigger_code || 'Space',
    dot_dash_threshold: Number(row.dot_dash_threshold || 250),
    letter_gap_timeout: Number(row.letter_gap_timeout || 1200),
    input_mode: row.input_mode || 'tap',
    auto_speak: Boolean(row.auto_speak)
  };
}

export function updateMorseSettings(patientId = 1, settings: {
  trigger_key?: string;
  trigger_code?: string;
  dot_dash_threshold?: number;
  letter_gap_timeout?: number;
  input_mode?: string;
  auto_speak?: boolean;
}) {
  const current = getMorseSettings(patientId);
  const updated = { ...current, ...settings };
  db.prepare(`
    INSERT INTO morse_settings (patient_id, trigger_key, trigger_code, dot_dash_threshold, letter_gap_timeout, input_mode, auto_speak, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(patient_id) DO UPDATE SET
      trigger_key = excluded.trigger_key,
      trigger_code = excluded.trigger_code,
      dot_dash_threshold = excluded.dot_dash_threshold,
      letter_gap_timeout = excluded.letter_gap_timeout,
      input_mode = excluded.input_mode,
      auto_speak = excluded.auto_speak,
      updated_at = CURRENT_TIMESTAMP
  `).run(
    patientId,
    updated.trigger_key,
    updated.trigger_code,
    updated.dot_dash_threshold,
    updated.letter_gap_timeout,
    updated.input_mode,
    updated.auto_speak ? 1 : 0
  );
  return updated;
}

// Morse History Helpers
export function getMorseHistory(patientId = 1, limit = 50) {
  return db.prepare('SELECT * FROM morse_history WHERE patient_id = ? ORDER BY created_at DESC LIMIT ?').all(patientId, limit);
}

export function addMorseHistory(data: { patient_id?: number; text: string; morse_sequence?: string }) {
  const id = `mh_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const patientId = data.patient_id || 1;
  db.prepare(`
    INSERT INTO morse_history (id, patient_id, text, morse_sequence)
    VALUES (?, ?, ?, ?)
  `).run(id, patientId, data.text, data.morse_sequence || null);
  return { id, patient_id: patientId, text: data.text, morse_sequence: data.morse_sequence };
}

export { db };
export default db;
