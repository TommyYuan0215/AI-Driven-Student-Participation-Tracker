# FocusTrack - An AI-Driven Student Participation Tracker

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/Python-3.10+-3776AB?logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-3.1.0-000000?logo=flask&logoColor=white)
![LiteRT](https://img.shields.io/badge/LiteRT-2.21.0-blue?logo=tensorflow&logoColor=white)
![OpenCV](https://img.shields.io/badge/OpenCV-4.10.0-5C3EE8?logo=opencv&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-5.11.4-010101?logo=socketdotio&logoColor=white)
![React](https://img.shields.io/badge/React-18+-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?logo=typescript&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql&logoColor=white)

## Table of Contents

- [Introduction](#introduction)
- [Key Features](#key-features)
- [System Architecture](#system-architecture)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
  - [Method 1 — Development Mode](#method-1--development-mode-hot-reload)
  - [Method 2 — Production Mode](#method-2--production-mode-recommended-for-hosting)
- [Usage Guide](#usage-guide)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

---

## Introduction

FocusTrack is a real-time monitoring system designed for educators to track student attention and engagement in virtual classrooms. By leveraging pre-trained AI models, this system analyzes:

- **Facial Expressions** - Detects emotional states
- **Body Language** - Monitors posture and physical engagement
- **Eye Focus** - Tracks gaze direction and attention level

The system categorizes student participation into three levels:

- 🟢 **Interested** - Active engagement
- 🟡 **Bored** - Low engagement
- 🔴 **Lacking Focus** - Lack of attention

This enables educators to identify disengagement early and dynamically modify teaching strategies in real-time to boost student motivation and learning outcomes.

---

## Key Features

### Real-Time Monitoring 📹

- Live video feed analysis with AI-powered emotion recognition
- Multi-student monitoring capabilities
- Real-time participation status dashboard
- Instant alerts for disengaged students

### Analytics & Reporting 📊

- Comprehensive emotion trend analysis
- Participation statistics and metrics
- Historical data tracking and visualization
- Generate detailed participation reports
- Customizable trend analysis with date filtering

### User Management 👥

- Role-based access control (Admin and Educator)
- User profile management
- Account settings and preferences
- Secure authentication and authorization

### Content Management 📢

- Create and manage announcements
- Slideshow/presentation management for classes
- Content scheduling and distribution
- Real-time content delivery to students

### Educational Dashboard 🎓

- **For Educators:**
  - Real-time participation monitoring
  - Post-class analytics and insights
  - Class session management
  - Individual student performance tracking
  - Public statistics view for transparency

- **For Admins:**
  - System-wide analytics
  - User and content management
  - Data trend analysis
  - Performance metrics

### Settings & Customization ⚙️

- General system settings
- Account preferences

---

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Client (React + Vite)                │
│  ┌──────────────┬──────────────┬──────────────┐         │
│  │   Educator   │    Admin     │   Settings   │         │
│  │   Dashboard  │   Dashboard  │   Portal     │         │
│  └──────────────┴──────────────┴──────────────┘         │
└─────────────────────────────────────────────────────────┘
                         │
                  HTTPS :443 / HTTP :80
                         │
        ┌────────────────▼────────────────┐
        │   Nginx Reverse Proxy           │
        │  - TLS termination (HTTPS)      │
        │  - HTTP → HTTPS redirect        │
        │  - Forwards to frontend :5180   │
        └────────────────┬─────────────────┘
                         │ (internal Docker network)
        ┌────────────────▼────────────────┐
        │   Frontend (React + Nginx)      │
        │  - Serves compiled React SPA    │
        │  - Proxies /api/ → backend      │
        │  - Proxies /socket.io/ → backend│
        └────────────────┬─────────────────┘
                         │
        ┌────────────────▼────────────────┐
        │   Backend (Flask + Python)      │
        │  ┌────────────────────────────┐ │
        │  │  Real-Time Tracking Server │ │
        │  │  - Video Stream Processing │ │
        │  │  - AI Model Inference      │ │
        │  │  - Emotion Recognition     │ │
        │  └────────────────────────────┘ │
        │  ┌────────────────────────────┐ │
        │  │  API Endpoints             │ │
        │  │  - User Management         │ │
        │  │  - Content Management      │ │
        │  │  - Report Generation       │ │
        │  │  - Session Tracking        │ │
        │  └────────────────────────────┘ │
        └────────────────┬─────────────────┘
                         │
        ┌────────────────▼────────────────┐
        │    Database (MySQL 8.0)         │
        │  - User Data                    │
        │  - Session Records              │
        │  - Participation Metrics        │
        │  - Content & Announcements      │
        └─────────────────────────────────┘
```

---

## Technology Stack

### Frontend

- **TypeScript** - Core programming language (TSX/TS) for strict compile-time type safety
- **React 18+** - UI library
- **Vite** - Build tool
- **React Router** - Navigation
- **React Bootstrap** - UI components
- **Axios** - HTTP client
- **Socket.io Client** - Real-time communication
- **Recharts** - Data visualization
- **React Toastify** - Notifications
- **JS Cookie** - Session management

### Backend

- **Flask** - Web framework
- **Python 3.x** - Programming language
- **TensorFlow/Keras** - Pre-trained emotion recognition models
- **OpenCV** - Video processing
- **SQLAlchemy** - ORM
- **Flask Session** - Session management

### Deployment

- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **Nginx** - HTTPS reverse proxy (TLS termination) + static file serving

---

## Prerequisites

Before you begin, ensure you have installed:

- **Docker** (v20.10+) and **Docker Compose** (v1.29+)
  - Download: https://www.docker.com/products/docker-desktop
- **Git** (v2.30+)

### Check Installation

```bash
docker --version
docker-compose --version
git --version
```

---

## Installation & Setup

FocusTrack supports two run modes via Docker Compose. Choose the one that fits your use case.

---

### Method 1 — Development Mode (Hot-Reload)

Use this when **actively developing or debugging** locally. The Vite dev server runs inside Docker with hot-reload enabled via polling.

> ⚠️ **Do NOT use this mode on a public web server.** It exposes source maps, enables debug logging, and is not optimised.

#### Step 1: Clone the Repository

```bash
git clone https://github.com/TommyYuan0215/FocusTrack.git
cd FocusTrack
```

#### Step 2: Set Up Environment Variables

```bash
cp .env.example .env
# Edit .env if needed — defaults work for local development
```

#### Step 3: Enable Development Override Config

Copy the development override template to activate local hot-reloads, source directories mapping, and dev ports:

```bash
cp docker-compose.override.yml.example docker-compose.override.yml
```

#### Step 4: Build and Start

```bash
docker compose up --build
```

#### Step 5: Access the Application

| Service       | URL                        |
|---------------|----------------------------|
| Frontend      | http://localhost:5180      |
| Backend API   | http://localhost:5555      |
| MySQL         | localhost:3320 (exposed)   |

#### Step 6: Stop

```bash
docker compose down
```

---

### Method 2 — Production Mode (Recommended for Hosting)

Use this when **deploying to a web server**. The React app is compiled into optimised static files served by **Nginx**, Gunicorn runs without hot-reload, and the MySQL port is not exposed externally.

#### Step 1: Clone the Repository (on your server)

```bash
git clone https://github.com/TommyYuan0215/FocusTrack.git
cd FocusTrack
```

#### Step 2: Configure Environment Variables

```bash
cp .env.example .env
nano .env   # or use your preferred editor
```

Set the following values in `.env` before continuing:

```env
# Generate a secure secret key:
# python -c "import secrets; print(secrets.token_hex(32))"
SECRET_KEY=<your-generated-secret-key>

DATABASE_PASSWORD=<strong-password>
MYSQL_ROOT_PASSWORD=<same-strong-password>

FLASK_ENV=production
```

> ⚠️ **Never deploy with the default `root` password.** Change it before running.

#### Step 3: Build All Images

```bash
# Build fresh — do not skip --no-cache on first production deploy
docker compose build --no-cache
```

This will:
- **Backend** — Install Python deps, bake source code into the image
- **Frontend** — Run `npm run build` (Vite), then serve the output via Nginx (no Node in final image)

#### Step 4: Start in Detached Mode

```bash
docker compose up -d
```

#### Step 5: Verify All Containers Are Running

```bash
docker compose ps
```

Expected output:
```
NAME                 STATUS          PORTS
nginx_proxy          Up              0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp
backend_container    Up (healthy)    0.0.0.0:5555->5555/tcp
frontend_container   Up              0.0.0.0:5180->5180/tcp
mysql_container      Up (healthy)    3306/tcp
```

> Note: MySQL shows `3306/tcp` with **no** external port mapping — this is correct and intentional for security.

#### Step 6: Set Up HTTPS (Required for Camera & Screen Share)

Camera and screen sharing **require HTTPS** — browsers block these APIs on plain HTTP. FocusTrack includes a built-in Nginx reverse proxy that handles TLS termination.

**Generate a certificate for your domain:**

For public domains (e.g. using Let's Encrypt):
```bash
certbot certonly --standalone -d yourdomain.com
cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/certs/cert.pem
cp /etc/letsencrypt/live/yourdomain.com/privkey.pem   nginx/certs/key.pem
```

For internal/homelab domains (e.g. `apps.homelab1367.internal`) using [mkcert](https://github.com/FiloSottile/mkcert):
```bash
# Install mkcert and trust the local CA
mkcert -install

# Generate cert for your internal domain
mkcert apps.homelab1367.internal

# Move into the certs folder
mv apps.homelab1367.internal.pem     nginx/certs/cert.pem
mv apps.homelab1367.internal-key.pem nginx/certs/key.pem
```

> ⚠️ The `nginx/certs/` folder is **git-ignored**. Never commit certificate or key files.

#### Step 7: Access the Application

| Service       | URL                                              |
|---------------|--------------------------------------------------|
| Frontend      | https://\<your-domain-or-ip\>                   |
| HTTP redirect | http://\<your-domain-or-ip\> → auto redirects   |
| Backend API   | Internal only (routed via frontend proxy)        |
| MySQL         | Not exposed externally ✅                        |

#### Step 8: View Logs

```bash
# All services
docker compose logs -f

# Individual services
docker compose logs -f nginx
docker compose logs -f backend
docker compose logs -f frontend
```

#### Step 9: Stop and Remove Containers

```bash
# Stop containers (keeps data volume)
docker compose down

# Stop and delete all data including database volume
docker compose down -v
```

#### Step 10: Update / Redeploy

```bash
git pull
docker compose build --no-cache
docker compose up -d
```

---

### Production vs Development — Quick Comparison

| Feature | Development | Production |
|---------|------------|------------|
| Frontend server | Vite dev server (hot-reload) | Nginx (static build) |
| HTTPS / TLS | ❌ Not included | ✅ Nginx reverse proxy |
| Camera & Screen Share | ✅ Works (localhost) | ✅ Works (requires HTTPS cert) |
| Source code in container | Bind-mounted from host | Baked into image at build |
| Gunicorn `--reload` | ✅ Enabled | ❌ Disabled |
| `FLASK_ENV` | `development` | `production` |
| MySQL port exposed | ✅ `3320:3306` | ❌ Internal only |
| Debug mode | ✅ On | ❌ Off |
| Build time | Fast (no build step) | Slower (compiles React) |
| Performance | ❌ Not optimised | ✅ Minified + gzip |

---

## TypeScript & Development Tooling 🛠️

To maintain frontend code quality and type safety, the client project is fully written in **TypeScript**.

### Type Checking
To compile and verify type correctness on the client code:
```bash
cd client
npx tsc --noEmit
```

### Code Linting
To run static analysis and verify React hook dependencies and rules:
```bash
cd client
npm run lint
```

---

## Usage Guide

### Default Admin Account

> ⚠️ **Important:** Change the default admin password after first login for security purposes.

```
Email: admin@aispt.com
Password: admin
```

---

### For Educators

1. **Login**
   - Access http://localhost:5180
   - Sign in with educator credentials

2. **Real-Time Monitoring**
   - Navigate to "Real-Time Monitoring"
   - Start or join a class session
   - Monitor student participation in real-time
   - View emotion recognition results on the dashboard

3. **Analytics & Reports**
   - Go to "Post Analytics" section
   - View participation statistics
   - Analyze emotion trends
   - Download detailed reports

4. **Manage Content**
   - Create and schedule announcements
   - Upload presentation slides
   - Manage class materials

### For Administrators

1. **Login**
   - Access the admin dashboard using default credentials above
   - Navigate to Admin Controls

2. **User Management**
   - Create/edit/delete user accounts
   - Assign roles and permissions
   - View user activity logs

3. **System Analytics**
   - Monitor system-wide participation metrics
   - View trend analysis across all classes
   - Access comprehensive data reports

4. **Content Management**
   - Approve announcements
   - Manage shared content
   - Configure system settings

### For Students

1. **Join Class**
   - Access the student portal
   - Join class sessions via invite link

2. **Enable Participation Tracking**
   - Grant camera/microphone permissions
   - Allow AI model to analyze participation
   - View your participation feedback

---

## API Documentation

### Authentication Endpoints

#### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Signup

```http
POST /api/auth/signup
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "educator"
}
```

### Tracking Server Endpoints

#### Start Session

```http
POST /api/tracking/session/start
Authorization: Bearer {token}

{
  "class_id": "class123",
  "session_name": "Math Class"
}
```

#### End Session

```http
POST /api/tracking/session/end
Authorization: Bearer {token}

{
  "session_id": "session123"
}
```

### Report Generation Endpoints

#### Get Participation Report

```http
GET /api/reports/participation?session_id=session123&format=json
Authorization: Bearer {token}
```

#### Get Emotion Trends

```http
GET /api/reports/emotion-trends?start_date=2025-01-01&end_date=2025-01-31
Authorization: Bearer {token}
```

### User Management Endpoints

#### Get User Profile

```http
GET /api/users/profile
Authorization: Bearer {token}
```

#### Update User Settings

```http
PUT /api/users/settings
Authorization: Bearer {token}

{
  "timezone": "Asia/Singapore",
  "notifications_enabled": true
}
```

---

## Project Structure

```
FocusTrack/
├── client/                          # React Frontend
│   ├── src/
│   │   ├── components/             # Reusable UI components
│   │   │   ├── card/              # Card components
│   │   │   ├── common/            # Common components
│   │   │   ├── customized/        # Custom styled components
│   │   │   ├── dashboard/         # Dashboard components
│   │   │   ├── form/              # Form components
│   │   │   ├── layout/            # Layout components
│   │   │   └── modal/             # Modal dialogs
│   │   ├── hooks/                 # Custom React hooks
│   │   │   ├── useEmotionTrends   # Trend data hook
│   │   │   ├── useLoadingState    # Loading state hook
│   │   │   └── useSession         # Session management
│   │   ├── utils/                 # Utility functions
│   │   │   ├── axiosUtils         # API calls
│   │   │   ├── errorBoundaries    # Error handling
│   │   │   ├── generateTrendReport# Report generation
│   │   │   └── navigation         # Navigation helpers
│   │   ├── views/                 # Page components
│   │   │   ├── home.tsx           # Home page
│   │   │   ├── Admin/             # Admin pages
│   │   │   ├── Educator/          # Educator pages
│   │   │   └── Settings/          # Settings pages
│   │   ├── App.tsx                # Root component
│   │   └── main.tsx               # Entry point
│   ├── package.json               # Dependencies
│   ├── vite.config.js             # Vite configuration
│   ├── nginx.conf                 # Frontend Nginx config (SPA + API proxy)
│   ├── dockerfile                 # Multi-stage Docker image (build → Nginx)
│   └── .dockerignore              # Excludes node_modules/dist from build context
│
├── server/                         # Flask Backend
│   ├── apps/
│   │   ├── blueprints/           # API endpoints
│   │   │   ├── tracking_server.py   # Real-time tracking
│   │   │   ├── tracking_session.py  # Session management
│   │   │   ├── user_credential.py   # Authentication
│   │   │   ├── user_management.py   # User CRUD
│   │   │   ├── content_management.py# Content CRUD
│   │   │   ├── report_generator.py  # Report generation
│   │   │   ├── settings.py          # Settings management
│   │   │   └── database.py          # Database ops
│   │   ├── models/               # AI Models
│   │   │   ├── emotion_recognition_model.keras
│   │   │   └── emotion_recognition_model_o.keras
│   │   └── services/             # Business logic
│   │       ├── config.py         # Configuration
│   │       ├── db_helper.py      # Database helpers
│   │       └── timezone_helper.py# Timezone utilities
│   ├── server.py                 # Flask app entry point
│   ├── requirements.txt          # Python dependencies
│   ├── dockerfile                # Production Docker image (Gunicorn)
│   └── .dockerignore             # Excludes cache/logs from image
│
├── nginx/                          # HTTPS Reverse Proxy
│   ├── nginx.conf                 # Nginx config (TLS termination, HTTP→HTTPS)
│   └── certs/                     # TLS certificate storage (git-ignored)
│       ├── README.md              # Instructions for placing certs here
│       ├── cert.pem               # Your certificate (NOT committed)
│       └── key.pem                # Your private key (NOT committed)
│
├── docker-compose.yml             # Docker Compose (production config)
├── docker-compose.override.yml    # Local dev overrides (git-ignored)
├── .env                           # Local secrets (git-ignored)
├── .env.example                   # Template — copy to .env
└── README.md                      # This file
```

---

## Security Considerations

- All API endpoints require authentication tokens
- Passwords are hashed using industry-standard algorithms
- Session data is encrypted
- CORS is configured for frontend access only
- Environment variables protect sensitive configuration
- Database credentials are never hardcoded

---

## Troubleshooting

### Port Already in Use

```bash
# If port 5180 (frontend) is in use, change the external port in docker-compose.yml:
# ports:
#   - "8080:80"   # Change left side to any free port

# If port 5555 (backend) is in use:
# ports:
#   - "5556:5555"  # Change left side to any free port
```

### Docker Build Fails

```bash
# Clear Docker build cache and rebuild from scratch
docker compose build --no-cache

# Nuclear option — removes all unused images and cache
docker system prune -a
docker compose up --build --force-recreate
```

### Frontend Shows Blank Page After Production Build

- The React app is a SPA — make sure the Nginx `try_files` rule is in place (it is in `client/nginx.conf`)
- Check Nginx logs: `docker compose logs frontend`
- Verify the build succeeded: `docker compose build frontend` and look for errors

### Backend API Not Responding

```bash
# Check if container is running and healthy
docker compose ps

# Tail backend logs
docker compose logs -f backend

# Test directly inside the container
docker exec -it backend_container curl http://localhost:5555/credential
```

### MySQL Container Not Starting / Backend Can't Connect

```bash
# Check MySQL logs
docker compose logs mysql

# If you changed MYSQL_ROOT_PASSWORD after the volume was created,
# drop the existing volume and let it recreate:
docker compose down -v
docker compose up -d
```

### Camera/Microphone Permissions

- Ensure the browser has permission to access camera/microphone
- Check Settings → Privacy & Security → Camera/Microphone
- **Camera and screen sharing require HTTPS in production.** `navigator.mediaDevices` is `undefined` on plain HTTP pages — this is a browser security restriction
- In production, generate a TLS certificate and place it in `nginx/certs/` (see [Step 6](#step-6-set-up-https-required-for-camera--screen-share))
- On `localhost` during development, this works without HTTPS
- Refresh the browser page after granting permissions

### WebSocket / Socket.IO Connection Issues

- Check that `socket.io/` proxy is configured in `client/nginx.conf` (it is by default)
- Verify firewall allows WebSocket upgrade on port 5180
- Check browser console for `WebSocket connection failed` errors
- Ensure the backend is running: `docker compose logs backend`

### Cannot Access Application From External IP

```bash
# Verify containers are running
docker compose ps

# Check all logs
docker compose logs -f

# Ensure server firewall allows ports 80 and 443
# Ubuntu/Debian:
ufw allow 80/tcp
ufw allow 443/tcp

# CentOS/RHEL:
firewall-cmd --add-port=80/tcp --permanent
firewall-cmd --add-port=443/tcp --permanent
firewall-cmd --reload
```

### Nginx Proxy Not Starting (Certificate Error)

```bash
# Check nginx logs
docker compose logs nginx

# Verify cert files exist in the right location
ls nginx/certs/
# Should show: cert.pem  key.pem  README.md

# If cert.pem / key.pem are missing, generate them:
# See Step 6 in the Production setup above
```

---

## Author

**Tan Jun Lin**

---

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

**Last Updated:** July 5, 2026
