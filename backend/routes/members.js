const express = require('express');
const router = express.Router();
const db = require('../db/db');

// GET all members
router.get('/', async (req, res) => {
  try {
    const [members] = await db.query('SELECT * FROM members ORDER BY name ASC');
    res.json(members);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET all labels
router.get('/labels', async (req, res) => {
  try {
    const [labels] = await db.query('SELECT * FROM labels');
    res.json(labels);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
