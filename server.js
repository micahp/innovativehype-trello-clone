const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 3000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';
const BOARD_FILE = path.join(__dirname, 'board.json');

const DEFAULT_BOARD = {
  title: "Classic Project Alpha",
  lists: [
    { id: "l1", title: "To Do", cards: [] },
    { id: "l2", title: "In Progress", cards: [] },
    { id: "l3", title: "Code Review", cards: [] },
    { id: "l4", title: "Testing", cards: [] },
    { id: "l5", title: "Done", cards: [] }
  ]
};

// ── Middleware ──
app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json({ limit: '5mb' }));
app.use(morgan('dev'));

// ── Helpers ──
function readBoard() {
  try {
    if (!fs.existsSync(BOARD_FILE)) {
      writeBoard(DEFAULT_BOARD);
      return JSON.parse(JSON.stringify(DEFAULT_BOARD));
    }
    const raw = fs.readFileSync(BOARD_FILE, 'utf8');
    if (!raw.trim()) {
      writeBoard(DEFAULT_BOARD);
      return JSON.parse(JSON.stringify(DEFAULT_BOARD));
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error(`[${new Date().toISOString()}] Board read error:`, e.message);
    // Return default if JSON is corrupt
    return JSON.parse(JSON.stringify(DEFAULT_BOARD));
  }
}

function writeBoard(data) {
  try {
    fs.writeFileSync(BOARD_FILE, JSON.stringify(data, null, 2), { mode: 0o600 });
    return true;
  } catch (e) {
    console.error(`[${new Date().toISOString()}] Board write error:`, e.message);
    return false;
  }
}

function findCard(board, cardId) {
  for (const list of board.lists) {
    const card = list.cards.find(c => c.id === cardId);
    if (card) return { list, card };
  }
  return null;
}

// ── Error format ──
function errorResponse(res, code, statusCode, message) {
  return res.status(statusCode).json({ error: message, code });
}

// ── Routes ──

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// Get full board
app.get('/api/board', (req, res) => {
  const board = readBoard();
  res.json(board);
});

// Save full board
app.put('/api/board', (req, res) => {
  const board = req.body;
  if (!board || typeof board !== 'object') {
    return errorResponse(res, 'INVALID_BODY', 400, 'Request body must be a valid board object');
  }
  if (!Array.isArray(board.lists)) {
    return errorResponse(res, 'INVALID_BODY', 400, 'Board must have a lists array');
  }
  
  const ok = writeBoard(board);
  if (!ok) {
    return errorResponse(res, 'WRITE_FAILED', 500, 'Failed to persist board data');
  }
  res.json({ success: true });
});

// Get single card
app.get('/api/cards/:id', (req, res) => {
  const board = readBoard();
  const result = findCard(board, req.params.id);
  if (!result) {
    return errorResponse(res, 'NOT_FOUND', 404, `Card ${req.params.id} not found`);
  }
  res.json(result.card);
});

// Create card
app.post('/api/cards', (req, res) => {
  const { listId, title } = req.body;
  if (!listId || !title || !title.trim()) {
    return errorResponse(res, 'INVALID_BODY', 400, 'listId and title are required');
  }
  
  const board = readBoard();
  const list = board.lists.find(l => l.id === listId);
  if (!list) {
    return errorResponse(res, 'NOT_FOUND', 404, `List ${listId} not found`);
  }
  
  const card = {
    id: 'c' + Date.now() + Math.random().toString(36).slice(2, 6),
    title: title.trim(),
    description: '',
    labels: [],
    comments: [],
    checklist: []
  };
  list.cards.push(card);
  
  if (!writeBoard(board)) {
    return errorResponse(res, 'WRITE_FAILED', 500, 'Failed to persist card');
  }
  res.status(201).json(card);
});

// Update card
app.put('/api/cards/:id', (req, res) => {
  const board = readBoard();
  const result = findCard(board, req.params.id);
  if (!result) {
    return errorResponse(res, 'NOT_FOUND', 404, `Card ${req.params.id} not found`);
  }
  
  const updates = req.body;
  // Merge allowed fields
  if (updates.title !== undefined) result.card.title = updates.title;
  if (updates.description !== undefined) result.card.description = updates.description;
  if (updates.labels !== undefined) result.card.labels = updates.labels;
  if (updates.comments !== undefined) result.card.comments = updates.comments;
  if (updates.checklist !== undefined) result.card.checklist = updates.checklist;
  
  if (!writeBoard(board)) {
    return errorResponse(res, 'WRITE_FAILED', 500, 'Failed to persist card update');
  }
  res.json(result.card);
});

// Delete card
app.delete('/api/cards/:id', (req, res) => {
  const board = readBoard();
  const result = findCard(board, req.params.id);
  if (!result) {
    return errorResponse(res, 'NOT_FOUND', 404, `Card ${req.params.id} not found`);
  }
  
  result.list.cards = result.list.cards.filter(c => c.id !== req.params.id);
  
  if (!writeBoard(board)) {
    return errorResponse(res, 'WRITE_FAILED', 500, 'Failed to persist card deletion');
  }
  res.status(204).send();
});

// ── Start ──
app.listen(PORT, () => {
  console.log(`Trello Clone API running on http://localhost:${PORT}`);
  console.log(`CORS origin: ${CORS_ORIGIN}`);
  console.log(`Board file: ${BOARD_FILE}`);
  
  // Create initial board if needed
  const board = readBoard();
  console.log(`Loaded board: "${board.title}" with ${board.lists.length} lists`);
});
