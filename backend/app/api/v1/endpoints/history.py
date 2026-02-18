from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.diagnosis import Diagnosis
from app.schemas.diagnosis import DiagnosisListResponse, DiagnosisStats
from app.services.image_service import ImageService
from app.storage.file_storage import get_storage

router = APIRouter(prefix="/history", tags=["History"])


@router.get("/", response_model=DiagnosisListResponse)
async def get_history(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    offset = (page - 1) * limit

    count_result = await db.execute(
        select(func.count()).select_from(Diagnosis).where(Diagnosis.user_id == current_user.id)
    )
    total = count_result.scalar()

    result = await db.execute(
        select(Diagnosis)
        .where(Diagnosis.user_id == current_user.id)
        .order_by(Diagnosis.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    items = result.scalars().all()

    return DiagnosisListResponse(items=items, total=total, page=page, limit=limit)


@router.get("/stats", response_model=DiagnosisStats)
async def get_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    count_result = await db.execute(
        select(func.count()).select_from(Diagnosis).where(Diagnosis.user_id == current_user.id)
    )
    total = count_result.scalar()

    type_result = await db.execute(
        select(Diagnosis.lesion_type, func.count())
        .where(Diagnosis.user_id == current_user.id)
        .group_by(Diagnosis.lesion_type)
    )
    by_type = {row[0]: row[1] for row in type_result.all()}

    severity_result = await db.execute(
        select(Diagnosis.severity_level, func.count())
        .where(Diagnosis.user_id == current_user.id)
        .group_by(Diagnosis.severity_level)
    )
    by_severity = {row[0]: row[1] for row in severity_result.all()}

    hospital_result = await db.execute(
        select(func.count())
        .select_from(Diagnosis)
        .where(Diagnosis.user_id == current_user.id, Diagnosis.requires_hospital == True)
    )
    hospital_count = hospital_result.scalar()

    return DiagnosisStats(
        total_diagnoses=total,
        by_lesion_type=by_type,
        by_severity=by_severity,
        hospital_required_count=hospital_count,
    )


@router.delete("/{diagnosis_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_diagnosis(
    diagnosis_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Diagnosis).where(
            Diagnosis.id == diagnosis_id,
            Diagnosis.user_id == current_user.id,
        )
    )
    diagnosis = result.scalar_one_or_none()

    if diagnosis is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Diagnostic introuvable",
        )

    storage = get_storage()
    image_service = ImageService(storage)
    await image_service.delete_image(diagnosis.image_path)

    await db.delete(diagnosis)
