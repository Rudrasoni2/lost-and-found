import torch
import torchvision.models as models
import torchvision.transforms as transforms
from PIL import Image
import numpy as np
import io
from pathlib import Path

# Global model - loaded once
_model = None
_transform = None

def get_model():
    global _model, _transform
    if _model is None:
        _model = models.resnet18(weights=models.ResNet18_Weights.DEFAULT)
        _model.fc = torch.nn.Identity()  # Remove classifier, output 512-d
        _model.eval()
        _transform = transforms.Compose([
            transforms.Resize(256),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ])
    return _model, _transform

def extract_embedding(image_path: str) -> bytes:
    """Extract 512-d embedding from image file, return as bytes."""
    model, transform = get_model()
    img = Image.open(image_path).convert("RGB")
    img_tensor = transform(img).unsqueeze(0)
    with torch.no_grad():
        embedding = model(img_tensor).squeeze().numpy()
    # L2 normalize
    embedding = embedding / np.linalg.norm(embedding)
    return embedding.astype(np.float32).tobytes()

def extract_embedding_from_bytes(image_bytes: bytes) -> bytes:
    """Extract embedding from raw image bytes."""
    model, transform = get_model()
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img_tensor = transform(img).unsqueeze(0)
    with torch.no_grad():
        embedding = model(img_tensor).squeeze().numpy()
    embedding = embedding / np.linalg.norm(embedding)
    return embedding.astype(np.float32).tobytes()

def embedding_to_numpy(embedding_bytes: bytes) -> np.ndarray:
    """Convert bytes back to numpy array."""
    return np.frombuffer(embedding_bytes, dtype=np.float32)

def find_similar_items(query_embedding_bytes: bytes, candidate_embeddings: list, threshold: float = 0.55, top_k: int = 10):
    """
    Compare query embedding against candidates.
    candidate_embeddings: list of (item_id, image_id, embedding_bytes)
    Returns: list of (item_id, image_id, similarity_score) sorted by score desc
    """
    query_vec = embedding_to_numpy(query_embedding_bytes)
    results = []
    
    for item_id, image_id, emb_bytes in candidate_embeddings:
        if emb_bytes is None:
            continue
        candidate_vec = embedding_to_numpy(emb_bytes)
        # Cosine similarity (vectors are L2-normalized, so dot product = cosine sim)
        similarity = float(np.dot(query_vec, candidate_vec))
        if similarity >= threshold:
            results.append((item_id, image_id, similarity))
    
    # Sort by similarity descending
    results.sort(key=lambda x: x[2], reverse=True)
    return results[:top_k]
