import os
import uuid
from django.conf import settings
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile

class BaseStorage:
    """
    Abstract interface for files storage.
    Can be sub-classed by Amazon S3 or Cloudflare R2 backends.
    """
    def save(self, file_name: str, content) -> str:
        raise NotImplementedError("Storage backend must implement save()")

    def delete(self, storage_path: str):
        raise NotImplementedError("Storage backend must implement delete()")

    def get_url(self, storage_path: str) -> str:
        raise NotImplementedError("Storage backend must implement get_url()")


class LocalStorage(BaseStorage):
    """
    Local filesystem storage implementation for development.
    Saves files under MEDIA_ROOT/media_library.
    """
    def save(self, file_name: str, content) -> str:
        # Extract file extension to construct unique filename
        ext = os.path.splitext(file_name)[1]
        unique_name = f"{uuid.uuid4()}{ext}"
        storage_path = os.path.join("media_library", unique_name)
        
        # Django default_storage automatically saves to MEDIA_ROOT
        path = default_storage.save(storage_path, ContentFile(content.read()))
        # Normalize path separators for database storage
        return path.replace("\\", "/")

    def delete(self, storage_path: str):
        if default_storage.exists(storage_path):
            default_storage.delete(storage_path)

    def get_url(self, storage_path: str) -> str:
        # Django's default_storage.url returns the MEDIA_URL + path prefix
        url = default_storage.url(storage_path)
        # Ensure it has domain/absolute form if required, else relative works locally
        return url


def get_storage_backend() -> BaseStorage:
    """
    Returns the configured storage backend.
    Can be dynamically toggled via env variables in settings.
    """
    return LocalStorage()
