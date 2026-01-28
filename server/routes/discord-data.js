import express from 'express';
import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';
import { config } from 'dotenv';

config();

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware d'authentification
const authenticate = async (req, res, next) => {
  const sessionToken = req.cookies.session_token;

  if (!sessionToken) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const decoded = jwt.verify(sessionToken, JWT_SECRET);
    req.userId = decoded.userId;
    
    // Récupérer le token Discord
    const tokensData = global.discordTokens?.[decoded.userId];
    if (!tokensData) {
      return res.status(401).json({ error: 'Discord tokens not found' });
    }

    req.discordAccessToken = tokensData.accessToken;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Obtenir ou créer le serveur Discord pour l'utilisateur
async function getOrCreateUserServer(userId, accessToken) {
  // Pour simplifier, on va utiliser un serveur Discord existant ou créer des channels privés
  // En production, vous devriez créer un serveur par utilisateur ou utiliser des DMs
  
  // Pour l'instant, on va utiliser un serveur Discord dédié avec des channels par utilisateur
  // Vous devrez créer un serveur Discord et obtenir son ID
  const SERVER_ID = process.env.DISCORD_SERVER_ID;
  
  if (!SERVER_ID) {
    // Fallback: utiliser des DMs (Direct Messages)
    // Récupérer le channel DM avec le bot
    const dmResponse = await fetch('https://discord.com/api/users/@me/channels', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipient_id: userId,
      }),
    });

    if (!dmResponse.ok) {
      throw new Error('Failed to create DM channel');
    }

    const dmChannel = await dmResponse.json();
    return { channelId: dmChannel.id, type: 'dm' };
  }

  // Créer un channel privé pour l'utilisateur dans le serveur
  const channelName = `user-${userId}`;
  
  // Vérifier si le channel existe déjà
  const channelsResponse = await fetch(
    `https://discord.com/api/guilds/${SERVER_ID}/channels`,
    {
      headers: {
        Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
      },
    }
  );

  if (channelsResponse.ok) {
    const channels = await channelsResponse.json();
    const existingChannel = channels.find(c => c.name === channelName);
    if (existingChannel) {
      return { channelId: existingChannel.id, type: 'guild' };
    }
  }

  // Créer le channel (nécessite un bot avec permissions)
  // Pour l'instant, on va utiliser une approche différente : stocker dans un channel dédié
  // avec des messages identifiés par l'userId dans l'embed
  
  return { channelId: SERVER_ID, type: 'guild' };
}

// Structure des channels (à adapter selon votre setup)
const CHANNEL_TYPES = {
  PROFILE: 'user-profile',
  FAVORITES: 'anime-favorites',
  LISTS: 'anime-lists',
  PREFERENCES: 'preferences',
  HISTORY: 'history',
  NOTIFICATIONS: 'notifications',
};

// Obtenir le channel ID pour un type donné
async function getChannelId(userId, channelType, accessToken) {
  // Pour simplifier, on va utiliser un seul channel avec des messages typés
  // En production, créez des channels séparés ou utilisez des DMs
  
  const server = await getOrCreateUserServer(userId, accessToken);
  return server.channelId;
}

// CREATE - Créer une donnée
router.post('/data/:type', authenticate, async (req, res) => {
  try {
    const { type } = req.params;
    const data = req.body;
    const channelId = await getChannelId(req.userId, type, req.discordAccessToken);

    // Créer un embed avec les données
    const embed = {
      title: `Data: ${type}`,
      description: JSON.stringify(data, null, 2),
      color: 0x5865f2,
      timestamp: new Date().toISOString(),
      footer: {
        text: `User: ${req.userId}`,
      },
    };

    const response = await fetch(
      `https://discord.com/api/channels/${channelId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${req.discordAccessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          embeds: [embed],
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Discord API error: ${error}`);
    }

    const message = await response.json();

    res.json({
      success: true,
      messageId: message.id,
      data: data,
    });
  } catch (error) {
    console.error('Error creating data:', error);
    res.status(500).json({ error: error.message });
  }
});

