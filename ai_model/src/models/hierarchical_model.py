import torch
import torch.nn as nn

from src.models.backbones import get_backbone


class HierarchicalDermaModel(nn.Module):
    """
    Hierarchical classification model for skin lesion analysis.
    Stage 1: Classify lesion type (melanoma, eczema, psoriasis, etc.)
    Stage 2: Evaluate severity conditioned on predicted type.
    """

    def __init__(
        self,
        num_types: int,
        num_severity_levels: int = 4,
        backbone_name: str = "efficientnet_b4",
        pretrained: bool = True,
        type_hidden_dim: int = 512,
        severity_hidden_dim: int = 256,
        type_embedding_dim: int = 64,
        dropout: float = 0.3,
    ):
        super().__init__()
        self.num_types = num_types
        self.num_severity_levels = num_severity_levels

        # Shared backbone
        self.backbone, feature_dim = get_backbone(backbone_name, pretrained)

        # Head 1: Lesion type classification
        self.type_head = nn.Sequential(
            nn.Linear(feature_dim, type_hidden_dim),
            nn.ReLU(inplace=True),
            nn.Dropout(dropout),
            nn.Linear(type_hidden_dim, num_types),
        )

        # Type embedding for conditioning severity head
        self.type_embedding = nn.Embedding(num_types, type_embedding_dim)

        # Head 2: Severity classification (conditioned on type)
        self.severity_head = nn.Sequential(
            nn.Linear(feature_dim + type_embedding_dim, severity_hidden_dim),
            nn.ReLU(inplace=True),
            nn.Dropout(dropout),
            nn.Linear(severity_hidden_dim, num_severity_levels),
        )

    def forward(self, x: torch.Tensor) -> tuple:
        # Extract features from backbone
        features = self.backbone(x)

        # Type classification
        type_logits = self.type_head(features)

        # Get predicted type for conditioning
        type_pred = type_logits.argmax(dim=1)
        type_embed = self.type_embedding(type_pred)

        # Severity classification conditioned on type
        severity_input = torch.cat([features, type_embed], dim=1)
        severity_logits = self.severity_head(severity_input)

        return type_logits, severity_logits

    def freeze_backbone(self):
        for param in self.backbone.parameters():
            param.requires_grad = False

    def unfreeze_backbone(self):
        for param in self.backbone.parameters():
            param.requires_grad = True
