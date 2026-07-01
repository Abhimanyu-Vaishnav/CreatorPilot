# CreatorPilot — Day 4 Changelog

## Created Files

### Backend (Django)
- [0004_note.py](file:///c:/Users/abhim/Desktop/Project/CreatorPilot/backend/apps/productivity/migrations/0004_note.py): Database migration file creating the note table.

### Frontend (Next.js)
- [types/index.ts](file:///c:/Users/abhim/Desktop/Project/CreatorPilot/frontend/src/features/notes/types/index.ts): Type mapping declarations for notes, inputs, and parameters.
- [services/notes.ts](file:///c:/Users/abhim/Desktop/Project/CreatorPilot/frontend/src/features/notes/services/notes.ts): API queries wrapper calling backend endpoints.
- [hooks/useNotes.ts](file:///c:/Users/abhim/Desktop/Project/CreatorPilot/frontend/src/features/notes/hooks/useNotes.ts): React Query bindings for backend queries and cache invalidations.
- [index.ts](file:///c:/Users/abhim/Desktop/Project/CreatorPilot/frontend/src/features/notes/index.ts): Main feature module entry exports.
- [NoteDialog.tsx](file:///c:/Users/abhim/Desktop/Project/CreatorPilot/frontend/src/features/notes/components/NoteDialog.tsx): Popup note creator selector with templates and colors.
- [NotesWorkspace.tsx](file:///c:/Users/abhim/Desktop/Project/CreatorPilot/frontend/src/features/notes/components/NotesWorkspace.tsx): Tab workspace panel implementing list/grid view, query sorting, searching and filtering.
- [SimpleEditor.tsx](file:///c:/Users/abhim/Desktop/Project/CreatorPilot/frontend/src/features/notes/components/SimpleEditor.tsx): Resizing drafting editor canvas with live statistics counts and autosave debouncing.
- [page.tsx](file:///c:/Users/abhim/Desktop/Project/CreatorPilot/frontend/src/app/dashboard/projects/[slug]/notes/[noteSlug]/page.tsx): Route rendering page for specific notes edit canvas.

---

## Modified Files

### Backend (Django)
- [models.py](file:///c:/Users/abhim/Desktop/Project/CreatorPilot/backend/apps/productivity/infrastructure/persistence/models.py): Added the `Note` DB model with automatic save hooks for slugifying, template loading, and word count calculation.
- [models.py (root)](file:///c:/Users/abhim/Desktop/Project/CreatorPilot/backend/apps/productivity/models.py): Exposed the `Note` model in the module exports.
- [serializers.py](file:///c:/Users/abhim/Desktop/Project/CreatorPilot/backend/apps/productivity/presentation/serializers.py): Added `NoteSerializer` with project slug references.
- [views.py](file:///c:/Users/abhim/Desktop/Project/CreatorPilot/backend/apps/productivity/presentation/views.py): Added `NoteViewSet` with complete CRUD overrides (auto-logging activities on create, open, update, delete states) and extended project endpoints.
- [urls.py](file:///c:/Users/abhim/Desktop/Project/CreatorPilot/backend/apps/productivity/presentation/urls.py): Registered the notes REST route endpoints under `/api/notes/`.

### Frontend (Next.js)
- [Breadcrumbs.tsx](file:///c:/Users/abhim/Desktop/Project/CreatorPilot/frontend/src/features/projects/components/Breadcrumbs.tsx): Added `customBreadcrumbs` options mapping to navigate nested contexts.
- [page.tsx (projects slug)](file:///c:/Users/abhim/Desktop/Project/CreatorPilot/frontend/src/app/dashboard/projects/[slug]/page.tsx): Rendered `NotesWorkspace`, added notes counting logic, synced active tab with browser search query parameters.
- [page.tsx (dashboard)](file:///c:/Users/abhim/Desktop/Project/CreatorPilot/frontend/src/app/dashboard/page.tsx): Configured dashboard drafts list and pinned note widget grids.

---

## Deleted Files
None.
