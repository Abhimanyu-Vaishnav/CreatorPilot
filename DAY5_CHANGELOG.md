# CreatorPilot — Day 5 Changelog

## Created Files

### Backend (Django)
- [0006_knowledgeitem.py](file:///c:/Users/abhim/Desktop/Project/CreatorPilot/backend/apps/productivity/migrations/0006_knowledgeitem.py): Database migration file creating the `KnowledgeItem` table.

### Frontend (Next.js)
- [types/index.ts](file:///c:/Users/abhim/Desktop/Project/CreatorPilot/frontend/src/features/vault/types/index.ts): Type mapping declarations for KnowledgeVault items, inputs, and search filter parameters.
- [services/vault.ts](file:///c:/Users/abhim/Desktop/Project/CreatorPilot/frontend/src/features/vault/services/vault.ts): REST API service wrappers mapping to backend `/api/knowledge/` and nested project vault routes.
- [hooks/useVault.ts](file:///c:/Users/abhim/Desktop/Project/CreatorPilot/frontend/src/features/vault/hooks/useVault.ts): React Query bindings for vault API calls, handling mutations and cache invalidation policies.
- [KnowledgeItemDialog.tsx](file:///c:/Users/abhim/Desktop/Project/CreatorPilot/frontend/src/features/vault/components/KnowledgeItemDialog.tsx): Dialog supporting creation and metadata editing of resources, including type selections, tag inputs, and note linkage.
- [KnowledgeCard.tsx](file:///c:/Users/abhim/Desktop/Project/CreatorPilot/frontend/src/features/vault/components/KnowledgeCard.tsx): Styled card displaying resource type icons, description excerpts, tag badges, favorite/pin buttons, and navigation links.
- [KnowledgeWorkspace.tsx](file:///c:/Users/abhim/Desktop/Project/CreatorPilot/frontend/src/features/vault/components/KnowledgeWorkspace.tsx): Main tab container implementing visual view layout switches, live search filters, ordering lists, and Empty State CTA.
- [page.tsx](file:///c:/Users/abhim/Desktop/Project/CreatorPilot/frontend/src/app/dashboard/projects/[slug]/knowledge/[knowledgeSlug]/page.tsx): Dynamic route details page displaying comprehensive descriptions, linked note preview cards, and metadata timestamps.

---

## Modified Files

### Backend (Django)
- [models.py (identity)](file:///c:/Users/abhim/Desktop/Project/CreatorPilot/backend/apps/identity/infrastructure/persistence/models.py): Added `username` property to CustomUser model to return the email string, resolving str/repr crashes in other components.
- [models.py (productivity)](file:///c:/Users/abhim/Desktop/Project/CreatorPilot/backend/apps/productivity/infrastructure/persistence/models.py): Implemented the `KnowledgeItem` model with unique slug hooks, choice constraints, and JSONField support for tags.
- [models.py (root)](file:///c:/Users/abhim/Desktop/Project/CreatorPilot/backend/apps/productivity/models.py): Exposed `KnowledgeItem` in productivity package entrypoint exports.
- [serializers.py](file:///c:/Users/abhim/Desktop/Project/CreatorPilot/backend/apps/productivity/presentation/serializers.py): Added `KnowledgeItemSerializer` with related note/project link mappings.
- [views.py](file:///c:/Users/abhim/Desktop/Project/CreatorPilot/backend/apps/productivity/presentation/views.py): Added `KnowledgeItemViewSet` with complete CRUD, query searching, and activity logging filters. Synced project overview metrics and added project knowledge endpoints.
- [urls.py](file:///c:/Users/abhim/Desktop/Project/CreatorPilot/backend/apps/productivity/presentation/urls.py): Registered the router path for `/api/knowledge/`.

### Frontend (Next.js)
- [index.ts](file:///c:/Users/abhim/Desktop/Project/CreatorPilot/frontend/src/features/vault/index.ts): Exposed public vault feature interfaces.
- [page.tsx (project slug)](file:///c:/Users/abhim/Desktop/Project/CreatorPilot/frontend/src/app/dashboard/projects/[slug]/page.tsx): Unlocked the Knowledge Vault tab, registered vault list hook counters, and mapped tab workspace rendering.
- [page.tsx (dashboard)](file:///c:/Users/abhim/Desktop/Project/CreatorPilot/frontend/src/app/dashboard/page.tsx): Integrated Knowledge Vault widgets showing starred, recent, and viewed items.

---

## Deleted Files
None.
