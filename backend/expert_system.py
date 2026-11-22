"""
Expert System Module for Lost & Found Item Matching
=====================================================

This module implements a rule-based Expert System with:
1. Knowledge Base   — IF-THEN rules derived from domain expertise
2. Inference Engine — Forward-chaining evaluation over item attributes
3. Working Memory   — Stores facts extracted from items being compared
4. Explanation Facility — Traces which rules fired and why

The expert system works alongside the existing AI (CNN) image matching
to provide a hybrid matching approach.
"""

from datetime import date, timedelta
from typing import List, Dict, Any, Optional, Tuple
import re
from difflib import SequenceMatcher


# ═══════════════════════════════════════════════════════════════════
# 1. KNOWLEDGE BASE — Domain rules for lost-found item matching
# ═══════════════════════════════════════════════════════════════════

RULES = [
    # ── Category Rules ──
    {
        "id": "R1",
        "name": "Exact Category Match",
        "description": "Both items belong to the same category",
        "priority": 1,
        "condition": lambda facts: facts["category_match"] == "exact",
        "action": {"score": 25, "confidence": "high"},
    },
    {
        "id": "R2",
        "name": "Related Category Match",
        "description": "Items belong to related categories (e.g., Electronics & Gadgets)",
        "priority": 2,
        "condition": lambda facts: facts["category_match"] == "related",
        "action": {"score": 12, "confidence": "medium"},
    },

    # ── Color Rules ──
    {
        "id": "R3",
        "name": "Exact Color Match",
        "description": "Both items have the same color",
        "priority": 1,
        "condition": lambda facts: facts["color_match"] == "exact",
        "action": {"score": 15, "confidence": "high"},
    },
    {
        "id": "R4",
        "name": "Similar Color Match",
        "description": "Items have similar colors (e.g., dark blue & navy)",
        "priority": 2,
        "condition": lambda facts: facts["color_match"] == "similar",
        "action": {"score": 8, "confidence": "medium"},
    },

    # ── Location Rules ──
    {
        "id": "R5",
        "name": "Same Location",
        "description": "Both items reported at the same location",
        "priority": 1,
        "condition": lambda facts: facts["location_match"] == "exact",
        "action": {"score": 20, "confidence": "high"},
    },
    {
        "id": "R6",
        "name": "Nearby Location",
        "description": "Items reported at nearby or related locations",
        "priority": 2,
        "condition": lambda facts: facts["location_match"] == "partial",
        "action": {"score": 10, "confidence": "medium"},
    },

    # ── Date / Time Proximity Rules ──
    {
        "id": "R7",
        "name": "Same Day Report",
        "description": "Items were lost and found on the same day",
        "priority": 1,
        "condition": lambda facts: facts["date_proximity"] == "same_day",
        "action": {"score": 15, "confidence": "high"},
    },
    {
        "id": "R8",
        "name": "Within One Week",
        "description": "Items were lost and found within 7 days of each other",
        "priority": 2,
        "condition": lambda facts: facts["date_proximity"] == "within_week",
        "action": {"score": 10, "confidence": "medium"},
    },
    {
        "id": "R9",
        "name": "Within One Month",
        "description": "Items were lost and found within 30 days of each other",
        "priority": 3,
        "condition": lambda facts: facts["date_proximity"] == "within_month",
        "action": {"score": 5, "confidence": "low"},
    },

    # ── Name / Title Similarity Rules ──
    {
        "id": "R10",
        "name": "High Name Similarity",
        "description": "Item names are highly similar (>80% match)",
        "priority": 1,
        "condition": lambda facts: facts["name_similarity"] >= 0.8,
        "action": {"score": 15, "confidence": "high"},
    },
    {
        "id": "R11",
        "name": "Moderate Name Similarity",
        "description": "Item names are moderately similar (50-80% match)",
        "priority": 2,
        "condition": lambda facts: 0.5 <= facts["name_similarity"] < 0.8,
        "action": {"score": 8, "confidence": "medium"},
    },

    # ── Description Keyword Matching Rules ──
    {
        "id": "R12",
        "name": "Strong Description Match",
        "description": "Multiple significant keywords match between descriptions",
        "priority": 1,
        "condition": lambda facts: facts["description_keyword_overlap"] >= 3,
        "action": {"score": 12, "confidence": "high"},
    },
    {
        "id": "R13",
        "name": "Partial Description Match",
        "description": "Some keywords match between descriptions",
        "priority": 2,
        "condition": lambda facts: 1 <= facts["description_keyword_overlap"] < 3,
        "action": {"score": 5, "confidence": "medium"},
    },

    # ── Compound / Composite Rules ──
    {
        "id": "R14",
        "name": "Strong Multi-Attribute Match",
        "description": "Category, color, AND location all match — very likely the same item",
        "priority": 0,
        "condition": lambda facts: (
            facts["category_match"] == "exact"
            and facts["color_match"] in ("exact", "similar")
            and facts["location_match"] in ("exact", "partial")
        ),
        "action": {"score": 15, "confidence": "very_high"},
    },
    {
        "id": "R15",
        "name": "Category + Time Match",
        "description": "Same category and found within a week of being lost",
        "priority": 1,
        "condition": lambda facts: (
            facts["category_match"] == "exact"
            and facts["date_proximity"] in ("same_day", "within_week")
        ),
        "action": {"score": 10, "confidence": "high"},
    },
    {
        "id": "R16",
        "name": "Name + Location Match",
        "description": "Similar names and same or nearby location",
        "priority": 1,
        "condition": lambda facts: (
            facts["name_similarity"] >= 0.5
            and facts["location_match"] in ("exact", "partial")
        ),
        "action": {"score": 10, "confidence": "high"},
    },
]


