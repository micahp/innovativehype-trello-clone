# Trello Clone — 2018 Style

A 2018-Trello-style project management board. Single HTML file + Express backend.

## Quick Start (No Install)

Open `trello_clone.html` in your browser. That's it. The board works entirely offline with localStorage.

## With Backend (Optional)

```bash
npm install
npm start
```

Then open `trello_clone.html` — it auto-syncs to `http://localhost:3000`.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/board` | Full board state |
| PUT | `/api/board` | Save full board state |
| GET | `/api/cards/:id` | Get single card |
| POST | `/api/cards` | Create card (body: `{listId, title}`) |
| PUT | `/api/cards/:id` | Update card |
| DELETE | `/api/cards/:id` | Delete card |

### Error Format

All errors return: `{"error": "message", "code": "ERROR_CODE"}`

## Features

- 5 Trello-style lists with drag-and-drop
- Editable card titles, descriptions, labels, comments, checklists
- localStorage persistence (works offline)
- Backend sync via REST API (debounced, 2s)
- Card search/filter
- Add/delete lists
- Board title editing

## Production

For production, use a process manager:

```bash
npm install -g pm2
pm2 start server.js
pm2 save
```

## Config

| Env Var | Default | Description |
|---------|---------|-------------|
| PORT | 3000 | Server port |
| CORS_ORIGIN | http://localhost:3000 | Allowed CORS origin |
