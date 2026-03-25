"""
Model definitions for real vs AI-generated image classification.

- get_resnet50_baseline: ResNet-50 with 2-class head (real vs fake).
"""

import torch
import torch.nn as nn
from torchvision.models import resnet50, ResNet50_Weights


def get_resnet50_baseline(
    num_classes: int = 2,
    pretrained: bool = True,
    freeze_backbone: bool = False,
) -> nn.Module:
    """
    Create a ResNet-50 model for real vs AI-generated image classification.

    Args:
        num_classes: number of output classes (default 2: real / fake).
        pretrained: whether to use ImageNet-1K pretrained weights.
        freeze_backbone: if True, freeze all convolutional layers
                         and only train the final FC layer.

    Returns:
        torch.nn.Module: a ResNet-50 model with modified final FC layer.
    """
    if pretrained:
        weights = ResNet50_Weights.IMAGENET1K_V1
    else:
        weights = None

    model = resnet50(weights=weights)

    # Replace the final FC layer with num_classes outputs
    in_features = model.fc.in_features
    model.fc = nn.Linear(in_features, num_classes)

    if freeze_backbone:
        for name, param in model.named_parameters():
            if not name.startswith("fc."):
                param.requires_grad = False

    return model


def count_trainable_parameters(model: nn.Module) -> int:
    """Return the number of trainable parameters."""
    return sum(p.numel() for p in model.parameters() if p.requires_grad)
