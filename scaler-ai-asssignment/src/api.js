import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

// Boards
export const getBoards = () => API.get('/boards');
export const getBoard = (id) => API.get(`/boards/${id}`);
export const createBoard = (data) => API.post('/boards', data);
export const updateBoard = (id, data) => API.patch(`/boards/${id}`, data);
export const deleteBoard = (id) => API.delete(`/boards/${id}`);

// Lists
export const createList = (data) => API.post('/lists', data);
export const updateList = (id, data) => API.patch(`/lists/${id}`, data);
export const deleteList = (id) => API.delete(`/lists/${id}`);
export const reorderLists = (data) => API.post('/lists/reorder', data);

// Cards
export const getCard = (id) => API.get(`/cards/${id}`);
export const createCard = (data) => API.post('/cards', data);
export const updateCard = (id, data) => API.patch(`/cards/${id}`, data);
export const deleteCard = (id) => API.delete(`/cards/${id}`);
export const reorderCards = (data) => API.post('/cards/reorder', data);
export const searchCards = (params) => API.get('/cards/search/query', { params });

// Card Labels
export const addLabelToCard = (cardId, label_id) => API.post(`/cards/${cardId}/labels`, { label_id });
export const removeLabelFromCard = (cardId, labelId) => API.delete(`/cards/${cardId}/labels/${labelId}`);

// Card Members
export const addMemberToCard = (cardId, member_id) => API.post(`/cards/${cardId}/members`, { member_id });
export const removeMemberFromCard = (cardId, memberId) => API.delete(`/cards/${cardId}/members/${memberId}`);

// Checklists
export const addChecklist = (cardId, data) => API.post(`/cards/${cardId}/checklists`, data);
export const deleteChecklist = (cardId, checklistId) => API.delete(`/cards/${cardId}/checklists/${checklistId}`);
export const addChecklistItem = (cardId, checklistId, data) => API.post(`/cards/${cardId}/checklists/${checklistId}/items`, data);
export const updateChecklistItem = (cardId, checklistId, itemId, data) => API.patch(`/cards/${cardId}/checklists/${checklistId}/items/${itemId}`, data);
export const deleteChecklistItem = (cardId, checklistId, itemId) => API.delete(`/cards/${cardId}/checklists/${checklistId}/items/${itemId}`);

// Comments
export const addComment = (cardId, data) => API.post(`/cards/${cardId}/comments`, data);

// Members & Labels
export const getMembers = () => API.get('/members');
export const getLabels = () => API.get('/members/labels');
