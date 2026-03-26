# DrumDiBum - Requirements & Implementation Status

## Overview
Web application for organizing groups and shared activities. Users can create groups, invite members, and plan activities with RSVP functionality.

---

## Phase 1 - MVP Requirements

### 1. User Management

| Requirement | Backend | Frontend | Status |
|---|---|---|---|
| Registration (email, password, first/last name) | AuthController + AuthService | RegisterPage | Done |
| Password validation (10+ chars, upper/lower/digit/special) | RegisterRequest @Pattern | Zod schema in RegisterPage | Done |
| ToS acceptance at registration | @AssertTrue on tosAccepted | Checkbox + Zod literal(true) | Done |
| Login / Logout | AuthController (JWT httpOnly cookie) | LoginPage + Navbar logout | Done |
| JWT-based session (httpOnly cookie) | JwtService + JwtAuthenticationFilter + CookieService | Axios withCredentials | Done |
| Provide basic test users for local development | Flyway migration creates BCrypt test accounts | n/a | Done |

### 2. Group Management

| Requirement | Backend | Frontend | Status |
|---|---|---|---|
| Create groups | GroupController POST /api/groups | CreateGroupPage | Done |
| View my groups | GroupController GET /api/groups | GroupListPage | Done |
| View group details | GroupController GET /api/groups/{id} | GroupDetailPage | Done |
| View group members | GroupController GET /api/groups/{id}/members | GroupDetailPage | Done |
| Invite members by email | InvitationController POST /api/groups/{id}/invite | GroupDetailPage invite form | Done |
| Accept invitation (with token) | InvitationController POST /api/invitations/{token}/accept | InvitePage | Done |
| Accepting an invitation automatically creates OPEN RSVPs for existing group activities | InvitationService + RsvpService | n/a | Done |
| Decline invitation | - (frontend only, no backend call) | InvitePage | Done |
| Leave group (cascade delete user's RSVPs in that group) | GroupController DELETE /api/groups/{id}/members/me | GroupDetailPage leave button | Done |

### 3. Activities

| Requirement | Backend | Frontend | Status |
|---|---|---|---|
| Create activities for a group | ActivityController POST /api/activities | CreateActivityPage | Done |
| Creating an activity automatically creates OPEN RSVPs for current group members | ActivityService + RsvpService | ActivityDetailPage RSVP list | Done |
| Show right-aligned accepted, declined, and open RSVP count badges for upcoming activities in a group, with the badges in the mobile card's upper-right corner and before the date on larger screens | ActivityResponse counts + GroupDetailPage | GroupDetailPage | Done |
| Show the same accepted, declined, and open RSVP count badges in the global activities list, with the badges in the mobile card's upper-right corner and before the date on larger screens | ActivityResponse counts + ActivityListPage | ActivityListPage | Done |
| View upcoming activities for a group | ActivityController GET /api/groups/{id}/activities | GroupDetailPage / ActivityListPage | Done |
| View activity details | ActivityController GET /api/activities/{id} | ActivityDetailPage | Done |
| Show a visible button-style link to go to the group from the activity detail page | n/a | ActivityDetailPage | Done |
| RSVP (accept / decline / open) | ActivityController PUT /api/activities/{id}/rsvps/me | ActivityDetailPage | Done |
| View RSVP list for an activity | ActivityController GET /api/activities/{id}/rsvps | ActivityDetailPage | Done |

### 4. Profile & Account

| Requirement | Backend | Frontend | Status |
|---|---|---|---|
| View profile | UserController GET /api/users/me | ProfilePage | Done |
| Edit profile (first/last name) | UserController PUT /api/users/me | ProfilePage | Done |
| Delete account (GDPR, cascade all data) | UserController DELETE /api/users/me | ProfilePage | Done |

---

## What's Done

### Backend (fully implemented)
- Spring Boot 3.x project with all dependencies (pom.xml)
- PostgreSQL database schema (Flyway V1__init.sql)
- All 6 JPA entities: User, Group, GroupMembership, Activity, Rsvp, InvitationToken
- All repositories, services, and controllers for all 5 modules (auth, user, group, activity, invitation)
- Spring Security config with JWT filter + CORS
- Global exception handler with validation error formatting
- Email sending for group invitations (via Mailhog in dev)
- Configurable invitation expiration (application.yml)

### Frontend (fully implemented)
- Vite + React + TypeScript project
- Tailwind CSS v4 + shadcn/ui with IKS corporate design tokens
- API client layer (Axios) with all endpoint bindings
- Auth context (useAuth hook with login/logout/session refresh)
- Router setup with protected routes
- Navbar with links to Groups, Activities, Profile
- All pages completed: LoginPage, RegisterPage, InvitePage, GroupListPage, CreateGroupPage, GroupDetailPage, ActivityListPage, CreateActivityPage, ActivityDetailPage, ProfilePage
tignore for IDE and local temp files
- Root README.md with local setup and development notes

---

## What Still Needs to Be Built

### Cleanup
- Remove Vite boilerplate files (App.css, hero.png, react.svg, vite.svg, icons.svg)
