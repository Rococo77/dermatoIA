import torch
import torch.nn as nn
import timm


def get_backbone(name: str = "efficientnet_b4", pretrained: bool = True):
    model = timm.create_model(name, pretrained=pretrained, num_classes=0)
    feature_dim = model.num_features
    return model, feature_dim
