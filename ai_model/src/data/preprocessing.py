import os
from pathlib import Path
from typing import List

from PIL import Image
from tqdm import tqdm


def preprocess_dataset(
    input_dir: str,
    output_dir: str,
    image_size: int = 224,
    lesion_types: List[str] = None,
):
    """
    Preprocess raw images: resize, validate, and save to processed directory.
    """
    input_path = Path(input_dir)
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    if lesion_types is None:
        lesion_types = [d.name for d in input_path.iterdir() if d.is_dir()]

    total_processed = 0
    total_skipped = 0

    for type_name in lesion_types:
        type_dir = input_path / type_name
        if not type_dir.exists():
            print(f"Repertoire introuvable: {type_dir}")
            continue

        out_type_dir = output_path / type_name
        out_type_dir.mkdir(parents=True, exist_ok=True)

        files = [f for f in type_dir.iterdir() if f.suffix.lower() in ('.jpg', '.jpeg', '.png', '.webp')]
        print(f"Traitement de {type_name}: {len(files)} images")

        for img_file in tqdm(files, desc=type_name):
            try:
                img = Image.open(img_file).convert("RGB")
                img = img.resize((image_size, image_size), Image.LANCZOS)

                out_file = out_type_dir / f"{img_file.stem}.jpg"
                img.save(out_file, "JPEG", quality=95)
                total_processed += 1
            except Exception as e:
                print(f"Erreur sur {img_file}: {e}")
                total_skipped += 1

    print(f"\nPreprocessing termine: {total_processed} images traitees, {total_skipped} ignorees")
