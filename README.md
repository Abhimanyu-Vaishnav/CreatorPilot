# CreatorPilot — Bounded Workspace for Digital Creators

CreatorPilot is a modular, high-scale "Operating System for Digital Creators" designed to consolidate creative assets, drafts, automation engines, project management, and cross-channel distribution pipelines.

This repository uses a monorepo setup structure:
- `/frontend`: Next.js web application utilizing Tailwind CSS, TypeScript, and shadcn/ui.
- `/backend`: Django backend API utilizing Django REST Framework (DRF), Redis, PostgreSQL, and Celery.

---

## Bounded Architecture

CreatorPilot structures distinct functionalities into Bounded Contexts using **Domain-Driven Design (DDD)** and Clean Architecture.

### Core Contexts
1. **Creative Context**: Writing Studio, Media Library, Prompt Library, SEO Workspace, and AI Assistant.
2. **Productivity Context**: Dashboard, Projects, Tasks, Calendar, Notes, Knowledge Vault, and Bookmark Manager.
3. **Distribution Context**: Blog, Pinterest, and YouTube Workspace integration, plus the Automation Engine.
4. **Identity & Settings Context**: User authentication, settings, and workspace collaboration.
5. **Analytics Context**: Aggregated data visualizations across all distribution channels.

---

## Local Development Setup

### Prerequisite Checklist
- Docker & Docker Compose
- Node.js (v20+ recommended)
- Python (v3.12+ recommended)

### Orchestrated Booting
Run the multi-container developer setup using Docker Compose:
```bash
docker compose up --build
```
This boots up:
- Next.js local development server (`http://localhost:3000`)
- Django REST API backend (`http://localhost:8000`)
- PostgreSQL database (`localhost:5432`)
- Redis cache & broker (`localhost:6379`)
- Celery worker & scheduler

---

## Coding Standards

### Frontend (Next.js)
1. **Feature Grouping**: Always create pages, custom hooks, services, and types under specific features inside `src/features/[feature-name]/` instead of global folders.
2. **AI Independence**: All UI elements must have graceful state management if the backend AI assistant is disabled.
3. **Aesthetics**: Premium UI layout following Linear and Notion styling guidelines (curated color palettes, responsive components, interactive hover transitions, glassmorphism, proper typographies).

### Backend (Django)
1. **Clean Domain Layers**: Separate pure python business entities and domain rules (`/domain`) from the Django infrastructure (`/infrastructure/persistence/models.py`).
2. **API First**: Build endpoints targeting REST representation patterns. Document paths with Swagger/OpenAPI specifications.
3. **Async Processing**: Use Celery tasks for heavy operations like YouTube uploads, image indexing, web scraping, and AI generation tasks.
