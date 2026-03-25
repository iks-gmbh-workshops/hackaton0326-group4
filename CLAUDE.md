> **Note:** This file and `AGENTS.md` must always have the same content. When updating one, update the other to match.

# DrumDiBum

Web application for organizing groups and shared activities.

## Tech Stack

### Frontend
- React 18 + TypeScript + Vite
- React Router v6
- TanStack Query (React Query)
- React Hook Form + Zod
- shadcn/ui + Tailwind CSS
- Axios

### Backend
- Spring Boot 3.x (Java 21)
- Spring Security + JWT (jjwt)
- Spring Data JPA + PostgreSQL 18 (Hibernate)
- Flyway migrations
- Springdoc OpenAPI (Swagger UI)
- Spring Mail + Lombok

### Infrastructure
- Docker Compose: PostgreSQL 18, Mailhog
- Local-only deployment

## Project Structure

- `frontend/` — React SPA
- `backend/` — Spring Boot REST API
- `docker-compose.yml` — local dev services (Postgres, Mailhog)

Backend is organized by domain module (not by layer):
- `auth/` — authentication (login, register)
- `user/` — user profile, account deletion
- `group/` — groups, memberships
- `activity/` — activities, RSVPs
- `invitation/` — invite tokens, email invites

Shared cross-cutting packages: `config/`, `security/`, `exception/`

## Commands

```bash
# Start infrastructure
docker-compose up -d

# Run backend (from backend/)
./mvnw spring-boot:run

# Run frontend (from frontend/)
npm run dev
```

## Conventions

- Backend base package: `com.drumdibum`
- API prefix: `/api/`
- Auth: JWT via httpOnly cookies
- DB credentials (local): drumdibum / drumdibum / drumdibum
- Mailhog Web UI: http://localhost:8025
- Swagger UI: http://localhost:8080/swagger-ui.html


## Design System

The app follows the IKS corporate design. Reference: `design.md`

Read `design.md` before working on any of the following:
- Creating or modifying React components with visual output
- Writing or updating CSS / Tailwind classes
- Choosing colors, fonts, spacing, or layout
- Building new pages or UI sections
- Reviewing existing UI for consistency

Key rules to always apply without re-reading:
- Colors: `#009fe3` (cyan), `#005578` (dark blue), `#575756` (text), `#1d1d1b` (black)
- Fonts: Segoe UI (body/UI), Merriweather Light Italic (headlines only)
- Layout: left-aligned, generous whitespace, no justified text

## Project Status

See `requirements.md` for the full requirements and implementation status (what's done vs. still needs to be built).

Read `requirements.md` before:
- Starting work on any new feature or page
- Checking whether something is already implemented
- Planning what to build next

After implementing anything, update `requirements.md`:
- Change the relevant Status cell from **Not yet** to **Done**
- If a new requirement was added during implementation, append it to the appropriate table