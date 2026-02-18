import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel


class DiagnosisResponse(BaseModel):
    id: uuid.UUID
    lesion_type: str
    lesion_type_confidence: float
    severity_level: str
    severity_confidence: float
    recommendation: str
    requires_hospital: bool
    model_version: str
    image_path: str
    created_at: datetime

    model_config = {"from_attributes": True}


class DiagnosisListResponse(BaseModel):
    items: List[DiagnosisResponse]
    total: int
    page: int
    limit: int


class DiagnosisStats(BaseModel):
    total_diagnoses: int
    by_lesion_type: dict
    by_severity: dict
    hospital_required_count: int
