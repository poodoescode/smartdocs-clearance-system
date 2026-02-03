# 🌱 SmartDocs Clearance System

A modern, paperless clearance request and approval system for educational institutions. Built with React, Node.js, and Supabase.

![Version](https://img.shields.io/badge/version-2.0.0-green)
![React](https://img.shields.io/badge/React-18-blue)
![Node](https://img.shields.io/badge/Node-16+-green)

## 🎯 Overview

SmartDocs is a digital clearance management system that streamlines the process of requesting and approving student clearances (graduation, transfer, leave of absence). It features role-based dashboards, multi-stage approval workflows, and real-time status tracking.

## ✨ Key Features

- **Multi-Role Dashboards**: Student, Library Admin, Cashier Admin, Registrar Admin, Super Admin
- **AI-Powered Routing**: Automatic request classification and routing
- **Multi-Stage Approval**: Library → Cashier → Registrar workflow
- **Real-Time Tracking**: Live status updates and notifications
- **Document Management**: Upload and download clearance certificates
- **Announcements System**: System-wide notifications with priority levels
- **Request History**: Complete audit trail with timestamps
- **Environmental Impact**: Track paper saved and CO2 reduced

## 🛠️ Tech Stack

### Frontend
- React 18 + Vite
- Tailwind CSS
- Supabase Client
- React Hot Toast
- Framer Motion
- Google reCAPTCHA

### Backend
- Node.js + Express
- Supabase (PostgreSQL)
- Axios
- Nodemailer (email notifications)

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ and npm
- Supabase account ([supabase.com](https://supabase.com))
- Google reCAPTCHA v2 keys ([google.com/recaptcha](https://www.google.com/recaptcha/admin))

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/poodoescode/smartdocs-clearance-system.git
cd smartdocs-clearance-system
```

2. **Setup Backend**
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your credentials
```

3. **Setup Frontend**
```bash
cd ../frontend
npm install
cp .env.example .env
# Edit .env with your credentials
```

4. **Configure Environment Variables**

See `.env.example` files in both `frontend/` and `backend/` directories for required variables.

**Important**: You must configure your Supabase URL, API keys, and reCAPTCHA keys before running the application.

5. **Setup Database**

Run the SQL migration scripts in your Supabase SQL Editor (in order):
- Database schema setup
- RLS policies
- Triggers and functions

6. **Run the Application**

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

Visit `http://localhost:5173`

## 📁 Project Structure

```
smartdocs-clearance-system/
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Dashboard pages
│   │   ├── services/      # API services
│   │   └── lib/           # Utilities
│   └── package.json
├── backend/               # Node.js backend
│   ├── routes/           # API routes
│   ├── services/         # Business logic
│   ├── middleware/       # Express middleware
│   └── package.json
└── README.md
```

## 🔐 Security

- Row Level Security (RLS) policies
- Google reCAPTCHA v2 protection
- Password strength validation
- Role-based access control
- Secure environment variables
- Input validation and sanitization

## 🎭 User Roles

- **Student**: Create and track clearance requests
- **Library Admin**: Approve/reject at library stage
- **Cashier Admin**: Approve/reject at cashier stage  
- **Registrar Admin**: Final approval and completion
- **Super Admin**: System management and user administration

## 🔄 Clearance Workflow

```
Student Request → Library Review → Cashier Review → Registrar Review → Completed
                     ↓ Reject         ↓ Reject         ↓ Reject
                  On Hold (Student can resubmit)
```

## 📝 License

MIT License - See LICENSE file for details

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

For issues and questions, please open an issue on GitHub.

---

**Built with 🌱 for a paperless future**
