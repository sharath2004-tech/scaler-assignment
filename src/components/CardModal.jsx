import { format, isValid } from 'date-fns';
import { useEffect, useRef, useState } from 'react';
import {
    addChecklist,
    addChecklistItem,
    addComment,
    addLabelToCard,
    addMemberToCard,
    API_ORIGIN,
    deleteAttachment,
    deleteCard,
    deleteChecklist,
    deleteChecklistItem,
    getCard,
    removeLabelFromCard,
    removeMemberFromCard,
    updateCard,
    updateChecklistItem,
    uploadAttachment,
    uploadCoverImage,
} from '../api';
import styles from './CardModal.module.css';

  const COVER_COLORS = ['#0052CC', '#00875A', '#FF5630', '#6554C0', '#FF8B00', '#00B8D9', '#36B37E', '#403294'];

function parseDateSafe(value, useMidnight = false) {
  if (!value) return null;
  const asText = String(value).trim();
  if (!asText || asText === '0000-00-00') return null;

  // Normalize MySQL-style values that may come as either YYYY-MM-DD or full datetime string
  const datePart = asText.match(/^\d{4}-\d{2}-\d{2}/)?.[0] || asText;
  const source = useMidnight ? `${datePart}T00:00:00` : asText;
  const parsed = new Date(source);
  return isValid(parsed) ? parsed : null;
}

function toDateInputValue(value) {
  const asText = String(value || '').trim();
  const datePart = asText.match(/^\d{4}-\d{2}-\d{2}/)?.[0];
  return datePart || '';
}

function formatDateSafe(value, pattern, useMidnight = false) {
  const parsed = parseDateSafe(value, useMidnight);
  return parsed ? format(parsed, pattern) : '';
}

function resolveMediaUrl(url) {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith('/')) return `${API_ORIGIN}${url}`;
  return url;
}

