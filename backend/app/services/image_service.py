import io
from PIL import Image

from fastapi import UploadFile, HTTPException, status

from app.storage.file_storage import FileStorage

ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


class ImageService:
    def __init__(self, storage: FileStorage):
        self.storage = storage

    async def validate_and_save(self, file: UploadFile) -> str:
        if file.content_type not in ALLOWED_MIME_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Type de fichier non supporte. Types acceptes: {', '.join(ALLOWED_MIME_TYPES)}",
            )

        content = await file.read()
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Fichier trop volumineux. Taille maximale: {MAX_FILE_SIZE // (1024*1024)} MB",
            )

        try:
            img = Image.open(io.BytesIO(content))
            img.verify()
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Le fichier n'est pas une image valide",
            )

        file_obj = io.BytesIO(content)
        path = await self.storage.save(file_obj, file.filename or "image.jpg", file.content_type)
        return path

    async def delete_image(self, image_path: str) -> bool:
        return await self.storage.delete(image_path)
