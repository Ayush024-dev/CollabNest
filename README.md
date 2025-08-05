# 🚀 CollabNest

*A collaborative platform for entrepreneurs and professionals to share, discover, and collaborate on startup ideas.*

> **"If your idea is good, you deserve a team to build it."**

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Screenshots](#-screenshots)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Installation](#-installation)
- [Docker Setup](#-docker-setup)
- [Project Structure](#-project-structure)
- [Contributing](#-contributing)

---

## 📌 Overview

**CollabNest** is a collaborative platform designed for aspiring founders, professionals, and innovators to pitch startup ideas and find like-minded collaborators. Whether you're a visionary with an idea or a builder looking to join the next big thing, CollabNest helps ideas find the right teams — and teams find their purpose.

### 🎯 Mission
Connect innovative ideas with passionate teams to build the next generation of successful startups.

---

## ✨ Features

### 🚀 Core Functionality
- **💡 Idea Sharing**: Post and share startup ideas publicly or privately
- **👥 Team Building**: Create or join collaborative teams around ideas
- **🔍 Discovery**: Discover trending ideas in your field of interest
- **💬 Real-time Messaging**: Communicate with collaborators instantly
- **🔔 Smart Notifications**: Stay updated with real-time activity alerts
- **🔐 Secure Authentication**: Robust user authentication and personal dashboards
- **📁 Structured Profiles**: Comprehensive profiles for both ideas and users

### 🛡️ Security & Privacy
- JWT-based authentication
- Encrypted data transmission
- Role-based access control
- Secure file uploads

---

## 🖼️ Screenshots

### Landing Page
![Landing Page](https://github.com/user-attachments/assets/ab91d193-c7fb-4045-a530-b2e946c12fdd)

### Share Ideas
![Share Ideas](https://github.com/user-attachments/assets/1f84f421-1b7a-4aaf-91ba-2a6763d4ea82)
*Share your startup ideas with others to gain recognition or build a team.*

### Real-time Updates
![Real-time Updates](https://github.com/user-attachments/assets/b78b25e1-20bd-4835-a0c3-1dd3f18cb80d)
*Receive real-time updates so you never miss anything important.*

### Connection Requests
![Connection Requests](https://github.com/user-attachments/assets/380082c0-70bf-47dd-9ebc-70b6b7aeff09)
*Send connection requests to like-minded people and build your professional network.*

### Messaging Portal
![Messaging Portal](https://github.com/user-attachments/assets/0e9939eb-af16-42a4-ae6b-49a9d8d8cf37)
*Discuss plans and strategies in real-time via the messaging portal with edit and delete capabilities.*

---

## 🛠️ Tech Stack

### **Frontend**
- **Framework**: Next.js 14
- **UI Library**: React.js 18
- **Styling**: Tailwind CSS + Material-UI (MUI)
- **State Management**: React Hooks
- **HTTP Client**: Axios

### **Backend**
- **Runtime**: Node.js
- **Framework**: Express.js
- **Real-time**: Socket.IO
- **Authentication**: JWT

### **Database**
- **Primary**: MongoDB Atlas
- **ODM**: Mongoose

### **Infrastructure**
- **Containerization**: Docker
- **File Storage**: Cloudinary
- **Email Service**: Nodemailer
- **Environment**: Environment Variables

---

## 🚧 Getting Started

### ⚙️ Prerequisites

- **Node.js** ≥ 16.0.0
- **npm** or **yarn** package manager
- **MongoDB** database (MongoDB Atlas recommended)
- **Docker** (optional, for containerized setup)

### 📋 System Requirements

- **RAM**: Minimum 4GB (8GB recommended)
- **Storage**: 2GB free space
- **Network**: Stable internet connection

---

## 📦 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/Ayush024-dev/CollabNest.git
cd CollabNest
```

### 2. Environment Setup

Create `.env` files in both `client` and `server` directories:

```bash
# In server/.env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
EMAIL_USER=your_email
EMAIL_PASS=your_email_password

# In client/.env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

### 3. Backend Setup

```bash
cd server
npm install
npm start
```

### 4. Frontend Setup

```bash
cd client
npm install
npm run dev
```

### 5. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080

---

## 🐳 Docker Setup

### Prerequisites
- Docker installed on your system
- Docker Compose (optional, for multi-container setup)

### Backend Container

```bash
cd server
docker build -t collabnest-backend .
docker run -p 8080:8080 --env-file .env collabnest-backend
```

### Frontend Container

```bash
cd client
docker build -t collabnest-frontend .
docker run -p 3000:3000 --env-file .env collabnest-frontend
```

### Using Docker Compose (Recommended)

```bash
# From project root
docker-compose up -d
```

---

## 📁 Project Structure

```
CollabNest/
├── 📁 client/                 # Next.js Frontend
│   ├── 📁 app/               # App Router
│   ├── 📁 components/        # Reusable Components
│   ├── 📁 public/           # Static Assets
│   ├── 📄 package.json
│   └── 📄 next.config.js
│
├── 📁 server/                # Express.js Backend
│   ├── 📁 controllers/      # Route Controllers
│   ├── 📁 models/          # Database Models
│   ├── 📁 routes/          # API Routes
│   ├── 📁 middleware/      # Custom Middleware
│   ├── 📁 utils/           # Utility Functions
│   ├── 📄 package.json
│   └── 📄 server.js
│
├── 📄 .gitignore
├── 📄 .dockerignore
├── 📄 docker-compose.yml
└── 📄 README.md
```

---

## 🔧 Development

### Available Scripts

#### Backend
```bash
npm start          # Start production server
npm run dev        # Start development server with nodemon
npm test           # Run tests
npm run lint       # Lint code
```

#### Frontend
```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run start      # Start production server
npm run lint       # Lint code
```

### Code Style
- **Backend**: ESLint with Airbnb config
- **Frontend**: ESLint + Prettier
- **Git**: Conventional Commits

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/AmazingFeature`)
3. **Commit** your changes (`git commit -m 'Add some AmazingFeature'`)
4. **Push** to the branch (`git push origin feature/AmazingFeature`)
5. **Open** a Pull Request

### Contribution Guidelines
- Follow the existing code style
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Ayush024-dev**
- GitHub: [@Ayush024-dev](https://github.com/Ayush024-dev)

---

## 🙏 Acknowledgments

- **MongoDB Atlas** for database hosting
- **Cloudinary** for file storage
- **Vercel** for deployment support
- **Open Source Community** for amazing tools and libraries

---

<div align="center">

**Thank you for visiting CollabNest! 🚀**

*Built with ❤️ for the startup community*

[![GitHub stars](https://img.shields.io/github/stars/Ayush024-dev/CollabNest?style=social)](https://github.com/Ayush024-dev/CollabNest/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/Ayush024-dev/CollabNest?style=social)](https://github.com/Ayush024-dev/CollabNest/network/members)

</div>

