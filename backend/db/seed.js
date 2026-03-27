const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env'), override: true });
const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');

const connectionUri =
  process.env.MYSQL_ADDON_URI || process.env.DATABASE_URL || null;

function getConnectionConfig() {
  if (connectionUri) {
    const u = new URL(connectionUri);
    return {
      host: u.hostname,
      port: Number(u.port) || 3306,
      user: decodeURIComponent(u.username),
      password: decodeURIComponent(u.password),
      database: u.pathname.replace(/^\//, ''),
      ssl: { rejectUnauthorized: false },
      connectTimeout: 30000,
      enableKeepAlive: true,
      multipleStatements: true,
    };
  }

  return {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'trello_clone',
    connectTimeout: 30000,
    enableKeepAlive: true,
    multipleStatements: true,
  };
}

async function seed() {
  const conn = await mysql.createConnection(getConnectionConfig());

  console.log('Connected. Seeding...');

  // Clear existing data
  await conn.query(`
    SET FOREIGN_KEY_CHECKS = 0;
    TRUNCATE TABLE card_attachments;
    TRUNCATE TABLE comments;
    TRUNCATE TABLE checklist_items;
    TRUNCATE TABLE checklists;
    TRUNCATE TABLE card_members;
    TRUNCATE TABLE card_labels;
    TRUNCATE TABLE cards;
    TRUNCATE TABLE labels;
    TRUNCATE TABLE lists;
    TRUNCATE TABLE boards;
    TRUNCATE TABLE members;
    SET FOREIGN_KEY_CHECKS = 1;
  `);

  // Members
  const members = [
    { id: uuidv4(), name: 'Alice Johnson', email: 'alice@example.com', avatar_color: '#0052CC', initials: 'AJ' },
    { id: uuidv4(), name: 'Bob Smith', email: 'bob@example.com', avatar_color: '#00875A', initials: 'BS' },
    { id: uuidv4(), name: 'Carol White', email: 'carol@example.com', avatar_color: '#FF5630', initials: 'CW' },
    { id: uuidv4(), name: 'David Lee', email: 'david@example.com', avatar_color: '#6554C0', initials: 'DL' },
    { id: uuidv4(), name: 'Eva Martinez', email: 'eva@example.com', avatar_color: '#FF8B00', initials: 'EM' },
  ];
  for (const m of members) {
    await conn.query(
      'INSERT INTO members (id, name, email, avatar_color, initials) VALUES (?, ?, ?, ?, ?)',
      [m.id, m.name, m.email, m.avatar_color, m.initials]
    );
  }

  // Labels
  const labels = [
    { id: uuidv4(), name: 'Bug', color: '#FF5630' },
    { id: uuidv4(), name: 'Feature', color: '#00B8D9' },
    { id: uuidv4(), name: 'Design', color: '#6554C0' },
    { id: uuidv4(), name: 'Backend', color: '#00875A' },
    { id: uuidv4(), name: 'Frontend', color: '#FF8B00' },
    { id: uuidv4(), name: 'Critical', color: '#DE350B' },
    { id: uuidv4(), name: 'Low Priority', color: '#97A0AF' },
  ];
  for (const l of labels) {
    await conn.query('INSERT INTO labels (id, name, color) VALUES (?, ?, ?)', [l.id, l.name, l.color]);
  }

  // Boards
  const board1Id = uuidv4();
  const board2Id = uuidv4();
  await conn.query(
    'INSERT INTO boards (id, title, background) VALUES (?, ?, ?)',
    [board1Id, 'Product Development', '#0052CC']
  );
  await conn.query(
    'INSERT INTO boards (id, title, background) VALUES (?, ?, ?)',
    [board2Id, 'Marketing Campaign', '#00875A']
  );

  // Lists for Board 1
  const todoListId = uuidv4();
  const inProgressListId = uuidv4();
  const reviewListId = uuidv4();
  const doneListId = uuidv4();

  const lists = [
    { id: todoListId, board_id: board1Id, title: 'To Do', position: 0 },
    { id: inProgressListId, board_id: board1Id, title: 'In Progress', position: 1 },
    { id: reviewListId, board_id: board1Id, title: 'Review', position: 2 },
    { id: doneListId, board_id: board1Id, title: 'Done', position: 3 },
  ];
  for (const l of lists) {
    await conn.query(
      'INSERT INTO lists (id, board_id, title, position) VALUES (?, ?, ?, ?)',
      [l.id, l.board_id, l.title, l.position]
    );
  }

  // Lists for Board 2
  const ideasListId = uuidv4();
  const planningListId = uuidv4();
  const executionListId = uuidv4();
  const lists2 = [
    { id: ideasListId, board_id: board2Id, title: 'Ideas', position: 0 },
    { id: planningListId, board_id: board2Id, title: 'Planning', position: 1 },
    { id: executionListId, board_id: board2Id, title: 'Execution', position: 2 },
  ];
  for (const l of lists2) {
    await conn.query(
      'INSERT INTO lists (id, board_id, title, position) VALUES (?, ?, ?, ?)',
      [l.id, l.board_id, l.title, l.position]
    );
  }

  // Cards for Board 1
  const cards = [
    { id: uuidv4(), list_id: todoListId, title: 'Design database schema', description: 'Design the full relational schema for the trello clone app including all tables and relationships.', position: 0, due_date: '2026-04-10', cover_color: '#0052CC' },
    { id: uuidv4(), list_id: todoListId, title: 'Set up CI/CD pipeline', description: 'Configure GitHub Actions for automated testing and deployment.', position: 1, due_date: '2026-04-15', cover_color: null },
    { id: uuidv4(), list_id: todoListId, title: 'Write unit tests', description: 'Cover all critical API endpoints with unit tests.', position: 2, due_date: '2026-04-20', cover_color: null },
    { id: uuidv4(), list_id: inProgressListId, title: 'Build REST API', description: 'Implement all CRUD endpoints for boards, lists, and cards using Express.js.', position: 0, due_date: '2026-04-05', cover_color: '#00875A' },
    { id: uuidv4(), list_id: inProgressListId, title: 'Implement drag & drop', description: 'Use dnd-kit library to enable smooth drag and drop for cards and lists.', position: 1, due_date: '2026-04-08', cover_color: null },
    { id: uuidv4(), list_id: reviewListId, title: 'Card details modal', description: 'Build the card detail modal with labels, due date, checklist, and member assignment.', position: 0, due_date: '2026-04-03', cover_color: '#6554C0' },
    { id: uuidv4(), list_id: reviewListId, title: 'Search & filter feature', description: 'Add search by title and filters by label, member, and due date.', position: 1, due_date: '2026-04-04', cover_color: null },
    { id: uuidv4(), list_id: doneListId, title: 'Project setup', description: 'Initialize React + Vite frontend and Node.js backend projects.', position: 0, due_date: '2026-03-25', cover_color: null },
    { id: uuidv4(), list_id: doneListId, title: 'UI wireframes', description: 'Create wireframes for all major screens including board view and card modal.', position: 1, due_date: '2026-03-27', cover_color: null },
  ];

  for (const c of cards) {
    await conn.query(
      'INSERT INTO cards (id, list_id, title, description, position, due_date, cover_color) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [c.id, c.list_id, c.title, c.description, c.position, c.due_date, c.cover_color]
    );
  }

  // Assign labels to cards
  await conn.query('INSERT INTO card_labels (card_id, label_id) VALUES (?, ?)', [cards[0].id, labels[3].id]); // Backend
  await conn.query('INSERT INTO card_labels (card_id, label_id) VALUES (?, ?)', [cards[1].id, labels[3].id]); // Backend
  await conn.query('INSERT INTO card_labels (card_id, label_id) VALUES (?, ?)', [cards[2].id, labels[1].id]); // Feature
  await conn.query('INSERT INTO card_labels (card_id, label_id) VALUES (?, ?)', [cards[3].id, labels[3].id]); // Backend
  await conn.query('INSERT INTO card_labels (card_id, label_id) VALUES (?, ?)', [cards[3].id, labels[1].id]); // Feature
  await conn.query('INSERT INTO card_labels (card_id, label_id) VALUES (?, ?)', [cards[4].id, labels[4].id]); // Frontend
  await conn.query('INSERT INTO card_labels (card_id, label_id) VALUES (?, ?)', [cards[5].id, labels[2].id]); // Design
  await conn.query('INSERT INTO card_labels (card_id, label_id) VALUES (?, ?)', [cards[5].id, labels[4].id]); // Frontend
  await conn.query('INSERT INTO card_labels (card_id, label_id) VALUES (?, ?)', [cards[6].id, labels[1].id]); // Feature

  // Assign members to cards
  await conn.query('INSERT INTO card_members (card_id, member_id) VALUES (?, ?)', [cards[0].id, members[0].id]);
  await conn.query('INSERT INTO card_members (card_id, member_id) VALUES (?, ?)', [cards[0].id, members[3].id]);
  await conn.query('INSERT INTO card_members (card_id, member_id) VALUES (?, ?)', [cards[3].id, members[1].id]);
  await conn.query('INSERT INTO card_members (card_id, member_id) VALUES (?, ?)', [cards[4].id, members[1].id]);
  await conn.query('INSERT INTO card_members (card_id, member_id) VALUES (?, ?)', [cards[4].id, members[2].id]);
  await conn.query('INSERT INTO card_members (card_id, member_id) VALUES (?, ?)', [cards[5].id, members[2].id]);
  await conn.query('INSERT INTO card_members (card_id, member_id) VALUES (?, ?)', [cards[6].id, members[0].id]);

  // Checklists
  const checklist1Id = uuidv4();
  await conn.query(
    'INSERT INTO checklists (id, card_id, title) VALUES (?, ?, ?)',
    [checklist1Id, cards[3].id, 'API Endpoints']
  );
  const checkItems1 = [
    { id: uuidv4(), checklist_id: checklist1Id, text: 'GET /boards', completed: true, position: 0 },
    { id: uuidv4(), checklist_id: checklist1Id, text: 'POST /boards', completed: true, position: 1 },
    { id: uuidv4(), checklist_id: checklist1Id, text: 'GET /lists/:boardId', completed: true, position: 2 },
    { id: uuidv4(), checklist_id: checklist1Id, text: 'POST /cards', completed: false, position: 3 },
    { id: uuidv4(), checklist_id: checklist1Id, text: 'PATCH /cards/:id', completed: false, position: 4 },
  ];
  for (const item of checkItems1) {
    await conn.query(
      'INSERT INTO checklist_items (id, checklist_id, text, completed, position) VALUES (?, ?, ?, ?, ?)',
      [item.id, item.checklist_id, item.text, item.completed, item.position]
    );
  }

  const checklist2Id = uuidv4();
  await conn.query(
    'INSERT INTO checklists (id, card_id, title) VALUES (?, ?, ?)',
    [checklist2Id, cards[5].id, 'Modal Features']
  );
  const checkItems2 = [
    { id: uuidv4(), checklist_id: checklist2Id, text: 'Labels section', completed: true, position: 0 },
    { id: uuidv4(), checklist_id: checklist2Id, text: 'Due date picker', completed: true, position: 1 },
    { id: uuidv4(), checklist_id: checklist2Id, text: 'Member assignment', completed: false, position: 2 },
    { id: uuidv4(), checklist_id: checklist2Id, text: 'Checklist component', completed: false, position: 3 },
  ];
  for (const item of checkItems2) {
    await conn.query(
      'INSERT INTO checklist_items (id, checklist_id, text, completed, position) VALUES (?, ?, ?, ?, ?)',
      [item.id, item.checklist_id, item.text, item.completed, item.position]
    );
  }

  // Comments
  await conn.query(
    'INSERT INTO comments (id, card_id, member_id, text) VALUES (?, ?, ?, ?)',
    [uuidv4(), cards[3].id, members[0].id, 'I will start working on the GET endpoints today.']
  );
  await conn.query(
    'INSERT INTO comments (id, card_id, member_id, text) VALUES (?, ?, ?, ?)',
    [uuidv4(), cards[3].id, members[1].id, 'Great! I can help with the POST endpoints.']
  );
  await conn.query(
    'INSERT INTO comments (id, card_id, member_id, text) VALUES (?, ?, ?, ?)',
    [uuidv4(), cards[5].id, members[2].id, 'Mockups are ready, check the design folder.']
  );

  // Board 2 - Marketing Campaign cards
  const mCards = [
    { id: uuidv4(), list_id: ideasListId, title: 'Social media strategy', description: 'Plan our Q2 social media content calendar.', position: 0, due_date: '2026-04-30', cover_color: null },
    { id: uuidv4(), list_id: ideasListId, title: 'Email newsletter redesign', description: 'Redesign the monthly newsletter template.', position: 1, due_date: null, cover_color: null },
    { id: uuidv4(), list_id: planningListId, title: 'Blog content calendar', description: 'Plan 12 blog posts for Q2.', position: 0, due_date: '2026-04-15', cover_color: null },
    { id: uuidv4(), list_id: executionListId, title: 'Launch landing page', description: 'Design and launch the campaign landing page.', position: 0, due_date: '2026-04-20', cover_color: '#FF8B00' },
  ];
  for (const c of mCards) {
    await conn.query(
      'INSERT INTO cards (id, list_id, title, description, position, due_date, cover_color) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [c.id, c.list_id, c.title, c.description, c.position, c.due_date, c.cover_color]
    );
  }

  await conn.end();
  console.log('Seeding complete!');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
