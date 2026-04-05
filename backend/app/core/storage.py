from __future__ import annotations
import shutil
from pathlib import Path, PurePosixPath
import boto3
from botocore.exceptions import ClientError
from app.core.config import settings
from app.core.security import create_storage_token
class StorageService:
    def __init__(self) -> None:
        self.bucket = settings.s3_bucket or "local"
        self.local_root = Path(settings.local_temp_dir) / "storage"
        self.client = None
        if settings.use_s3_storage:
            self.client = boto3.client(
                "s3",
                endpoint_url=settings.s3_endpoint_url,
                aws_access_key_id=settings.aws_access_key_id or None,
                aws_secret_access_key=settings.aws_secret_access_key or None,
                region_name=settings.aws_region,
                use_ssl=settings.s3_use_ssl,
            )
    @property
    def uses_local_storage(self) -> bool:
        return self.client is None
    def ensure_bucket(self) -> None:
        if self.uses_local_storage:
            self.local_root.mkdir(parents=True, exist_ok=True)
            return
        try:
            self.client.head_bucket(Bucket=self.bucket)
        except ClientError:
            create_kwargs = {"Bucket": self.bucket}
            if settings.aws_region != "us-east-1":
                create_kwargs["CreateBucketConfiguration"] = {
                    "LocationConstraint": settings.aws_region
                }
            self.client.create_bucket(**create_kwargs)
    def resolve_local_path(self, key: str) -> Path:
        normalized_key = PurePosixPath(key)
        if normalized_key.is_absolute() or any(part in {"..", ""} for part in normalized_key.parts):
            raise ValueError("Invalid storage key")
        return self.local_root.joinpath(*normalized_key.parts)
    def upload_file(
        self,
        local_path: str | Path,
        key: str,
        content_type: str | None = None,
    ) -> str:
        if self.uses_local_storage:
            destination = self.resolve_local_path(key)
            destination.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(Path(local_path), destination)
            return key
        extra_args = {"ContentType": content_type} if content_type else None
        self.client.upload_file(
            Filename=str(local_path),
            Bucket=self.bucket,
            Key=key,
            ExtraArgs=extra_args or {},
        )
        return key
    def upload_bytes(self, data: bytes, key: str, content_type: str = "application/octet-stream") -> str:
        if self.uses_local_storage:
            destination = self.resolve_local_path(key)
            destination.parent.mkdir(parents=True, exist_ok=True)
            destination.write_bytes(data)
            return key
        self.client.put_object(Bucket=self.bucket, Key=key, Body=data, ContentType=content_type)
        return key
    def download_file(self, key: str, destination: str | Path) -> Path:
        destination_path = Path(destination)
        destination_path.parent.mkdir(parents=True, exist_ok=True)
        if self.uses_local_storage:
            shutil.copy2(self.resolve_local_path(key), destination_path)
            return destination_path
        self.client.download_file(self.bucket, key, str(destination_path))
        return destination_path
    def download_bytes(self, key: str) -> bytes:
        if self.uses_local_storage:
            return self.resolve_local_path(key).read_bytes()
        response = self.client.get_object(Bucket=self.bucket, Key=key)
        return response["Body"].read()
    def generate_presigned_url(self, key: str, expires_in: int = 3600) -> str:
        if self.uses_local_storage:
            token = create_storage_token(key, expires_in=expires_in)
            return f"{settings.api_v1_prefix}/storage/download?token={token}"
        return self.client.generate_presigned_url(
            "get_object",
            Params={"Bucket": self.bucket, "Key": key},
            ExpiresIn=expires_in,
        )
