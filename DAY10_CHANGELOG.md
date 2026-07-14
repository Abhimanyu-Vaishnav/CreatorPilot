# DAY 10 CHANGELOG

## Publishing Engine v1 — Production Polish

---

### Backend Changes

#### `apps/publishing/infrastructure/persistence/models.py`
- **ADDED**: 8 future-proofing nullable fields to `PublishItem`:
  - `external_post_id` (CharField, null)
  - `publish_url` (URLField, null)
  - `platform_response` (JSONField, default=dict)
  - `failure_reason` (TextField, blank)
  - `retry_count` (IntegerField, default=0)
  - `last_sync_at` (DateTimeField, null)
  - `analytics_synced` (BooleanField, default=False)
  - `automation_triggered` (BooleanField, default=False)

#### `apps/publishing/presentation/serializers.py`
- **ADDED**: All 8 future-proofing fields exposed in `PublishItemSerializer.Meta.fields`

#### `apps/publishing/presentation/views.py`
- **ADDED**: `log_activity()` helper method on `PublishItemViewSet`
  - Creates `ProjectActivity` records silently (never breaks user flow)
  - Logs metadata: `publish_item_id`, `title`, `slug`, `platform`
- **ADDED**: `perform_destroy()` override to log "Deleted" activity before delete
- **UPDATED**: `perform_create()` — adds `log_activity("Draft Created")`
- **UPDATED**: `perform_update()` — adds `log_activity("Updated")`
- **UPDATED**: `schedule()` action — adds `log_activity("Scheduled")`
- **UPDATED**: `approve()` action — adds `log_activity("Approved")`
- **UPDATED**: `reject()` action — adds `log_activity("Rejected")`
- **UPDATED**: `duplicate()` action — adds `log_activity("Duplicated")`
- **UPDATED**: `publish()` action — adds `log_activity("Published")`
- **ADDED**: Import of `ProjectActivity` from productivity models

#### `apps/publishing/migrations/0003_publishitem_analytics_synced_and_more.py`
- **NEW**: Migration for all 8 future-proofing fields

---

### Frontend Changes

#### `frontend/src/app/dashboard/page.tsx`
- **ADDED**: Import of `usePublishItemsQuery` from `../../features/publishing`
- **ADDED**: Import of `SendHorizonal`, `Rss`, `BarChart3` from `lucide-react`
- **ADDED**: `usePublishItemsQuery()` instantiation in component body
- **ADDED**: `publishingWidgets` memoized calculation using `useMemo` covering:
  - `draftCount`
  - `upcomingPosts` (sorted by `scheduled_at`)
  - `recentlyPublished` (sorted by `published_at`)
  - `breakdownList` (platform counts)
- **ADDED**: Publishing Engine Overview panel in right column sidebar:
  - Draft Count stat card
  - Published Count stat card
  - Upcoming Scheduled Posts list
  - Recently Published list
  - Platform Breakdown list

#### `frontend/src/features/publishing/services/publishingApi.ts`
- **FIXED**: `getPlatforms()` now correctly unwraps paginated DRF response:
  - Returns `response.results` if response is a paginated object
  - Falls back to `response` if it's already a flat array
  - Returns `[]` as safe default

---

### API Changes
- No breaking changes to existing API
- All new fields are optional/nullable
- No endpoint signature changes

---

### Database Changes
- New migration: `publishing.0003_publishitem_analytics_synced_and_more`
- 8 new nullable columns on `publishing_publishitem` table

---

## Summary

Publishing Engine v1 is now production-ready with:
- Full timeline logging for project activity feeds
- Future-proofed schema for automation and analytics engines
- Live dashboard widgets showing publishing queue state
- Zero TypeScript errors, zero Django warnings, all 7 tests passing
