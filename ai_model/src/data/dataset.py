from collections import Counter
from pathlib import Path
from typing import Tuple, List, Dict, Optional

import numpy as np
import pandas as pd
import torch
from PIL import Image
from torch.utils.data import Dataset
import albumentations as A
from albumentations.pytorch import ToTensorV2


class SkinLesionDataset(Dataset):
    """
    Dataset for HAM10000 skin lesion images.
    Loads from a split CSV file with metadata columns.
    Returns (image, type_idx, severity_idx, metadata_tensor).
    """

    def __init__(
        self,
        csv_path: str,
        images_base_dir: str,
        lesion_types: List[str],
        severity_levels: List[str],
        severity_mapping: Dict[str, str],
        metadata_config: dict,
        transform: Optional[A.Compose] = None,
    ):
        self.images_base_dir = Path(images_base_dir)
        self.lesion_types = lesion_types
        self.severity_levels = severity_levels
        self.severity_mapping = severity_mapping
        self.metadata_config = metadata_config
        self.type_to_idx = {t: i for i, t in enumerate(lesion_types)}
        self.severity_to_idx = {s: i for i, s in enumerate(severity_levels)}
        self.transform = transform or self._default_transform()

        # Metadata encoding mappings
        sex_cats = metadata_config.get("sex_categories", ["male", "female", "unknown"])
        loc_cats = metadata_config.get("localization_categories", ["unknown"])
        self.sex_to_idx = {s: i for i, s in enumerate(sex_cats)}
        self.loc_to_idx = {l: i for i, l in enumerate(loc_cats)}
        self.num_sex = len(sex_cats)
        self.num_loc = len(loc_cats)

        # Age normalization stats (computed from training set)
        self.age_mean = metadata_config.get("age_mean", 52.0)
        self.age_std = metadata_config.get("age_std", 17.0)

        # Load samples from CSV
        self.df = pd.read_csv(csv_path)

    def _default_transform(self) -> A.Compose:
        return A.Compose([
            A.Resize(224, 224),
            A.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225],
            ),
            ToTensorV2(),
        ])

    def _encode_metadata(self, row) -> torch.Tensor:
        features = []

        # Age: z-score normalized
        age = row["age"] if pd.notna(row["age"]) else self.age_mean
        age_normalized = (age - self.age_mean) / (self.age_std + 1e-8)
        features.append(age_normalized)

        # Sex: one-hot encoding
        sex = row["sex"] if pd.notna(row["sex"]) else "unknown"
        sex_onehot = [0.0] * self.num_sex
        sex_idx = self.sex_to_idx.get(sex, self.sex_to_idx.get("unknown", 0))
        sex_onehot[sex_idx] = 1.0
        features.extend(sex_onehot)

        # Localization: one-hot encoding
        loc = row["localization"] if pd.notna(row["localization"]) else "unknown"
        loc_onehot = [0.0] * self.num_loc
        loc_idx = self.loc_to_idx.get(loc, self.loc_to_idx.get("unknown", 0))
        loc_onehot[loc_idx] = 1.0
        features.extend(loc_onehot)

        return torch.tensor(features, dtype=torch.float32)

    def __len__(self) -> int:
        return len(self.df)

    def __getitem__(self, idx: int) -> Tuple:
        row = self.df.iloc[idx]

        # Load image
        img_path = self.images_base_dir / row["image_path"]
        image = np.array(Image.open(img_path).convert("RGB"))

        if self.transform:
            augmented = self.transform(image=image)
            image = augmented["image"]

        # Labels
        type_idx = self.type_to_idx[row["dx"]]
        severity = self.severity_mapping[row["dx"]]
        severity_idx = self.severity_to_idx[severity]

        # Metadata
        metadata = self._encode_metadata(row)

        return image, type_idx, severity_idx, metadata


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


def compute_class_weights(
    csv_path: str,
    lesion_types: List[str],
    severity_levels: List[str],
    severity_mapping: Dict[str, str],
) -> Tuple[torch.Tensor, torch.Tensor]:
    """
    Compute inverse-frequency class weights for imbalanced HAM10000 dataset.

    Returns:
        (type_weights, severity_weights) tensors for CrossEntropyLoss
    """
    df = pd.read_csv(csv_path)
    n_total = len(df)

    # Type weights: w_c = N / (C * n_c)
    type_counts = df["dx"].value_counts()
    n_types = len(lesion_types)
    type_weights = torch.zeros(n_types)
    for i, t in enumerate(lesion_types):
        count = type_counts.get(t, 1)
        type_weights[i] = n_total / (n_types * count)

    # Severity weights
    df["_severity"] = df["dx"].map(severity_mapping)
    sev_counts = df["_severity"].value_counts()
    n_sevs = len(severity_levels)
    severity_weights = torch.zeros(n_sevs)
    for i, s in enumerate(severity_levels):
        count = sev_counts.get(s, 1)
        severity_weights[i] = n_total / (n_sevs * count)

    return type_weights, severity_weights


