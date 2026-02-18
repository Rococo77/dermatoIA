import os
import shutil
from pathlib import Path
from typing import List, Tuple

import numpy as np
from sklearn.model_selection import train_test_split


def stratified_split(
    data_dir: str,
    output_dir: str,
    lesion_types: List[str],
    train_ratio: float = 0.7,
    val_ratio: float = 0.15,
    test_ratio: float = 0.15,
    seed: int = 42,
):
    """
    Split dataset into train/val/test with stratification by lesion type.
    Expects data_dir to have subdirectories per lesion type.
    """
    data_path = Path(data_dir)
    output_path = Path(output_dir)

    all_files = []
    all_labels = []

    for type_name in lesion_types:
        type_dir = data_path / type_name
        if not type_dir.exists():
            continue

        for img_file in type_dir.iterdir():
            if img_file.suffix.lower() in ('.jpg', '.jpeg', '.png', '.webp'):
                all_files.append(str(img_file))
                all_labels.append(type_name)

    if len(all_files) == 0:
        print("Aucun fichier image trouve dans le dataset.")
        return

    all_files = np.array(all_files)
    all_labels = np.array(all_labels)

    # First split: train vs (val + test)
    train_files, temp_files, train_labels, temp_labels = train_test_split(
        all_files, all_labels,
        test_size=(val_ratio + test_ratio),
        stratify=all_labels,
        random_state=seed,
    )

    # Second split: val vs test
    relative_test_ratio = test_ratio / (val_ratio + test_ratio)
    val_files, test_files, val_labels, test_labels = train_test_split(
        temp_files, temp_labels,
        test_size=relative_test_ratio,
        stratify=temp_labels,
        random_state=seed,
    )

    # Copy files to split directories
    for split_name, files, labels in [
        ("train", train_files, train_labels),
        ("val", val_files, val_labels),
        ("test", test_files, test_labels),
    ]:
        print(f"{split_name}: {len(files)} images")
        for file_path, label in zip(files, labels):
            dest_dir = output_path / split_name / label
            dest_dir.mkdir(parents=True, exist_ok=True)
            dest_file = dest_dir / Path(file_path).name
            shutil.copy2(file_path, dest_file)

    print(f"Split termine. Resultats dans {output_path}")
