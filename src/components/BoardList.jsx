import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState } from 'react';
import { deleteList, updateList } from '../api';
import AddCardButton from './AddCardButton';
import styles from './BoardList.module.css';
import CardItem from './CardItem';

export default function BoardList({ list, allLabels, allMembers, onCardClick, onCardCreate, onListUpdate, onListDelete }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(list.title);
  const [showMenu, setShowMenu] = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: list.id,
    data: { type: 'list' },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const handleTitleSave = async () => {
    setEditing(false);
    if (!title.trim() || title === list.title) { setTitle(list.title); return; }
    const { data } = await updateList(list.id, { title: title.trim() });
    onListUpdate(data);
  };

  const handleDelete = async () => {
    if (!confirm(`Delete list "${list.title}"? All cards will be removed.`)) return;
    await deleteList(list.id);
    onListDelete(list.id);
  };

  const cardIds = (list.cards || []).map((c) => c.id);

  return (
    <div ref={setNodeRef} style={style} className={styles.list} {...attributes}>
      <div className={styles.header} {...listeners}>
        {editing ? (
          <input
            className={styles.titleInput}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleSave}
            onKeyDown={(e) => { if (e.key === 'Enter') handleTitleSave(); if (e.key === 'Escape') { setTitle(list.title); setEditing(false); } }}
            autoFocus
            onClick={(e) => e.stopPropagation()}
            maxLength={200}
          />
        ) : (
          <h3 className={styles.title} onClick={() => setEditing(true)}>{list.title}</h3>
        )}
        <button className={styles.menuBtn} onClick={(e) => { e.stopPropagation(); setShowMenu((v) => !v); }}>
          …
        </button>
        {showMenu && (
          <div className={styles.menu}>
            <button onClick={() => { setEditing(true); setShowMenu(false); }}>Rename list</button>
            <button className={styles.danger} onClick={() => { setShowMenu(false); handleDelete(); }}>Delete list</button>
          </div>
        )}
      </div>

      <div className={styles.cardsArea}>
        <SortableContext items={cardIds} strategy={verticalListSortingStrategy} id={list.id}>
          {(list.cards || []).map((card) => (
            <CardItem
              key={card.id}
              card={card}
              allLabels={allLabels}
              allMembers={allMembers}
              listId={list.id}
              onClick={() => onCardClick(card.id)}
            />
          ))}
        </SortableContext>
      </div>

      <AddCardButton listId={list.id} onCardCreate={onCardCreate} />
    </div>
  );
}
