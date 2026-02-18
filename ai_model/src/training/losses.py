import torch
import torch.nn as nn
from typing import Optional


class HierarchicalLoss(nn.Module):
    """
    Combined loss for hierarchical classification.
    Loss = alpha * CrossEntropy(type) + beta * CrossEntropy(severity)
    Supports class weights to handle imbalanced datasets.
    """

    def __init__(
        self,
        alpha: float = 1.0,
        beta: float = 1.0,
        type_weights: Optional[torch.Tensor] = None,
        severity_weights: Optional[torch.Tensor] = None,
    ):
        super().__init__()
        self.alpha = alpha
        self.beta = beta
        self.type_loss_fn = nn.CrossEntropyLoss(weight=type_weights)
        self.severity_loss_fn = nn.CrossEntropyLoss(weight=severity_weights)

    def forward(
        self,
        type_logits: torch.Tensor,
        severity_logits: torch.Tensor,
        type_targets: torch.Tensor,
        severity_targets: torch.Tensor,
    ) -> dict:
        type_loss = self.type_loss_fn(type_logits, type_targets)
        severity_loss = self.severity_loss_fn(severity_logits, severity_targets)
        total_loss = self.alpha * type_loss + self.beta * severity_loss

        return {
            "total_loss": total_loss,
            "type_loss": type_loss,
            "severity_loss": severity_loss,
        }
