import argparse
import logging
import yaml
from pathlib import Path

import torch
from torch.utils.data import DataLoader

from src.data.dataset import SkinLesionDataset, get_val_transform
from src.models.hierarchical_model import HierarchicalDermaModel
from src.evaluation.evaluate import evaluate_model
from src.evaluation.visualize import plot_confusion_matrix, plot_roc_curves

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
    image_size = config["data"]["image_size"]

    # Test dataset
    test_dataset = SkinLesionDataset(
        root_dir=str(Path(config["data"]["splits_dir"]) / "test"),
        lesion_types=lesion_types,
        severity_levels=severity_levels,
        transform=get_val_transform(image_size),
    )

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
    )

    checkpoint = torch.load(args.checkpoint, map_location="cpu")
    model.load_state_dict(checkpoint["model_state_dict"])
    logger.info(f"Checkpoint charge: {args.checkpoint}")

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    # Evaluate
    metrics = evaluate_model(model, test_loader, lesion_types, severity_levels, device)

    # Generate visualizations
    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)

    if "type_confusion_matrix" in metrics:
        plot_confusion_matrix(
            metrics["type_confusion_matrix"].argmax(axis=1) if len(metrics["type_confusion_matrix"].shape) > 1 else [],
            [],
            lesion_types,
            title="Classification du type de lesion",
            output_path=str(output_dir / "type_confusion_matrix.png"),
        )

    logger.info(f"Resultats sauvegardes dans {output_dir}")


if __name__ == "__main__":
    main()
