from io import BytesIO

import boto3

from app.core.config import get_settings


class StorageService:
    def __init__(self) -> None:
        settings = get_settings()
        session = boto3.session.Session(
            aws_access_key_id=settings.aws_access_key_id,
            aws_secret_access_key=settings.aws_secret_access_key,
            region_name=settings.aws_region,
        )
        self.bucket = settings.aws_bucket_name
        self.client = session.client("s3", endpoint_url=settings.storage_endpoint_url)

    def upload_bytes(self, key: str, content: bytes, content_type: str) -> str:
        self.client.upload_fileobj(
            BytesIO(content),
            self.bucket,
            key,
            ExtraArgs={"ContentType": content_type},
        )
        return key

    def delete_object(self, key: str) -> None:
        self.client.delete_object(Bucket=self.bucket, Key=key)

    def signed_url(self, key: str, expires_in: int = 900) -> str:
        return self.client.generate_presigned_url(
            "get_object",
            Params={"Bucket": self.bucket, "Key": key},
            ExpiresIn=expires_in,
        )
