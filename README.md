# AI-Based Lost and Found Website

An intelligent Lost & Found platform designed to streamline reporting, searching, and recovering lost items using deep-learning visual similarity.

Built strictly according to the **Software Requirements Specification (SRS)**.

---

## Key Features

1. **AI Image Matching (ResNet-18)**
   - Extracts 512-dimensional visual embeddings on upload using a pretrained ResNet-18 model.
   - Computes L2-normalized cosine similarity against reported items of the opposite classification (`lost` vs. `found`).
   - Automatically ranks and highlights top matching candidates with percentage confidence scores.

2. **Lost & Found Reporting**
   - Detailed item metadata: Name, Category, Color, Location, Date, Description, and Multi-image uploads.
   - Automatic background matching triggers when a new item is posted.

3. **Smart Search & Filters**
   - Filter items by category, lost/found status, date, color, location, and keyword text search.

4. **In-App Messaging & Notifications**
   - Context-aware direct messaging between the item reporter and potential finder/owner.
   - Real-time notification bell with alert counts for match discoveries and messages.

5. **Recovery Tracking**
   - Owners can easily mark items as `Recovered` upon retrieval.

6. **Admin Dashboard**
   - Comprehensive overview of platform statistics (total users, active items, recovered items).
   - Moderate/ban users and delete invalid or inappropriate listings.

---

## Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS, React Router v6, Axios, Lucide React, Sonner (Toasts), Date-fns
- **Backend:** FastAPI, Python 3.10+, SQLAlchemy, Pydantic v2, PyJWT, Bcrypt
- **AI/ML:** PyTorch, TorchVision (ResNet18 Feature Extractor), Pillow, NumPy
- **Database:** SQLite (persisted in `backend/lostandfound.db`)

---

## Directory Structure

```text
lost-and-found/
├── backend/
│   ├── ai_module.py           # ResNet18 model & vector cosine similarity
│   ├── auth.py                # JWT authentication & password hashing
│   ├── config.py              # Application settings & upload directories
│   ├── database.py            # SQLite engine & database sessions
│   ├── main.py                # FastAPI entry point & CORS
│   ├── models.py              # SQLAlchemy models (User, Item, Match, Message, Notification)
│   ├── requirements.txt       # Python dependencies
│   ├── routes/                # Auth, items, matches, messages, notifications, admin
│   ├── schemas.py             # Pydantic validation schemas
│   ├── seed.py                # Seeds default admin account
│   └── uploads/               # Stored item pictures
└── frontend/
    ├── src/
    │   ├── components/        # Navbar, ItemCard, MatchCard, ImageUpload, NotificationBell, etc.
    │   ├── context/           # AuthContext (state & tokens)
    │   ├── pages/             # Home, Login, Register, ReportItem, SearchItems, ItemDetail, Messages, etc.
    │   ├── services/api.js    # Axios client with interceptors
    │   ├── App.jsx            # Routing configuration
    │   └── main.jsx
    ├── package.json
    ├── tailwind.config.js
    └── vite.config.js         # Proxy configuration for backend API & uploads
```

---

## Quickstart Guide

### 1. Prerequisites
- Python 3.10+
- Node.js 18+ & npm

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate   # On Windows
# source venv/bin/activate # On macOS/Linux

# Install PyTorch CPU-only
pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu

# Install remaining dependencies
pip install -r requirements.txt

# Run backend server
python main.py
```
*The backend runs at `http://localhost:8000`. On first launch, tables and the default administrator account are automatically created.*

**Default Admin Credentials:**
- **Email:** `admin@lostandfound.com`
- **Password:** `admin123`

---

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run Vite dev server
npm run dev
```
*The frontend runs at `http://localhost:3000` (proxies `/api` and `/uploads` requests directly to `http://localhost:8000`).*
