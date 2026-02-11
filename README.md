# Chat App

Full-stack real-time chat application with NestJS + MongoDB backend and React + Vite frontend.

## Highlights
- Email login + registration with JWT + refresh tokens
- DM and group chats with roles (admin/member)
- Reactions, replies, forwards, starred messages
- Attachments via DigitalOcean Spaces (S3-compatible)
- Search, read receipts, mute, block, favourite contacts
- Profile + account settings (alternate email verification, change email, delete account)
- Socket.io real-time with Redis adapter
- Redis-backed presence and refresh tokens
- Dockerized backend + frontend

## Project structure
```
/backend
/frontend
/docker-compose.yml
```

## Backend

### Setup
```
cd backend
cp .env.example .env
npm install
npm run start:dev
```

### Env vars
- `PORT`
- `APP_URL`
- `MONGO_URI`
- `REDIS_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `JWT_ACCESS_TTL`
- `JWT_REFRESH_TTL`
- `DO_SPACES_REGION`
- `DO_SPACES_ENDPOINT`
- `DO_SPACES_BUCKET`
- `DO_SPACES_KEY`
- `DO_SPACES_SECRET`
- `MAIL_HOST`
- `MAIL_PORT`
- `MAIL_USER`
- `MAIL_PASS`
- `MAIL_FROM`

### Tests
```
npm run test
```

### Docker
```
docker build -t chat-backend ./backend
```

## Frontend

### Setup
```
cd frontend
npm install
npm run dev
```

### Env vars
Create a `.env` file in `frontend`:
```
VITE_API_URL=http://localhost:4000
```

### Docker
```
docker build -t chat-frontend ./frontend
```

## Docker Compose (local)
```
docker compose up --build
```
Backend: `http://localhost:4000`
Frontend: `http://localhost:8080`

## API overview
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/change-email`
- `POST /auth/delete-account`
- `PATCH /users/profile`
- `POST /users/verify-alt-email`
- `POST /users/block`
- `POST /users/unblock`
- `POST /users/favourites`
- `DELETE /users/favourites`
- `GET /rooms`
- `POST /rooms`
- `POST /rooms/:roomId/members`
- `PATCH /rooms/:roomId/roles`
- `PATCH /rooms/:roomId/mute`
- `PATCH /rooms/:roomId/unmute`
- `POST /messages`
- `GET /messages/:roomId`
- `POST /messages/reactions`
- `POST /messages/search`
- `PATCH /messages/seen`
- `POST /messages/star`
- `POST /messages/unstar`
- `POST /attachments/presign`

## Real-time events
- `message:send` → emits `message:new`
- `message:react` → emits `message:reaction`
- `message:seen` → emits `message:seen`
