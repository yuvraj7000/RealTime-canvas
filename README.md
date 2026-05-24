## Canvas Bord

Realtime collaborative whiteboard with drawing tools, image sharing, and room-based syncing.

## Prerequisites

- Node.js 20+ and npm
- A PostgreSQL database (local or hosted)
- Cloudinary account (for image uploads)

## Install

1) Install frontend deps:

```bash
cd frontend
npm install
```

2) Install backend deps:

```bash
cd server
npm install
```

## Environment Variables

Create a `server/.env` file (copy from `server/.env.example`) and set:

```
PORT=4000
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DB"
CLIENT_ORIGIN="http://localhost:3000,http://127.0.0.1:3000"
CLOUDINARY_CLOUD_NAME="your_cloud"
CLOUDINARY_API_KEY="your_key"
CLOUDINARY_API_SECRET="your_secret"
CLOUDINARY_FOLDER="canvas-bord"
```

Optional (frontend): create `frontend/.env.local` if your backend is not on the default port.

```
NEXT_PUBLIC_SERVER_URL="http://localhost:4000"
```

## Run Locally

1) Run database migrations:

```bash
cd server
npm run prisma:migrate
```

2) Start the backend:

```bash
cd server
npm run dev
```

3) Start the frontend:

```bash
cd frontend
npm run dev
```

Open http://localhost:3000

## Required Services

- PostgreSQL (for rooms/shapes persistence)
- Cloudinary (for image uploads)
