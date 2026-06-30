# CreatorPilot — Day 3 Changelog

## Created Files

### Frontend
1. [Breadcrumbs.tsx](file:///c:/Users/abhim/Desktop/Project/CreatorPilot/frontend/src/features/projects/components/Breadcrumbs.tsx)
   - *Description*: Reusable navigation breadcrumbs component representing `Dashboard > Projects > Project Name` with current theme color dot indicator.
2. [Timeline.tsx](file:///c:/Users/abhim/Desktop/Project/CreatorPilot/frontend/src/features/projects/components/Timeline.tsx)
   - *Description*: Vertical list showing activity logs mapping different actions (e.g. Created, Opened, Updated, Favorited, Archived) to custom badges, icons, descriptions, and relative time.

---

## Modified Files

### Backend
1. [persistence/models.py](file:///c:/Users/abhim/Desktop/Project/CreatorPilot/backend/apps/productivity/infrastructure/persistence/models.py)
   - *Description*: Added `project_progress` integer field to `Project` model and created `ProjectActivity` table representing chronological changes.
2. [presentation/serializers.py](file:///c:/Users/abhim/Desktop/Project/CreatorPilot/backend/apps/productivity/presentation/serializers.py)
   - *Description*: Updated `ProjectSerializer` to serialize `project_progress` and added `ProjectActivitySerializer` with relative time calculation helper.
3. [presentation/views.py](file:///c:/Users/abhim/Desktop/Project/CreatorPilot/backend/apps/productivity/presentation/views.py)
   - *Description*: Added auto-logging hooks in ViewSet methods (`perform_create`, `perform_update`, `retrieve`) and exposed actions `activity`, `recent_activity`, and `overview`.

### Frontend
1. [projects/types/index.ts](file:///c:/Users/abhim/Desktop/Project/CreatorPilot/frontend/src/features/projects/types/index.ts)
   - *Description*: Added `project_progress` to project types, added `ProjectActivity` interface, and added `ProjectOverviewData` interface.
2. [projects/services/projects.ts](file:///c:/Users/abhim/Desktop/Project/CreatorPilot/frontend/src/features/projects/services/projects.ts)
   - *Description*: Extended api actions for activity logs, recent activity endpoints, and overview stats.
3. [projects/hooks/useProjects.ts](file:///c:/Users/abhim/Desktop/Project/CreatorPilot/frontend/src/features/projects/hooks/useProjects.ts)
   - *Description*: Declared React Query query hooks and mutations (`useProjectActivityQuery`, `useRecentActivityQuery`, `useProjectOverviewQuery`, `useAddActivityMutation`).
4. [projects/components/ProjectDialog.tsx](file:///c:/Users/abhim/Desktop/Project/CreatorPilot/frontend/src/features/projects/components/ProjectDialog.tsx)
   - *Description*: Added progress slider range selection (0-100) and resolved TypeScript input type parameters.
5. [projects/components/ProjectCard.tsx](file:///c:/Users/abhim/Desktop/Project/CreatorPilot/frontend/src/features/projects/components/ProjectCard.tsx)
   - *Description*: Added progress bar visualization under the project description showing color accents and completeness percentage.
6. [app/dashboard/projects/[slug]/page.tsx](file:///c:/Users/abhim/Desktop/Project/CreatorPilot/frontend/src/app/dashboard/projects/[slug]/page.tsx)
   - *Description*: Restructured project workspace using new layouts, tabs (Overview, Notes, Tasks, Media Library, Knowledge Vault, Calendar, Timeline, Settings), Breadcrumbs, Timeline panel, stats, and Quick Actions (Edit, Open Settings, Duplicate, Archive, Delete).
7. [app/dashboard/page.tsx](file:///c:/Users/abhim/Desktop/Project/CreatorPilot/frontend/src/app/dashboard/page.tsx)
   - *Description*: Added Recent Activity Feed widget displaying log updates in the sidebar.
8. [components/layout/Navbar.tsx](file:///c:/Users/abhim/Desktop/Project/CreatorPilot/frontend/src/components/layout/Navbar.tsx)
   - *Description*: Replaced static mock notification bell with functional dropdown panel showing unread indicator badges, hover states, clear all actions, and routing links.

---

## Deleted Files
None.
