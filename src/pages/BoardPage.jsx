import {
    closestCorners, defaultDropAnimationSideEffects,
    DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createList, getBoard, getLabels, getMembers, reorderCards, reorderLists } from '../api';
import BoardList from '../components/BoardList';
import CardItem from '../components/CardItem';
import CardModal from '../components/CardModal';
import Navbar from '../components/Navbar';
import SearchBar from '../components/SearchBar';
import styles from './BoardPage.module.css';

const DROP_ANIMATION = {
  sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.5' } } }),
};

export default function BoardPage() {
  const { boardId } = useParams();
  const navigate = useNavigate();
  const [board, setBoard] = useState(null);
  const [lists, setLists] = useState([]);
  const [allMembers, setAllMembers] = useState([]);
  const [allLabels, setAllLabels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCard, setActiveCard] = useState(null);
  const [activeList, setActiveList] = useState(null);
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [filterLabel, setFilterLabel] = useState(null);
  const [filterMember, setFilterMember] = useState(null);
  const [filterDue, setFilterDue] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const loadBoard = useCallback(() => {
    return getBoard(boardId).then((r) => {
      setBoard({ id: r.data.id, title: r.data.title, background: r.data.background });
      setLists(r.data.lists || []);
    });
  }, [boardId]);

  useEffect(() => {
    Promise.all([loadBoard(), getMembers(), getLabels()])
      .then(([, membersRes, labelsRes]) => {
        setAllMembers(membersRes.data);
        setAllLabels(labelsRes.data);
      })
      .catch(() => navigate('/'))
      .finally(() => setLoading(false));
  }, [loadBoard, navigate]);

  const findListOfCard = (cardId) => lists.find((l) => l.cards?.some((c) => c.id === cardId));

  function onDragStart({ active }) {
    const type = active.data.current?.type;
    if (type === 'card') {
      const list = findListOfCard(active.id);
      setActiveCard(list?.cards.find((c) => c.id === active.id) || null);
    } else if (type === 'list') {
      setActiveList(lists.find((l) => l.id === active.id) || null);
    }
  }

  function onDragOver({ active, over }) {
    if (!over) return;
    const activeType = active.data.current?.type;
    if (activeType !== 'card') return;

    const activeListId = active.data.current?.listId;
    const overType = over.data.current?.type;
    const overListId = overType === 'card' ? over.data.current?.listId : over.id;

    if (!activeListId || !overListId || activeListId === overListId) return;

    setLists((prev) => {
      const srcList = prev.find((l) => l.id === activeListId);
      const dstList = prev.find((l) => l.id === overListId);
      if (!srcList || !dstList) return prev;

      const card = srcList.cards.find((c) => c.id === active.id);
      const newSrc = srcList.cards.filter((c) => c.id !== active.id);
      const overIndex = overType === 'card' ? dstList.cards.findIndex((c) => c.id === over.id) : dstList.cards.length;
      const newDst = [...dstList.cards];
      newDst.splice(overIndex, 0, { ...card, list_id: overListId });

      return prev.map((l) => {
        if (l.id === activeListId) return { ...l, cards: newSrc };
        if (l.id === overListId) return { ...l, cards: newDst };
        return l;
      });
    });
  }

  async function onDragEnd({ active, over }) {
    setActiveCard(null);
    setActiveList(null);
    if (!over) return;

    const activeType = active.data.current?.type;

    if (activeType === 'list') {
      const oldIndex = lists.findIndex((l) => l.id === active.id);
      const newIndex = lists.findIndex((l) => l.id === over.id);
      if (oldIndex !== newIndex) {
        const newLists = arrayMove(lists, oldIndex, newIndex);
        setLists(newLists);
        await reorderLists({ board_id: boardId, ordered_ids: newLists.map((l) => l.id) });
      }
      return;
    }

    // card drag end
    const activeListId = active.data.current?.listId;
    const overType = over.data.current?.type;
    const overListId = overType === 'card' ? over.data.current?.listId : over.id;

    if (!activeListId || !overListId) return;

    setLists((prev) => {
      const targetList = prev.find((l) => l.id === overListId);
      if (!targetList) return prev;

      if (activeListId === overListId) {
        const oldIdx = targetList.cards.findIndex((c) => c.id === active.id);
        const newIdx = targetList.cards.findIndex((c) => c.id === over.id);
        if (oldIdx === newIdx) return prev;
        const newCards = arrayMove(targetList.cards, oldIdx, newIdx);
        return prev.map((l) => (l.id === overListId ? { ...l, cards: newCards } : l));
      }
      return prev;
    });

    const finalList = lists.find((l) => l.id === overListId);
    if (finalList) {
      await reorderCards({ list_id: overListId, ordered_ids: finalList.cards.map((c) => c.id) });
    }
  }

  const handleCardUpdate = (updatedCard) => {
    setLists((prev) =>
      prev.map((l) => ({
        ...l,
        cards: l.cards?.map((c) => (c.id === updatedCard.id ? { ...c, ...updatedCard } : c)) || [],
      }))
    );
  };

  const handleCardDelete = (cardId) => {
    setLists((prev) =>
      prev.map((l) => ({ ...l, cards: l.cards?.filter((c) => c.id !== cardId) || [] }))
    );
    setSelectedCardId(null);
  };

  const handleCardCreate = (card) => {
    setLists((prev) =>
      prev.map((l) => (l.id === card.list_id ? { ...l, cards: [...(l.cards || []), card] } : l))
    );
  };

  const handleListCreate = (list) => {
    setLists((prev) => [...prev, { ...list, cards: [] }]);
  };

  const handleListUpdate = (updatedList) => {
    setLists((prev) => prev.map((l) => (l.id === updatedList.id ? { ...l, ...updatedList } : l)));
  };

  const handleListDelete = (listId) => {
    setLists((prev) => prev.filter((l) => l.id !== listId));
  };

  const filteredLists = lists.map((list) => ({
    ...list,
    cards: (list.cards || []).filter((card) => {
      if (filterLabel && !card.label_ids?.includes(filterLabel)) return false;
      if (filterMember && !card.member_ids?.includes(filterMember)) return false;
      if (filterDue) {
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const due = card.due_date ? new Date(card.due_date) : null;
        if (!due) return false;
        if (filterDue === 'overdue' && due >= today) return false;
        if (filterDue === 'today' && due.toDateString() !== today.toDateString()) return false;
        if (filterDue === 'week') {
          const week = new Date(today); week.setDate(today.getDate() + 7);
          if (due < today || due > week) return false;
        }
      }
      return true;
    }),
  }));

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Navbar />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8C9BAB' }}>
        Loading board...
      </div>
    </div>
  );

  return (
    <div className={styles.page} style={{ '--board-bg': board?.background || '#026AA7' }}>
      <Navbar boardTitle={board?.title} boardId={boardId} />

      <div className={styles.boardHeader}>
        <SearchBar
          allLabels={allLabels}
          allMembers={allMembers}
          filterLabel={filterLabel}
          filterMember={filterMember}
          filterDue={filterDue}
          onFilterLabel={setFilterLabel}
          onFilterMember={setFilterMember}
          onFilterDue={setFilterDue}
        />
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
      >
        <div className={styles.listsContainer}>
          {filteredLists.map((list) => (
            <BoardList
              key={list.id}
              list={list}
              allLabels={allLabels}
              allMembers={allMembers}
              onCardClick={setSelectedCardId}
              onCardCreate={handleCardCreate}
              onListUpdate={handleListUpdate}
              onListDelete={handleListDelete}
            />
          ))}
          <AddListButton boardId={boardId} onListCreate={handleListCreate} />
        </div>

        <DragOverlay dropAnimation={DROP_ANIMATION}>
          {activeCard && (
            <CardItem card={activeCard} allLabels={allLabels} allMembers={allMembers} isDragging />
          )}
          {activeList && (
            <div className={styles.listOverlay}>
              <div className={styles.listOverlayHeader}>{activeList.title}</div>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {selectedCardId && (
        <CardModal
          cardId={selectedCardId}
          allLabels={allLabels}
          allMembers={allMembers}
          onClose={() => setSelectedCardId(null)}
          onUpdate={handleCardUpdate}
          onDelete={handleCardDelete}
        />
      )}
    </div>
  );
}

function AddListButton({ boardId, onListCreate }) {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    const { data } = await createList({ board_id: boardId, title: title.trim() });
    onListCreate(data);
    setTitle('');
    setAdding(false);
  };

  if (!adding) {
    return (
      <button className={styles.addListBtn} onClick={() => setAdding(true)}>
        + Add another list
      </button>
    );
  }

  return (
    <div className={styles.addListForm}>
      <form onSubmit={handleSubmit}>
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter list title..."
          maxLength={200}
          onKeyDown={(e) => e.key === 'Escape' && setAdding(false)}
        />
        <div className={styles.addListActions}>
          <button type="submit" className={styles.addListSubmit} disabled={!title.trim()}>
            Add list
          </button>
          <button type="button" onClick={() => setAdding(false)} className={styles.addListCancel}>
            ×
          </button>
        </div>
      </form>
    </div>
  );
}
