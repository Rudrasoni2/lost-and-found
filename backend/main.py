import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from database import Base, engine
from config import UPLOAD_DIR
from seed import seed_admin

from routes import (
    auth_routes,
    item_routes,
    match_routes,
    message_routes,
    notification_routes,
    admin_routes
)

app = FastAPI(
    title="Lost & Found AI",
    description="Backend for AI-Based Lost and Found Website",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

app.include_router(auth_routes.router)
app.include_router(item_routes.router)
app.include_router(match_routes.router)
app.include_router(message_routes.router)
app.include_router(notification_routes.router)
app.include_router(admin_routes.router)

@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    seed_admin()

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
