# ProjectOS 🚀

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express.js" />
  <img src="https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white" alt="Redis" />
  <img src="https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socketdotio&logoColor=white" alt="Socket.io" />
</p>

ProjectOS is a scalable, collaborative work management platform that bridges the gap between structured task management (**Jira**), real-time communication (**Slack**), and centralized documentation (**Notion**). 

Built with modern technologies, it offers a robust backend for real-time collaboration, secure authentication, and efficient project tracking.

---

## 🌟 Key Features

- **🛡️ Secure Authentication**: JWT-based auth with access and refresh tokens.
- **📂 Project Management**: Create, update, and manage project-specific workflows.
- **✅ Task Tracking**: Detailed task management within project contexts.
- **💬 Real-time Chat**: Project-specific chat rooms using Socket.io for instant communication.
- **📊 Activity Logs**: Automatic logging of project and task activities.
- **📖 API Documentation**: Interactive API exploration with Swagger UI.
- **🚦 Security**: Rate limiting, data validation, and secure password hashing.

---

## 🛠️ Tech Stack & Technologies Used

We leverage a modern and robust stack to ensure performance, scalability, and security.

| Category | Technologies |
| :--- | :--- |
| **Backend** | ![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white) ![Express.js](https://img.shields.io/badge/Express.js-000000?style=flat-square&logo=express&logoColor=white) |
| **Database** | ![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat-square&logo=mongodb&logoColor=white) ![Mongoose](https://img.shields.io/badge/Mongoose-880000?style=flat-square&logo=mongoose&logoColor=white) |
| **Real-time** | ![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=flat-square&logo=socketdotio&logoColor=white) |
| **Caching/Security** | ![Redis](https://img.shields.io/badge/Redis-DC382D?style=flat-square&logo=redis&logoColor=white) |
| **Documentation** | ![Swagger](https://img.shields.io/badge/Swagger-85EA2D?style=flat-square&logo=swagger&logoColor=black) |
| **Validation** | ![Joi](https://img.shields.io/badge/Joi-white?style=flat-square&logo=joi&logoColor=black) |

---

## 🚀 Getting Started

Follow these steps to get the project running locally on your machine.

### 📋 Prerequisites

Ensure you have the following installed:
- ![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white) (v16.x or higher)
- ![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat-square&logo=mongodb&logoColor=white) (Local or Atlas)
- ![Redis](https://img.shields.io/badge/Redis-DC382D?style=flat-square&logo=redis&logoColor=white) (Required for rate limiting)

### ⚙️ Installation Steps

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd ProductionGraded
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory and add the following variables:
   ```env
   PORT=5001
   MONGO_URI=mongodb://127.0.0.1:27017/ProjectOS_DB
   ACCESS_TOKEN_SECRET=your_access_token_secret
   REFRESH_TOKEN_SECRET=your_refresh_token_secret
   ADMIN_EMAIL=admin@projectos.com
   ADMIN_PASSWORD=your_admin_password
   ```

4. **Start the Project**
   For development with automatic restarts:
   ```bash
   npm run start
   ```

---

## 📚 API Documentation

Once the server is running, you can access the interactive API documentation at:
`http://localhost:5001/api-docs`

This allows you to test endpoints directly from your browser.

---

## 📂 Project Structure

```text
src/
├── config/       # Database and server configurations
├── controllers/  # Request handlers
├── middlewares/  # Custom Express middlewares (Auth, Validation, etc.)
├── models/       # Mongoose schemas
├── routes/       # API route definitions
├── service/      # Business logic and external integrations
├── socket/       # Socket.io event handlers
├── utils/        # Helper functions
└── validators/   # Data validation schemas (Joi)
```

---

## 🛡️ Best Practices Applied

- **Validation**: Strict input validation using Joi schemas.
- **Security**: Password hashing with Bcrypt and JWT for session management.
- **Optimization**: Redis-based rate limiting to prevent API abuse.
- **Formatting**: ESLint and Prettier for consistent code style.
- **Git Hooks**: Husky for linting before commits.

---

## 🤝 Contributing

1. Fork the project.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

## 📄 License

Distributed under the ISC License.
