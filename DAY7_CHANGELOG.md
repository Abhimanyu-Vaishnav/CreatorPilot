# Day 7 Changelog — Calendar & Planning Engine

## Created Files
- `frontend/src/features/planner/types/index.ts`
  - Created TypeScript type interfaces: `CalendarEvent`, `CalendarFilterParams`, `CreateEventInput`, and `UpdateEventInput`.
- `frontend/src/features/planner/services/planner.ts`
  - Created `plannerService` for handling GET/POST/PATCH/DELETE API calls to `/api/calendar/` endpoints.
- `frontend/src/features/planner/hooks/usePlanner.ts`
  - Created hooks: `useCalendarEventsQuery`, `useCalendarEventQuery`, `useCreateEventMutation`, `useUpdateEventMutation`, and `useDeleteEventMutation`.
- `frontend/src/features/planner/components/EventDialog.tsx`
  - Created modal component with fields: Title, Description, Type, Project association, Related Task mapping, Start, End, All Day checkbox, color palette choices, and Reminder select.
- `frontend/src/features/planner/components/CalendarWorkspace.tsx`
  - Created Month, Week, Day, and Agenda layout rendering canvas.
  - Implemented search input, quick event filters, mini-calendar date navigation, and sidebar item lists.
  - Enabled HTML5 drag-and-drop capability.
- `frontend/src/features/planner/index.ts`
  - Entry point exporting all types, services, hooks, and views.
- `frontend/src/app/dashboard/planner/page.tsx`
  - Created global Planner workspace page.

---

## Modified Files
- `backend/apps/productivity/infrastructure/persistence/models.py`
  - Appended the `CalendarEvent` database model structure.
- `backend/apps/productivity/presentation/serializers.py`
  - Added `CalendarEventSerializer` mapping and validation.
- `backend/apps/productivity/presentation/views.py`
  - Added `CalendarViewSet` viewset combining events and due-date tasks. Logged activity feeds to `ProjectActivity`.
- `backend/apps/productivity/presentation/urls.py`
  - Registered `calendar` API route.
- `frontend/src/components/layout/Sidebar.tsx`
  - Removed `disabled: true` block from the Content Planner link.
- `frontend/src/app/dashboard/projects/[slug]/page.tsx`
  - Unlocked `calendar` tab, imported and rendered `<CalendarWorkspace />` inside project views.
- `frontend/src/app/dashboard/page.tsx`
  - Integrated Schedule, Agenda, Key Milestones, and Upcoming Releases dashboard widgets.

---

## Deleted Files
- *None*
