import torch
import logging
from pathlib import Path

from src.models.hierarchical_model import HierarchicalDermaModel

logger = logging.getLogger(__name__)


def export_to_torchscript(
    model: HierarchicalDermaModel,
    output_path: str,
    image_size: int = 224,
    use_metadata: bool = False,
    metadata_feature_dim: int = 18,
):
    """Export trained model to TorchScript format for serving."""
    model.eval()
    model.cpu()

    dummy_image = torch.randn(1, 3, image_size, image_size)

    if use_metadata:
        dummy_metadata = torch.zeros(1, metadata_feature_dim)
        dummy_input = (dummy_image, dummy_metadata)
    else:
        dummy_input = (dummy_image,)

    try:
        scripted_model = torch.jit.trace(model, dummy_input)

        output_dir = Path(output_path).parent
        output_dir.mkdir(parents=True, exist_ok=True)

        scripted_model.save(output_path)
        logger.info(f"Modele exporte en TorchScript: {output_path}")

        # Verify
        loaded = torch.jit.load(output_path)
        test_output = loaded(*dummy_input)
        logger.info(f"Verification: type_logits shape={test_output[0].shape}, severity_logits shape={test_output[1].shape}")

    except Exception as e:
        logger.error(f"Erreur lors de l'export: {e}")
        raise
