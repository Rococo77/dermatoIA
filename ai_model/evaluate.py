import argparse
import logging
import yaml
from pathlib import Path

import pandas as pd
import torch
from torch.utils.data import DataLoader

from src.data.dataset import (
    SkinLesionDataset,
    FolderDataset,
    get_val_transform,
    split_folder_dataset,
)
from src.models.hierarchical_model import HierarchicalDermaModel
from src.evaluation.evaluate import evaluate_model

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


def main():
    parser = argparse.ArgumentParser(description="DermatoIA - Evaluation du modele")
    parser.add_argument("--config", type=str, default="configs/config.yaml")
    parser.add_argument("--checkpoint", type=str, default="outputs/best_model.pt")
    parser.add_argument("--output", type=str, default="outputs/evaluation")
    args = parser.parse_args()

    with open(args.config) as f:
        config = yaml.safe_load(f)

    lesion_types = config["lesion_types"]
    severity_levels = config["severity_levels"]
    severity_mapping = config["severity_mapping"]
    metadata_config = dict(config["metadata"])
    image_size = config["data"]["image_size"]
    dataset_mode = config["data"].get("dataset_mode", "csv")

    logger.info(f"Dataset mode: {dataset_mode}")

    # -----------------------------------------------------------------------
    # Dataset creation: branch on mode
    # -----------------------------------------------------------------------

    if dataset_mode == "folder":
        metadata_config["use_metadata"] = False
        logger.info("Mode folder: metadata desactivee")

        folder_dir = config["data"]["folder_dir"]
        splits = split_folder_dataset(
            base_dir=folder_dir,
            lesion_types=lesion_types,
            train_ratio=config["data"]["train_ratio"],
            val_ratio=config["data"]["val_ratio"],
            test_ratio=config["data"]["test_ratio"],
        )

        test_paths, test_labels = splits["test"]

        test_dataset = FolderDataset(
            image_paths=test_paths,
            labels=test_labels,
            lesion_types=lesion_types,
            severity_levels=severity_levels,
            severity_mapping=severity_mapping,
            metadata_dim=0,
            transform=get_val_transform(image_size),
        )

        metadata_feature_dim = 0

    else:
        # CSV mode: compute age stats from training set (must match training)
        train_csv = str(Path(config["data"]["splits_dir"]) / "train.csv")
        train_df = pd.read_csv(train_csv)
        metadata_config["age_mean"] = float(train_df["age"].mean())
        metadata_config["age_std"] = float(train_df["age"].std())

        test_dataset = SkinLesionDataset(
            csv_path=str(Path(config["data"]["splits_dir"]) / "test.csv"),
            images_base_dir=config["data"]["processed_dir"],
            lesion_types=lesion_types,
            severity_levels=severity_levels,
            severity_mapping=severity_mapping,
            metadata_config=metadata_config,
            transform=get_val_transform(image_size),
        )

        metadata_feature_dim = (
            1
            + len(metadata_config["sex_categories"])
            + len(metadata_config["localization_categories"])
        )

    # -----------------------------------------------------------------------
    # Common: loader, model, evaluation
    # -----------------------------------------------------------------------

    logger.info(f"Test: {len(test_dataset)} images")

    test_loader = DataLoader(
        test_dataset,
        batch_size=config["training"]["batch_size"],
        shuffle=False,
        num_workers=config["training"]["num_workers"],
    )

    # Load model
    model = HierarchicalDermaModel(
        num_types=len(lesion_types),
        num_severity_levels=config["model"]["num_severity_levels"],
        backbone_name=config["model"]["backbone"],
        pretrained=False,
        type_hidden_dim=config["model"]["type_hidden_dim"],
        severity_hidden_dim=config["model"]["severity_hidden_dim"],
        type_embedding_dim=config["model"]["type_embedding_dim"],
        dropout=config["model"]["dropout"],
        use_metadata=metadata_config.get("use_metadata", False),
        metadata_feature_dim=metadata_feature_dim,
        metadata_fusion_dim=config["model"].get("metadata_fusion_dim", 64),
    )

    checkpoint = torch.load(args.checkpoint, map_location="cpu")
    model.load_state_dict(checkpoint["model_state_dict"])
    logger.info(f"Checkpoint charge: {args.checkpoint}")

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    # Evaluate
    metrics = evaluate_model(model, test_loader, lesion_types, severity_levels, device)

    # Generate results
    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)

    logger.info("\nF1 par type de lesion:")
    for t in lesion_types:
        key = f"type_f1_{t}"
        if key in metrics:
            logger.info(f"  {t}: {metrics[key]:.4f}")

    logger.info(f"Resultats sauvegardes dans {output_dir}")


if __name__ == "__main__":
    main()
