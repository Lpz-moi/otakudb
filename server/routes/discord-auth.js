import express from 'express';
import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';
import { config } from 'dotenv';
import { getRow, runQuery } from '../db.js';

config();

const router = express.Router();

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const DISCORD_REDIRECT_URI = process.env.DISCORD_REDIRECT_URI || 'http://localhost:3001/api/auth/discord/callback';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Validation
if (!DISCORD_CLIENT_ID || !DISCORD_CLIENT_SECRET) {
  console.error('❌ Missing DISCORD_CLIENT_ID or DISCORD_CLIENT_SECRET');
}

/**
 * GET /api/auth/discord/login
 * Retourner l'URL d'autorisation Discord
 */
router.get('/login', (req, res) => {
  try {
    const state = Math.random().toString(36).substring(7);
    const scopes = ['identify', 'email'];
    
    const authUrl = `https://discord.com/api/oauth2/authorize?` +
      `client_id=${DISCORD_CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(DISCORD_REDIRECT_URI)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent(scopes.join(' '))}&` +
      `state=${state}`;

    res.cookie('discord_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600000,
      path: '/',
    });

    console.log('✅ Auth URL generated');
    res.json({ authUrl });
  } catch (error) {
    console.error('❌ Error generating auth URL:', error);
    res.status(500).json({ error: 'Failed to generate auth URL' });
  }
});

/**
 * GET /api/auth/discord/callback
 * Callback OAuth Discord
 */
router.get('/callback', async (req, res) => {
  const { code, state } = req.query;
  const storedState = req.cookies.discord_oauth_state;

  if (!code) {
    return res.redirect(`${FRONTEND_URL}/auth/error?message=missing_code`);
  }

  if (state !== storedState) {
    console.error('❌ State mismatch');
    return res.redirect(`${FRONTEND_URL}/auth/error?message=invalid_state`);
  }

  try {
    console.log('🔄 Exchanging code for token...');
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: DISCORD_REDIRECT_URI,
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      throw new Error(`Token exchange failed: ${error}`);
    }

    const tokenData = await tokenResponse.json();
    const { access_token } = tokenData;

    console.log('🔄 Fetching user data...');
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    if (!userResponse.ok) {
      throw new Error('Failed to fetch user data');
    }

    const userData = await userResponse.json();
    const discordId = userData.id;

    console.log('🔄 Creating/updating user in database...');
    const existingUser = await getRow('SELECT * FROM users WHERE discord_id = ?', [discordId]);

    if (!existingUser) {
      await runQuery(
        'INSERT INTO users (discord_id, username, avatar, email) VALUES (?, ?, ?, ?)',
        [discordId, userData.username, userData.avatar, userData.email]
      );
      console.log('✅ New user created:', discordId);
    } else {
      await runQuery(
        'UPDATE users SET username = ?, avatar = ?, email = ?, updated_at = CURRENT_TIMESTAMP WHERE discord_id = ?',
        [userData.username, userData.avatar, userData.email, discordId]
      );
      console.log('✅ User updated:', discordId);
    }

    console.log('🔄 Generating JWT...');
    const sessionToken = jwt.sign(
      {
        discord_id: discordId,
        username: userData.username,
        email: userData.email,
        avatar: userData.avatar,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('session_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    res.clearCookie('discord_oauth_state', { path: '/' });

    console.log('✅ OAuth complete');
    res.redirect(`${FRONTEND_URL}/auth/success`);
  } catch (error) {
    console.error('❌ OAuth error:', error);
    res.redirect(`${FRONTEND_URL}/auth/error?message=${encodeURIComponent(error.message)}`);
  }
});

/**
 * GET /api/auth/discord/me
 * Récupérer l'utilisateur courant
 */
router.get('/me', async (req, res) => {
  const sessionToken = req.cookies.session_token;

  if (!sessionToken) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const decoded = jwt.verify(sessionToken, JWT_SECRET);
    const user = await getRow('SELECT * FROM users WHERE discord_id = ?', [decoded.discord_id]);

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    res.json({
      user: {
        id: user.discord_id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      res.clearCookie('session_token', { path: '/' });
      return res.status(401).json({ error: 'Token expired' });
    }
    console.error('❌ Auth error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

/**
 * POST /api/auth/discord/logout
 * Déconnecter l'utilisateur
 */
router.post('/logout', (req, res) => {
  try {
    res.clearCookie('session_token', { path: '/' });
    console.log('✅ Logout');
    res.json({ success: true, message: 'Logged out' });
  } catch (error) {
    console.error('❌ Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

export { router as discordAuthRouter };


