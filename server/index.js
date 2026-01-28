import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { initializeDatabase } from "./db.js";

import { discordAuthRouter } from "./routes/discord-auth.js";
import { animeListRouter } from "./routes/anime-list.js";

// Init env
dotenv.config();

// App
const app = express();
const PORT = Number(process.env.PORT) || 3001;

/* =========================
   MIDDLEWARES
========================= */

// CORS Configuration for Codespaces + Local Development
const corsOptions = {
  origin: function (origin, callback) {
    // Liste des origines autorisées
    const allowedOrigins = [
      'http://localhost:8080',
      'http://localhost:5173',
      'http://localhost:3000',
      'http://10.0.2.68:8080', // Codespaces local network
      process.env.FRONTEND_URL,
    ].filter(Boolean);

    // Regex pour tous les domaines *.app.github.dev (Codespaces)
    const isCodespaces = origin && /https:\/\/[a-z0-9\-]+-(8080|5173|3000)\.app\.github\.dev$/.test(origin);
    
    if (!origin || allowedOrigins.includes(origin) || isCodespaces) {
      callback(null, true);
    } else {
      console.warn(`⚠️ CORS blocked for origin: ${origin}`);
      callback(new Error('Not allowed by CORS'), false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200,
};

// CORS (Vite + cookies)
app.use(cors(corsOptions));

// Body parsing
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// Cookies
app.use(cookieParser());

/* =========================
   ROUTES
========================= */

app.get("/", (req, res) => {
  res.json({
    name: "OtakuDB Backend API",
    status: "running",
    port: PORT,
    version: "1.0.0",
  });
});

// Auth routes
app.use("/api/auth/discord", discordAuthRouter);

// Anime list routes
app.use("/api/anime", animeListRouter);

// Health check (monitoring)
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

/* =========================
   404 HANDLER
========================= */

app.use((req, res) => {
  res.status(404).json({
    error: "Not Found",
    path: req.originalUrl,
    method: req.method,
  });
});

/* =========================
   ERROR HANDLING
========================= */

app.use((err, req, res, next) => {
  console.error("❌ Error:", err);
  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
  });
});

/* =========================
   SERVER START
========================= */

async function startServer() {
  try {
    // Initialize database
    console.log("🔄 Initializing database...");
    await initializeDatabase();
    
    const server = app.listen(PORT, () => {
      console.log(`✅ Backend running on http://localhost:${PORT}`);
      console.log(`📍 API available at http://localhost:${PORT}/api`);
      console.log(`🔐 Auth endpoint: http://localhost:${PORT}/api/auth/discord`);
      console.log(`🎬 Anime endpoint: http://localhost:${PORT}/api/anime`);
    });

    /* =========================
       ERROR HANDLING
    ========================= */

    server.on("error", (error) => {
      if (error.code === "EADDRINUSE") {
        console.error(`\n❌ Port ${PORT} already in use`);
        console.error("💡 Solutions :");
        console.error("   → npm run kill:port");
        console.error("   → change PORT in .env");
        console.error(`   → netstat -ano | findstr :${PORT}`);
        process.exit(1);
      }

      console.error("❌ Server error:", error);
      process.exit(1);
    });

    // Catch unhandled errors (sécurité)
    process.on("unhandledRejection", (reason) => {
      console.error("❌ Unhandled Rejection:", reason);
    });

    process.on("uncaughtException", (err) => {
      console.error("❌ Uncaught Exception:", err);
      process.exit(1);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

startServer();

