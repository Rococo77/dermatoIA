from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db, get_current_user
from app.core.security import hash_password, verify_password
from app.models.user import User
from app.schemas.user import UserResponse, UserUpdateRequest, PasswordChangeRequest
from app.storage.file_storage import get_storage
from app.services.image_service import ImageService

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserResponse)
async def get_profile(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=UserResponse)
async def update_profile(
    request: UserUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if request.full_name is not None:
        current_user.full_name = request.full_name
    if request.email is not None:
        current_user.email = request.email

    await db.flush()
    await db.refresh(current_user)
    return current_user


@router.put("/me/password")
async def change_password(
    request: PasswordChangeRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not verify_password(request.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mot de passe actuel incorrect",
        )

    if len(request.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le nouveau mot de passe doit contenir au moins 8 caracteres",
        )

    current_user.hashed_password = hash_password(request.new_password)
    await db.flush()

    return {"message": "Mot de passe modifie avec succes"}


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
async def delete_account(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    storage = get_storage()
    image_service = ImageService(storage)
    for diagnosis in current_user.diagnoses:
        await image_service.delete_image(diagnosis.image_path)

    await db.delete(current_user)
