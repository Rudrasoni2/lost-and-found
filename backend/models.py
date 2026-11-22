from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Date, ForeignKey, Float, LargeBinary
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), default="user")
    phone = Column(String(20), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    items = relationship("Item", back_populates="user")
    sent_messages = relationship("Message", foreign_keys="Message.sender_id", back_populates="sender")
    received_messages = relationship("Message", foreign_keys="Message.receiver_id", back_populates="receiver")
    notifications = relationship("Notification", back_populates="user")

class Item(Base):
    __tablename__ = "items"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    type = Column(String(10), nullable=False)
    name = Column(String(200), nullable=False)
    category = Column(String(50), nullable=False)
    color = Column(String(50), nullable=True)
    description = Column(Text, nullable=True)
    location = Column(String(200), nullable=True)
    date_lost_found = Column(Date, nullable=True)
    status = Column(String(20), default="active")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="items")
    images = relationship("ItemImage", back_populates="item", cascade="all, delete-orphan")
    matches_as_item1 = relationship("Match", foreign_keys="Match.item1_id", back_populates="item1")
    matches_as_item2 = relationship("Match", foreign_keys="Match.item2_id", back_populates="item2")
    messages = relationship("Message", back_populates="item")
    notifications = relationship("Notification", back_populates="item")

class ItemImage(Base):
    __tablename__ = "item_images"

    id = Column(Integer, primary_key=True, autoincrement=True)
    item_id = Column(Integer, ForeignKey("items.id", ondelete="CASCADE"), nullable=False)
    file_path = Column(String(500), nullable=False)
    embedding = Column(LargeBinary, nullable=True)
    is_primary = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    item = relationship("Item", back_populates="images")

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, autoincrement=True)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    receiver_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    item_id = Column(Integer, ForeignKey("items.id"), nullable=True)
    content = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    sender = relationship("User", foreign_keys=[sender_id], back_populates="sent_messages")
    receiver = relationship("User", foreign_keys=[receiver_id], back_populates="received_messages")
    item = relationship("Item", back_populates="messages")

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    type = Column(String(50), nullable=False)
    message = Column(Text, nullable=False)
    item_id = Column(Integer, ForeignKey("items.id"), nullable=True)
    related_item_id = Column(Integer, nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="notifications")
    item = relationship("Item", back_populates="notifications")

class Match(Base):
    __tablename__ = "matches"

    id = Column(Integer, primary_key=True, autoincrement=True)
    item1_id = Column(Integer, ForeignKey("items.id"), nullable=False)
    item2_id = Column(Integer, ForeignKey("items.id"), nullable=False)
    similarity_score = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    item1 = relationship("Item", foreign_keys=[item1_id], back_populates="matches_as_item1")
    item2 = relationship("Item", foreign_keys=[item2_id], back_populates="matches_as_item2")
