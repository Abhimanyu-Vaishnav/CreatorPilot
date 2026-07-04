# DAY 6 CHECKLIST

### Workspace
- [x] Tasks tab unlocked (removed `lock: true` restriction)
- [x] Task count visible in tab headers and overview sidebar stats

### Database
- [x] Task model defined in `models.py`
- [x] Relations to owner, project, related_note, and related_knowledge mapped
- [x] Migrations generated (`0007_task`) and applied successfully

### CRUD
- [x] Create (TaskDialog modal)
- [x] Read (Task details page and project workspace filters)
- [x] Update (Kanban drag-and-drop, toggle favorite, edit details dialog)
- [x] Delete (Task actions menu with confirmation window)

### Views
- [x] List View (tabular, responsive display with checkboxes)
- [x] Kanban Board (grouped status columns with drag-and-drop support)
- [x] Detail View (dedicated route `/dashboard/projects/{projectSlug}/tasks/{taskId}`)

### Filters
- [x] Status (Todo, In Progress, Blocked, Completed)
- [x] Priority (Low, Medium, High, Urgent)
- [x] Due Date (Due Today, Overdue, Upcoming Deadlines)

### Dashboard
- [x] Widgets (Today's Tasks, Overdue, Upcoming, Completed)
- [x] Progress (Project progress bar updates instantly on task status change)

### Timeline
- [x] Activity logs (Timeline events logged for Created, Completed, Reopened, Archived, Restored, and Deleted)

### Backend
- [x] APIs (Full set of CRUD endpoints and reorder endpoints)
- [x] Validation (Validated titles, priority levels, and status strings)
- [x] Security (Isolated by owner in queryset queries)

### Frontend
- [x] Responsive UI (Notion/Linear layout adapting cleanly to screens)
- [x] Error handling (Graceful fallback error alerts on model retrieval fails)
- [x] Loading states (Loader2 animation rendering on fetch delays)

### Testing
- [x] Build passed (Next.js production build compiled successfully with zero type checking issues)
- [x] CRUD verified (Fully integrated client-side and server-side logic)
- [x] Drag & Drop verified (Bulk reordering endpoint handles updates)
- [x] Progress verified (Task completions automatically adjust project progress metrics)
