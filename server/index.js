import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

import { discordAuthRouter } from "./routes/discord-auth.js";
import { discordDataRouter } from "./routes/discord-data.js";

// Init env
dotenv.config();

// App
const app = express();
const PORT = Number(process.env.PORT) || 3001;

/* =========================
   MIDDLEWARES
========================= */

// CORS (Vite + cookies)
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Body parsing
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// Cookies
app.use(cookieParser());

/* =========================
   ROUTES
========================= */

app.get("/", (req, res) => {
  res.json({
    name: "Backend API",
    status: "running",
    port: PORT,
  });
});

app.use("/api/auth/discord", discordAuthRouter);
app.use("/api/discord", discordDataRouter);

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
  });
});

/* =========================
   SERVER START
========================= */

const server = app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
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
