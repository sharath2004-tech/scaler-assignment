const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.resolve(__dirname, '../.env'), override: true });

// Support DATABASE_URL, Clever Cloud MYSQL_ADDON_URI, or individual DB_* / MYSQL_ADDON_* vars
// MYSQL_ADDON_URI (from .env) takes priority over any system-level DATABASE_URL
const connectionUri =
  process.env.MYSQL_ADDON_URI || process.env.DATABASE_URL || null;

function parseUri(uri) {
  const u = new URL(uri);
  return {
    host: u.hostname,
    port: Number(u.port) || 3306,
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    database: u.pathname.replace(/^\//, ''),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: { rejectUnauthorized: false },
    connectTimeout: 30000,
    enableKeepAlive: true,
  };
}

const poolConfig = connectionUri
  ? parseUri(connectionUri)
  : {
      host: process.env.DB_HOST || process.env.MYSQL_ADDON_HOST || 'localhost',
      port: Number(process.env.DB_PORT || process.env.MYSQL_ADDON_PORT) || 3306,
      user: process.env.DB_USER || process.env.MYSQL_ADDON_USER || 'root',
      password: process.env.DB_PASSWORD || process.env.MYSQL_ADDON_PASSWORD || '',
      database: process.env.DB_NAME || process.env.MYSQL_ADDON_DB || 'trello_clone',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 30000,
      enableKeepAlive: true,
    };

const pool = mysql.createPool(poolConfig);

module.exports = pool;
