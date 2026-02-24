import logging
from pathlib import Path
from typing import List, Dict

import torch
import numpy as np
from torch.utils.data import DataLoader
from tqdm import tqdm

from src.models.hierarchical_model import HierarchicalDermaModel
from src.training.metrics import MetricsCalculator

logger = logging.getLogger(__name__)


def evaluate_model(
    model: HierarchicalDermaModel,
    test_loader: DataLoader,
    lesion_types: List[str],
    severity_levels: List[str],
    device: torch.device = None,
) -> Dict:
    device = device or torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model.to(device)
    model.eval()

    calculator = MetricsCalculator(lesion_types, severity_levels)

    all_type_preds = []
    all_type_targets = []
    all_severity_preds = []
    all_severity_targets = []
    all_type_probs = []
    all_severity_probs = []

    with torch.no_grad():
        for images, type_labels, severity_labels, metadata in tqdm(test_loader, desc="Evaluation"):
            images = images.to(device)
            metadata = metadata.to(device)

            type_logits, severity_logits = model(images, metadata)

            type_probs = torch.softmax(type_logits, dim=1)
            severity_probs = torch.softmax(severity_logits, dim=1)

            all_type_preds.extend(type_logits.argmax(dim=1).cpu().numpy())
            all_type_targets.extend(type_labels.numpy())
            all_severity_preds.extend(severity_logits.argmax(dim=1).cpu().numpy())
            all_severity_targets.extend(severity_labels.numpy())
            all_type_probs.extend(type_probs.cpu().numpy())
            all_severity_probs.extend(severity_probs.cpu().numpy())

    metrics = calculator.compute(
        np.array(all_type_preds),
        np.array(all_type_targets),
        np.array(all_severity_preds),
        np.array(all_severity_targets),
        np.array(all_type_probs),
        np.array(all_severity_probs),
    )

    print("\n=== Resultats d'evaluation ===")
    print(f"Type Accuracy:      {metrics['type_accuracy']:.4f}")
    print(f"Type F1 (weighted):  {metrics['type_f1_weighted']:.4f}")
    print(f"Type F1 (macro):     {metrics['type_f1_macro']:.4f}")
    print(f"Type AUC:            {metrics.get('type_auc', 'N/A')}")
    print(f"Melanoma Sensitivity:{metrics.get('melanoma_sensitivity', 'N/A')}")
    print(f"Severity Accuracy:   {metrics['severity_accuracy']:.4f}")
    print(f"Severity F1:         {metrics['severity_f1_weighted']:.4f}")
    print(f"Severity AUC:        {metrics.get('severity_auc', 'N/A')}")

    return metrics
