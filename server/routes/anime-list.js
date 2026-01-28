import express from 'express';
import jwt from 'jsonwebtoken';
import { config } from 'dotenv';
import { getRow, runQuery, getAllRows } from '../db.js';

config();

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * Middleware d'authentification
 */
const authenticate = async (req, res, next) => {
  const sessionToken = req.cookies.session_token;

  if (!sessionToken) {
    console.log('⚠️ No session token in anime-list request');
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const decoded = jwt.verify(sessionToken, JWT_SECRET);
    req.userId = decoded.discord_id;
    next();
  } catch (error) {
    console.error('❌ Anime-list auth error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};

/**
 * Validation des données d'anime
 */
function validateAnimeItem(data) {
  const { anime_id, anime_title, status, progress, rating } = data;
  
  if (!anime_id || !Number.isInteger(anime_id)) {
    throw new Error('Invalid anime_id');
  }
  
  if (!anime_title || typeof anime_title !== 'string') {
    throw new Error('Invalid anime_title');
  }
  
  if (!['watching', 'completed', 'planned', 'dropped'].includes(status)) {
    throw new Error('Invalid status');
  }
  
  if (progress && !Number.isInteger(progress)) {
    throw new Error('Invalid progress');
  }
  
  if (rating && (typeof rating !== 'number' || rating < 0 || rating > 10)) {
    throw new Error('Invalid rating (must be 0-10)');
  }
}

/**
 * GET /api/anime
 * Récupérer la liste d'animes de l'utilisateur
 */
router.get('/', authenticate, async (req, res) => {
  try {
    console.log('📖 Fetching anime list for user:', req.userId);
    
    const animes = await getAllRows(
      `SELECT * FROM anime_list WHERE user_discord_id = ? ORDER BY updated_at DESC`,
      [req.userId]
    );

    // Transformer les données
    const formattedAnimes = animes.map(anime => ({
      id: anime.id,
      anime_id: anime.anime_id,
      title: anime.anime_title,
      image: anime.anime_image,
      status: anime.status,
      progress: anime.progress,
      rating: anime.rating,
      notes: anime.notes,
      is_favorite: Boolean(anime.is_favorite),
      added_at: anime.added_at,
      updated_at: anime.updated_at,
    }));

    res.json({
      success: true,
      data: formattedAnimes,
      count: formattedAnimes.length,
    });
  } catch (error) {
    console.error('❌ Error fetching anime list:', error);
    res.status(500).json({ error: 'Failed to fetch anime list' });
  }
});

/**
 * POST /api/anime
 * Ajouter un anime à la liste
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const { anime_id, anime_title, anime_image, status, progress = 0, rating, notes } = req.body;

    // Validation
    validateAnimeItem({ anime_id, anime_title, status, progress, rating });

    console.log('➕ Adding anime to list:', anime_id, 'for user:', req.userId);

    // Vérifier si l'anime existe déjà
    const existing = await getRow(
      'SELECT id FROM anime_list WHERE user_discord_id = ? AND anime_id = ?',
      [req.userId, anime_id]
    );

    if (existing) {
      return res.status(409).json({ error: 'Anime already in list' });
    }

    // Insérer l'anime
    const result = await runQuery(
      `INSERT INTO anime_list 
       (user_discord_id, anime_id, anime_title, anime_image, status, progress, rating, notes) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.userId, anime_id, anime_title, anime_image, status, progress, rating || null, notes || null]
    );

    console.log('✅ Anime added:', anime_id);

    res.status(201).json({
      success: true,
      message: 'Anime added to list',
      id: result.lastID,
      anime_id,
    });
  } catch (error) {
    console.error('❌ Error adding anime:', error);
    res.status(400).json({ error: error.message || 'Failed to add anime' });
  }
});

/**
 * PUT /api/anime/:animeId
 * Mettre à jour un anime
 */
router.put('/:animeId', authenticate, async (req, res) => {
  try {
    const { animeId } = req.params;
    const { status, progress, rating, notes, is_favorite } = req.body;

    console.log('📝 Updating anime:', animeId, 'for user:', req.userId);

    // Vérifier que l'anime appartient à l'utilisateur
    const anime = await getRow(
      'SELECT id FROM anime_list WHERE user_discord_id = ? AND anime_id = ?',
      [req.userId, animeId]
    );

    if (!anime) {
      return res.status(404).json({ error: 'Anime not found in your list' });
    }

    // Construire la requête de mise à jour dynamiquement
    const updates = [];
    const params = [];

    if (status !== undefined) {
      if (!['watching', 'completed', 'planned', 'dropped'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }
      updates.push('status = ?');
      params.push(status);
    }

    if (progress !== undefined) {
      if (!Number.isInteger(progress)) {
        return res.status(400).json({ error: 'Invalid progress' });
      }
      updates.push('progress = ?');
      params.push(progress);
    }

    if (rating !== undefined) {
      if (rating !== null && (typeof rating !== 'number' || rating < 0 || rating > 10)) {
        return res.status(400).json({ error: 'Invalid rating' });
      }
      updates.push('rating = ?');
      params.push(rating);
    }

    if (notes !== undefined) {
      updates.push('notes = ?');
      params.push(notes);
    }

    if (is_favorite !== undefined) {
      updates.push('is_favorite = ?');
      params.push(is_favorite ? 1 : 0);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(req.userId, animeId);

    // Exécuter la mise à jour
    await runQuery(
      `UPDATE anime_list SET ${updates.join(', ')} WHERE user_discord_id = ? AND anime_id = ?`,
      params
    );

    console.log('✅ Anime updated:', animeId);

    res.json({
      success: true,
      message: 'Anime updated successfully',
      anime_id: animeId,
    });
  } catch (error) {
    console.error('❌ Error updating anime:', error);
    res.status(500).json({ error: 'Failed to update anime' });
  }
});

/**
 * DELETE /api/anime/:animeId
 * Supprimer un anime de la liste
 */
router.delete('/:animeId', authenticate, async (req, res) => {
  try {
    const { animeId } = req.params;

    console.log('🗑️ Deleting anime:', animeId, 'for user:', req.userId);

    const result = await runQuery(
      'DELETE FROM anime_list WHERE user_discord_id = ? AND anime_id = ?',
      [req.userId, animeId]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Anime not found in your list' });
    }

    console.log('✅ Anime deleted:', animeId);

    res.json({
      success: true,
      message: 'Anime removed from list',
      anime_id: animeId,
    });
  } catch (error) {
    console.error('❌ Error deleting anime:', error);
    res.status(500).json({ error: 'Failed to delete anime' });
  }
});

/**
 * GET /api/anime/stats
 * Obtenir les statistiques
 */
router.get('/stats', authenticate, async (req, res) => {
  try {
    console.log('📊 Fetching stats for user:', req.userId);

    const stats = await getRow(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'watching' THEN 1 ELSE 0 END) as watching,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'planned' THEN 1 ELSE 0 END) as planned,
        SUM(CASE WHEN status = 'dropped' THEN 1 ELSE 0 END) as dropped,
        SUM(CASE WHEN is_favorite = 1 THEN 1 ELSE 0 END) as favorites,
        ROUND(AVG(CASE WHEN rating IS NOT NULL THEN rating END), 1) as avg_rating
      FROM anime_list 
      WHERE user_discord_id = ?`,
      [req.userId]
    );

    res.json({
      success: true,
      data: {
        total: stats.total || 0,
        watching: stats.watching || 0,
        completed: stats.completed || 0,
        planned: stats.planned || 0,
        dropped: stats.dropped || 0,
        favorites: stats.favorites || 0,
        avg_rating: stats.avg_rating || 0,
      },
    });
  } catch (error) {
    console.error('❌ Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export { router as animeListRouter };
