import { Link } from 'react-router-dom';
import styles from './Navbar.module.css';

export default function Navbar({ boardTitle, boardId }) {
  return (
    <nav className={styles.nav}>
      <div className={styles.left}>
        <Link to="/" className={styles.logo}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <rect x="3" y="3" width="7.5" height="18" rx="2" />
            <rect x="13.5" y="3" width="7.5" height="12" rx="2" />
          </svg>
          <span>Trello Clone</span>
        </Link>
        {boardTitle && (
          <>
            <span className={styles.sep}>|</span>
            <span className={styles.boardName}>{boardTitle}</span>
          </>
        )}
      </div>
      <div className={styles.right}>
        <div className={styles.avatar} title="Alice Johnson (default user)">AJ</div>
      </div>
    </nav>
  );
}
