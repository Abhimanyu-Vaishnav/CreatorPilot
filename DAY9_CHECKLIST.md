# Day 9 Checklist - Media Library Finalization

## Multi-File uploads with queue
- [x] **Upload Queue**: Drag-and-drop or select multiple files simultaneously.
- [x] **Indicators**: Real-time progress trackers showing percentage loader per file.
- [x] **Actions**: Cancel triggers for active uploads and Retry buttons for failed uploads.
- [x] **Background processing**: Processing uploads asynchronously in background queues.

## Directory & Folder management
- [x] **Database Schema**: `MediaFolder` persistence model with recursive parents.
- [x] **Breadcrumbs navigation**: Jump back to parent directories via folder trail links.
- [x] **Directory navigation**: Double-click folder cards to explore subdirectories.
- [x] **Folder creation**: Inline form dialogs to instantiate folders in current parent context.

## Entity linkages & details
- [x] **Expanded links**: Support for linking Media Assets with Notes, Vault Items, Calendar Events, Tasks, and Documents.
- [x] **Right Details sliding panel**: Slidable drawer pane showing multi-format preview players, edit fields, linkage lists, and projects dropdowns.
- [x] **Timeline logs**: chronological audit timelines specific to the selected file.
- [x] **Storage bar**: Visual indicator of total space occupied against 500MB workspace limits.

## Bulk actions & selection
- [x] **Checkboxes**: Select overlays on grid and list views.
- [x] **Bulk operations bar**: Bulk Favorite, Bulk Archive, Bulk Restore, and Bulk Delete triggers.

## Keyboard shortcuts
- [x] `Ctrl + A` — Select all assets in current folder.
- [x] `Delete` — Delete selected asset(s).
- [x] `F` or `f` — Toggle Favorite / Star.
- [x] `A` or `a` — Toggle Archive.
- [x] `R` or `r` — Inline rename metadata in sidebar.
- [x] `Space` — Toggle large Preview Dialog overlay.

## Performance & Security
- [x] **MIME Whitelists**: Reject unsafe files.
- [x] **Safe Filename Normalization**: Clean symbols, script tags, backslashes, and replace with underscores.
- [x] **Size Constraint validation**: Rejects uploads > 50MB before DB execution.
- [x] **Owner isolation**: Double checks `owner = request.user` across all ViewSets, Detail Actions, and serializer ForeignKey relationships.
- [x] **Infinite scroll**: Increase results limits on scrolling to the bottom of the container.

## Verification
- [x] **Django unit tests**: APITests verifying folder CRUD, upload whitelists, permissions, owner isolation, duplicate actions, linkages, and bulk mutations.
- [x] **Production build check**: Compiled with zero TypeScript/Turbopack warnings.
