import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, 'database.json');

// Initial state of the database file
const DEFAULT_DB = {
  users: [],
  audits: {}, // userId -> { logs: [], wheelSelfAssessment: {}, checklistItems: [] }
};

class FileDatabase {
  constructor() {
    this.init();
  }

  init() {
    if (!fs.existsSync(DB_PATH)) {
      this.write(DEFAULT_DB);
    }
  }

  read() {
    try {
      const data = fs.readFileSync(DB_PATH, 'utf8');
      return JSON.parse(data);
    } catch (e) {
      console.error('Failed reading database file, returning default schema.', e);
      return DEFAULT_DB;
    }
  }

  write(data) {
    try {
      fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
      console.error('Failed writing to database file.', e);
    }
  }

  getUserByEmail(email) {
    const db = this.read();
    return db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  getUserById(id) {
    const db = this.read();
    return db.users.find((u) => u.id === id);
  }

  createUser(email, passwordHash) {
    const db = this.read();
    
    // Check duplication
    if (this.getUserByEmail(email)) {
      throw new Error('User already exists');
    }

    const newUser = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
      email: email.toLowerCase(),
      passwordHash,
      createdAt: new Date().toISOString(),
    };

    db.users.push(newUser);
    
    // Create empty audit mapping
    db.audits[newUser.id] = {
      logs: [],
      wheelSelfAssessment: {
        health: 6,
        wealth: 5,
        career: 6,
        relationships: 6,
        leisure: 6,
        growth: 6,
      },
      checklistItems: [
        { id: 'h1', label: '30m Workout', active: true },
        { id: 'h2', label: 'Read 10 Pages', active: true },
        { id: 'h3', label: 'Drink 3L Water', active: true },
        { id: 'h4', label: 'Meditate', active: true },
        { id: 'h5', label: 'Stretch/Mobility', active: true },
        { id: 'h6', label: 'Journaling', active: true },
        { id: 'h7', label: 'No Sugar', active: true },
        { id: 'h8', label: '8h Sleep', active: true },
      ],
    };

    this.write(db);
    return newUser;
  }

  getAuditData(userId) {
    const db = this.read();
    return db.audits[userId] || { logs: [], wheelSelfAssessment: {}, checklistItems: [] };
  }

  saveAuditLogs(userId, logs) {
    const db = this.read();
    if (!db.audits[userId]) {
      db.audits[userId] = { logs: [], wheelSelfAssessment: {}, checklistItems: [] };
    }
    db.audits[userId].logs = logs;
    this.write(db);
    return db.audits[userId];
  }

  saveWheelAssessment(userId, wheel) {
    const db = this.read();
    if (!db.audits[userId]) {
      db.audits[userId] = { logs: [], wheelSelfAssessment: {}, checklistItems: [] };
    }
    db.audits[userId].wheelSelfAssessment = wheel;
    this.write(db);
    return db.audits[userId];
  }

  saveChecklistItems(userId, habits) {
    const db = this.read();
    if (!db.audits[userId]) {
      db.audits[userId] = { logs: [], wheelSelfAssessment: {}, checklistItems: [] };
    }
    db.audits[userId].checklistItems = habits;
    this.write(db);
    return db.audits[userId];
  }
}

export const db = new FileDatabase();
