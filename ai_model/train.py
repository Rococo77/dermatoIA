import argparse
import logging
import yaml
from pathlib import Path

import torch
from torch.utils.data import DataLoader

from src.data.dataset import SkinLesionDataset, get_train_transform, get_val_transform
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
    image_size = config["data"]["image_size"]

    logger.info(f"Types de lesions: {lesion_types}")
    logger.info(f"Niveaux de gravite: {severity_levels}")

    # Create datasets
    train_dataset = SkinLesionDataset(
        root_dir=str(Path(config["data"]["splits_dir"]) / "train"),
        lesion_types=lesion_types,
        severity_levels=severity_levels,
        transform=get_train_transform(image_size),
    )

    val_dataset = SkinLesionDataset(
        root_dir=str(Path(config["data"]["splits_dir"]) / "val"),
        lesion_types=lesion_types,
        severity_levels=severity_levels,
        transform=get_val_transform(image_size),
    )

    logger.info(f"Train: {len(train_dataset)} images | Val: {len(val_dataset)} images")

    if len(train_dataset) == 0:
        logger.error("Aucune image d'entrainement trouvee. Verifiez le dataset.")
        return

    # Create data loaders
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
    )

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    logger.info(f"Device: {device}")

    # Train
    trainer = Trainer(
        model=model,
        train_loader=train_loader,
        val_loader=val_loader,
        lesion_types=lesion_types,
        severity_levels=severity_levels,
        config=config,
        device=device,
        output_dir=args.output,
    )
    trainer.train()

    # Load best model and export
    best_checkpoint = Path(args.output) / "best_model.pt"
    if best_checkpoint.exists():
        checkpoint = torch.load(best_checkpoint, map_location="cpu")
        model.load_state_dict(checkpoint["model_state_dict"])
        logger.info(f"Meilleur modele charge (val_loss: {checkpoint['best_val_loss']:.4f})")

        export_path = str(Path(config["export"]["output_dir"]) / "model.pt")
        export_to_torchscript(model, export_path, image_size)


if __name__ == "__main__":
    main()
