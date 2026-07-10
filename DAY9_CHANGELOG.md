# Day 9 Changelog - Media Library v1 Finalization

## Created Files

### Backend
* **[tests.py](file:///c:/Users/abhim/Desktop/Project/CreatorPilot/backend/apps/creative/tests.py)**: Added unit tests validating folder creation, owner isolation, MIME/extension validations, and bulk actions.

### Frontend
* **[hooks/useUploadQueue.ts](file:///c:/Users/abhim/Desktop/Project/CreatorPilot/frontend/src/features/media/hooks/useUploadQueue.ts)**: Added custom concurrent queue processor hook to handle background multi-file uploads with progress.

---

## Modified Files

### Backend
* **[models.py (Persistence)](file:///c:/Users/abhim/Desktop/Project/CreatorPilot/backend/apps/creative/infrastructure/persistence/models.py)**: Added `MediaFolder` model. Added folder, note, knowledge item, task, and calendar event linkages to `MediaAsset`.
* **[models.py (Root)](file:///c:/Users/abhim/Desktop/Project/CreatorPilot/backend/apps/creative/models.py)**: Exposed `MediaFolder` model to apps.
* **[serializers.py](file:///c:/Users/abhim/Desktop/Project/CreatorPilot/backend/apps/creative/presentation/serializers.py)**: Added `MediaFolderSerializer`. Added relational title mappings and context owner checks.
* **[views.py](file:///c:/Users/abhim/Desktop/Project/CreatorPilot/backend/apps/creative/presentation/views.py)**: Created `MediaFolderViewSet`. Added safe filename normalization, PIL image thumbnailing, 50MB constraints, whitelists, and bulk action endpoints.
* **[urls.py](file:///c:/Users/abhim/Desktop/Project/CreatorPilot/backend/apps/creative/presentation/urls.py)**: Registered folder endpoints in routers.

### Frontend
* **[types/index.ts](file:///c:/Users/abhim/Desktop/Project/CreatorPilot/frontend/src/features/media/types/index.ts)**: Added folder interfaces and linking properties.
* **[services/media.ts](file:///c:/Users/abhim/Desktop/Project/CreatorPilot/frontend/src/features/media/services/media.ts)**: Integrated progress track uploads and bulk action payloads.
* **[hooks/useMedia.ts](file:///c:/Users/abhim/Desktop/Project/CreatorPilot/frontend/src/features/media/hooks/useMedia.ts)**: Expose bulk mutations and folder query handles.
* **[index.ts](file:///c:/Users/abhim/Desktop/Project/CreatorPilot/frontend/src/features/media/index.ts)**: Exported the upload queue hook.
* **[MediaWorkspace.tsx](file:///c:/Users/abhim/Desktop/Project/CreatorPilot/frontend/src/features/media/components/MediaWorkspace.tsx)**: Re-designed workspace supporting folder directory listings, breadcrumbs navigation, right-side sliding metadata linkage panel, batch select sliders, infinite scroll page additions, and keyboard triggers.
* **[MediaUploadDialog.tsx](file:///c:/Users/abhim/Desktop/Project/CreatorPilot/frontend/src/features/media/components/MediaUploadDialog.tsx)**: Transitioned single upload view to concurrent multi-file queue manager with indicators.
