import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { format, isPast, isToday, isValid } from 'date-fns';
import styles from './CardItem.module.css';

function parseDueDate(value) {
  if (!value) return null;
  const asText = String(value).trim();
  if (!asText || asText === '0000-00-00') return null;
  const parsed = new Date(`${asText}T00:00:00`);
  return isValid(parsed) ? parsed : null;
}

export default function CardItem({ card, allLabels, allMembers, listId, onClick, isDragging }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: isSortableDragging } = useSortable({
    id: card.id,
    data: { type: 'card', listId },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.3 : 1,
  };

  const cardLabels = allLabels.filter((l) => card.label_ids?.includes(l.id));
  const cardMembers = allMembers.filter((m) => card.member_ids?.includes(m.id));

  const dueDate = parseDueDate(card.due_date);
  const isOverdue = dueDate && !card.archived && isPast(dueDate) && !isToday(dueDate);
  const isDueToday = dueDate && isToday(dueDate);

  const hasDesc = !!card.description;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`${styles.card} ${isDragging ? styles.dragging : ''}`}
      onClick={onClick}
    >
      {card.cover_color && <div className={styles.cover} style={{ background: card.cover_color }} />}

      {cardLabels.length > 0 && (
        <div className={styles.labels}>
          {cardLabels.map((label) => (
            <span
              key={label.id}
              className={styles.label}
              style={{ background: label.color }}
              title={label.name}
            />
          ))}
        </div>
      )}

      <span className={styles.title}>{card.title}</span>

      <div className={styles.footer}>
        <div className={styles.badges}>
          {hasDesc && (
            <span className={styles.badge} title="Has description">
              <svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor">
                <path d="M2 2h12v2H2zm0 4h12v2H2zm0 4h8v2H2z" />
              </svg>
            </span>
          )}
          {dueDate && (
            <span
              className={`${styles.badge} ${styles.dueBadge} ${isOverdue ? styles.overdue : isDueToday ? styles.dueToday : ''}`}
              title={`Due: ${format(dueDate, 'MMM d, yyyy')}`}
            >
              <svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor">
                <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 1.5a5.5 5.5 0 1 1 0 11 5.5 5.5 0 0 1 0-11zM7.25 4v4.31l2.97 1.71-.75 1.3-3.47-2V4h1.25z" />
              </svg>
              {format(dueDate, 'MMM d')}
            </span>
          )}
        </div>
        {cardMembers.length > 0 && (
          <div className={styles.members}>
            {cardMembers.slice(0, 3).map((m) => (
              <div
                key={m.id}
                className={styles.memberAvatar}
                style={{ background: m.avatar_color }}
                title={m.name}
              >
                {m.initials}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
