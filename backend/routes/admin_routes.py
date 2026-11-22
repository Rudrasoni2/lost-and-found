from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from pydantic import BaseModel
import os

from schemas import UserResponse, ItemResponse, StatsResponse
from models import User, Item
from database import get_db
from auth import get_admin_user
from config import UPLOAD_DIR

router = APIRouter(prefix="/api/admin", tags=["Admin"])

@router.get("/stats", response_model=StatsResponse)
def get_stats(admin_user: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    total_users = db.query(User).count()
    total_items = db.query(Item).count()
    lost_items = db.query(Item).filter(Item.type == "lost").count()
    found_items = db.query(Item).filter(Item.type == "found").count()
    recovered_items = db.query(Item).filter(Item.status == "recovered").count()
    active_items = db.query(Item).filter(Item.status == "active").count()
    
    return StatsResponse(
        total_users=total_users,
        total_items=total_items,
        lost_items=lost_items,
        found_items=found_items,
        recovered_items=recovered_items,
        active_items=active_items
    )

@router.get("/users", response_model=List[UserResponse])
def get_users(search: Optional[str] = None, skip: int = 0, limit: int = 50, admin_user: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    query = db.query(User)
    if search:
        query = query.filter(or_(User.name.ilike(f"%{search}%"), User.email.ilike(f"%{search}%")))
    users = query.offset(skip).limit(limit).all()
    return users

class UserAdminUpdate(BaseModel):
    role: Optional[str] = None
    is_active: Optional[bool] = None

@router.patch("/users/{user_id}", response_model=UserResponse)
def update_user(user_id: int, user_update: UserAdminUpdate, admin_user: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user_update.role is not None:
        user.role = user_update.role
    if user_update.is_active is not None:
        user.is_active = user_update.is_active
        
    db.commit()
    db.refresh(user)
    return user

@router.delete("/users/{user_id}")
def delete_user(user_id: int, admin_user: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == admin_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
        
    db.delete(user)
    db.commit()
    return {"message": "User deleted successfully"}

@router.get("/items", response_model=List[ItemResponse])
def get_items(
    type: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    query = db.query(Item)
    if type:
        query = query.filter(Item.type == type)
    if status:
        query = query.filter(Item.status == status)
    if search:
        query = query.filter(or_(Item.name.ilike(f"%{search}%"), Item.description.ilike(f"%{search}%")))
    
    items = query.order_by(Item.created_at.desc()).offset(skip).limit(limit).all()
    results = []
    for item in items:
        resp = ItemResponse.model_validate(item)
        resp.user_name = item.user.name
        results.append(resp)
    return results

@router.delete("/items/{item_id}")
def delete_item_admin(item_id: int, admin_user: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
        
    for img in item.images:
        try:
            full_path = UPLOAD_DIR.parent / img.file_path
            if full_path.exists():
                os.remove(full_path)
        except Exception:
            pass
            
    db.delete(item)
    db.commit()
    return {"message": "Item deleted successfully"}
