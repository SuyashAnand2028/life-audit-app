import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { db } from './db.js';
import { authenticateToken } from './middleware.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'life-audit-os-secret-2026';

app.use(cors());
app.use(express.json());

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const existingUser = db.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email is already registered' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Save User
    const newUser = db.createUser(email, passwordHash);

    // Sign Token
    const token = jwt.sign({ id: newUser.id, email: newUser.email }, JWT_SECRET, {
      expiresIn: '7d',
    });

    res.status(201).json({
      token,
      user: { id: newUser.id, email: newUser.email },
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error during registration' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const user = db.getUserByEmail(email);
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // Verify Password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // Sign Token
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: '7d',
    });

    res.json({
      token,
      user: { id: user.id, email: user.email },
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error during login' });
  }
});

// Audit Operations (JWT Protected)
app.get('/api/audit/data', authenticateToken, (req, res) => {
  try {
    const data = db.getAuditData(req.user.id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve data' });
  }
});

app.post('/api/audit/logs', authenticateToken, (req, res) => {
  const { logs } = req.body;
  if (!Array.isArray(logs)) {
    return res.status(400).json({ error: 'Logs must be an array' });
  }
  try {
    const updated = db.saveAuditLogs(req.user.id, logs);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save logs' });
  }
});

app.post('/api/audit/wheel', authenticateToken, (req, res) => {
  const { wheelSelfAssessment } = req.body;
  if (!wheelSelfAssessment) {
    return res.status(400).json({ error: 'wheelSelfAssessment data is required' });
  }
  try {
    const updated = db.saveWheelAssessment(req.user.id, wheelSelfAssessment);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save Wheel assessment' });
  }
});

app.post('/api/audit/habits', authenticateToken, (req, res) => {
  const { checklistItems } = req.body;
  if (!Array.isArray(checklistItems)) {
    return res.status(400).json({ error: 'checklistItems must be an array' });
  }
  try {
    const updated = db.saveChecklistItems(req.user.id, checklistItems);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save checklist habits' });
  }
});

// Export for Vercel Serverless
export default app;
