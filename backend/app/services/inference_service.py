import asyncio
import logging
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from typing import Dict, Any

import torch
from PIL import Image
from torchvision import transforms

from app.core.config import settings

logger = logging.getLogger(__name__)

LESION_TYPES = [
    "melanoma", "eczema", "psoriasis", "acne",
    "dermatitis", "keratosis", "nevus", "other"
]

SEVERITY_LEVELS = ["low", "medium", "high", "critical"]


class InferenceService:
    def __init__(self):
        self.model = None
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225],
            ),
        ])
        self._executor = ThreadPoolExecutor(
            max_workers=settings.INFERENCE_MAX_WORKERS,
            thread_name_prefix="inference",
        )
        self._load_model()

    def _load_model(self):
        model_path = Path(settings.MODEL_PATH)
        if model_path.exists():
            try:
                self.model = torch.jit.load(str(model_path), map_location="cpu")
                self.model.eval()
                logger.info(f"Modele charge depuis {model_path}")
            except Exception as e:
                logger.warning(f"Impossible de charger le modele: {e}")
                self.model = None
        else:
            logger.warning(f"Fichier modele introuvable: {model_path}")

    def predict(self, image: Image.Image) -> Dict[str, Any]:
        """Inference synchrone (bloquante). A appeler depuis un thread worker."""
        if self.model is None:
            return {
                "lesion_type": "other",
                "lesion_type_confidence": 0.0,
                "severity_level": "low",
                "severity_confidence": 0.0,
                "all_type_scores": {t: 0.0 for t in LESION_TYPES},
                "all_severity_scores": {s: 0.0 for s in SEVERITY_LEVELS},
            }

        input_tensor = self.transform(image.convert("RGB")).unsqueeze(0)

        with torch.no_grad():
            type_logits, severity_logits = self.model(input_tensor)

        type_probs = torch.softmax(type_logits, dim=1).squeeze()
        type_idx = type_probs.argmax().item()
        lesion_type = LESION_TYPES[type_idx]
        type_confidence = type_probs[type_idx].item()

        severity_probs = torch.softmax(severity_logits, dim=1).squeeze()
        severity_idx = severity_probs.argmax().item()
        severity_level = SEVERITY_LEVELS[severity_idx]
        severity_confidence = severity_probs[severity_idx].item()

        return {
            "lesion_type": lesion_type,
            "lesion_type_confidence": round(type_confidence, 4),
            "severity_level": severity_level,
            "severity_confidence": round(severity_confidence, 4),
            "all_type_scores": {
                t: round(p.item(), 4) for t, p in zip(LESION_TYPES, type_probs)
            },
            "all_severity_scores": {
                s: round(p.item(), 4) for s, p in zip(SEVERITY_LEVELS, severity_probs)
            },
        }

    async def predict_async(self, image: Image.Image) -> Dict[str, Any]:
        """
        Inference non-bloquante. Delegue le calcul CPU-bound au thread pool
        pour ne pas bloquer la boucle asyncio et permettre aux autres requetes
        d'etre traitees en parallele.
        """
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(self._executor, self.predict, image)
