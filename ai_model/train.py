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
    get_train_transform,
    get_val_transform,
    compute_class_weights,
    split_folder_dataset,
    compute_folder_class_weights,
)
from src.models.hierarchical_model import HierarchicalDermaModel
from src.training.trainer import Trainer
from src.export.export_model import export_to_torchscript

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


def main():
    parser = argparse.ArgumentParser(description="DermatoIA - Entrainement du modele")
    parser.add_argument("--config", type=str, default="configs/config.yaml", help="Chemin vers la config")
    parser.add_argument("--output", type=str, default="outputs", help="Repertoire de sortie")
    args = parser.parse_args()

    # Load config
    with open(args.config) as f:
        config = yaml.safe_load(f)

    lesion_types = config["lesion_types"]
    severity_levels = config["severity_levels"]
    severity_mapping = config["severity_mapping"]
    metadata_config = dict(config["metadata"])
    image_size = config["data"]["image_size"]
    dataset_mode = config["data"].get("dataset_mode", "csv")

    logger.info(f"Dataset mode: {dataset_mode}")
    logger.info(f"Types de lesions: {lesion_types}")
    logger.info(f"Niveaux de gravite: {severity_levels}")
    logger.info(f"Mapping severite: {severity_mapping}")

    # -----------------------------------------------------------------------
    # Dataset creation: branch on mode
    # -----------------------------------------------------------------------

    type_weights, severity_weights = None, None

    if dataset_mode == "folder":
        # Folder mode: images organized as folder_dir/{class}/*.png
        # No patient metadata available for synthetic images
        metadata_config["use_metadata"] = False
        logger.info("Mode folder: metadata desactivee (pas de donnees patient)")

        folder_dir = config["data"]["folder_dir"]
        splits = split_folder_dataset(
            base_dir=folder_dir,
            lesion_types=lesion_types,
            train_ratio=config["data"]["train_ratio"],
            val_ratio=config["data"]["val_ratio"],
            test_ratio=config["data"]["test_ratio"],
        )

        train_paths, train_labels = splits["train"]
        val_paths, val_labels = splits["val"]

        train_dataset = FolderDataset(
            image_paths=train_paths,
            labels=train_labels,
            lesion_types=lesion_types,
            severity_levels=severity_levels,
            severity_mapping=severity_mapping,
            metadata_dim=0,
            transform=get_train_transform(image_size),
        )

        val_dataset = FolderDataset(
            image_paths=val_paths,
            labels=val_labels,
            lesion_types=lesion_types,
            severity_levels=severity_levels,
            severity_mapping=severity_mapping,
            metadata_dim=0,
            transform=get_val_transform(image_size),
        )

        # Class weights from labels list
        if config["training"].get("use_class_weights", False):
            type_weights, severity_weights = compute_folder_class_weights(
                labels=train_labels,
                lesion_types=lesion_types,
                severity_levels=severity_levels,
                severity_mapping=severity_mapping,
            )
            logger.info(f"Type class weights: {type_weights}")
            logger.info(f"Severity class weights: {severity_weights}")

        metadata_feature_dim = 0

    else:
        # CSV mode: HAM10000 with metadata (age, sex, localization)
        train_csv = str(Path(config["data"]["splits_dir"]) / "train.csv")
        train_df = pd.read_csv(train_csv)
        metadata_config["age_mean"] = float(train_df["age"].mean())
        metadata_config["age_std"] = float(train_df["age"].std())
        logger.info(f"Age stats (train): mean={metadata_config['age_mean']:.1f}, std={metadata_config['age_std']:.1f}")

        train_dataset = SkinLesionDataset(
            csv_path=train_csv,
            images_base_dir=config["data"]["processed_dir"],
            lesion_types=lesion_types,
            severity_levels=severity_levels,
            severity_mapping=severity_mapping,
            metadata_config=metadata_config,
            transform=get_train_transform(image_size),
        )

        val_dataset = SkinLesionDataset(
            csv_path=str(Path(config["data"]["splits_dir"]) / "val.csv"),
            images_base_dir=config["data"]["processed_dir"],
            lesion_types=lesion_types,
            severity_levels=severity_levels,
            severity_mapping=severity_mapping,
            metadata_config=metadata_config,
            transform=get_val_transform(image_size),
        )

        # Class weights from CSV
        if config["training"].get("use_class_weights", False):
            type_weights, severity_weights = compute_class_weights(
                csv_path=train_csv,
                lesion_types=lesion_types,
                severity_levels=severity_levels,
                severity_mapping=severity_mapping,
            )
            logger.info(f"Type class weights: {type_weights}")
            logger.info(f"Severity class weights: {severity_weights}")

        metadata_feature_dim = (
            1  # age
            + len(metadata_config["sex_categories"])
            + len(metadata_config["localization_categories"])
        )

    # -----------------------------------------------------------------------
    # Common: loaders, model, training, export
    # -----------------------------------------------------------------------

    logger.info(f"Train: {len(train_dataset)} images | Val: {len(val_dataset)} images")

    if len(train_dataset) == 0:
        logger.error("Aucune image d'entrainement trouvee. Verifiez le dataset.")
        return

    train_loader = DataLoader(
        train_dataset,
        batch_size=config["training"]["batch_size"],
        shuffle=True,
        num_workers=config["training"]["num_workers"],
        pin_memory=True,
    )

    val_loader = DataLoader(
        val_dataset,
        batch_size=config["training"]["batch_size"],
        shuffle=False,
        num_workers=config["training"]["num_workers"],
        pin_memory=True,
    )

    # Create model
    model = HierarchicalDermaModel(
        num_types=len(lesion_types),
        num_severity_levels=config["model"]["num_severity_levels"],
        backbone_name=config["model"]["backbone"],
        pretrained=config["model"]["pretrained"],
        type_hidden_dim=config["model"]["type_hidden_dim"],
        severity_hidden_dim=config["model"]["severity_hidden_dim"],
        type_embedding_dim=config["model"]["type_embedding_dim"],
        dropout=config["model"]["dropout"],
        use_metadata=metadata_config.get("use_metadata", False),
        metadata_feature_dim=metadata_feature_dim,
        metadata_fusion_dim=config["model"].get("metadata_fusion_dim", 64),
    )

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    logger.info(f"Device: {device}")
    logger.info(f"Backbone: {config['model']['backbone']}")

    # Build output directory: outputs/{backbone}_{dataset_mode}/train_{n}
    backbone_name = config["model"]["backbone"]
    run_base = f"{backbone_name}_{dataset_mode}"
    base_dir = Path(args.output) / run_base

    # Auto-increment run number
    run_n = 1
    if base_dir.exists():
        existing = [d.name for d in base_dir.iterdir() if d.is_dir() and d.name.startswith("train_")]
        if existing:
            nums = []
            for name in existing:
                try:
                    nums.append(int(name.split("_")[1]))
                except (IndexError, ValueError):
                    pass
            if nums:
                run_n = max(nums) + 1

    output_dir = base_dir / f"train_{run_n}"
    output_dir.mkdir(parents=True, exist_ok=True)
    run_name = f"{run_base}/train_{run_n}"
    logger.info(f"Run: {run_name}")
    logger.info(f"Output directory: {output_dir}")

    # Train
    trainer = Trainer(
        model=model,
        train_loader=train_loader,
        val_loader=val_loader,
        lesion_types=lesion_types,
        severity_levels=severity_levels,
        config=config,
        device=device,
        output_dir=str(output_dir),
        type_weights=type_weights,
        severity_weights=severity_weights,
    )
    trainer.train()

    # Load best model and export
    best_checkpoint = output_dir / "best_model.pt"
    if best_checkpoint.exists():
        checkpoint = torch.load(best_checkpoint, map_location="cpu")
        model.load_state_dict(checkpoint["model_state_dict"])
        logger.info(f"Meilleur modele charge (val_loss: {checkpoint['best_val_loss']:.4f})")

        export_dir = Path(config["export"]["output_dir"])
        export_dir.mkdir(parents=True, exist_ok=True)
        export_path = str(export_dir / f"model_{run_base}_train{run_n}.pt")
        export_to_torchscript(
            model, export_path, image_size,
            use_metadata=metadata_config.get("use_metadata", False),
            metadata_feature_dim=metadata_feature_dim,
        )


if __name__ == "__main__":
    main()
