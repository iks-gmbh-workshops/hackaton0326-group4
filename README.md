# DrumDiBum

DrumDiBum is a local web application for organizing groups, inviting members, and planning shared activities with RSVP support.

## Tech Stack

### Frontend
- React + TypeScript + Vite
- React Router
- TanStack Query
- React Hook Form + Zod
- shadcn/ui + Tailwind CSS
- Axios

### Backend
- Spring Boot 3
- Java 21
- Spring Security + JWT
- Spring Data JPA
- PostgreSQL
- Flyway
- Spring Mail
- Springdoc OpenAPI

### Local Infrastructure
- Docker Compose
- PostgreSQL
- Mailhog

## Project Structure

- `frontend/` - React single-page application
- `backend/` - Spring Boot REST API
- `docker-compose.yml` - local Postgres and Mailhog services
- `requirements.md` - implementation status and remaining work

## Prerequisites

- Java 21
- Maven
- Node.js and npm
- Docker Desktop or another local Docker runtime

## Local Setup

### 1. Start infrastructure

From the project root:

```bash
docker compose up -d
```

This starts:
- PostgreSQL on `localhost:5432`
- Mailhog on `localhost:1025` and `localhost:8025`

### 2. Start the backend

From `backend/`:

```bash
mvn spring-boot:run
```

Important:
- Flyway migrations run when the backend starts.
- The database tables are not created by Docker alone.
- If you inspect Postgres before the backend has started, tables like `users` will not exist yet.

### 3. Start the frontend

From `frontend/`:

```bash
npm install
npm run dev
```

The Vite dev server proxies `/api` requests to the backend on `http://localhost:8080`.

## Local URLs

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8080/api`
- Swagger UI: `http://localhost:8080/swagger-ui.html`
- Mailhog UI: `http://localhost:8025`

## Local Configuration

Default local database settings:

- Database: `drumdibum`
- Username: `drumdibum`
- Password: `drumdibum`

These values are defined in:
- [`docker-compose.yml`](docker-compose.yml)
- [`application.yml`](backend/src/main/resources/application.yml)

## Seeded Test Users

The backend seeds a few local test users through Flyway in [`V2__seed_test_users.sql`](backend/src/main/resources/db/migration/V2__seed_test_users.sql):

- `anna@example.com` / `TestUser123!`
- `ben@example.com` / `Welcome123!`
- `clara@example.com` / `DrumDiBum123!`

## Useful Commands

### Backend

```bash
mvn spring-boot:run
mvn test
```

### Frontend

```bash
npm run dev
npm run build
npm run lint
```

### Reset local database

```bash
docker compose down -v
docker compose up -d
```

Use this only if you want to remove the local Postgres data volume and start fresh.

## Notes

- Authentication uses JWT stored in an `httpOnly` cookie.
- The application is intended for local development.
- For current feature status, see [`requirements.md`](requirements.md).