# ═══════════════════════════════════════════════════════════════════
# 2. HELPER FUNCTIONS — Fact Extraction
# ═══════════════════════════════════════════════════════════════════

# Related category groups — categories in the same group are "related"
RELATED_CATEGORIES = [
    {"electronics", "gadgets", "phones", "laptops", "computers", "tablets", "tech"},
    {"bags", "backpacks", "purses", "luggage", "wallets", "handbags"},
    {"clothing", "clothes", "accessories", "apparel", "shoes", "footwear"},
    {"documents", "ids", "cards", "paperwork", "licenses", "passports"},
    {"keys", "keychains", "access cards"},
    {"jewelry", "watches", "accessories", "rings", "necklaces"},
    {"books", "notebooks", "stationery"},
    {"pets", "animals"},
    {"sports", "fitness", "gym equipment"},
    {"musical instruments", "instruments", "music"},
]

# Color synonyms — colors that should be considered "similar"
COLOR_SYNONYMS = {
    "black": {"dark", "charcoal", "ebony", "midnight", "jet"},
    "white": {"cream", "ivory", "pearl", "snow", "off-white", "beige"},
    "red": {"crimson", "scarlet", "maroon", "burgundy", "ruby", "cherry"},
    "blue": {"navy", "cobalt", "azure", "sky blue", "teal", "royal blue", "dark blue", "light blue"},
    "green": {"olive", "lime", "emerald", "forest green", "mint", "sage", "dark green"},
    "yellow": {"gold", "golden", "amber", "mustard", "lemon"},
    "brown": {"tan", "chocolate", "coffee", "mocha", "caramel", "khaki", "bronze"},
    "gray": {"grey", "silver", "slate", "charcoal", "ash", "gunmetal"},
    "pink": {"rose", "magenta", "salmon", "blush", "fuchsia", "hot pink"},
    "purple": {"violet", "lavender", "plum", "lilac", "mauve", "indigo"},
    "orange": {"tangerine", "coral", "peach", "rust", "copper"},
}

# Common stop words to ignore in description keyword analysis
STOP_WORDS = {
    "the", "a", "an", "is", "it", "in", "on", "at", "to", "for", "of", "and",
    "or", "my", "i", "was", "were", "be", "been", "has", "have", "had", "this",
    "that", "with", "from", "but", "not", "are", "its", "very", "so", "just",
    "about", "can", "will", "do", "did", "if", "me", "we", "our", "you", "your",
    "some", "any", "all", "no", "there", "here", "how", "what", "when", "where",
    "which", "who", "also", "than", "then", "them", "those", "these", "each",
    "would", "could", "should", "may", "might", "much", "many", "other",
    "item", "lost", "found", "please", "help", "looking", "anyone", "seen",
}


def _normalize(text: Optional[str]) -> str:
    """Lowercase and strip whitespace."""
    if not text:
        return ""
    return text.strip().lower()


def _extract_keywords(text: Optional[str]) -> set:
    """Extract meaningful keywords from text, removing stop words."""
    if not text:
        return set()
    words = set(re.findall(r'[a-z]+', text.lower()))
    return words - STOP_WORDS


def _compare_categories(cat1: str, cat2: str) -> str:
    """Compare two categories and return 'exact', 'related', or 'none'."""
    c1 = _normalize(cat1)
    c2 = _normalize(cat2)

    if not c1 or not c2:
        return "none"

    if c1 == c2:
        return "exact"

    for group in RELATED_CATEGORIES:
        if c1 in group and c2 in group:
            return "related"

    return "none"


