import os
from pathlib import Path
from typing import Tuple, List, Optional

import numpy as np
from PIL import Image
from torch.utils.data import Dataset
import albumentations as A
from albumentations.pytorch import ToTensorV2


class SkinLesionDataset(Dataset):
    """
    Dataset for skin lesion images.
    Expects directory structure:
        data/splits/{split}/
            {lesion_type}/
                image1.jpg
                image2.png
                ...
    Each image filename should encode severity: {name}_{severity}.ext
    Or a CSV mapping file can be used.
    """

    def __init__(
        self,
        root_dir: str,
        lesion_types: List[str],
        severity_levels: List[str],
        transform: Optional[A.Compose] = None,
        csv_path: Optional[str] = None,
    ):
        self.root_dir = Path(root_dir)
        self.lesion_types = lesion_types
        self.severity_levels = severity_levels
        self.type_to_idx = {t: i for i, t in enumerate(lesion_types)}
        self.severity_to_idx = {s: i for i, s in enumerate(severity_levels)}
        self.transform = transform or self._default_transform()
        self.samples = self._load_samples(csv_path)

    def _default_transform(self) -> A.Compose:
        return A.Compose([
            A.Resize(224, 224),
            A.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225],
            ),
            ToTensorV2(),
        ])

    def _load_samples(self, csv_path: Optional[str] = None) -> List[dict]:
        samples = []

        if csv_path and os.path.exists(csv_path):
            import pandas as pd
            df = pd.read_csv(csv_path)
            for _, row in df.iterrows():
                img_path = self.root_dir / row["image_path"]
                if img_path.exists():
                    samples.append({
                        "image_path": str(img_path),
                        "lesion_type": row["lesion_type"],
                        "severity": row["severity"],
                        "type_idx": self.type_to_idx.get(row["lesion_type"], len(self.lesion_types) - 1),
                        "severity_idx": self.severity_to_idx.get(row["severity"], 0),
                    })
        else:
            # Load from directory structure
            for type_name in self.lesion_types:
                type_dir = self.root_dir / type_name
                if not type_dir.exists():
                    continue

                for img_file in type_dir.iterdir():
                    if img_file.suffix.lower() in ('.jpg', '.jpeg', '.png', '.webp'):
                        # Parse severity from filename: name_severity.ext
                        stem = img_file.stem
                        severity = "low"
                        for sev in self.severity_levels:
                            if f"_{sev}" in stem.lower():
                                severity = sev
                                break

                        samples.append({
                            "image_path": str(img_file),
                            "lesion_type": type_name,
                            "severity": severity,
                            "type_idx": self.type_to_idx[type_name],
                            "severity_idx": self.severity_to_idx[severity],
                        })

        return samples

    def __len__(self) -> int:
        return len(self.samples)

    def __getitem__(self, idx: int) -> Tuple:
        sample = self.samples[idx]
        image = np.array(Image.open(sample["image_path"]).convert("RGB"))

        if self.transform:
            augmented = self.transform(image=image)
            image = augmented["image"]

        return image, sample["type_idx"], sample["severity_idx"]


def get_train_transform(image_size: int = 224) -> A.Compose:
    return A.Compose([
        A.Resize(image_size, image_size),
        A.HorizontalFlip(p=0.5),
        A.VerticalFlip(p=0.5),
        A.RandomRotate90(p=0.5),
        A.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2, hue=0.1, p=0.5),
        A.GaussNoise(p=0.3),
        A.CoarseDropout(max_holes=8, max_height=16, max_width=16, p=0.3),
        A.Normalize(
            mean=[0.485, 0.456, 0.406],
            std=[0.229, 0.224, 0.225],
        ),
        ToTensorV2(),
    ])


def get_val_transform(image_size: int = 224) -> A.Compose:
    return A.Compose([
        A.Resize(image_size, image_size),
        A.Normalize(
            mean=[0.485, 0.456, 0.406],
            std=[0.229, 0.224, 0.225],
        ),
        ToTensorV2(),
    ])
