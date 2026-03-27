import { useState } from 'react';
import { createCard } from '../api';
import styles from './AddCardButton.module.css';

export default function AddCardButton({ listId, onCardCreate }) {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    const { data } = await createCard({ list_id: listId, title: title.trim() });
    onCardCreate(data);
    setTitle('');
    setAdding(false);
  };

  if (!adding) {
    return (
      <button className={styles.btn} onClick={() => setAdding(true)}>
        <span>+</span> Add a card
      </button>
    );
  }

  return (
    <div className={styles.form}>
      <form onSubmit={handleSubmit}>
        <textarea
          className={styles.textarea}
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter a title for this card…"
          rows={3}
          maxLength={500}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e); }
            if (e.key === 'Escape') setAdding(false);
          }}
        />
        <div className={styles.actions}>
          <button type="submit" className={styles.submit} disabled={!title.trim()}>
            Add card
          </button>
          <button type="button" className={styles.cancel} onClick={() => { setAdding(false); setTitle(''); }}>
            ×
          </button>
        </div>
      </form>
    </div>
  );
}
