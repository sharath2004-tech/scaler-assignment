import { useEffect, useRef, useState } from 'react';
import styles from './SearchBar.module.css';

export default function SearchBar({
  allLabels,
  allMembers,
  searchQuery,
  filterLabel,
  filterMember,
  filterDue,
  onSearchQuery,
  onFilterLabel,
  onFilterMember,
  onFilterDue,
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const hasFilter = searchQuery?.trim() || filterLabel || filterMember || filterDue;

  const clearAll = () => {
    onSearchQuery('');
    onFilterLabel(null);
    onFilterMember(null);
    onFilterDue(null);
  };

  return (
    <div className={styles.wrapper} ref={ref}>
      <div className={styles.searchWrap}>
        <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" className={styles.searchIcon}>
          <path d="M11.5 10.5l3 3-1 1-3-3a5 5 0 1 1 1-1zM6.5 10a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" />
        </svg>
        <input
          className={styles.searchInput}
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchQuery(e.target.value)}
          placeholder="Search cards by title..."
          maxLength={200}
        />
      </div>

      <button
        className={`${styles.filterBtn} ${hasFilter ? styles.active : ''}`}
        onClick={() => setOpen((v) => !v)}
      >
        <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
          <path d="M1 3h14l-5 6v5l-4-2V9L1 3z" />
        </svg>
        Filters
        {hasFilter && <span className={styles.dot} />}
      </button>

      {hasFilter && (
        <button className={styles.clearBtn} onClick={clearAll}>Clear filters</button>
      )}

      {open && (
        <div className={styles.dropdown}>
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Labels</div>
            <button
              className={`${styles.option} ${!filterLabel ? styles.optionActive : ''}`}
              onClick={() => { onFilterLabel(null); }}
            >
              All labels
            </button>
            {allLabels.map((label) => (
              <button
                key={label.id}
                className={`${styles.option} ${filterLabel === label.id ? styles.optionActive : ''}`}
                onClick={() => { onFilterLabel(label.id); setOpen(false); }}
              >
                <span className={styles.labelDot} style={{ background: label.color }} />
                {label.name}
              </button>
            ))}
          </div>

          <div className={styles.section}>
            <div className={styles.sectionTitle}>Members</div>
            <button
              className={`${styles.option} ${!filterMember ? styles.optionActive : ''}`}
              onClick={() => onFilterMember(null)}
            >
              All members
            </button>
            {allMembers.map((m) => (
              <button
                key={m.id}
                className={`${styles.option} ${filterMember === m.id ? styles.optionActive : ''}`}
                onClick={() => { onFilterMember(m.id); setOpen(false); }}
              >
                <span className={styles.memberBadge} style={{ background: m.avatar_color }}>{m.initials}</span>
                {m.name}
              </button>
            ))}
          </div>

          <div className={styles.section}>
            <div className={styles.sectionTitle}>Due Date</div>
            {[
              { value: null, label: 'Any' },
              { value: 'overdue', label: 'Overdue' },
              { value: 'today', label: 'Due today' },
              { value: 'week', label: 'Due this week' },
            ].map(({ value, label }) => (
              <button
                key={String(value)}
                className={`${styles.option} ${filterDue === value ? styles.optionActive : ''}`}
                onClick={() => { onFilterDue(value); setOpen(false); }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