export default function CardModal({ cardId, allLabels, allMembers, onClose, onUpdate, onDelete }) {
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleVal, setTitleVal] = useState('');
  const [editingDesc, setEditingDesc] = useState(false);
  const [descVal, setDescVal] = useState('');
  const [showLabelPicker, setShowLabelPicker] = useState(false);
  const [showMemberPicker, setShowMemberPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [newChecklistTitle, setNewChecklistTitle] = useState('');
  const [showNewChecklist, setShowNewChecklist] = useState(false);
  const [newItemTexts, setNewItemTexts] = useState({});
  const [commentText, setCommentText] = useState('');
  const [coverImageInput, setCoverImageInput] = useState('');
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const overlayRef = useRef(null);

  // Default logged-in user
  const DEFAULT_MEMBER_ID = null; // will be set from members list

  useEffect(() => {
    getCard(cardId)
      .then((r) => {
        setCard(r.data);
        setTitleVal(r.data.title);
        setDescVal(r.data.description || '');
        setCoverImageInput(r.data.cover_image || '');
      })
      .finally(() => setLoading(false));
  }, [cardId]);

  const saveTitle = async () => {
    setEditingTitle(false);
    if (!titleVal.trim() || titleVal === card.title) return;
    const { data } = await updateCard(cardId, { title: titleVal.trim() });
    setCard((prev) => ({ ...prev, title: data.title }));
    onUpdate({ ...card, title: data.title });
  };

  const saveDesc = async () => {
    setEditingDesc(false);
    if (descVal === (card.description || '')) return;
    const { data } = await updateCard(cardId, { description: descVal });
    setCard((prev) => ({ ...prev, description: data.description }));
    onUpdate({ ...card, description: data.description });
  };

  const saveDueDate = async (date) => {
    setShowDatePicker(false);
    const { data } = await updateCard(cardId, { due_date: date || null });
    setCard((prev) => ({ ...prev, due_date: data.due_date }));
    onUpdate({ ...card, due_date: data.due_date });
  };

  const applyCoverColor = async (color) => {
    const { data } = await updateCard(cardId, { cover_color: color, cover_image: null });
    setCard((prev) => ({ ...prev, cover_color: data.cover_color, cover_image: data.cover_image }));
    setCoverImageInput('');
    onUpdate({ ...card, cover_color: data.cover_color, cover_image: data.cover_image });
  };

  const applyCoverImage = async () => {
    const url = coverImageInput.trim();
    if (!url) return;
    const { data } = await updateCard(cardId, { cover_image: url, cover_color: null });
    setCard((prev) => ({ ...prev, cover_color: data.cover_color, cover_image: data.cover_image }));
    onUpdate({ ...card, cover_color: data.cover_color, cover_image: data.cover_image });
  };

  const removeCover = async () => {
    const { data } = await updateCard(cardId, { cover_image: null, cover_color: null });
    setCard((prev) => ({ ...prev, cover_color: data.cover_color, cover_image: data.cover_image }));
    setCoverImageInput('');
    onUpdate({ ...card, cover_color: data.cover_color, cover_image: data.cover_image });
  };

  const handleAttachmentUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    setUploadingAttachment(true);
    try {
      const { data } = await uploadAttachment(cardId, formData);
      setCard((prev) => ({ ...prev, attachments: [data, ...(prev.attachments || [])] }));
    } finally {
      setUploadingAttachment(false);
      e.target.value = '';
    }
  };

  const handleAttachmentDelete = async (attachmentId) => {
    await deleteAttachment(cardId, attachmentId);
    setCard((prev) => ({
      ...prev,
      attachments: (prev.attachments || []).filter((a) => a.id !== attachmentId),
    }));
  };

  const handleCoverFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCover(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      // Preferred path: dedicated cover-upload endpoint
      const { data } = await uploadCoverImage(cardId, formData);
      setCard((prev) => ({ ...prev, cover_image: data.cover_image, cover_color: data.cover_color }));
      setCoverImageInput(data.cover_image || '');
      onUpdate({ ...card, cover_image: data.cover_image, cover_color: data.cover_color });
    } catch (err) {
      // Backward-compatible fallback if backend isn't redeployed with /cover/upload yet
      if (err?.response?.status === 404) {
        const fallbackData = new FormData();
        fallbackData.append('file', file);
        const { data: attachment } = await uploadAttachment(cardId, fallbackData);
        const { data: updated } = await updateCard(cardId, {
          cover_image: attachment.file_url,
          cover_color: null,
        });

        setCard((prev) => ({
          ...prev,
          cover_image: updated.cover_image,
          cover_color: updated.cover_color,
          attachments: [attachment, ...(prev.attachments || [])],
        }));
        setCoverImageInput(updated.cover_image || '');
        onUpdate({
          ...card,
          cover_image: updated.cover_image,
          cover_color: updated.cover_color,
        });
      } else {
        throw err;
      }
    } finally {
      setUploadingCover(false);
      e.target.value = '';
    }
  };

  const toggleLabel = async (label) => {
    const has = card.labels?.some((l) => l.id === label.id);
    if (has) {
      await removeLabelFromCard(cardId, label.id);
      setCard((prev) => ({ ...prev, labels: prev.labels.filter((l) => l.id !== label.id) }));
      onUpdate({ ...card, label_ids: card.labels.filter((l) => l.id !== label.id).map((l) => l.id) });
    } else {
      await addLabelToCard(cardId, label.id);
      setCard((prev) => ({ ...prev, labels: [...(prev.labels || []), label] }));
      onUpdate({ ...card, label_ids: [...(card.label_ids || []), label.id] });
    }
  };

  const toggleMember = async (member) => {
    const has = card.members?.some((m) => m.id === member.id);
    if (has) {
      await removeMemberFromCard(cardId, member.id);
      setCard((prev) => ({ ...prev, members: prev.members.filter((m) => m.id !== member.id) }));
      onUpdate({ ...card, member_ids: (card.member_ids || []).filter((id) => id !== member.id) });
    } else {
      await addMemberToCard(cardId, member.id);
      setCard((prev) => ({ ...prev, members: [...(prev.members || []), member] }));
      onUpdate({ ...card, member_ids: [...(card.member_ids || []), member.id] });
    }
  };

  const handleAddChecklist = async (e) => {
    e.preventDefault();
    if (!newChecklistTitle.trim()) return;
    const { data } = await addChecklist(cardId, { title: newChecklistTitle.trim() });
    setCard((prev) => ({ ...prev, checklists: [...(prev.checklists || []), data] }));
    setNewChecklistTitle('');
    setShowNewChecklist(false);
  };

  const handleDeleteChecklist = async (checklistId) => {
    await deleteChecklist(cardId, checklistId);
    setCard((prev) => ({ ...prev, checklists: prev.checklists.filter((c) => c.id !== checklistId) }));
  };

  const handleAddItem = async (e, checklistId) => {
    e.preventDefault();
    const text = newItemTexts[checklistId];
    if (!text?.trim()) return;
    const { data } = await addChecklistItem(cardId, checklistId, { text: text.trim() });
    setCard((prev) => ({
      ...prev,
      checklists: prev.checklists.map((c) =>
        c.id === checklistId ? { ...c, items: [...(c.items || []), data] } : c
      ),
    }));
    setNewItemTexts((prev) => ({ ...prev, [checklistId]: '' }));
  };

  const handleToggleItem = async (checklistId, item) => {
    const { data } = await updateChecklistItem(cardId, checklistId, item.id, { completed: !item.completed });
    setCard((prev) => ({
      ...prev,
      checklists: prev.checklists.map((c) =>
        c.id === checklistId
          ? { ...c, items: c.items.map((i) => (i.id === item.id ? data : i)) }
          : c
      ),
    }));
  };

  const handleDeleteItem = async (checklistId, itemId) => {
    await deleteChecklistItem(cardId, checklistId, itemId);
    setCard((prev) => ({
      ...prev,
      checklists: prev.checklists.map((c) =>
        c.id === checklistId ? { ...c, items: c.items.filter((i) => i.id !== itemId) } : c
      ),
    }));
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    const { data } = await addComment(cardId, { text: commentText.trim(), member_id: allMembers[0]?.id });
    setCard((prev) => ({ ...prev, comments: [...(prev.comments || []), data] }));
    setCommentText('');
  };

  const handleDelete = async () => {
    if (!confirm('Delete this card?')) return;
    await deleteCard(cardId);
    onDelete(cardId);
  };

  const handleArchive = async () => {
    await updateCard(cardId, { archived: true });
    onDelete(cardId);
  };

  if (loading) return (
    <div className="overlay" onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.loading}>Loading card...</div>
      </div>
    </div>
  );

  if (!card) return null;

  return (
    <div className="overlay" ref={overlayRef} onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Cover */}
        {(card.cover_image || card.cover_color) && (
          <div
            className={styles.cover}
            style={card.cover_image
              ? {
                  backgroundImage: `url(${resolveMediaUrl(card.cover_image)})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }
              : { background: card.cover_color }}
          />
        )}

        {/* Close */}
        <button className={styles.closeBtn} onClick={onClose}>×</button>

        <div className={styles.body}>
          {/* Main content */}
          <div className={styles.main}>
            {/* Labels strip */}
            {card.labels?.length > 0 && (
              <div className={styles.labelsRow}>
                {card.labels.map((l) => (
                  <span key={l.id} className={styles.labelTag} style={{ background: l.color }}>{l.name}</span>
                ))}
              </div>
            )}

            {/* Title */}
            <div className={styles.titleSection}>
              <svg viewBox="0 0 16 16" width="18" height="18" fill="currentColor" className={styles.sectionIcon}>
                <path d="M1 2h14v2H1zm0 4h14v2H1zm0 4h9v2H1z" />
              </svg>
              {editingTitle ? (
                <textarea
                  className={styles.titleInput}
                  value={titleVal}
                  onChange={(e) => setTitleVal(e.target.value)}
                  onBlur={saveTitle}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); saveTitle(); } if (e.key === 'Escape') { setTitleVal(card.title); setEditingTitle(false); } }}
                  autoFocus
                  rows={2}
                  maxLength={500}
                />
              ) : (
                <h2 className={styles.cardTitle} onClick={() => setEditingTitle(true)}>{card.title}</h2>
              )}
            </div>

            {/* In list */}
            <p className={styles.inList}>in list <strong>{card.list_id}</strong></p>

            {/* Description */}
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" className={styles.sectionIcon}>
                  <path d="M2 2h12v2H2zm0 4h12v2H2zm0 4h8v2H2z" />
                </svg>
                <h3>Description</h3>
                {!editingDesc && (
                  <button className={styles.editBtn} onClick={() => setEditingDesc(true)}>Edit</button>
                )}
              </div>
              {editingDesc ? (
                <div>
                  <textarea
                    className={styles.descInput}
                    value={descVal}
                    onChange={(e) => setDescVal(e.target.value)}
                    placeholder="Add a more detailed description…"
                    rows={5}
                    autoFocus
                  />
                  <div className={styles.inlineActions}>
                    <button className={styles.saveBtnSm} onClick={saveDesc}>Save</button>
                    <button className={styles.cancelBtnSm} onClick={() => { setEditingDesc(false); setDescVal(card.description || ''); }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div
                  className={`${styles.descDisplay} ${!card.description ? styles.descPlaceholder : ''}`}
                  onClick={() => setEditingDesc(true)}
                >
                  {card.description || 'Add a more detailed description…'}
                </div>
              )}
            </div>

            {/* Checklists */}
            {(card.checklists || []).map((cl) => {
              const cl_total = cl.items?.length || 0;
              const cl_done = cl.items?.filter((i) => i.completed).length || 0;
              const cl_pct = cl_total > 0 ? Math.round((cl_done / cl_total) * 100) : 0;
              return (
                <div key={cl.id} className={styles.section}>
                  <div className={styles.sectionHeader}>
                    <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" className={styles.sectionIcon}>
                      <path d="M2 3h12v2H2zm0 4h12v2H2zm0 4h6v2H2zm11-1l-3 3-1.5-1.5 1-1L11 10z" />
                    </svg>
                    <h3>{cl.title}</h3>
                    <button className={styles.editBtn} onClick={() => handleDeleteChecklist(cl.id)}>Delete</button>
                  </div>
                  <div className={styles.progressRow}>
                    <span className={styles.pct}>{cl_pct}%</span>
                    <div className={styles.progressBar}>
                      <div className={styles.progressFill} style={{ width: `${cl_pct}%`, background: cl_pct === 100 ? '#00875A' : '#0052CC' }} />
                    </div>
                  </div>
                  {(cl.items || []).map((item) => (
                    <div key={item.id} className={styles.checkItem}>
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={() => handleToggleItem(cl.id, item)}
                        className={styles.checkbox}
                      />
                      <span className={`${styles.itemText} ${item.completed ? styles.itemDone : ''}`}>{item.text}</span>
                      <button className={styles.deleteItemBtn} onClick={() => handleDeleteItem(cl.id, item.id)}>×</button>
                    </div>
                  ))}
                  <form className={styles.addItemForm} onSubmit={(e) => handleAddItem(e, cl.id)}>
                    <input
                      value={newItemTexts[cl.id] || ''}
                      onChange={(e) => setNewItemTexts((prev) => ({ ...prev, [cl.id]: e.target.value }))}
                      placeholder="Add an item…"
                      className={styles.addItemInput}
                      maxLength={500}
                    />
                    <button type="submit" className={styles.saveBtnSm} disabled={!newItemTexts[cl.id]?.trim()}>Add</button>
                  </form>
                </div>
              );
            })}

            {/* Comments */}
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" className={styles.sectionIcon}>
                  <path d="M2 2h12v12H2zM4 4v8h8V4z" />
                </svg>
                <h3>Attachments</h3>
              </div>
              <div className={styles.attachmentsBox}>
                <label className={styles.uploadBtn}>
                  {uploadingAttachment ? 'Uploading...' : '+ Add attachment'}
                  <input type="file" onChange={handleAttachmentUpload} disabled={uploadingAttachment} />
                </label>
                {(card.attachments || []).map((a) => (
                  <div key={a.id} className={styles.attachmentItem}>
                    <a href={resolveMediaUrl(a.file_url)} target="_blank" rel="noreferrer" className={styles.attachmentLink}>
                      {a.file_name}
                    </a>
                    <button className={styles.attachmentDeleteBtn} onClick={() => handleAttachmentDelete(a.id)}>
                      Delete
                    </button>
                  </div>
                ))}
                {(!card.attachments || card.attachments.length === 0) && (
                  <div className={styles.emptyHint}>No attachments yet.</div>
                )}
              </div>
            </div>

            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" className={styles.sectionIcon}>
                  <path d="M14 1H2a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h3v3l4-3h5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1z" />
                </svg>
                <h3>Activity</h3>
              </div>
              <form className={styles.commentForm} onSubmit={handleComment}>
                <div className={styles.memberAvatar} style={{ background: allMembers[0]?.avatar_color || '#0052CC' }}>
                  {allMembers[0]?.initials || 'AJ'}
                </div>
                <div className={styles.commentInputWrap}>
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Write a comment…"
                    rows={1}
                    className={styles.commentInput}
                    onFocus={(e) => { e.target.rows = 3; }}
                  />
                  {commentText && (
                    <div className={styles.inlineActions}>
                      <button type="submit" className={styles.saveBtnSm}>Save</button>
                    </div>
                  )}
                </div>
              </form>
              {(card.comments || []).map((comment) => (
                <div key={comment.id} className={styles.comment}>
                  <div className={styles.memberAvatar} style={{ background: comment.avatar_color || '#0052CC' }}>
                    {comment.initials || '?'}
                  </div>
                  <div className={styles.commentContent}>
                    <span className={styles.commenterName}>{comment.member_name || 'Unknown'}</span>
                    <span className={styles.commentTime}>{formatDateSafe(comment.created_at, 'MMM d, yyyy')}</span>
                    <p className={styles.commentText}>{comment.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className={styles.sidebar}>
            {/* Members */}
            <div className={styles.sideSection}>
              <div className={styles.sideSectionTitle}>Members</div>
              <div className={styles.membersList}>
                {(card.members || []).map((m) => (
                  <div key={m.id} className={styles.memberChip} title={m.name}>
                    <span className={styles.memberAvatar} style={{ background: m.avatar_color }}>{m.initials}</span>
                  </div>
                ))}
              </div>
              <button className={styles.sideBtn} onClick={() => { setShowMemberPicker((v) => !v); setShowLabelPicker(false); }}>
                + Members
              </button>
              {showMemberPicker && (
                <div className={styles.picker}>
                  {allMembers.map((m) => {
                    const has = card.members?.some((cm) => cm.id === m.id);
                    return (
                      <button key={m.id} className={`${styles.pickerItem} ${has ? styles.pickerItemActive : ''}`} onClick={() => toggleMember(m)}>
                        <span className={styles.memberAvatar} style={{ background: m.avatar_color, width: 24, height: 24, fontSize: 10 }}>{m.initials}</span>
                        {m.name}
                        {has && <span className={styles.checkMark}>✓</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Labels */}
            <div className={styles.sideSection}>
              <div className={styles.sideSectionTitle}>Labels</div>
              <div className={styles.labelsGrid}>
                {(card.labels || []).map((l) => (
                  <span key={l.id} className={styles.labelChip} style={{ background: l.color }}>{l.name}</span>
                ))}
              </div>
              <button className={styles.sideBtn} onClick={() => { setShowLabelPicker((v) => !v); setShowMemberPicker(false); }}>
                + Labels
              </button>
              {showLabelPicker && (
                <div className={styles.picker}>
                  {allLabels.map((label) => {
                    const has = card.labels?.some((l) => l.id === label.id);
                    return (
                      <button key={label.id} className={`${styles.pickerItem} ${has ? styles.pickerItemActive : ''}`} onClick={() => toggleLabel(label)}>
                        <span className={styles.labelDotLg} style={{ background: label.color }} />
                        {label.name}
                        {has && <span className={styles.checkMark}>✓</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Due Date */}
            <div className={styles.sideSection}>
              <div className={styles.sideSectionTitle}>Due Date</div>
              {parseDateSafe(card.due_date, true) && (
                <div className={styles.dueDateDisplay}>{formatDateSafe(card.due_date, 'MMM d, yyyy', true)}</div>
              )}
              <button className={styles.sideBtn} onClick={() => setShowDatePicker((v) => !v)}>
                {card.due_date ? 'Change' : '+ Due date'}
              </button>
              {showDatePicker && (
                <div className={styles.datePicker}>
                  <input
                    type="date"
                    defaultValue={toDateInputValue(card.due_date)}
                    onChange={(e) => saveDueDate(e.target.value)}
                    style={{ colorScheme: 'dark' }}
                  />
                  {card.due_date && (
                    <button className={styles.removeDate} onClick={() => saveDueDate(null)}>Remove date</button>
                  )}
                </div>
              )}
            </div>

            {/* Cover */}
            <div className={styles.sideSection}>
              <div className={styles.sideSectionTitle}>Cover</div>
              <div className={styles.coverColorGrid}>
                {COVER_COLORS.map((color) => (
                  <button
                    key={color}
                    className={`${styles.coverColor} ${card.cover_color === color ? styles.coverColorActive : ''}`}
                    style={{ background: color }}
                    onClick={() => applyCoverColor(color)}
                    title="Set cover color"
                  />
                ))}
              </div>
              <input
                className={styles.coverInput}
                placeholder="Image URL"
                value={coverImageInput}
                onChange={(e) => setCoverImageInput(e.target.value)}
              />
              <button className={styles.sideBtn} onClick={applyCoverImage} disabled={!coverImageInput.trim()}>
                Set image
              </button>
              <label className={styles.uploadBtn}>
                {uploadingCover ? 'Uploading...' : '+ Upload local image'}
                <input type="file" accept="image/*" onChange={handleCoverFileUpload} disabled={uploadingCover} />
              </label>
              {(card.cover_color || card.cover_image) && (
                <button className={styles.removeDate} onClick={removeCover}>Remove cover</button>
              )}
            </div>

            {/* Checklist */}
            <div className={styles.sideSection}>
              <div className={styles.sideSectionTitle}>Add to card</div>
              <button className={styles.sideBtn} onClick={() => setShowNewChecklist((v) => !v)}>
                ☑ Checklist
              </button>
              {showNewChecklist && (
                <form onSubmit={handleAddChecklist} className={styles.newChecklistForm}>
                  <input
                    value={newChecklistTitle}
                    onChange={(e) => setNewChecklistTitle(e.target.value)}
                    placeholder="Checklist title"
                    autoFocus
                    maxLength={200}
                  />
                  <button type="submit" className={styles.saveBtnSm} disabled={!newChecklistTitle.trim()}>Add</button>
                </form>
              )}
            </div>

            {/* Actions */}
            <div className={styles.sideSection}>
              <div className={styles.sideSectionTitle}>Actions</div>
              <button className={styles.sideBtn} onClick={handleArchive}>Archive</button>
              <button className={`${styles.sideBtn} ${styles.danger}`} onClick={handleDelete}>Delete card</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
