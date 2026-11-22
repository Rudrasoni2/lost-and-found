from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from datetime import date, datetime
import uuid
import os
import shutil

from schemas import ItemResponse
from models import Item, ItemImage, User, Match, Notification
from database import get_db, SessionLocal
from auth import get_current_user
from config import UPLOAD_DIR
from ai_module import extract_embedding, find_similar_items
from expert_system import evaluate_match, hybrid_score as compute_hybrid_score

router = APIRouter(prefix="/api/items", tags=["Items"])

def trigger_matching(item_id: int):
    db = SessionLocal()
    try:
        item = db.query(Item).filter(Item.id == item_id).first()
        if not item or not item.images:
            return

        primary_image = next((img for img in item.images if img.is_primary), item.images[0])
        if not primary_image.embedding:
            return

        opposite_type = "found" if item.type == "lost" else "lost"
        
        candidate_images = db.query(ItemImage).join(Item).filter(
            Item.type == opposite_type,
            Item.status == "active",
            ItemImage.embedding.isnot(None)
        ).all()

        candidates = [(img.item_id, img.id, img.embedding) for img in candidate_images]
        matches = find_similar_items(primary_image.embedding, candidates)
        
        for match_item_id, match_image_id, score in matches:
            match_record = Match(
                item1_id=item.id,
                item2_id=match_item_id,
                similarity_score=score
            )
            db.add(match_record)
            
            match_item = db.query(Item).filter(Item.id == match_item_id).first()
            if match_item:
                notif1 = Notification(
                    user_id=item.user_id,
                    type="match_found",
                    message=f"Potential match found for your {item.type} item '{item.name}'.",
                    item_id=item.id,
                    related_item_id=match_item.id
                )
                notif2 = Notification(
                    user_id=match_item.user_id,
                    type="match_found",
                    message=f"Potential match found for your {match_item.type} item '{match_item.name}'.",
                    item_id=match_item.id,
                    related_item_id=item.id
                )
                db.add_all([notif1, notif2])

        db.commit()
    except Exception as e:
        print(f"Error in background matching: {e}")
        db.rollback()
    finally:
        db.close()

@router.post("", response_model=ItemResponse)
@router.post("/", response_model=ItemResponse)
def create_item(
    background_tasks: BackgroundTasks,
    type: str = Form(...),
    name: str = Form(...),
    category: str = Form(...),
    color: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    location: Optional[str] = Form(None),
    date_lost_found: Optional[str] = Form(None),
    images: List[UploadFile] = File(default=[]),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    parsed_date = None
    if date_lost_found and date_lost_found.strip():
        try:
            parsed_date = date.fromisoformat(date_lost_found.strip())
        except (ValueError, TypeError):
            parsed_date = None

    new_item = Item(
        user_id=current_user.id,
        type=type,
        name=name,
        category=category,
        color=color,
        description=description,
        location=location,
        date_lost_found=parsed_date
    )
    db.add(new_item)
    db.commit()
    db.refresh(new_item)

    has_embeddings = False
    valid_images = [img for img in images if img and img.filename and img.filename.strip()]

    for i, file in enumerate(valid_images):
        file_ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
        unique_filename = f"{uuid.uuid4()}.{file_ext}"
        file_path = UPLOAD_DIR / unique_filename

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        try:
            embedding = extract_embedding(str(file_path))
            has_embeddings = True
        except Exception as e:
            print(f"Error extracting embedding for {file_path}: {e}")
            embedding = None

        item_image = ItemImage(
            item_id=new_item.id,
            file_path=str(file_path.relative_to(UPLOAD_DIR.parent)),
            embedding=embedding,
            is_primary=(i == 0)
        )
        db.add(item_image)
    
    db.commit()
    
    if has_embeddings:
        background_tasks.add_task(trigger_matching, new_item.id)
    
    db.refresh(new_item)
    response = ItemResponse.model_validate(new_item)
    response.user_name = current_user.name
    return response

@router.get("", response_model=List[ItemResponse])
@router.get("/", response_model=List[ItemResponse])
def get_items(
    type: Optional[str] = None,
    category: Optional[str] = None,
    color: Optional[str] = None,
    location: Optional[str] = None,
    status: Optional[str] = "active",
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    query = db.query(Item)
    if type:
        query = query.filter(Item.type == type)
    if category:
        query = query.filter(Item.category == category)
    if color:
        query = query.filter(Item.color.ilike(f"%{color}%"))
    if location:
        query = query.filter(Item.location.ilike(f"%{location}%"))
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

@router.get("/my", response_model=List[ItemResponse])
def get_my_items(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    items = db.query(Item).filter(Item.user_id == current_user.id).order_by(Item.created_at.desc()).all()
    results = []
    for item in items:
        resp = ItemResponse.model_validate(item)
        resp.user_name = current_user.name
        results.append(resp)
    return results

@router.get("/{item_id}", response_model=ItemResponse)
def get_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    resp = ItemResponse.model_validate(item)
    resp.user_name = item.user.name
    return resp

from pydantic import BaseModel
class ItemUpdate(BaseModel):
    status: Optional[str] = None

@router.patch("/{item_id}", response_model=ItemResponse)
def update_item(item_id: int, item_update: ItemUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if item.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to update this item")
    
    if item_update.status:
        if item_update.status == "recovered" and item.status != "recovered":
            notif = Notification(
                user_id=item.user_id,
                type="item_recovered",
                message=f"Your item '{item.name}' has been marked as recovered.",
                item_id=item.id
            )
            db.add(notif)
        item.status = item_update.status
    
    db.commit()
    db.refresh(item)
    resp = ItemResponse.model_validate(item)
    resp.user_name = item.user.name
    return resp

@router.delete("/{item_id}")
def delete_item(item_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if item.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to delete this item")
    
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
