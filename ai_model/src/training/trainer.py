import os
import logging
from pathlib import Path
from typing import Dict, List, Optional

import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from torch.utils.tensorboard import SummaryWriter
import numpy as np
from tqdm import tqdm

from src.training.losses import HierarchicalLoss
from src.training.metrics import MetricsCalculator, AverageMeter

logger = logging.getLogger(__name__)


class Trainer:
    def __init__(
        self,
        model: nn.Module,
        train_loader: DataLoader,
        val_loader: DataLoader,
        lesion_types: List[str],
        severity_levels: List[str],
        config: dict,
        device: torch.device = None,
        output_dir: str = "outputs",
    ):
        self.model = model
        self.train_loader = train_loader
        self.val_loader = val_loader
        self.config = config
        self.device = device or torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)

        self.model.to(self.device)

        self.metrics_calculator = MetricsCalculator(lesion_types, severity_levels)

        # Loss function
        self.criterion = HierarchicalLoss(
            alpha=config["training"]["loss_alpha"],
            beta=config["training"]["loss_beta"],
        )

        # Tensorboard
        self.writer = SummaryWriter(log_dir=str(self.output_dir / "logs"))

        self.best_val_loss = float("inf")
        self.patience_counter = 0

    def _create_optimizer(self, lr: float):
        return torch.optim.AdamW(
            filter(lambda p: p.requires_grad, self.model.parameters()),
            lr=lr,
            weight_decay=self.config["training"]["weight_decay"],
        )

    def _create_scheduler(self, optimizer, epochs: int):
        return torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs)

    def train_epoch(self, optimizer) -> Dict:
        self.model.train()
        loss_meter = AverageMeter()

        all_type_preds = []
        all_type_targets = []
        all_severity_preds = []
        all_severity_targets = []

        pbar = tqdm(self.train_loader, desc="Training")
        for images, type_labels, severity_labels in pbar:
            images = images.to(self.device)
            type_labels = type_labels.to(self.device)
            severity_labels = severity_labels.to(self.device)

            optimizer.zero_grad()
            type_logits, severity_logits = self.model(images)

            losses = self.criterion(type_logits, severity_logits, type_labels, severity_labels)
            losses["total_loss"].backward()
            optimizer.step()

            loss_meter.update(losses["total_loss"].item(), images.size(0))

            all_type_preds.extend(type_logits.argmax(dim=1).cpu().numpy())
            all_type_targets.extend(type_labels.cpu().numpy())
            all_severity_preds.extend(severity_logits.argmax(dim=1).cpu().numpy())
            all_severity_targets.extend(severity_labels.cpu().numpy())

            pbar.set_postfix(loss=f"{loss_meter.avg:.4f}")

        metrics = self.metrics_calculator.compute(
            np.array(all_type_preds),
            np.array(all_type_targets),
            np.array(all_severity_preds),
            np.array(all_severity_targets),
        )
        metrics["loss"] = loss_meter.avg
        return metrics

    @torch.no_grad()
    def validate(self) -> Dict:
        self.model.eval()
        loss_meter = AverageMeter()

        all_type_preds = []
        all_type_targets = []
        all_severity_preds = []
        all_severity_targets = []
        all_type_probs = []
        all_severity_probs = []

        for images, type_labels, severity_labels in tqdm(self.val_loader, desc="Validation"):
            images = images.to(self.device)
            type_labels = type_labels.to(self.device)
            severity_labels = severity_labels.to(self.device)

            type_logits, severity_logits = self.model(images)

            losses = self.criterion(type_logits, severity_logits, type_labels, severity_labels)
            loss_meter.update(losses["total_loss"].item(), images.size(0))

            type_probs = torch.softmax(type_logits, dim=1)
            severity_probs = torch.softmax(severity_logits, dim=1)

            all_type_preds.extend(type_logits.argmax(dim=1).cpu().numpy())
            all_type_targets.extend(type_labels.cpu().numpy())
            all_severity_preds.extend(severity_logits.argmax(dim=1).cpu().numpy())
            all_severity_targets.extend(severity_labels.cpu().numpy())
            all_type_probs.extend(type_probs.cpu().numpy())
            all_severity_probs.extend(severity_probs.cpu().numpy())

        metrics = self.metrics_calculator.compute(
            np.array(all_type_preds),
            np.array(all_type_targets),
            np.array(all_severity_preds),
            np.array(all_severity_targets),
            np.array(all_type_probs),
            np.array(all_severity_probs),
        )
        metrics["loss"] = loss_meter.avg
        return metrics

    def _log_metrics(self, metrics: Dict, phase: str, epoch: int):
        for key, value in metrics.items():
            if isinstance(value, (int, float)):
                self.writer.add_scalar(f"{phase}/{key}", value, epoch)

    def _check_early_stopping(self, val_loss: float) -> bool:
        patience = self.config["training"]["early_stopping_patience"]
        if val_loss < self.best_val_loss:
            self.best_val_loss = val_loss
            self.patience_counter = 0
            self._save_checkpoint("best_model.pt")
            return False
        else:
            self.patience_counter += 1
            if self.patience_counter >= patience:
                logger.info(f"Early stopping apres {self.patience_counter} epochs sans amelioration")
                return True
            return False

    def _save_checkpoint(self, filename: str):
        path = self.output_dir / filename
        torch.save({
            "model_state_dict": self.model.state_dict(),
            "best_val_loss": self.best_val_loss,
        }, path)
        logger.info(f"Checkpoint sauvegarde: {path}")

    def train(self):
        # Phase 1: Frozen backbone
        phase1 = self.config["training"]["phase1"]
        logger.info("=== Phase 1: Backbone gele ===")
        self.model.freeze_backbone()
        optimizer = self._create_optimizer(phase1["lr"])
        scheduler = self._create_scheduler(optimizer, phase1["epochs"])

        for epoch in range(phase1["epochs"]):
            logger.info(f"Epoch {epoch + 1}/{phase1['epochs']}")

            train_metrics = self.train_epoch(optimizer)
            val_metrics = self.validate()
            scheduler.step()

            self._log_metrics(train_metrics, "train", epoch)
            self._log_metrics(val_metrics, "val", epoch)

            logger.info(
                f"Train Loss: {train_metrics['loss']:.4f} | "
                f"Val Loss: {val_metrics['loss']:.4f} | "
                f"Type Acc: {val_metrics['type_accuracy']:.4f} | "
                f"Sev Acc: {val_metrics['severity_accuracy']:.4f}"
            )

            if self._check_early_stopping(val_metrics["loss"]):
                break

        # Phase 2: Unfrozen backbone
        phase2 = self.config["training"]["phase2"]
        logger.info("=== Phase 2: Fine-tuning complet ===")
        self.model.unfreeze_backbone()
        optimizer = self._create_optimizer(phase2["lr"])
        scheduler = self._create_scheduler(optimizer, phase2["epochs"])
        self.patience_counter = 0

        for epoch in range(phase2["epochs"]):
            global_epoch = phase1["epochs"] + epoch
            logger.info(f"Epoch {epoch + 1}/{phase2['epochs']} (global: {global_epoch + 1})")

            train_metrics = self.train_epoch(optimizer)
            val_metrics = self.validate()
            scheduler.step()

            self._log_metrics(train_metrics, "train", global_epoch)
            self._log_metrics(val_metrics, "val", global_epoch)

            logger.info(
                f"Train Loss: {train_metrics['loss']:.4f} | "
                f"Val Loss: {val_metrics['loss']:.4f} | "
                f"Type Acc: {val_metrics['type_accuracy']:.4f} | "
                f"Sev Acc: {val_metrics['severity_accuracy']:.4f}"
            )

            if self._check_early_stopping(val_metrics["loss"]):
                break

        self.writer.close()
        logger.info("Entrainement termine.")
