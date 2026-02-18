import torch
import numpy as np
from typing import Dict, List
from sklearn.metrics import (
    accuracy_score,
    f1_score,
    roc_auc_score,
    confusion_matrix,
)


class MetricsCalculator:
    def __init__(self, lesion_types: List[str], severity_levels: List[str]):
        self.lesion_types = lesion_types
        self.severity_levels = severity_levels

    def compute(
        self,
        type_preds: np.ndarray,
        type_targets: np.ndarray,
        severity_preds: np.ndarray,
        severity_targets: np.ndarray,
        type_probs: np.ndarray = None,
        severity_probs: np.ndarray = None,
    ) -> Dict:
        metrics = {}

        # Type metrics
        metrics["type_accuracy"] = accuracy_score(type_targets, type_preds)
        metrics["type_f1_weighted"] = f1_score(type_targets, type_preds, average="weighted", zero_division=0)
        metrics["type_f1_macro"] = f1_score(type_targets, type_preds, average="macro", zero_division=0)

        # Severity metrics
        metrics["severity_accuracy"] = accuracy_score(severity_targets, severity_preds)
        metrics["severity_f1_weighted"] = f1_score(severity_targets, severity_preds, average="weighted", zero_division=0)
        metrics["severity_f1_macro"] = f1_score(severity_targets, severity_preds, average="macro", zero_division=0)

        # AUC if probabilities are given
        if type_probs is not None:
            try:
                metrics["type_auc"] = roc_auc_score(
                    type_targets, type_probs, multi_class="ovr", average="weighted"
                )
            except ValueError:
                metrics["type_auc"] = 0.0

        if severity_probs is not None:
            try:
                metrics["severity_auc"] = roc_auc_score(
                    severity_targets, severity_probs, multi_class="ovr", average="weighted"
                )
            except ValueError:
                metrics["severity_auc"] = 0.0

        # Confusion matrices
        metrics["type_confusion_matrix"] = confusion_matrix(
            type_targets, type_preds, labels=list(range(len(self.lesion_types)))
        )
        metrics["severity_confusion_matrix"] = confusion_matrix(
            severity_targets, severity_preds, labels=list(range(len(self.severity_levels)))
        )

        return metrics


class AverageMeter:
    """Track running average of a metric."""

    def __init__(self):
        self.reset()

    def reset(self):
        self.val = 0
        self.avg = 0
        self.sum = 0
        self.count = 0

    def update(self, val: float, n: int = 1):
        self.val = val
        self.sum += val * n
        self.count += n
        self.avg = self.sum / self.count
