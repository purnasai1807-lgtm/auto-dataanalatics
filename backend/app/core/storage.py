from __future__ import annotations
from pathlib import Path
import boto3
from botocore.exceptions import ClientError
from app.core.config import settings
class StorageService:
    def __init__(self) -> None:
        self.client = boto3.client(
            "s3",
            endpoint_url=settings.s3_endpoint_url,
            aws_access_key_id=settings.aws_access_key_id,
            aws_secret_access_key=settings.aws_secret_access_key,
            region_name=settings.aws_region,
            use_ssl=settings.s3_use_ssl,
        )
        self.bucket = settings.s3_bucket
    def ensure_bucket(self) -> None:
        try:
            self.client.head_bucket(Bucket=self.bucket)
        except ClientError:
            create_kwargs = {"Bucket": self.bucket}
            if settings.aws_region != "us-east-1":
                create_kwargs["CreateBucketConfiguration"] = {
                    "LocationConstraint": settings.aws_region
                }
            self.client.create_bucket(**create_kwargs)
    def upload_file(
        self,
        local_path: str | Path,
        key: str,
        content_type: str | None = None,
    ) -> str:
        extra_args = {"ContentType": content_type} if content_type else None
        self.client.upload_file(
            Filename=str(local_path),
            Bucket=self.bucket,
            Key=key,
            ExtraArgs=extra_args or {},
        )
        return key
    def upload_bytes(self, data: bytes, key: str, content_type: str = "application/octet-stream") -> str:
        self.client.put_object(Bucket=self.bucket, Key=key, Body=data, ContentType=content_type)
        return key
    def download_file(self, key: str, destination: str | Path) -> Path:
        destination_path = Path(destination)
        destination_path.parent.mkdir(parents=True, exist_ok=True)
        self.client.download_file(self.bucket, key, str(destination_path))
        return destination_path
    def download_bytes(self, key: str) -> bytes:
        response = self.client.get_object(Bucket=self.bucket, Key=key)
        return response["Body"].read()
    def generate_presigned_url(self, key: str, expires_in: int = 3600) -> str:
        return self.client.generate_presigned_url(
            "get_object",
            Params={"Bucket": self.bucket, "Key": key},
            ExpiresIn=expires_in,
        )
