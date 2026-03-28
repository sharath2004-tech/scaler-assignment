# Trello Clone

A full-stack Trello-like project management application built with React.js + Vite (frontend) and Node.js + Express.js (backend), using MySQL as the database.

---

## Live Deployment

- **Frontend (Vercel):** https://scaler-assignment-gamma.vercel.app/
- **Backend API (Render):** https://scaler-assignment-x4b7.onrender.com
- **Database (Railway):** MySQL is hosted on Railway
- **API example endpoint:** https://scaler-assignment-x4b7.onrender.com/api/boards

> Note: The backend root (`/`) may return 404. Use `/api/*` routes for API calls.

For deployed frontend, set:

```bash
VITE_API_URL=https://scaler-assignment-x4b7.onrender.com/api
```

---

## Tech Stack

| Layer    | Technology                        |
|----------|-----------------------------------|
| Frontend | React 19, Vite 8, @dnd-kit, date-fns, react-router-dom |
| Backend  | Node.js, Express.js 5             |
| Database | MySQL 8+ (Railway hosted)         |
| HTTP     | Axios                             |

---

## Features

### Core
- **Multiple Boards** – Create, browse and delete boards with custom background colors
- **Lists Management** – Create, rename, delete lists; drag-and-drop to reorder
- **Cards Management** – Create, edit title & description, delete/archive cards; drag-and-drop cards between lists and reorder within a list
- **Card Details Modal**
  - Add/remove colored labels
  - Set/remove due date with overdue highlighting
  - Add checklists with items (mark complete/incomplete, delete items)
  - Assign/remove members
  - Add comments/activity log
  - Cover color + cover image (URL and local upload)
  - Attachments upload/list/delete
  - Move card to another list (from modal)
  - Copy card (duplicates key metadata)
- **Search & Filters** – Search cards by title and filter by label/member/due date (overdue / today / this week)
- **Archived Cards View** – List archived cards per board and restore them

### Bonus
- Responsive design (mobile, tablet, desktop)
- Multiple boards support
- Activity/comments on cards
- Board background customization
- Card covers and file attachments
- Sample data seeded into the DB

---

## Database Schema

### Tables

| Table             | Description                                      |
|-------------------|--------------------------------------------------|
| `members`         | Sample users (no auth required)                  |
| `boards`          | Project boards with title and background color   |
| `lists`           | Ordered columns within a board                   |
| `cards`           | Cards within lists with title, description, etc. |
| `labels`          | Global colored label definitions                 |
| `card_labels`     | Many-to-many: cards ↔ labels                    |
| `card_members`    | Many-to-many: cards ↔ members                   |
| `checklists`      | Checklists belonging to a card                   |
| `checklist_items` | Items within a checklist                         |
| `comments`        | Comments/activity log entries on cards           |
| `card_attachments`| Uploaded files linked to cards                   |

Schema file: `backend/db/schema.sql`

---

## Setup Instructions

### Prerequisites
- Node.js 18+
- MySQL 8+ running locally
- npm

---

### 1. Database Setup

Open MySQL client and run:

```sql
-- Create the database
CREATE DATABASE IF NOT EXISTS trello_clone;
```

Then run the schema:
```bash
mysql -u root -p trello_clone < backend/db/schema.sql
```

---

### 2. Backend Setup

```bash
cd backend

# Copy env file and configure your DB credentials
copy .env.example .env
# Edit .env: set DB_USER, DB_PASSWORD, DB_HOST etc.

# Install dependencies
npm install

# Seed sample data
npm run seed

# Start the development server
npm run dev
```

The backend will run on **https://scaler-assignment-x4b7.onrender.com**

---

### 3. Frontend Setup

```bash
# From the project root
npm install

# Start the dev server
npm run dev
```

The frontend will run on **https://scaler-assignment-gamma.vercel.app**

---

### 4. Environment Variables (backend/.env)

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=trello_clone
PORT=5000
```

---

## API Endpoints

| Method | Endpoint                                          | Description                   |
|--------|---------------------------------------------------|-------------------------------|
| GET    | /api/boards                                       | Get all boards                |
| GET    | /api/boards/:id                                   | Get board with lists & cards  |
| POST   | /api/boards                                       | Create board                  |
| PATCH  | /api/boards/:id                                   | Update board                  |
| DELETE | /api/boards/:id                                   | Delete board                  |
| GET    | /api/lists/board/:boardId                         | Get lists for a board         |
| POST   | /api/lists                                        | Create list                   |
| PATCH  | /api/lists/:id                                    | Update list title              |
| DELETE | /api/lists/:id                                    | Delete list                   |
| POST   | /api/lists/reorder                                | Reorder lists (drag & drop)   |
| GET    | /api/cards/:id                                    | Get full card details         |
| POST   | /api/cards                                        | Create card                   |
| PATCH  | /api/cards/:id                                    | Update card fields            |
| DELETE | /api/cards/:id                                    | Delete card                   |
| POST   | /api/cards/reorder                                | Reorder/move cards            |
| GET    | /api/cards/search/query                           | Search and filter cards       |
| POST   | /api/cards/:id/labels                             | Add label to card             |
| DELETE | /api/cards/:id/labels/:labelId                    | Remove label from card        |
| POST   | /api/cards/:id/members                            | Add member to card            |
| DELETE | /api/cards/:id/members/:memberId                  | Remove member from card       |
| POST   | /api/cards/:id/checklists                         | Add checklist to card         |
| DELETE | /api/cards/:id/checklists/:checklistId            | Delete checklist              |
| POST   | /api/cards/:id/checklists/:clId/items             | Add checklist item            |
| PATCH  | /api/cards/:id/checklists/:clId/items/:itemId     | Toggle/edit checklist item    |
| DELETE | /api/cards/:id/checklists/:clId/items/:itemId     | Delete checklist item         |
| POST   | /api/cards/:id/comments                           | Add comment                   |
| GET    | /api/cards/archived/:boardId                      | Get archived cards for board  |
| POST   | /api/cards/:id/attachments/upload                 | Upload attachment             |
| DELETE | /api/cards/:id/attachments/:attachmentId          | Delete attachment             |
| POST   | /api/cards/:id/cover/upload                       | Upload cover image file       |
| GET    | /api/members                                      | Get all members               |
| GET    | /api/members/labels                               | Get all labels                |

---

## Assumptions

1. **No authentication** – A default user "Alice Johnson" is assumed to be logged in (first member in DB).
2. **Sample data** includes 2 boards, multiple lists, cards, labels, checklists, and comments (seeded via `npm run seed`).
3. **Sample members**: Alice Johnson, Bob Smith, Carol White, David Lee, Eva Martinez.
4. **Drag and drop** uses [@dnd-kit](https://dndkit.com) with mouse + touch sensors (distance activation on desktop, delay+tolerance on mobile).
5. **Board background** uses a solid color; it can be extended to support image URLs.
6. **Archived cards** are hidden from the board view but not deleted.
7. All IDs use UUID v4 for better portability.
