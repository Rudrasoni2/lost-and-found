from pydantic import BaseModel, ConfigDict, EmailStr, Field
from datetime import datetime, date
from typing import Optional, List

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(min_length=6)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str
    phone: Optional[str] = None
    is_active: bool
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class ItemImageResponse(BaseModel):
    id: int
    file_path: str
    is_primary: bool
    model_config = ConfigDict(from_attributes=True)

class ItemResponse(BaseModel):
    id: int
    user_id: int
    type: str
    name: str
    category: str
    color: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    date_lost_found: Optional[date] = None
    status: str
    created_at: datetime
    updated_at: datetime
    images: List[ItemImageResponse] = []
    user_name: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class RuleFired(BaseModel):
    rule_id: str
    rule_name: str
    description: str
    score_contribution: int
    confidence: str

class ExpertExplanation(BaseModel):
    summary: str
    confidence_level: str
    reasons: List[str]
    suggestion: str

class ExpertSystemResult(BaseModel):
    expert_score: float
    fired_rules: List[RuleFired]
    explanation: ExpertExplanation
    working_memory: dict

class MatchResponse(BaseModel):
    item: ItemResponse
    similarity_score: float
    expert_system: Optional[ExpertSystemResult] = None
    hybrid_score: Optional[float] = None

class MessageCreate(BaseModel):
    receiver_id: int
    content: str
    item_id: Optional[int] = None

class MessageResponse(BaseModel):
    id: int
    sender_id: int
    sender_name: Optional[str] = None
    receiver_id: int
    receiver_name: Optional[str] = None
    item_id: Optional[int] = None
    content: str
    is_read: bool
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class NotificationResponse(BaseModel):
    id: int
    type: str
    message: str
    item_id: Optional[int] = None
    related_item_id: Optional[int] = None
    is_read: bool
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class ConversationResponse(BaseModel):
    user_id: int
    user_name: str
    last_message: str
    last_message_time: datetime
    unread_count: int
    item_id: Optional[int] = None

class StatsResponse(BaseModel):
    total_users: int
    total_items: int
    lost_items: int
    found_items: int
    recovered_items: int
    active_items: int
