from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from schemas import MatchResponse, ItemResponse
from models import Item, ItemImage, User, Match, Notification
from database import get_db
from auth import get_current_user
from ai_module import find_similar_items
from expert_system import evaluate_match, hybrid_score

router = APIRouter(prefix="/api/items", tags=["Matches"])


def _item_to_attrs(item: Item) -> dict:
    """Convert an Item ORM model to a dict of attributes for the expert system."""
    return {
        "name": item.name or "",
        "category": item.category or "",
        "color": item.color,
        "description": item.description,
        "location": item.location,
        "date_lost_found": item.date_lost_found,
    }


def _build_match_result(item: Item, candidate: Item, ai_score: float) -> dict:
    """Build a single match result with both AI and expert system scores."""
    item_attrs = _item_to_attrs(item)
    candidate_attrs = _item_to_attrs(candidate)

    # Run expert system evaluation
    es_result = evaluate_match(item_attrs, candidate_attrs)

    # Compute hybrid score
    combined = hybrid_score(ai_score, es_result["expert_score"])

    item_resp = ItemResponse.model_validate(candidate)
    item_resp.user_name = candidate.user.name

    return {
        "item": item_resp,
        "similarity_score": ai_score,
        "expert_system": es_result,
        "hybrid_score": combined,
    }


@router.get("/{item_id}/matches", response_model=List[MatchResponse])
def get_item_matches(item_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    if not item.images:
        return []

    primary_image = next((img for img in item.images if img.is_primary), item.images[0])
    if not primary_image.embedding:
        return []

    opposite_type = "found" if item.type == "lost" else "lost"
    
    candidate_images = db.query(ItemImage).join(Item).filter(
        Item.type == opposite_type,
        Item.status == "active",
        ItemImage.embedding.isnot(None)
    ).all()

    candidates = [(img.item_id, img.id, img.embedding) for img in candidate_images]
    matches = find_similar_items(primary_image.embedding, candidates)
    
    results = []
    seen_item_ids = set()
    for match_item_id, _, ai_score in matches:
        if match_item_id in seen_item_ids:
            continue
        seen_item_ids.add(match_item_id)
        match_item = db.query(Item).filter(Item.id == match_item_id).first()
        if match_item:
            result = _build_match_result(item, match_item, ai_score)
            results.append(result)

    # Sort by hybrid score (descending)
    results.sort(key=lambda r: r["hybrid_score"], reverse=True)
    return results


@router.post("/{item_id}/find-matches", response_model=List[MatchResponse])
def find_item_matches(item_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    if item.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    db.query(Match).filter((Match.item1_id == item.id) | (Match.item2_id == item.id)).delete()
    
    if not item.images:
        return []

    primary_image = next((img for img in item.images if img.is_primary), item.images[0])
    if not primary_image.embedding:
        return []

    opposite_type = "found" if item.type == "lost" else "lost"
    
    candidate_images = db.query(ItemImage).join(Item).filter(
        Item.type == opposite_type,
        Item.status == "active",
        ItemImage.embedding.isnot(None)
    ).all()

    candidates = [(img.item_id, img.id, img.embedding) for img in candidate_images]
    matches = find_similar_items(primary_image.embedding, candidates)
    
    results = []
    seen_item_ids = set()
    for match_item_id, match_image_id, ai_score in matches:
        if match_item_id in seen_item_ids:
            continue
        seen_item_ids.add(match_item_id)

        match_record = Match(item1_id=item.id, item2_id=match_item_id, similarity_score=ai_score)
        db.add(match_record)
        
        match_item = db.query(Item).filter(Item.id == match_item_id).first()
        if match_item:
            notif = Notification(
                user_id=match_item.user_id,
                type="match_found",
                message=f"Potential match found for your {match_item.type} item '{match_item.name}'.",
                item_id=match_item.id,
                related_item_id=item.id
            )
            db.add(notif)
            
            result = _build_match_result(item, match_item, ai_score)
            results.append(result)
            
    db.commit()
    # Sort by hybrid score (descending)
    results.sort(key=lambda r: r["hybrid_score"], reverse=True)
    return results


# ── Expert System Only Endpoint (no image required) ──

@router.get("/{item_id}/expert-matches")
def get_expert_matches(
    item_id: int,
    threshold: float = 0.15,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Find matches using ONLY the expert system (rule-based).
    Useful when items don't have images uploaded.
    """
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    opposite_type = "found" if item.type == "lost" else "lost"
    candidates = db.query(Item).filter(
        Item.type == opposite_type,
        Item.status == "active"
    ).all()

    item_attrs = _item_to_attrs(item)
    results = []

    for candidate in candidates:
        candidate_attrs = _item_to_attrs(candidate)
        es_result = evaluate_match(item_attrs, candidate_attrs)

        if es_result["expert_score"] >= threshold:
            item_resp = ItemResponse.model_validate(candidate)
            item_resp.user_name = candidate.user.name
            results.append({
                "item": item_resp,
                "similarity_score": 0.0,  # No AI score
                "expert_system": es_result,
                "hybrid_score": es_result["expert_score"],
            })

    results.sort(key=lambda r: r["hybrid_score"], reverse=True)
    return results[:10]
