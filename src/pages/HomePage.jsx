import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createBoard, deleteBoard, getBoards } from '../api';
import Navbar from '../components/Navbar';
import styles from './HomePage.module.css';

const BOARD_BACKGROUNDS = [
  '#0052CC', '#00875A', '#FF5630', '#6554C0', '#FF8B00',
  '#DE350B', '#00B8D9', '#36B37E', '#403294', '#0065FF',
];

export default function HomePage() {
  const [boards, setBoards] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newBg, setNewBg] = useState(BOARD_BACKGROUNDS[0]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const filteredBoards = boards.filter((board) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (board.title || '').toLowerCase().includes(q);
  });

  useEffect(() => {
    getBoards()
      .then((r) => setBoards(r.data))
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const { data } = await createBoard({ title: newTitle.trim(), background: newBg });
    setBoards((prev) => [data, ...prev]);
    setShowCreate(false);
    setNewTitle('');
    setNewBg(BOARD_BACKGROUNDS[0]);
    navigate(`/board/${data.id}`);
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!confirm('Delete this board?')) return;
    await deleteBoard(id);
    setBoards((prev) => prev.filter((b) => b.id !== id));
  };

  return (
    <div className={styles.page}>
      <Navbar />
      <div className={styles.content}>
        <div className={styles.header}>
          <h1 className={styles.title}>
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
              <path d="M4 4h7v7H4zm9 0h7v7h-7zm0 9h7v7h-7zM4 13h7v7H4z" />
            </svg>
            Your boards
          </h1>
          <div className={styles.searchWrap}>
            <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" className={styles.searchIcon}>
              <path d="M11.5 10.5l3 3-1 1-3-3a5 5 0 1 1 1-1zM6.5 10a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" />
            </svg>
            <input
              className={styles.searchInput}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search boards by title..."
            />
          </div>
        </div>

        {loading ? (
          <div className={styles.loading}>Loading boards...</div>
        ) : (
          <div className={styles.grid}>
            {searchQuery.trim() && filteredBoards.length === 0 && (
              <div className={styles.emptyState}>
                No boards found for "{searchQuery.trim()}".
              </div>
            )}

            {filteredBoards.map((board) => (
              <div
                key={board.id}
                className={styles.boardCard}
                style={{ background: board.background }}
                onClick={() => navigate(`/board/${board.id}`)}
              >
                <span className={styles.boardTitle}>{board.title}</span>
                <button
                  className={styles.deleteBtn}
                  onClick={(e) => handleDelete(e, board.id)}
                  title="Delete board"
                >
                  ×
                </button>
              </div>
            ))}

            <div className={styles.addCard} onClick={() => setShowCreate(true)}>
              <span>+ Create new board</span>
            </div>
          </div>
        )}
      </div>

      {showCreate && (
        <div className="overlay" onClick={() => setShowCreate(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2>Create board</h2>
            <div className={styles.bgPicker}>
              {BOARD_BACKGROUNDS.map((bg) => (
                <div
                  key={bg}
                  className={`${styles.bgSwatch} ${newBg === bg ? styles.selected : ''}`}
                  style={{ background: bg }}
                  onClick={() => setNewBg(bg)}
                />
              ))}
            </div>
            <form onSubmit={handleCreate}>
              <label>
                Board title *
                <input
                  autoFocus
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Enter board title"
                  maxLength={200}
                />
              </label>
              <div className={styles.modalActions}>
                <button type="button" onClick={() => setShowCreate(false)} className={styles.cancelBtn}>
                  Cancel
                </button>
                <button type="submit" className={styles.submitBtn} disabled={!newTitle.trim()}>
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