def _compare_colors(color1: Optional[str], color2: Optional[str]) -> str:
    """Compare two colors and return 'exact', 'similar', or 'none'."""
    c1 = _normalize(color1)
    c2 = _normalize(color2)

    if not c1 or not c2:
        return "none"

    if c1 == c2:
        return "exact"

    # Check if one color is a synonym of the other
    for primary, synonyms in COLOR_SYNONYMS.items():
        all_names = synonyms | {primary}
        if c1 in all_names and c2 in all_names:
            return "similar"

    # Check partial containment (e.g., "dark blue" vs "blue")
    if c1 in c2 or c2 in c1:
        return "similar"

    return "none"


def _compare_locations(loc1: Optional[str], loc2: Optional[str]) -> str:
    """Compare two locations and return 'exact', 'partial', or 'none'."""
    l1 = _normalize(loc1)
    l2 = _normalize(loc2)

    if not l1 or not l2:
        return "none"

    if l1 == l2:
        return "exact"

    # Partial match: one location is a substring, or they share significant words
    if l1 in l2 or l2 in l1:
        return "partial"

    words1 = set(re.findall(r'[a-z]+', l1)) - {"near", "by", "at", "in", "on", "the", "of", "and"}
    words2 = set(re.findall(r'[a-z]+', l2)) - {"near", "by", "at", "in", "on", "the", "of", "and"}

    if words1 and words2:
        overlap = len(words1 & words2)
        total = min(len(words1), len(words2))
        if total > 0 and overlap / total >= 0.5:
            return "partial"

    return "none"


def _compare_dates(date1: Optional[date], date2: Optional[date]) -> str:
    """Compare two dates and return proximity level."""
    if date1 is None or date2 is None:
        return "unknown"

    diff = abs((date1 - date2).days)

    if diff == 0:
        return "same_day"
    elif diff <= 7:
        return "within_week"
    elif diff <= 30:
        return "within_month"
    else:
        return "distant"


def _compare_names(name1: str, name2: str) -> float:
    """Return string similarity ratio between two names (0.0 to 1.0)."""
    n1 = _normalize(name1)
    n2 = _normalize(name2)
    if not n1 or not n2:
        return 0.0
    return SequenceMatcher(None, n1, n2).ratio()


def _count_description_overlap(desc1: Optional[str], desc2: Optional[str]) -> int:
    """Count the number of meaningful keyword overlaps between two descriptions."""
    kw1 = _extract_keywords(desc1)
    kw2 = _extract_keywords(desc2)
    return len(kw1 & kw2)


# ═══════════════════════════════════════════════════════════════════
# 3. WORKING MEMORY — Extracts and stores facts from two items
# ═══════════════════════════════════════════════════════════════════

def build_working_memory(item1: dict, item2: dict) -> dict:
    """
    Extract and compute all facts needed for rule evaluation.

    Parameters:
        item1: The source (query) item attributes
        item2: The candidate item attributes

    Returns:
        A dictionary of computed facts (the "Working Memory")
    """
    facts = {
        # Raw attributes for reference
        "item1_name": item1.get("name", ""),
        "item2_name": item2.get("name", ""),
        "item1_category": item1.get("category", ""),
        "item2_category": item2.get("category", ""),
        "item1_color": item1.get("color"),
        "item2_color": item2.get("color"),
        "item1_location": item1.get("location"),
        "item2_location": item2.get("location"),
        "item1_date": item1.get("date_lost_found"),
        "item2_date": item2.get("date_lost_found"),

        # Computed comparisons
        "category_match": _compare_categories(
            item1.get("category", ""), item2.get("category", "")
        ),
        "color_match": _compare_colors(
            item1.get("color"), item2.get("color")
        ),
        "location_match": _compare_locations(
            item1.get("location"), item2.get("location")
        ),
        "date_proximity": _compare_dates(
            item1.get("date_lost_found"), item2.get("date_lost_found")
        ),
        "name_similarity": _compare_names(
            item1.get("name", ""), item2.get("name", "")
        ),
        "description_keyword_overlap": _count_description_overlap(
            item1.get("description"), item2.get("description")
        ),
    }
    return facts


# ═══════════════════════════════════════════════════════════════════
# 4. INFERENCE ENGINE — Forward-chaining rule evaluation
# ═══════════════════════════════════════════════════════════════════

def run_inference(facts: dict) -> Tuple[float, List[dict]]:
    """
    Forward-chaining inference engine.

    Evaluates all rules against the working memory facts.
    Rules are sorted by priority (lower = higher priority).

    Parameters:
        facts: The working memory dictionary

    Returns:
        (total_score, fired_rules) where:
            - total_score: Normalized expert system match score (0.0 to 1.0)
            - fired_rules: List of dicts describing each rule that fired
    """
    fired_rules = []

    # Sort rules by priority (0 = highest priority)
    sorted_rules = sorted(RULES, key=lambda r: r["priority"])

    total_raw_score = 0
    # Maximum possible score if all rules fired
    max_possible_score = sum(r["action"]["score"] for r in RULES)

    for rule in sorted_rules:
        try:
            if rule["condition"](facts):
                fired_rules.append({
                    "rule_id": rule["id"],
                    "rule_name": rule["name"],
                    "description": rule["description"],
                    "score_contribution": rule["action"]["score"],
                    "confidence": rule["action"]["confidence"],
                })
                total_raw_score += rule["action"]["score"]
        except (KeyError, TypeError):
            # Skip rules that can't be evaluated due to missing facts
            continue

    # Normalize to 0.0 — 1.0
    normalized_score = min(total_raw_score / max_possible_score, 1.0) if max_possible_score > 0 else 0.0

    return normalized_score, fired_rules