// READ - Lire toutes les données d'un type
router.get('/data/:type', authenticate, async (req, res) => {
  try {
    const { type } = req.params;
    const channelId = await getChannelId(req.userId, type, req.discordAccessToken);

    // Récupérer tous les messages du channel
    const response = await fetch(
      `https://discord.com/api/channels/${channelId}/messages?limit=100`,
      {
        headers: {
          Authorization: `Bearer ${req.discordAccessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch messages');
    }

    const messages = await response.json();
    
    // Parser les embeds et filtrer par userId
    const data = messages
      .filter(msg => 
        msg.embeds && 
        msg.embeds.length > 0 && 
        msg.embeds[0].footer?.text === `User: ${req.userId}`
      )
      .map(msg => {
        try {
          const embed = msg.embeds[0];
          const parsed = JSON.parse(embed.description);
          return {
            messageId: msg.id,
            ...parsed,
          };
        } catch (e) {
          return null;
        }
      })
      .filter(Boolean);

    res.json({ data });
  } catch (error) {
    console.error('Error reading data:', error);
    res.status(500).json({ error: error.message });
  }
});

// UPDATE - Mettre à jour une donnée
router.patch('/data/:type/:messageId', authenticate, async (req, res) => {
  try {
    const { type, messageId } = req.params;
    const data = req.body;
    const channelId = await getChannelId(req.userId, type, req.discordAccessToken);

    const embed = {
      title: `Data: ${type}`,
      description: JSON.stringify(data, null, 2),
      color: 0x5865f2,
      timestamp: new Date().toISOString(),
      footer: {
        text: `User: ${req.userId}`,
      },
    };

    const response = await fetch(
      `https://discord.com/api/channels/${channelId}/messages/${messageId}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${req.discordAccessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          embeds: [embed],
        }),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to update message');
    }

    res.json({ success: true, messageId, data });
  } catch (error) {
    console.error('Error updating data:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE - Supprimer une donnée
router.delete('/data/:type/:messageId', authenticate, async (req, res) => {
  try {
    const { type, messageId } = req.params;
    const channelId = await getChannelId(req.userId, type, req.discordAccessToken);

    const response = await fetch(
      `https://discord.com/api/channels/${channelId}/messages/${messageId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${req.discordAccessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to delete message');
    }

    res.json({ success: true, messageId });
  } catch (error) {
    console.error('Error deleting data:', error);
    res.status(500).json({ error: error.message });
  }
});

// Batch operations pour optimiser
router.post('/data/:type/batch', authenticate, async (req, res) => {
  try {
    const { type } = req.params;
    const { operations } = req.body; // [{ action: 'create'|'update'|'delete', data, messageId? }]
    const channelId = await getChannelId(req.userId, type, req.discordAccessToken);

    const results = [];

    for (const op of operations) {
      try {
        if (op.action === 'create') {
          const embed = {
            title: `Data: ${type}`,
            description: JSON.stringify(op.data, null, 2),
            color: 0x5865f2,
            timestamp: new Date().toISOString(),
            footer: { text: `User: ${req.userId}` },
          };

          const response = await fetch(
            `https://discord.com/api/channels/${channelId}/messages`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${req.discordAccessToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ embeds: [embed] }),
            }
          );

          if (response.ok) {
            const message = await response.json();
            results.push({ success: true, messageId: message.id, action: 'create' });
          }
        } else if (op.action === 'update' && op.messageId) {
          const embed = {
            title: `Data: ${type}`,
            description: JSON.stringify(op.data, null, 2),
            color: 0x5865f2,
            timestamp: new Date().toISOString(),
            footer: { text: `User: ${req.userId}` },
          };

          const response = await fetch(
            `https://discord.com/api/channels/${channelId}/messages/${op.messageId}`,
            {
              method: 'PATCH',
              headers: {
                Authorization: `Bearer ${req.discordAccessToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ embeds: [embed] }),
            }
          );

          if (response.ok) {
            results.push({ success: true, messageId: op.messageId, action: 'update' });
          }
        } else if (op.action === 'delete' && op.messageId) {
          const response = await fetch(
            `https://discord.com/api/channels/${channelId}/messages/${op.messageId}`,
            {
              method: 'DELETE',
              headers: {
                Authorization: `Bearer ${req.discordAccessToken}`,
              },
            }
          );

          if (response.ok) {
            results.push({ success: true, messageId: op.messageId, action: 'delete' });
          }
        }
      } catch (error) {
        results.push({ success: false, error: error.message, action: op.action });
      }

      // Rate limiting: attendre un peu entre les requêtes
      await new Promise(resolve => setTimeout(resolve, 250));
    }

    res.json({ results });
  } catch (error) {
    console.error('Error in batch operation:', error);
    res.status(500).json({ error: error.message });
  }
});

export { router as discordDataRouter };
