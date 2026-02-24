from pathlib import Path
from typing import Dict

import pandas as pd
from sklearn.model_selection import train_test_split


def stratified_split(
    metadata_csv: str,
    output_dir: str,
    train_ratio: float = 0.7,
    val_ratio: float = 0.15,
    test_ratio: float = 0.15,
    seed: int = 42,
) -> Dict[str, str]:
    """
    Split HAM10000 dataset by lesion_id with stratification by diagnosis type.
    Splitting by lesion_id prevents data leakage (same lesion can have multiple images).

    Args:
        metadata_csv: Path to processed metadata CSV
        output_dir: Path to output directory for split CSVs
        train_ratio: Proportion for training set
        val_ratio: Proportion for validation set
        test_ratio: Proportion for test set
        seed: Random seed for reproducibility

    Returns:
        Dict with 'train', 'val', 'test' keys pointing to split CSV paths
    """
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    df = pd.read_csv(metadata_csv)
    print(f"Dataset total: {len(df)} images, {df['lesion_id'].nunique()} lesions uniques")

    # Create lesion-level dataframe for splitting (one row per unique lesion)
    lesion_df = df.groupby("lesion_id")["dx"].first().reset_index()

    # First split: train vs (val + test)
    train_lesions, temp_lesions, train_labels, temp_labels = train_test_split(
        lesion_df["lesion_id"],
        lesion_df["dx"],
        test_size=(val_ratio + test_ratio),
        stratify=lesion_df["dx"],
        random_state=seed,
    )

    # Second split: val vs test
    relative_test_ratio = test_ratio / (val_ratio + test_ratio)
    val_lesions, test_lesions, _, _ = train_test_split(
        temp_lesions,
        temp_labels,
        test_size=relative_test_ratio,
        stratify=temp_labels,
        random_state=seed,
    )

    # Convert to sets for fast lookup
    train_set = set(train_lesions)
    val_set = set(val_lesions)
    test_set = set(test_lesions)

    # Verify no overlap
    assert len(train_set & val_set) == 0, "Overlap entre train et val!"
    assert len(train_set & test_set) == 0, "Overlap entre train et test!"
    assert len(val_set & test_set) == 0, "Overlap entre val et test!"

    # Filter image-level dataframe by lesion assignments
    train_df = df[df["lesion_id"].isin(train_set)].reset_index(drop=True)
    val_df = df[df["lesion_id"].isin(val_set)].reset_index(drop=True)
    test_df = df[df["lesion_id"].isin(test_set)].reset_index(drop=True)

    # Save split CSVs
    split_paths = {}
    for split_name, split_df in [("train", train_df), ("val", val_df), ("test", test_df)]:
        csv_path = output_path / f"{split_name}.csv"
        split_df.to_csv(csv_path, index=False)
        split_paths[split_name] = str(csv_path)

        print(f"\n{split_name}: {len(split_df)} images, {split_df['lesion_id'].nunique()} lesions")
        print(f"  Distribution par diagnostic:")
        for dx, count in split_df["dx"].value_counts().items():
            pct = 100 * count / len(split_df)
            print(f"    {dx}: {count} ({pct:.1f}%)")

    print(f"\nSplit termine. CSVs sauvegardes dans {output_path}")
    return split_paths
