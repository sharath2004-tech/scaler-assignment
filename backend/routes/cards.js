const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const db = require('../db/db');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');

const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '');
    cb(null, `${Date.now()}-${uuidv4()}${ext}`);
  },
});

const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

function toUploadsFilePath(fileUrl) {
  if (!fileUrl) return null;
  try {
    const parsed = new URL(fileUrl);
    if (parsed.pathname.startsWith('/uploads/')) {
      return path.join(uploadsDir, parsed.pathname.replace('/uploads/', ''));
    }
  } catch (_err) {
    if (fileUrl.startsWith('/uploads/')) {
      return path.join(uploadsDir, fileUrl.replace('/uploads/', ''));
    }
  }
  return null;
}

let attachmentsTableReady = false;
async function ensureAttachmentsTable() {
  if (attachmentsTableReady) return;
  await db.query(`
    CREATE TABLE IF NOT EXISTS card_attachments (
      id VARCHAR(36) PRIMARY KEY,
      card_id VARCHAR(36) NOT NULL,
      file_name VARCHAR(255) NOT NULL,
      file_url TEXT NOT NULL,
      file_size INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE
    )
  `);
  attachmentsTableReady = true;
}

// GET full card details
router.get('/:id', async (req, res) => {
  try {
    await ensureAttachmentsTable();
    const [[card]] = await db.query('SELECT * FROM cards WHERE id = ?', [req.params.id]);
    if (!card) return res.status(404).json({ error: 'Card not found' });

    const [labels] = await db.query(
      `SELECT l.* FROM labels l JOIN card_labels cl ON l.id = cl.label_id WHERE cl.card_id = ?`,
      [req.params.id]
    );
    const [members] = await db.query(
      `SELECT m.* FROM members m JOIN card_members cm ON m.id = cm.member_id WHERE cm.card_id = ?`,
      [req.params.id]
    );
    const [checklists] = await db.query(
      'SELECT * FROM checklists WHERE card_id = ? ORDER BY created_at ASC',
      [req.params.id]
    );
    for (const cl of checklists) {
      const [items] = await db.query(
        'SELECT * FROM checklist_items WHERE checklist_id = ? ORDER BY position ASC',
        [cl.id]
      );
      cl.items = items;
    }
    const [comments] = await db.query(
      `SELECT c.*, m.name AS member_name, m.initials, m.avatar_color
       FROM comments c LEFT JOIN members m ON c.member_id = m.id
       WHERE c.card_id = ? ORDER BY c.created_at ASC`,
      [req.params.id]
    );

    const [attachments] = await db.query(
      'SELECT * FROM card_attachments WHERE card_id = ? ORDER BY created_at DESC',
      [req.params.id]
    );

    res.json({ ...card, labels, members, checklists, comments, attachments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create card
router.post('/', async (req, res) => {
  try {
    const { list_id, title } = req.body;
    if (!list_id || !title) return res.status(400).json({ error: 'list_id and title are required' });
    const [[{ maxPos }]] = await db.query(
      'SELECT COALESCE(MAX(position), -1) + 1 AS maxPos FROM cards WHERE list_id = ?',
      [list_id]
    );
    const id = uuidv4();
    await db.query(
      'INSERT INTO cards (id, list_id, title, position) VALUES (?, ?, ?, ?)',
      [id, list_id, title, maxPos]
    );
    const [[card]] = await db.query('SELECT * FROM cards WHERE id = ?', [id]);
    res.status(201).json({ ...card, labels: [], members: [], checklists: [], comments: [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH update card
router.patch('/:id', async (req, res) => {
  try {
    const allowed = ['title', 'description', 'due_date', 'cover_color', 'cover_image', 'archived', 'list_id'];
    const fields = [];
    const values = [];
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(req.body[key]);
      }
    }
    if (!fields.length) return res.status(400).json({ error: 'Nothing to update' });
    values.push(req.params.id);
    await db.query(`UPDATE cards SET ${fields.join(', ')} WHERE id = ?`, values);
    const [[card]] = await db.query('SELECT * FROM cards WHERE id = ?', [req.params.id]);
    res.json(card);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE card
router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM cards WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST reorder/move cards
router.post('/reorder', async (req, res) => {
  try {
    const { list_id, ordered_ids } = req.body;
    if (!list_id || !Array.isArray(ordered_ids)) {
      return res.status(400).json({ error: 'list_id and ordered_ids required' });
    }
    const updates = ordered_ids.map((id, index) =>
      db.query('UPDATE cards SET position = ?, list_id = ? WHERE id = ?', [index, list_id, id])
    );
    await Promise.all(updates);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST add label to card
router.post('/:id/labels', async (req, res) => {
  try {
    const { label_id } = req.body;
    await db.query('INSERT IGNORE INTO card_labels (card_id, label_id) VALUES (?, ?)', [req.params.id, label_id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE remove label from card
router.delete('/:id/labels/:labelId', async (req, res) => {
  try {
    await db.query('DELETE FROM card_labels WHERE card_id = ? AND label_id = ?', [req.params.id, req.params.labelId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST add member to card
router.post('/:id/members', async (req, res) => {
  try {
    const { member_id } = req.body;
    await db.query('INSERT IGNORE INTO card_members (card_id, member_id) VALUES (?, ?)', [req.params.id, member_id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE remove member from card
router.delete('/:id/members/:memberId', async (req, res) => {
  try {
    await db.query('DELETE FROM card_members WHERE card_id = ? AND member_id = ?', [req.params.id, req.params.memberId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST add checklist
router.post('/:id/checklists', async (req, res) => {
  try {
    const { title = 'Checklist' } = req.body;
    const clId = uuidv4();
    await db.query('INSERT INTO checklists (id, card_id, title) VALUES (?, ?, ?)', [clId, req.params.id, title]);
    const [[checklist]] = await db.query('SELECT * FROM checklists WHERE id = ?', [clId]);
    res.status(201).json({ ...checklist, items: [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE checklist
router.delete('/:id/checklists/:checklistId', async (req, res) => {
  try {
    await db.query('DELETE FROM checklists WHERE id = ? AND card_id = ?', [req.params.checklistId, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST add checklist item
router.post('/:id/checklists/:checklistId/items', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'text is required' });
    const [[{ maxPos }]] = await db.query(
      'SELECT COALESCE(MAX(position), -1) + 1 AS maxPos FROM checklist_items WHERE checklist_id = ?',
      [req.params.checklistId]
    );
    const itemId = uuidv4();
    await db.query(
      'INSERT INTO checklist_items (id, checklist_id, text, completed, position) VALUES (?, ?, ?, FALSE, ?)',
      [itemId, req.params.checklistId, text, maxPos]
    );
    const [[item]] = await db.query('SELECT * FROM checklist_items WHERE id = ?', [itemId]);
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH update checklist item
router.patch('/:id/checklists/:checklistId/items/:itemId', async (req, res) => {
  try {
    const { text, completed } = req.body;
    const fields = [];
    const values = [];
    if (text !== undefined) { fields.push('text = ?'); values.push(text); }
    if (completed !== undefined) { fields.push('completed = ?'); values.push(completed); }
    if (!fields.length) return res.status(400).json({ error: 'Nothing to update' });
    values.push(req.params.itemId);
    await db.query(`UPDATE checklist_items SET ${fields.join(', ')} WHERE id = ?`, values);
    const [[item]] = await db.query('SELECT * FROM checklist_items WHERE id = ?', [req.params.itemId]);
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE checklist item
router.delete('/:id/checklists/:checklistId/items/:itemId', async (req, res) => {
  try {
    await db.query('DELETE FROM checklist_items WHERE id = ?', [req.params.itemId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST add comment
router.post('/:id/comments', async (req, res) => {
  try {
    const { text, member_id } = req.body;
    if (!text) return res.status(400).json({ error: 'text is required' });
    const commentId = uuidv4();
    await db.query(
      'INSERT INTO comments (id, card_id, member_id, text) VALUES (?, ?, ?, ?)',
      [commentId, req.params.id, member_id || null, text]
    );
    const [[comment]] = await db.query(
      `SELECT c.*, m.name AS member_name, m.initials, m.avatar_color
       FROM comments c LEFT JOIN members m ON c.member_id = m.id WHERE c.id = ?`,
      [commentId]
    );
    res.status(201).json(comment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST upload attachment
router.post('/:id/attachments/upload', upload.single('file'), async (req, res) => {
  try {
    await ensureAttachmentsTable();
    if (!req.file) return res.status(400).json({ error: 'file is required' });

    const attachmentId = uuidv4();
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.get('host');
    const fileUrl = `${protocol}://${host}/uploads/${req.file.filename}`;

    await db.query(
      'INSERT INTO card_attachments (id, card_id, file_name, file_url, file_size) VALUES (?, ?, ?, ?, ?)',
      [attachmentId, req.params.id, req.file.originalname, fileUrl, req.file.size || 0]
    );

    const [[attachment]] = await db.query('SELECT * FROM card_attachments WHERE id = ?', [attachmentId]);
    res.status(201).json(attachment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST upload cover image from local file
router.post('/:id/cover/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'file is required' });

    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.get('host');
    const fileUrl = `${protocol}://${host}/uploads/${req.file.filename}`;

    await db.query('UPDATE cards SET cover_image = ?, cover_color = NULL WHERE id = ?', [fileUrl, req.params.id]);
    const [[card]] = await db.query('SELECT id, cover_image, cover_color FROM cards WHERE id = ?', [req.params.id]);

    res.json(card);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE attachment
router.delete('/:id/attachments/:attachmentId', async (req, res) => {
  try {
    await ensureAttachmentsTable();
    const [[attachment]] = await db.query(
      'SELECT * FROM card_attachments WHERE id = ? AND card_id = ?',
      [req.params.attachmentId, req.params.id]
    );
    if (!attachment) return res.status(404).json({ error: 'Attachment not found' });

    const filePath = toUploadsFilePath(attachment.file_url);
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await db.query('DELETE FROM card_attachments WHERE id = ?', [req.params.attachmentId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET search cards
router.get('/search/query', async (req, res) => {
  try {
    const { q, label_id, member_id, due } = req.query;
    let sql = `
      SELECT DISTINCT c.*, l.board_id,
        GROUP_CONCAT(DISTINCT cl.label_id) AS label_ids,
        GROUP_CONCAT(DISTINCT cm.member_id) AS member_ids
      FROM cards c
      JOIN lists l ON c.list_id = l.id
      LEFT JOIN card_labels cl ON c.id = cl.card_id
      LEFT JOIN card_members cm ON c.id = cm.card_id
      WHERE c.archived = FALSE
    `;
    const params = [];
    if (q) { sql += ' AND c.title LIKE ?'; params.push(`%${q}%`); }
    if (label_id) { sql += ' AND c.id IN (SELECT card_id FROM card_labels WHERE label_id = ?)'; params.push(label_id); }
    if (member_id) { sql += ' AND c.id IN (SELECT card_id FROM card_members WHERE member_id = ?)'; params.push(member_id); }
    if (due === 'overdue') { sql += ' AND c.due_date < CURDATE()'; }
    if (due === 'today') { sql += ' AND c.due_date = CURDATE()'; }
    if (due === 'week') { sql += ' AND c.due_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)'; }
    sql += ' GROUP BY c.id ORDER BY c.created_at DESC LIMIT 50';
    const [rows] = await db.query(sql, params);
    res.json(rows.map((c) => ({
      ...c,
      label_ids: c.label_ids ? c.label_ids.split(',') : [],
      member_ids: c.member_ids ? c.member_ids.split(',') : [],
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
