# Day 8 Changelog — CreatorPilot

All files created, modified, or deleted during Day 8 development of Writing Studio v1.

## Created Files

### Backend
- **[0010_document.py](file:///c:/Users/abhim/Desktop/Project/CreatorPilot/backend/apps/productivity/migrations/0010_document.py)**
  - *Reason*: Schema migration file to instantiate the `Document` database model.

### Frontend
- **[types/index.ts](file:///c:/Users/abhim/Desktop/Project/CreatorPilot/frontend/src/features/studio/types/index.ts)**
  - *Reason*: TypeScript type definitions for `Document`, inputs, and filtering query parameters.
- **[services/documents.ts](file:///c:/Users/abhim/Desktop/Project/CreatorPilot/frontend/src/features/studio/services/documents.ts)**
  - *Reason*: API client caller using the global `api` fetching instance for CRUD endpoints.
- **[hooks/useDocuments.ts](file:///c:/Users/abhim/Desktop/Project/CreatorPilot/frontend/src/features/studio/hooks/useDocuments.ts)**
  - *Reason*: React Query custom hooks (`useDocumentsQuery`, `useProjectDocumentsQuery`, mutations) with cache invalidation rules.
- **[components/MarkdownEditor.tsx](file:///c:/Users/abhim/Desktop/Project/CreatorPilot/frontend/src/features/studio/components/MarkdownEditor.tsx)**
  - *Reason*: Distraction-free text editor supporting markdown regex compilation, word statistics, and autosave.
- **[components/WritingWorkspace.tsx](file:///c:/Users/abhim/Desktop/Project/CreatorPilot/frontend/src/features/studio/components/WritingWorkspace.tsx)**
  - *Reason*: Three-panel workspace mapping outline headings, project notes, vault references, calendar schedules, tasks, and editor actions.

---

## Modified Files

### Backend
- **[models.py](file:///c:/Users/abhim/Desktop/Project/CreatorPilot/backend/apps/productivity/infrastructure/persistence/models.py)**
  - *Reason*: Appended the `Document` model definition with template prefill structures, slug validations, and automatic statistics updates.
- **[serializers.py](file:///c:/Users/abhim/Desktop/Project/CreatorPilot/backend/apps/productivity/presentation/serializers.py)**
  - *Reason*: Declared `DocumentSerializer` with title validations and status checks.
- **[views.py](file:///c:/Users/abhim/Desktop/Project/CreatorPilot/backend/apps/productivity/presentation/views.py)**
  - *Reason*: Added `DocumentViewSet` to handle CRUD logic and log activities, and created project action to retrieve documents by workspace.
- **[urls.py](file:///c:/Users/abhim/Desktop/Project/CreatorPilot/backend/apps/productivity/presentation/urls.py)**
  - *Reason*: Registered the `/api/documents/` route with Django's default router.

### Frontend
- **[index.ts](file:///c:/Users/abhim/Desktop/Project/CreatorPilot/frontend/src/features/studio/index.ts)**
  - *Reason*: Updated index to export types, hooks, services, and components.
- **[Timeline.tsx](file:///c:/Users/abhim/Desktop/Project/CreatorPilot/frontend/src/features/projects/components/Timeline.tsx)**
  - *Reason*: Extended timeline component to render document activity styles and labels (Created, Updated, Status Changed, Deleted).
- **[page.tsx](file:///c:/Users/abhim/Desktop/Project/CreatorPilot/frontend/src/app/dashboard/projects/%5Bslug%5D/page.tsx)**
  - *Reason*: Added tab mapping, counting logic, and rendering for the "Writing Studio" layout inside the project dashboard.
- **[page.tsx](file:///c:/Users/abhim/Desktop/Project/CreatorPilot/frontend/src/app/dashboard/page.tsx)**
  - *Reason*: Rendered dashboard widgets for Writing Studio drafts, recent documents, and recently edited documents.
