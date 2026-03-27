-- ============================================================
-- Trello Clone Database Schema
-- ============================================================

CREATE DATABASE IF NOT EXISTS trello_clone;
USE trello_clone;

-- Members (sample users, no auth required)
CREATE TABLE IF NOT EXISTS members (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  avatar_color VARCHAR(20) DEFAULT '#0052CC',
  initials VARCHAR(5) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Boards
CREATE TABLE IF NOT EXISTS boards (
  id VARCHAR(36) PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  background VARCHAR(200) DEFAULT '#0052CC',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Lists
CREATE TABLE IF NOT EXISTS lists (
  id VARCHAR(36) PRIMARY KEY,
  board_id VARCHAR(36) NOT NULL,
  title VARCHAR(200) NOT NULL,
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE
);

-- Labels
CREATE TABLE IF NOT EXISTS labels (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100),
  color VARCHAR(20) NOT NULL
);

-- Cards
CREATE TABLE IF NOT EXISTS cards (
  id VARCHAR(36) PRIMARY KEY,
  list_id VARCHAR(36) NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  position INT NOT NULL DEFAULT 0,
  due_date DATE,
  cover_color VARCHAR(20),
  cover_image VARCHAR(500),
  archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE
);

-- Card Labels (many-to-many)
CREATE TABLE IF NOT EXISTS card_labels (
  card_id VARCHAR(36) NOT NULL,
  label_id VARCHAR(36) NOT NULL,
  PRIMARY KEY (card_id, label_id),
  FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE,
  FOREIGN KEY (label_id) REFERENCES labels(id) ON DELETE CASCADE
);

-- Card Members (many-to-many)
CREATE TABLE IF NOT EXISTS card_members (
  card_id VARCHAR(36) NOT NULL,
  member_id VARCHAR(36) NOT NULL,
  PRIMARY KEY (card_id, member_id),
  FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE,
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
);

-- Checklists
CREATE TABLE IF NOT EXISTS checklists (
  id VARCHAR(36) PRIMARY KEY,
  card_id VARCHAR(36) NOT NULL,
  title VARCHAR(200) NOT NULL DEFAULT 'Checklist',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE
);

-- Checklist Items
CREATE TABLE IF NOT EXISTS checklist_items (
  id VARCHAR(36) PRIMARY KEY,
  checklist_id VARCHAR(36) NOT NULL,
  text VARCHAR(500) NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (checklist_id) REFERENCES checklists(id) ON DELETE CASCADE
);

-- Comments / Activity Log
CREATE TABLE IF NOT EXISTS comments (
  id VARCHAR(36) PRIMARY KEY,
  card_id VARCHAR(36) NOT NULL,
  member_id VARCHAR(36),
  text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE,
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE SET NULL
);
