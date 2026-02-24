import torch
import torch.nn as nn
import timm
from typing import Tuple


# ---------------------------------------------------------------------------
# Squeeze-and-Excitation block (channel attention)
# ---------------------------------------------------------------------------

class SEBlock(nn.Module):
    """Squeeze-and-Excitation: recalibrates channel-wise feature responses."""

    def __init__(self, channels: int, reduction: int = 16):
        super().__init__()
        self.pool = nn.AdaptiveAvgPool2d(1)
        self.fc = nn.Sequential(
            nn.Linear(channels, channels // reduction, bias=False),
            nn.ReLU(inplace=True),
            nn.Linear(channels // reduction, channels, bias=False),
            nn.Sigmoid(),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        b, c, _, _ = x.shape
        w = self.pool(x).view(b, c)
        w = self.fc(w).view(b, c, 1, 1)
        return x * w


# ---------------------------------------------------------------------------
# Residual block with BN + optional SE + optional downsampling
# ---------------------------------------------------------------------------

class ResidualBlock(nn.Module):

    def __init__(self, in_ch: int, out_ch: int, stride: int = 1, use_se: bool = True):
        super().__init__()
        self.conv1 = nn.Conv2d(in_ch, out_ch, 3, stride=stride, padding=1, bias=False)
        self.bn1 = nn.BatchNorm2d(out_ch)
        self.conv2 = nn.Conv2d(out_ch, out_ch, 3, stride=1, padding=1, bias=False)
        self.bn2 = nn.BatchNorm2d(out_ch)
        self.relu = nn.ReLU(inplace=True)
        self.se = SEBlock(out_ch) if use_se else nn.Identity()

        self.downsample = None
        if stride != 1 or in_ch != out_ch:
            self.downsample = nn.Sequential(
                nn.Conv2d(in_ch, out_ch, 1, stride=stride, bias=False),
                nn.BatchNorm2d(out_ch),
            )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        identity = x
        out = self.relu(self.bn1(self.conv1(x)))
        out = self.bn2(self.conv2(out))
        out = self.se(out)
        if self.downsample is not None:
            identity = self.downsample(x)
        out += identity
        return self.relu(out)


# ---------------------------------------------------------------------------
# DermaCNN — custom architecture for 224x224 dermoscopy images
# ---------------------------------------------------------------------------

class DermaCNN(nn.Module):
    """
    Custom CNN for dermoscopy classification.

    Architecture:
        Stem (7x7 conv stride 2, maxpool) -> 56x56
        Stage 1: 2x ResidualBlock  64ch   56x56
        Stage 2: 2x ResidualBlock 128ch   28x28
        Stage 3: 2x ResidualBlock 256ch   14x14
        Stage 4: 2x ResidualBlock 512ch    7x7
        Global Average Pool -> 512-dim feature vector

    ~5M parameters. SE attention in every block.
    Exposes .num_features = 512 (same convention as timm).
    """

    def __init__(self):
        super().__init__()
        self.num_features = 512

        # Stem: 224 -> 112 -> 56
        self.stem = nn.Sequential(
            nn.Conv2d(3, 64, kernel_size=7, stride=2, padding=3, bias=False),
            nn.BatchNorm2d(64),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(kernel_size=3, stride=2, padding=1),
        )

        # Stage 1: 56x56, 64ch
        self.stage1 = nn.Sequential(
            ResidualBlock(64, 64),
            ResidualBlock(64, 64),
        )

        # Stage 2: 56->28, 128ch
        self.stage2 = nn.Sequential(
            ResidualBlock(64, 128, stride=2),
            ResidualBlock(128, 128),
        )

        # Stage 3: 28->14, 256ch
        self.stage3 = nn.Sequential(
            ResidualBlock(128, 256, stride=2),
            ResidualBlock(256, 256),
        )

        # Stage 4: 14->7, 512ch
        self.stage4 = nn.Sequential(
            ResidualBlock(256, 512, stride=2),
            ResidualBlock(512, 512),
        )

        self.pool = nn.AdaptiveAvgPool2d(1)

        self._init_weights()

    def _init_weights(self):
        for m in self.modules():
            if isinstance(m, nn.Conv2d):
                nn.init.kaiming_normal_(m.weight, mode="fan_out", nonlinearity="relu")
            elif isinstance(m, nn.BatchNorm2d):
                nn.init.constant_(m.weight, 1)
                nn.init.constant_(m.bias, 0)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x = self.stem(x)
        x = self.stage1(x)
        x = self.stage2(x)
        x = self.stage3(x)
        x = self.stage4(x)
        x = self.pool(x)
        return x.flatten(1)  # (B, 512)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def get_backbone(name: str = "efficientnet_b4", pretrained: bool = True) -> Tuple[nn.Module, int]:
    """
    Returns (backbone_module, feature_dim).
    Supports all timm model names + 'custom_cnn'.
    """
    if name == "custom_cnn":
        model = DermaCNN()
        return model, model.num_features

    model = timm.create_model(name, pretrained=pretrained, num_classes=0)
    return model, model.num_features