# ═══════════════════════════════════════════════════════════════════
# 5. EXPLANATION FACILITY — Human-readable explanations
# ═══════════════════════════════════════════════════════════════════

def generate_explanation(fired_rules: List[dict], expert_score: float) -> dict:
    """
    Generate a human-readable explanation of the expert system's reasoning.

    Parameters:
        fired_rules: List of rules that fired
        expert_score: The normalized expert system score

    Returns:
        A dictionary with structured explanation data
    """
    if not fired_rules:
        return {
            "summary": "No attribute-based matching rules were triggered.",
            "confidence_level": "none",
            "reasons": [],
            "suggestion": "The items don't share enough attributes to suggest a match based on rules.",
        }

    # Determine overall confidence
    confidences = [r["confidence"] for r in fired_rules]
    if "very_high" in confidences:
        confidence_level = "very_high"
    elif confidences.count("high") >= 2:
        confidence_level = "high"
    elif "high" in confidences:
        confidence_level = "medium_high"
    elif "medium" in confidences:
        confidence_level = "medium"
    else:
        confidence_level = "low"

    # Build human-readable reasons
    reasons = []
    for rule in fired_rules:
        reasons.append(f"✓ {rule['rule_name']}: {rule['description']}")

    # Build summary
    score_percent = round(expert_score * 100)
    if score_percent >= 70:
        summary = f"Strong attribute match ({score_percent}% score). Multiple item attributes align closely."
    elif score_percent >= 40:
        summary = f"Moderate attribute match ({score_percent}% score). Several item attributes are similar."
    elif score_percent >= 20:
        summary = f"Weak attribute match ({score_percent}% score). Some attributes partially match."
    else:
        summary = f"Minimal attribute match ({score_percent}% score). Few attributes align."

    # Build suggestion
    if confidence_level in ("very_high", "high"):
        suggestion = "The rule-based analysis strongly suggests these items may be the same. We recommend contacting the other reporter."
    elif confidence_level in ("medium_high", "medium"):
        suggestion = "Some attributes match — it's worth reviewing the item details and images to confirm."
    else:
        suggestion = "Limited attribute overlap. Visual comparison via AI image matching may be more reliable."

    return {
        "summary": summary,
        "confidence_level": confidence_level,
        "reasons": reasons,
        "suggestion": suggestion,
    }


# ═══════════════════════════════════════════════════════════════════
# 6. PUBLIC API — Main entry point for expert system evaluation
# ═══════════════════════════════════════════════════════════════════

def evaluate_match(item1_attrs: dict, item2_attrs: dict) -> dict:
    """
    Main entry point: evaluate two items using the expert system.

    Parameters:
        item1_attrs: dict with keys: name, category, color, description,
                     location, date_lost_found
        item2_attrs: same structure

    Returns:
        {
            "expert_score": float (0.0 to 1.0),
            "fired_rules": [...],
            "explanation": {...},
            "working_memory": {...},
        }
    """
    # Step 1: Build working memory (extract facts)
    working_memory = build_working_memory(item1_attrs, item2_attrs)

    # Step 2: Run inference engine (forward chaining)
    expert_score, fired_rules = run_inference(working_memory)

    # Step 3: Generate explanation
    explanation = generate_explanation(fired_rules, expert_score)

    return {
        "expert_score": round(expert_score, 4),
        "fired_rules": fired_rules,
        "explanation": explanation,
        "working_memory": {
            k: v for k, v in working_memory.items()
            if not k.startswith("item1_") and not k.startswith("item2_")
        },
    }


def hybrid_score(ai_score: float, expert_score: float, ai_weight: float = 0.6, expert_weight: float = 0.4) -> float:
    """
    Combine AI image similarity score with expert system score
    into a single hybrid match score.

    Parameters:
        ai_score: CNN-based image similarity (0.0 to 1.0)
        expert_score: Expert system rule-based score (0.0 to 1.0)
        ai_weight: Weight for AI score (default 0.6)
        expert_weight: Weight for expert score (default 0.4)

    Returns:
        Combined score (0.0 to 1.0)
    """
    return round(ai_score * ai_weight + expert_score * expert_weight, 4)
