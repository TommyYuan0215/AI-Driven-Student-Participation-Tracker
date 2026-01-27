# FocusTrack - An AI-Driven Student Participation Tracker

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/Python-3.8+-3776AB?logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-3.1.0-000000?logo=flask&logoColor=white)
![TensorFlow](https://img.shields.io/badge/TensorFlow-2.19.0-FF6F00?logo=tensorflow&logoColor=white)
![OpenCV](https://img.shields.io/badge/OpenCV-4.10.0-5C3EE8?logo=opencv&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-5.11.4-010101?logo=socketdotio&logoColor=white)
![React](https://img.shields.io/badge/React-18+-61DAFB?logo=react&logoColor=black)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql&logoColor=white)

## Table of Contents

- [Introduction](#introduction)
- [Key Features](#key-features)
- [System Architecture](#system-architecture)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Usage Guide](#usage-guide)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
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
│         │              │              │                 │
│         │ WebSocket/   │ REST API     │                 │
│         │ REST API     │              │                 │
└─────────┼──────────────┼──────────────┼─────────────────┘
          │              │              │
          └──────────────┼──────────────┘
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
        │    Database (MySQL/SQLite)      │
        │  - User Data                    │
        │  - Session Records              │
        │  - Participation Metrics        │
        │  - Content & Announcements      │
        └─────────────────────────────────┘
```

---

## Technology Stack

### Frontend

- **React 18+** - UI framework
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

### Quick Start with Docker (Recommended)

#### Step 1: Clone the Repository

```bash
git clone https://github.com/TommyYuan0215/FocusTrack.git
cd FocusTrack
```

#### Step 2: Build and Run with Docker Compose

```bash
docker-compose up --build
```

This command will:

- Build the Flask backend container
- Build the React frontend container
- Start both services
- Initialize the database

#### Step 3: Access the Application

- **Frontend:** http://localhost:5180
- **Backend API:** http://localhost:5555

#### Step 4: Stop the Application

```bash
docker-compose down
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
AI-Driven-Student-Participation-Tracker/
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
│   │   │   ├── home.jsx           # Home page
│   │   │   ├── Admin/             # Admin pages
│   │   │   ├── Educator/          # Educator pages
│   │   │   └── Settings/          # Settings pages
│   │   ├── App.jsx                # Root component
│   │   └── main.jsx               # Entry point
│   ├── package.json               # Dependencies
│   ├── vite.config.js             # Vite configuration
│   └── Dockerfile                 # Docker configuration
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
│   ├── Dockerfile               # Docker configuration
│   └── flask_session/           # Session storage
│
├── docker-compose.yml           # Docker composition
└── README.md                    # This file
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
# If port 5173 (frontend) is in use, modify docker-compose.yml:
# ports:
#   - "5174:5173"  # Change external port

# If port 5000 (backend) is in use, modify docker-compose.yml:
# ports:
#   - "5001:5000"  # Change external port
```

### Docker Build Fails

```bash
# Clear Docker cache
docker system prune -a

# Rebuild from scratch
docker-compose up --build --force-recreate
```

### Camera/Microphone Permissions

- Ensure browser has permission to access camera/microphone
- Check Settings → Privacy & Security → Camera/Microphone
- Refresh the browser page

### WebSocket Connection Issues

- Check that Socket.io is enabled on backend
- Verify firewall allows WebSocket connections
- Check browser console for connection errors

### Cannot Access Application

- Verify Docker containers are running: `docker-compose ps`
- Check logs: `docker-compose logs -f`
- Ensure ports 5173 and 5000 are available
- Try rebuilding: `docker-compose up --build`

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

**Last Updated:** November 17, 2025
