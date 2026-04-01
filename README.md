# 🕊️ Kabootar — P2P Intercity Delivery Platform

Kabootar connects **travelers** carrying spare luggage capacity with **senders** who need parcels delivered between cities.

---

## 📁 Folder Structure

```
kabootar/
├── frontend/                 # React + Vite + Tailwind
│   ├── src/
│   │   ├── pages/           # LoginPage, Dashboard, TripsPage, ParcelsPage, ChatPage...
│   │   ├── components/      # TripCard, ParcelCard, Modals, etc.
│   │   ├── context/         # AuthContext (global user state)
│   │   ├── lib/             # api.js (axios), firebase.js, socket.js
│   │   └── index.css        # Tailwind + custom styles
│   ├── .env.example
│   └── vite.config.js
│
└── backend/                  # Node.js + Express + MongoDB
    ├── src/
    │   ├── models/          # User, Trip, Parcel, Message
    │   ├── routes/          # auth, trips, parcels, match, chat
    │   ├── middleware/      # auth.js (JWT protect)
    │   └── config/          # db.js, socket.js, firebase.js
    ├── .env.example
    └── render.yaml
```

---

## ⚡ Quick Start

### 1. Clone & Install

```bash
git clone <your-repo>
cd kabootar

# Backend
cd backend
npm install
cp .env.example .env   # fill in your values

# Frontend
cd ../frontend
npm install
cp .env.example .env   # fill in your values
```

### 2. Set Up MongoDB
- Create a free cluster at [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas)
- Get your connection string and paste into `backend/.env` as `MONGO_URI`

### 3. Set Up Firebase
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project
3. Enable **Phone Authentication** under Authentication → Sign-in methods
4. Add your domain to Authorized Domains
5. Go to Project Settings → Service Accounts → Generate new private key
6. Paste the JSON as `FIREBASE_SERVICE_ACCOUNT` in `backend/.env`
7. Copy web app config values to `frontend/.env`

### 4. Run Locally

```bash
# Terminal 1 — Backend
cd backend
npm run dev

# Terminal 2 — Frontend
cd frontend
npm run dev
```

Frontend: http://localhost:5173
Backend:  http://localhost:5000

---

## 🌐 Deployment

### Backend → Render

1. Push to GitHub
2. Go to [render.com](https://render.com) → New Web Service
3. Connect your repo, select `backend/` as root
4. Set build command: `npm install`
5. Set start command: `npm start`
6. Add all env variables from `backend/.env.example`

### Frontend → Vercel

1. Go to [vercel.com](https://vercel.com) → New Project
2. Import your repo, set **Root Directory** to `frontend`
3. Framework: Vite
4. Add env variables from `frontend/.env.example`
5. Set `VITE_API_URL` to your Render backend URL (e.g. `https://kabootar-api.onrender.com/api`)
6. Set `VITE_SOCKET_URL` to `https://kabootar-api.onrender.com`

---

## 🔌 API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/verify` | — | Firebase OTP → JWT |
| GET | `/api/auth/me` | ✓ | Current user |
| POST | `/api/auth/rate/:userId` | ✓ | Rate a user |
| GET | `/api/trips` | — | List trips (filter: from, to, date) |
| POST | `/api/trips` | ✓ | Create trip |
| DELETE | `/api/trips/:id` | ✓ | Delete own trip |
| GET | `/api/parcels` | — | List parcel requests |
| POST | `/api/parcels` | ✓ | Create parcel request |
| DELETE | `/api/parcels/:id` | ✓ | Delete own parcel |
| GET | `/api/match/parcel/:id` | ✓ | Find matching trips for a parcel |
| GET | `/api/match/trip/:id` | ✓ | Find matching parcels for a trip |
| GET | `/api/chat/conversations` | ✓ | Get all conversations |
| GET | `/api/chat/:userId` | ✓ | Get messages with a user |
| POST | `/api/chat/:userId` | ✓ | Send message (REST fallback) |

---

## 🔴 Socket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `register` | Client → Server | Register user on connect |
| `join_room` | Client → Server | Join a chat room |
| `send_message` | Client → Server | Send a message |
| `receive_message` | Server → Client | Broadcast message to room |

---

## 🛠️ Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, Vite, Tailwind CSS v3 |
| Backend | Node.js, Express 4 |
| Database | MongoDB + Mongoose |
| Auth | Firebase Phone OTP + JWT |
| Realtime | Socket.io |
| Hosting | Vercel (frontend) + Render (backend) |

---

## 🗺️ Roadmap (Post-MVP)

- [ ] Push notifications (FCM)
- [ ] Escrow payment (Razorpay)
- [ ] Parcel tracking with status updates
- [ ] ID verification / KYC
- [ ] Group delivery requests
- [ ] PWA support

---

Made with ♥ for the Indian traveler ecosystem.
