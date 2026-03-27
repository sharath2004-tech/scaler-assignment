const express = require('express');
const router = express.Router();
const db = require('../db/db');
const { v4: uuidv4 } = require('uuid');

// GET all boards
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM boards ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single board with lists and cards
router.get('/:id', async (req, res) => {
  try {
    const [[board]] = await db.query('SELECT * FROM boards WHERE id = ?', [req.params.id]);
    if (!board) return res.status(404).json({ error: 'Board not found' });

    const [lists] = await db.query(
      'SELECT * FROM lists WHERE board_id = ? ORDER BY position ASC',
      [req.params.id]
    );

    for (const list of lists) {
      const [cards] = await db.query(
        `SELECT c.*, 
          GROUP_CONCAT(DISTINCT cl.label_id) AS label_ids,
          GROUP_CONCAT(DISTINCT cm.member_id) AS member_ids
         FROM cards c
         LEFT JOIN card_labels cl ON c.id = cl.card_id
         LEFT JOIN card_members cm ON c.id = cm.member_id
         WHERE c.list_id = ? AND c.archived = FALSE
         GROUP BY c.id
         ORDER BY c.position ASC`,
        [list.id]
      );
      list.cards = cards.map((c) => ({
        ...c,
        label_ids: c.label_ids ? c.label_ids.split(',') : [],
        member_ids: c.member_ids ? c.member_ids.split(',') : [],
      }));
    }

    res.json({ ...board, lists });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create board
router.post('/', async (req, res) => {
  try {
    const { title, background = '#0052CC' } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });
    const id = uuidv4();
    await db.query('INSERT INTO boards (id, title, background) VALUES (?, ?, ?)', [id, title, background]);
    const [[board]] = await db.query('SELECT * FROM boards WHERE id = ?', [id]);
    res.status(201).json(board);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH update board
router.patch('/:id', async (req, res) => {
  try {
    const { title, background } = req.body;
    const fields = [];
    const values = [];
    if (title !== undefined) { fields.push('title = ?'); values.push(title); }
    if (background !== undefined) { fields.push('background = ?'); values.push(background); }
    if (!fields.length) return res.status(400).json({ error: 'Nothing to update' });
    values.push(req.params.id);
    await db.query(`UPDATE boards SET ${fields.join(', ')} WHERE id = ?`, values);
    const [[board]] = await db.query('SELECT * FROM boards WHERE id = ?', [req.params.id]);
    res.json(board);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE board
router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM boards WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
