import io
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from PIL import Image

from app.core.config import settings
from app.core.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.diagnosis import Diagnosis
from app.schemas.diagnosis import DiagnosisResponse
from app.services.image_service import ImageService
from app.services.recommendation_service import RecommendationService
from app.storage.file_storage import get_storage

router = APIRouter(prefix="/diagnosis", tags=["Diagnosis"])


@router.post("/", response_model=DiagnosisResponse, status_code=status.HTTP_201_CREATED)
async def create_diagnosis(
    request: Request,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    storage = get_storage()
    image_service = ImageService(storage)

    content = await file.read()
    await file.seek(0)

    image_path = await image_service.validate_and_save(file)

    # Inference dans le thread pool pour ne pas bloquer la boucle asyncio
    inference_service = request.app.state.inference_service
    pil_image = Image.open(io.BytesIO(content))
    prediction = await inference_service.predict_async(pil_image)

    rec_service = RecommendationService()
    rec = rec_service.generate(prediction["lesion_type"], prediction["severity_level"])

    diagnosis = Diagnosis(
        user_id=current_user.id,
        image_path=image_path,
        lesion_type=prediction["lesion_type"],
        lesion_type_confidence=prediction["lesion_type_confidence"],
        severity_level=prediction["severity_level"],
        severity_confidence=prediction["severity_confidence"],
        recommendation=rec["recommendation"],
        requires_hospital=rec["requires_hospital"],
        model_version=settings.MODEL_VERSION,
    )
    db.add(diagnosis)
    await db.flush()
    await db.refresh(diagnosis)

    return diagnosis


@router.get("/{diagnosis_id}", response_model=DiagnosisResponse)
async def get_diagnosis(
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

    return diagnosis


@router.get("/latest/", response_model=DiagnosisResponse)
async def get_latest_diagnosis(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Diagnosis)
        .where(Diagnosis.user_id == current_user.id)
        .order_by(Diagnosis.created_at.desc())
        .limit(1)
    )
    diagnosis = result.scalar_one_or_none()

    if diagnosis is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aucun diagnostic trouve",
        )

    return diagnosis
