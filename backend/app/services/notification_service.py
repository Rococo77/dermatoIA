import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import Notification


class NotificationService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_notification(
        self,
        user_id: uuid.UUID,
        title: str,
        body: str,
        notification_type: str,
        diagnosis_id: Optional[uuid.UUID] = None,
        scheduled_at: Optional[datetime] = None,
    ) -> Notification:
        notification = Notification(
            user_id=user_id,
            diagnosis_id=diagnosis_id,
            title=title,
            body=body,
            notification_type=notification_type,
            scheduled_at=scheduled_at,
        )
        self.db.add(notification)
        await self.db.flush()
        return notification

    async def schedule_follow_up(
        self,
        user_id: uuid.UUID,
        diagnosis_id: uuid.UUID,
        severity_level: str,
    ):
        if severity_level in ("high", "critical"):
            delay = timedelta(hours=24)
            title = "Rappel: Consultation recommandee"
            body = "Votre diagnostic recent indique une condition necessitant une attention medicale. Avez-vous pris rendez-vous?"
        elif severity_level == "medium":
            delay = timedelta(days=7)
            title = "Suivi de votre diagnostic"
            body = "Comment evolue votre condition? N'hesitez pas a reprendre une photo pour suivre l'evolution."
        else:
            return

        scheduled_at = datetime.now(timezone.utc) + delay
        await self.create_notification(
            user_id=user_id,
            title=title,
            body=body,
            notification_type="follow_up",
            diagnosis_id=diagnosis_id,
            scheduled_at=scheduled_at,
        )
