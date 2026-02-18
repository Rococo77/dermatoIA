from pathlib import Path
from typing import List

import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import confusion_matrix, roc_curve, auc


def plot_confusion_matrix(
    targets: np.ndarray,
    preds: np.ndarray,
    class_names: List[str],
    title: str = "Matrice de confusion",
    output_path: str = None,
):
    cm = confusion_matrix(targets, preds, labels=list(range(len(class_names))))
    cm_normalized = cm.astype("float") / cm.sum(axis=1, keepdims=True)

    fig, axes = plt.subplots(1, 2, figsize=(20, 8))

    # Raw counts
    sns.heatmap(
        cm, annot=True, fmt="d", cmap="Blues",
        xticklabels=class_names, yticklabels=class_names,
        ax=axes[0],
    )
    axes[0].set_title(f"{title} (counts)")
    axes[0].set_ylabel("Vrai label")
    axes[0].set_xlabel("Label predit")

    # Normalized
    sns.heatmap(
        cm_normalized, annot=True, fmt=".2f", cmap="Blues",
        xticklabels=class_names, yticklabels=class_names,
        ax=axes[1],
    )
    axes[1].set_title(f"{title} (normalise)")
    axes[1].set_ylabel("Vrai label")
    axes[1].set_xlabel("Label predit")

    plt.tight_layout()

    if output_path:
        Path(output_path).parent.mkdir(parents=True, exist_ok=True)
        plt.savefig(output_path, dpi=150, bbox_inches="tight")

    plt.close()


def plot_roc_curves(
    targets: np.ndarray,
    probs: np.ndarray,
    class_names: List[str],
    title: str = "Courbes ROC",
    output_path: str = None,
):
    n_classes = len(class_names)
    fig, ax = plt.subplots(figsize=(10, 8))

    for i in range(n_classes):
        binary_targets = (targets == i).astype(int)
        if binary_targets.sum() == 0:
            continue

        fpr, tpr, _ = roc_curve(binary_targets, probs[:, i])
        roc_auc = auc(fpr, tpr)
        ax.plot(fpr, tpr, label=f"{class_names[i]} (AUC = {roc_auc:.3f})")

    ax.plot([0, 1], [0, 1], "k--", label="Random")
    ax.set_xlabel("Taux de faux positifs")
    ax.set_ylabel("Taux de vrais positifs")
    ax.set_title(title)
    ax.legend(loc="lower right")
    ax.grid(True, alpha=0.3)

    plt.tight_layout()

    if output_path:
        Path(output_path).parent.mkdir(parents=True, exist_ok=True)
        plt.savefig(output_path, dpi=150, bbox_inches="tight")

    plt.close()
