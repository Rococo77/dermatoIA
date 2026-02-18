import os
import uuid
from abc import ABC, abstractmethod
from pathlib import Path
from typing import BinaryIO

import boto3
from botocore.exceptions import ClientError

from app.core.config import settings


class FileStorage(ABC):
    @abstractmethod
    async def save(self, file: BinaryIO, filename: str, content_type: str) -> str:
        pass

    @abstractmethod
    async def delete(self, file_path: str) -> bool:
        pass

    @abstractmethod
    async def get_url(self, file_path: str) -> str:
        pass


class LocalFileStorage(FileStorage):
    def __init__(self):
        self.base_path = Path(settings.STORAGE_LOCAL_PATH)
        self.base_path.mkdir(parents=True, exist_ok=True)

    async def save(self, file: BinaryIO, filename: str, content_type: str) -> str:
        ext = Path(filename).suffix
        unique_name = f"{uuid.uuid4()}{ext}"
        file_path = self.base_path / unique_name

        with open(file_path, "wb") as f:
            content = file.read()
            f.write(content)

        return str(unique_name)

    async def delete(self, file_path: str) -> bool:
        full_path = self.base_path / file_path
        if full_path.exists():
            full_path.unlink()
            return True
        return False

    async def get_url(self, file_path: str) -> str:
        return f"/uploads/{file_path}"


class S3FileStorage(FileStorage):
    def __init__(self):
        self.s3_client = boto3.client(
            "s3",
            endpoint_url=settings.S3_ENDPOINT_URL,
            aws_access_key_id=settings.S3_ACCESS_KEY,
            aws_secret_access_key=settings.S3_SECRET_KEY,
        )
        self.bucket_name = settings.S3_BUCKET_NAME
        self._ensure_bucket()

    def _ensure_bucket(self):
        try:
            self.s3_client.head_bucket(Bucket=self.bucket_name)
        except ClientError:
            self.s3_client.create_bucket(Bucket=self.bucket_name)

    async def save(self, file: BinaryIO, filename: str, content_type: str) -> str:
        ext = Path(filename).suffix
        unique_name = f"{uuid.uuid4()}{ext}"

        self.s3_client.upload_fileobj(
            file,
            self.bucket_name,
            unique_name,
            ExtraArgs={"ContentType": content_type},
        )

        return unique_name

    async def delete(self, file_path: str) -> bool:
        try:
            self.s3_client.delete_object(Bucket=self.bucket_name, Key=file_path)
            return True
        except ClientError:
            return False

    async def get_url(self, file_path: str) -> str:
        return self.s3_client.generate_presigned_url(
            "get_object",
            Params={"Bucket": self.bucket_name, "Key": file_path},
            ExpiresIn=3600,
        )


def get_storage() -> FileStorage:
    if settings.STORAGE_TYPE == "s3":
        return S3FileStorage()
    return LocalFileStorage()
