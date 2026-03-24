# ⚡ ChatSpace — Real-Time Chat App

Full-stack real-time chat app built with **Node.js + Express + Socket.IO + MongoDB + React**.
Anyone in the world can open your URL and chat — no bots, real humans only.

---

## 🚀 Features

| Feature | Details |
|---|---|
| ✅ Real-time messaging | Socket.IO WebSockets — instant delivery |
| ✅ Public channels | #general, #tech-talk, #random, #music |
| ✅ Private DMs | One-on-one direct messages |
| ✅ Create channels | Any user can create new public rooms |
| ✅ Typing indicators | Live "XYZ is typing..." |
| ✅ Online/Offline status | Real-time presence per user |
| ✅ Message reactions | Emoji react to any message |
| ✅ Edit & Delete | Edit or delete your own messages |
| ✅ Chat history | Stored in MongoDB, loaded on join |
| ✅ JWT Auth | Secure login with tokens |
| ✅ Unlimited users | As many people as you want |

---

## 📁 Project Structure

```
chatapp/
├── server/               ← Node.js + Express + Socket.IO
│   ├── src/
│   │   ├── index.js      ← Entry point
│   │   ├── models/       ← User, Room, Message (Mongoose)
│   │   ├── routes/       ← auth, rooms, messages
│   │   ├── middleware/   ← JWT auth middleware
│   │   └── socket/       ← All Socket.IO event handlers
│   ├── .env.example
│   └── package.json
│
└── client/               ← React + Vite
    ├── src/
    │   ├── pages/        ← AuthPage, ChatPage
    │   ├── components/   ← Sidebar, ChatWindow, MembersPanel
    │   ├── hooks/        ← useSocket.js
    │   └── context/      ← AuthContext.jsx
    ├── .env.example
    └── package.json
```

---

## ⚙️ Setup — Step by Step

### 1. MongoDB Setup (Free)
1. Go to [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas) → Create free account
2. Create a free cluster → Connect → Get your connection string
3. It looks like: `mongodb+srv://user:pass@cluster.mongodb.net/chatapp`

### 2. Server Setup

```bash
cd server
cp .env.example .env
# Edit .env with your MongoDB URI and a JWT secret
npm install
npm run dev        # Development with nodemon
# npm start        # Production
```

Your `.env` should look like:
```
PORT=5000
MONGODB_URI=mongodb+srv://youruser:yourpass@cluster.mongodb.net/chatapp
JWT_SECRET=make_this_long_and_random_abc123xyz
CLIENT_URL=http://localhost:5173
```

### 3. Client Setup

```bash
cd client
cp .env.example .env
# Edit .env — set VITE_API_URL and VITE_SOCKET_URL to your server URL
npm install
npm run dev        # Starts at http://localhost:5173
```

Your `.env` should look like:
```
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

### 4. Open in multiple browsers/tabs
- Open `http://localhost:5173` in **Chrome**
- Open `http://localhost:5173` in **Firefox** (or incognito)
- Register two different accounts → Start chatting! 🎉

---

## 🌍 Deploy (So Anyone Can Access It)

### Deploy Server → Railway (Free)
1. Push server folder to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Add environment variables in Railway dashboard
4. Railway gives you a URL like `https://chatapp-server.up.railway.app`

### Deploy Client → Vercel (Free)
1. Push client folder to GitHub
2. Go to [vercel.com](https://vercel.com) → Import project
3. Set environment variables:
   ```
   VITE_API_URL=https://your-railway-url.up.railway.app
   VITE_SOCKET_URL=https://your-railway-url.up.railway.app
   ```
4. Deploy → Get your URL like `https://chatspace.vercel.app`

### Share that URL with anyone — they can register and chat! 🌍

---

## 🔌 Socket Events Reference

| Event | Direction | Payload |
|---|---|---|
| `message:send` | Client → Server | `{ roomId, text, replyTo? }` |
| `message:new` | Server → Room | Full message object |
| `typing:start` | Client → Server | `{ roomId }` |
| `typing:stop` | Client → Server | `{ roomId }` |
| `typing:start` | Server → Room | `{ userId, username, roomId }` |
| `typing:stop` | Server → Room | `{ userId, roomId }` |
| `users:online` | Server → All | Array of online users |
| `message:react` | Client → Server | `{ messageId, emoji, roomId }` |
| `message:edit` | Client → Server | `{ messageId, text, roomId }` |
| `message:delete` | Client → Server | `{ messageId, roomId }` |
| `rooms:join` | Client → Server | `[roomId, ...]` |

---

## 🛠 Tech Stack

- **Backend**: Node.js, Express, Socket.IO, Mongoose, JWT, bcryptjs
- **Frontend**: React 18, Vite, Axios, socket.io-client
- **Database**: MongoDB Atlas
- **Auth**: JWT (7-day tokens)

---