# ---------------------------------------------------------------------------
# Folder-based dataset (for augmented/synthetic datasets organized by class)
# ---------------------------------------------------------------------------


class FolderDataset(Dataset):
    """
    Dataset loading images from class subdirectories.
    Structure: base_dir/{lesion_type}/image.png
    No patient metadata — returns a zero tensor for compatibility.
    Returns same (image, type_idx, severity_idx, metadata) tuple as SkinLesionDataset.
    """

    def __init__(
        self,
        image_paths: List[str],
        labels: List[str],
        lesion_types: List[str],
        severity_levels: List[str],
        severity_mapping: Dict[str, str],
        metadata_dim: int = 0,
        transform: Optional[A.Compose] = None,
    ):
        self.image_paths = image_paths
        self.labels = labels
        self.lesion_types = lesion_types
        self.severity_levels = severity_levels
        self.severity_mapping = severity_mapping
        self.type_to_idx = {t: i for i, t in enumerate(lesion_types)}
        self.severity_to_idx = {s: i for i, s in enumerate(severity_levels)}
        self.metadata_dim = metadata_dim
        self.transform = transform

    def __len__(self) -> int:
        return len(self.image_paths)

    def __getitem__(self, idx: int) -> Tuple:
        img_path = self.image_paths[idx]
        label = self.labels[idx]

        image = np.array(Image.open(img_path).convert("RGB"))

        if self.transform:
            augmented = self.transform(image=image)
            image = augmented["image"]

        type_idx = self.type_to_idx[label]
        severity = self.severity_mapping[label]
        severity_idx = self.severity_to_idx[severity]

        # Zero metadata tensor (no patient data for synthetic images)
        metadata = torch.zeros(max(self.metadata_dim, 1), dtype=torch.float32)

        return image, type_idx, severity_idx, metadata


def split_folder_dataset(
    base_dir: str,
    lesion_types: List[str],
    train_ratio: float = 0.7,
    val_ratio: float = 0.15,
    test_ratio: float = 0.15,
    seed: int = 42,
    extensions: Tuple[str, ...] = (".png", ".jpg", ".jpeg"),
) -> Dict[str, Tuple[List[str], List[str]]]:
    """
    Scan class subdirectories and split into train/val/test (stratified).

    Returns:
        Dict with keys 'train', 'val', 'test', each mapping to
        (image_paths_list, labels_list).
    """
    from sklearn.model_selection import train_test_split

    base = Path(base_dir)
    all_paths = []
    all_labels = []

    for cls_name in lesion_types:
        cls_dir = base / cls_name
        if not cls_dir.is_dir():
            raise FileNotFoundError(f"Class directory not found: {cls_dir}")
        for f in sorted(cls_dir.iterdir()):
            if f.suffix.lower() in extensions:
                all_paths.append(str(f))
                all_labels.append(cls_name)

    # First split: train vs (val+test)
    train_paths, temp_paths, train_labels, temp_labels = train_test_split(
        all_paths, all_labels,
        test_size=(val_ratio + test_ratio),
        stratify=all_labels,
        random_state=seed,
    )

    # Second split: val vs test
    relative_test = test_ratio / (val_ratio + test_ratio)
    val_paths, test_paths, val_labels, test_labels = train_test_split(
        temp_paths, temp_labels,
        test_size=relative_test,
        stratify=temp_labels,
        random_state=seed,
    )

    return {
        "train": (train_paths, train_labels),
        "val": (val_paths, val_labels),
        "test": (test_paths, test_labels),
    }


def compute_folder_class_weights(
    labels: List[str],
    lesion_types: List[str],
    severity_levels: List[str],
    severity_mapping: Dict[str, str],
) -> Tuple[torch.Tensor, torch.Tensor]:
    """
    Compute inverse-frequency class weights from a list of labels.
    Works without CSV — uses the labels list directly.
    """
    n_total = len(labels)
    type_counts = Counter(labels)
    n_types = len(lesion_types)

    type_weights = torch.zeros(n_types)
    for i, t in enumerate(lesion_types):
        count = type_counts.get(t, 1)
        type_weights[i] = n_total / (n_types * count)

    severity_labels = [severity_mapping[l] for l in labels]
    sev_counts = Counter(severity_labels)
    n_sevs = len(severity_levels)
    severity_weights = torch.zeros(n_sevs)
    for i, s in enumerate(severity_levels):
        count = sev_counts.get(s, 1)
        severity_weights[i] = n_total / (n_sevs * count)

    return type_weights, severity_weights
