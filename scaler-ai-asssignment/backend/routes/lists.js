const express = require('express');
const router = express.Router();
const db = require('../db/db');
const { v4: uuidv4 } = require('uuid');

// GET all lists for a board
router.get('/board/:boardId', async (req, res) => {
  try {
    const [lists] = await db.query(
      'SELECT * FROM lists WHERE board_id = ? ORDER BY position ASC',
      [req.params.boardId]
    );
    res.json(lists);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create list
router.post('/', async (req, res) => {
  try {
    const { board_id, title } = req.body;
    if (!board_id || !title) return res.status(400).json({ error: 'board_id and title are required' });
    const [[{ maxPos }]] = await db.query(
      'SELECT COALESCE(MAX(position), -1) + 1 AS maxPos FROM lists WHERE board_id = ?',
      [board_id]
    );
    const id = uuidv4();
    await db.query('INSERT INTO lists (id, board_id, title, position) VALUES (?, ?, ?, ?)', [id, board_id, title, maxPos]);
    const [[list]] = await db.query('SELECT * FROM lists WHERE id = ?', [id]);
    res.status(201).json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH update list title
router.patch('/:id', async (req, res) => {
  try {
    const { title } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });
    await db.query('UPDATE lists SET title = ? WHERE id = ?', [title, req.params.id]);
    const [[list]] = await db.query('SELECT * FROM lists WHERE id = ?', [req.params.id]);
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE list
router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM lists WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST reorder lists (drag & drop)
router.post('/reorder', async (req, res) => {
  try {
    const { board_id, ordered_ids } = req.body;
    if (!board_id || !Array.isArray(ordered_ids)) {
      return res.status(400).json({ error: 'board_id and ordered_ids array required' });
    }
    const updates = ordered_ids.map((id, index) =>
      db.query('UPDATE lists SET position = ? WHERE id = ? AND board_id = ?', [index, id, board_id])
    );
    await Promise.all(updates);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
