import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
UPLOAD_DIR = BASE_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

DATABASE_URL = f"sqlite:///{BASE_DIR / 'lostandfound.db'}"
SECRET_KEY = os.getenv("SECRET_KEY", "super-secret-key-change-in-production-2024")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

CATEGORIES = [
    "Electronics", "Keys", "Wallet/Purse", "Bag/Backpack", "Clothing",
    "Documents/ID", "Jewelry", "Pet", "Phone", "Books", "Accessories", "Other"
]

SIMILARITY_THRESHOLD = 0.55
MAX_MATCHES = 10
