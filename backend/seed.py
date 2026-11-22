from database import SessionLocal
from models import User
from auth import hash_password

def seed_admin():
    db = SessionLocal()
    try:
        admin = db.query(User).filter(User.email == "admin@lostandfound.com").first()
        if not admin:
            admin = User(
                name="Admin",
                email="admin@lostandfound.com",
                password_hash=hash_password("admin123"),
                role="admin"
            )
            db.add(admin)
            db.commit()
            print("Admin user created: admin@lostandfound.com / admin123")
        else:
            print("Admin user already exists.")
    finally:
        db.close()
