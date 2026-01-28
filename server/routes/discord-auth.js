import express from 'express';
import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';
import { config } from 'dotenv';

config();

const router = express.Router();

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const DISCORD_REDIRECT_URI = process.env.DISCORD_REDIRECT_URI || 'http://localhost:3001/api/auth/discord/callback';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:8080';

// Générer l'URL d'autorisation Discord
router.get('/login', (req, res) => {
  const state = Math.random().toString(36).substring(7);
  const scopes = ['identify', 'email', 'guilds'];
  
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
    maxAge: 600000, // 10 minutes
  });

  res.json({ authUrl });
});

// Callback OAuth Discord
router.get('/callback', async (req, res) => {
  const { code, state } = req.query;
  const storedState = req.cookies.discord_oauth_state;

  if (!code || state !== storedState) {
    return res.redirect(`${FRONTEND_URL}/auth/error?message=invalid_state`);
  }

  try {
    // Échanger le code contre un access token
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
      throw new Error('Failed to exchange code for token');
    }

    const tokenData = await tokenResponse.json();
    const { access_token, refresh_token, expires_in } = tokenData;

    // Récupérer les informations utilisateur
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    if (!userResponse.ok) {
      throw new Error('Failed to fetch user data');
    }

    const userData = await userResponse.json();

    // Créer les tokens JWT
    const sessionToken = jwt.sign(
      {
        userId: userData.id,
        username: userData.username,
        discriminator: userData.discriminator,
        email: userData.email,
        avatar: userData.avatar,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const refreshTokenJWT = jwt.sign(
      { userId: userData.id },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Stocker les tokens Discord de manière sécurisée (en production, utiliser une DB)
    // Pour l'instant, on les inclut dans le JWT refresh token
    const tokensData = {
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresAt: Date.now() + expires_in * 1000,
    };

    // Rediriger vers le frontend avec les tokens
    res.cookie('session_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
    });

    res.cookie('refresh_token', refreshTokenJWT, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 jours
    });

    // Stocker les tokens Discord (en production, utiliser Redis ou DB)
    // Pour l'instant, on les stocke dans un objet en mémoire (à améliorer)
    if (!global.discordTokens) {
      global.discordTokens = {};
    }
    global.discordTokens[userData.id] = tokensData;

    res.redirect(`${FRONTEND_URL}/auth/success`);
  } catch (error) {
    console.error('OAuth error:', error);
    res.redirect(`${FRONTEND_URL}/auth/error?message=${encodeURIComponent(error.message)}`);
  }
});

// Vérifier la session
router.get('/me', async (req, res) => {
  const sessionToken = req.cookies.session_token;

  if (!sessionToken) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const decoded = jwt.verify(sessionToken, JWT_SECRET);
    
    // Récupérer les tokens Discord si nécessaire
    const tokensData = global.discordTokens?.[decoded.userId];
    
    res.json({
      user: {
        id: decoded.userId,
        username: decoded.username,
        discriminator: decoded.discriminator,
        email: decoded.email,
        avatar: decoded.avatar,
      },
      hasDiscordTokens: !!tokensData,
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Obtenir les tokens Discord pour l'utilisateur
router.get('/tokens', async (req, res) => {
  const sessionToken = req.cookies.session_token;

  if (!sessionToken) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const decoded = jwt.verify(sessionToken, JWT_SECRET);
    const tokensData = global.discordTokens?.[decoded.userId];

    if (!tokensData) {
      return res.status(404).json({ error: 'Discord tokens not found' });
    }

    // Vérifier si le token est expiré et le rafraîchir si nécessaire
    if (Date.now() >= tokensData.expiresAt - 60000) { // 1 minute avant expiration
      const refreshed = await refreshDiscordToken(decoded.userId, tokensData.refreshToken);
      if (refreshed) {
        return res.json({ accessToken: refreshed.accessToken });
      }
    }

    res.json({ accessToken: tokensData.accessToken });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Rafraîchir le token Discord
async function refreshDiscordToken(userId, refreshToken) {
  try {
    const response = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      return null;
    }

    const tokenData = await response.json();
    const tokensData = {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token || refreshToken,
      expiresAt: Date.now() + tokenData.expires_in * 1000,
    };

    global.discordTokens[userId] = tokensData;
    return tokensData;
  } catch (error) {
    console.error('Error refreshing Discord token:', error);
    return null;
  }
}

// Déconnexion
router.post('/logout', (req, res) => {
  const sessionToken = req.cookies.session_token;

  if (sessionToken) {
    try {
      const decoded = jwt.verify(sessionToken, JWT_SECRET);
      // Supprimer les tokens Discord
      if (global.discordTokens) {
        delete global.discordTokens[decoded.userId];
      }
    } catch (error) {
      // Token invalide, continuer quand même
    }
  }

  res.clearCookie('session_token');
  res.clearCookie('refresh_token');
  res.json({ success: true });
});

export { router as discordAuthRouter };
