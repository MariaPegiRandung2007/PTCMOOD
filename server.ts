import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { GoogleGenAI, Type } from "@google/genai";
import path from "path";

const db = new Database("schoolmood.db");
const JWT_SECRET = process.env.JWT_SECRET || "schoolmood-secret-key-123";

// Initialize DB
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT,
    name TEXT
  );

  CREATE TABLE IF NOT EXISTS moods (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER,
    date TEXT,
    mood_type TEXT,
    reason TEXT,
    category TEXT,
    FOREIGN KEY(student_id) REFERENCES users(id)
  );
`);

// Seed some users if empty
const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };
if (userCount.count === 0) {
  const salt = bcrypt.genSaltSync(10);
  const studentPass = bcrypt.hashSync("student123", salt);
  const teacherPass = bcrypt.hashSync("teacher123", salt);

  db.prepare("INSERT INTO users (username, password, role, name) VALUES (?, ?, ?, ?)").run("student1", studentPass, "student", "Budi Santoso");
  db.prepare("INSERT INTO users (username, password, role, name) VALUES (?, ?, ?, ?)").run("student2", studentPass, "student", "Siti Aminah");
  db.prepare("INSERT INTO users (username, password, role, name) VALUES (?, ?, ?, ?)").run("teacher1", teacherPass, "teacher", "Ibu Guru BK");
}

async function startServer() {
  const app = express();
  app.use(express.json());

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

  // Auth Middleware
  const authenticate = (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch (e) {
      res.status(401).json({ error: "Invalid token" });
    }
  };

  // Auth Routes
  app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username) as any;
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role, name: user.name }, JWT_SECRET);
    res.json({ token, user: { id: user.id, username: user.username, role: user.role, name: user.name } });
  });

  // Mood Routes
  app.post("/api/moods", authenticate, async (req: any, res) => {
    const { mood_type, reason } = req.body;
    const student_id = req.user.id;
    const date = new Date().toISOString().split("T")[0];

    // Check if already submitted today
    const existing = db.prepare("SELECT * FROM moods WHERE student_id = ? AND date = ?").get(student_id, date);
    if (existing) {
      return res.status(400).json({ error: "Kamu sudah mengisi mood hari ini!" });
    }

    // AI Categorization
    let category = "Lainnya";
    if (reason && reason.trim().length > 0) {
      try {
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: `Kategorikan alasan suasana hati siswa berikut ke dalam satu kata (Akademik, Pertemanan, Keluarga, Kesehatan, atau Lainnya): "${reason}"`,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                category: { type: Type.STRING }
              }
            }
          }
        });
        const result = JSON.parse(response.text);
        category = result.category || "Lainnya";
      } catch (e) {
        console.error("AI Error:", e);
      }
    }

    db.prepare("INSERT INTO moods (student_id, date, mood_type, reason, category) VALUES (?, ?, ?, ?, ?)").run(
      student_id, date, mood_type, reason, category
    );
    res.json({ success: true });
  });

  app.get("/api/moods/me", authenticate, (req: any, res) => {
    const moods = db.prepare("SELECT * FROM moods WHERE student_id = ? ORDER BY date DESC").all(req.user.id);
    res.json(moods);
  });

  app.get("/api/moods/stats", authenticate, (req: any, res) => {
    if (req.user.role !== "teacher") return res.status(403).json({ error: "Forbidden" });
    
    const moods = db.prepare(`
      SELECT m.*, u.name as student_name 
      FROM moods m 
      JOIN users u ON m.student_id = u.id 
      ORDER BY m.date DESC
    `).all();
    res.json(moods);
  });

  app.get("/api/ai/insight", authenticate, async (req: any, res) => {
    const days = req.query.days || 7;
    let moods;
    if (req.user.role === 'teacher') {
      moods = db.prepare("SELECT mood_type, date FROM moods WHERE date >= date('now', ? || ' days')").all(`-${days}`);
    } else {
      moods = db.prepare("SELECT mood_type, date FROM moods WHERE student_id = ? AND date >= date('now', ? || ' days')").all(req.user.id, `-${days}`);
    }

    if (moods.length === 0) return res.json({ insight: "Belum ada data mood yang cukup untuk dianalisis." });

    try {
      const moodSummary = moods.map(m => m.mood_type).join(", ");
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Berikan insight singkat (maks 2 kalimat) tentang tren emosi berikut: ${moodSummary}. Gunakan bahasa yang ramah dan mendukung.`,
      });
      res.json({ insight: response.text });
    } catch (e) {
      res.json({ insight: "Gagal memuat insight AI." });
    }
  });

  // Vite middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(3000, "0.0.0.0", () => {
    console.log("Server running on http://localhost:3000");
  });
}

startServer();
