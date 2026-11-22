from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc, func
from typing import List, Optional

from schemas import MessageCreate, MessageResponse, ConversationResponse
from models import Message, User, Notification
from database import get_db
from auth import get_current_user

router = APIRouter(prefix="/api/messages", tags=["Messages"])

@router.post("", response_model=MessageResponse)
@router.post("/", response_model=MessageResponse)
def create_message(message_in: MessageCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if message_in.receiver_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot send message to yourself")
        
    new_message = Message(
        sender_id=current_user.id,
        receiver_id=message_in.receiver_id,
        content=message_in.content,
        item_id=message_in.item_id
    )
    db.add(new_message)
    
    notif = Notification(
        user_id=message_in.receiver_id,
        type="message_received",
        message=f"You have a new message from {current_user.name}.",
        item_id=message_in.item_id
    )
    db.add(notif)
    
    db.commit()
    db.refresh(new_message)
    
    resp = MessageResponse.model_validate(new_message)
    resp.sender_name = current_user.name
    resp.receiver_name = new_message.receiver.name
    return resp

@router.get("/conversations", response_model=List[ConversationResponse])
def get_conversations(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Simple conversation extraction logic for SQLite
    messages = db.query(Message).filter(
        or_(Message.sender_id == current_user.id, Message.receiver_id == current_user.id)
    ).order_by(desc(Message.created_at)).all()
    
    conversations = {}
    for msg in messages:
        other_user_id = msg.receiver_id if msg.sender_id == current_user.id else msg.sender_id
        if other_user_id not in conversations:
            other_user = db.query(User).filter(User.id == other_user_id).first()
            if not other_user: continue
            conversations[other_user_id] = {
                "user_id": other_user_id,
                "user_name": other_user.name,
                "last_message": msg.content,
                "last_message_time": msg.created_at,
                "unread_count": 0,
                "item_id": msg.item_id
            }
        
        if msg.receiver_id == current_user.id and not msg.is_read:
            conversations[other_user_id]["unread_count"] += 1
            
    return list(conversations.values())

@router.get("/conversation/{user_id}", response_model=List[MessageResponse])
def get_conversation(user_id: int, item_id: Optional[int] = None, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    query = db.query(Message).filter(
        or_(
            and_(Message.sender_id == current_user.id, Message.receiver_id == user_id),
            and_(Message.sender_id == user_id, Message.receiver_id == current_user.id)
        )
    )
    messages = query.order_by(Message.created_at.asc()).all()
    
    results = []
    for msg in messages:
        if msg.receiver_id == current_user.id and not msg.is_read:
            msg.is_read = True
        resp = MessageResponse.model_validate(msg)
        resp.sender_name = msg.sender.name
        resp.receiver_name = msg.receiver.name
        results.append(resp)
        
    db.commit()
    return results
