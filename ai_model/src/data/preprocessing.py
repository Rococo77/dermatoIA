from pathlib import Path
from typing import Dict, Optional

import pandas as pd
from PIL import Image
from tqdm import tqdm


def preprocess_dataset(
    metadata_csv: str,
    images_dir: str,
    output_dir: str,
    image_size: int = 224,
    severity_mapping: Optional[Dict[str, str]] = None,
) -> str:
    """
    Preprocess HAM10000 dataset: resize images, clean metadata, derive severity.

    Args:
        metadata_csv: Path to HAM10000_metadata.csv
        images_dir: Path to flat image directory (data/raw/images/)
        output_dir: Path to processed output directory
        image_size: Target image size (square)
        severity_mapping: Dict mapping dx code -> severity level

    Returns:
        Path to processed metadata CSV
    """
    images_path = Path(images_dir)
    output_path = Path(output_dir)
    out_images_dir = output_path / "images"
    out_images_dir.mkdir(parents=True, exist_ok=True)

    # Load metadata
    df = pd.read_csv(metadata_csv)
    print(f"Metadata chargees: {len(df)} entrees")

    # Derive severity from diagnosis
    if severity_mapping:
        df["severity"] = df["dx"].map(severity_mapping)
        unmapped = df["severity"].isna().sum()
        if unmapped > 0:
            print(f"ATTENTION: {unmapped} entrees sans mapping de severite")
            df["severity"] = df["severity"].fillna("low")

    # Set relative image path (relative to output_dir)
    df["image_path"] = df["image_id"].apply(lambda x: f"images/{x}.jpg")

    # Handle missing metadata
    age_median = df["age"].median()
    df["age"] = df["age"].fillna(age_median)
    df["sex"] = df["sex"].fillna("unknown")
    df["localization"] = df["localization"].fillna("unknown")

    print(f"Age median (pour remplissage NaN): {age_median:.1f}")

    # Process images
    total_processed = 0
    total_skipped = 0

    for _, row in tqdm(df.iterrows(), total=len(df), desc="Preprocessing images"):
        image_id = row["image_id"]
        src_file = images_path / f"{image_id}.jpg"

        if not src_file.exists():
            found = False
            for ext in [".jpeg", ".png", ".webp"]:
                alt = images_path / f"{image_id}{ext}"
                if alt.exists():
                    src_file = alt
                    found = True
                    break
            if not found:
                total_skipped += 1
                continue

        try:
            img = Image.open(src_file).convert("RGB")
            img = img.resize((image_size, image_size), Image.LANCZOS)

            out_file = out_images_dir / f"{image_id}.jpg"
            img.save(out_file, "JPEG", quality=95)
            total_processed += 1
        except Exception as e:
            print(f"Erreur sur {src_file}: {e}")
            total_skipped += 1

    # Remove rows for skipped images
    if total_skipped > 0:
        existing = set(f.stem for f in out_images_dir.iterdir() if f.suffix == ".jpg")
        df = df[df["image_id"].isin(existing)].reset_index(drop=True)

    # Save processed metadata
    out_csv = output_path / "metadata_processed.csv"
    df.to_csv(out_csv, index=False)

    # Print summary
    print(f"\nPreprocessing termine:")
    print(f"  Images traitees: {total_processed}")
    print(f"  Images ignorees: {total_skipped}")
    print(f"\nDistribution par diagnostic:")
    print(df["dx"].value_counts().to_string())
    if severity_mapping:
        print(f"\nDistribution par severite:")
        print(df["severity"].value_counts().to_string())
    print(f"\nMetadata sauvegardees: {out_csv}")

    return str(out_csv)
