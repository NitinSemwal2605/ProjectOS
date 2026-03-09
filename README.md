# ProjectOS 🚀

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express.js" />
  <img src="https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white" alt="Redis" />
  <img src="https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socketdotio&logoColor=white" alt="Socket.io" />
  <img src="https://img.shields.io/badge/Cloudinary-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white" alt="Cloudinary" />
</p>

ProjectOS is a scalable, collaborative work management platform that bridges the gap between structured task management (**Jira**), real-time communication (**Slack**), and centralized documentation (**Notion**). 

Built with modern technologies, it offers a robust backend for real-time collaboration, secure authentication, efficient project tracking, and **seamless file sharing** powered by Cloudinary.

---

## 🚀 Core Features (Detailed)

### 🔐 Authentication & Security
- **JWT-Based Auth**: Secure session management using Access and Refresh tokens.
- **Role-Based Access**: Granular control for different user roles within projects.
- **Password Safety**: Industry-standard encryption using `bcrypt` for all user credentials.

### 📂 Project Management
- **Full CRUD Support**: Seamlessly create, update, and manage project lifecycles.
- **Member Collaboration**: Add and remove members to projects with ease.
- **Activity Tracking**: Real-time logging of project-related activities to keep teams informed.
- **Scoped Rooms**: Automatic creation of project-specific communication channels via Socket.io.

### ✅ Task Tracking System
- **Dynamic Task Assignment**: Assign tasks to multiple project members with clear ownership.
- **Smart Updates**: Real-time status synchronization across all connected team members.
- **History Logs**: Detailed trail of task modifications, including assignee and status changes.

### 💬 Real-time Communication
- **Project-Specific Chat**: Secure messaging within project rooms using Socket.io.
- **History Retrieval**: Efficient loading of chat history with pagination for optimized performance.
- **Real-time Indicators**: Visual cues for typing status (`typing:start`, `typing:stop`).
- **Message Management**: Support for editing and soft-deleting messages with historical transparency.
- **@Mentions & Notifications**: Tag team members using `@username` syntax with real-time in-app notifications.

### 📎 File Upload & Sharing (NEW)
- **In-Chat Attachments**: Send files (images, documents, videos, etc.) directly alongside chat messages.
- **Cloudinary-Powered Storage**: Automatic upload and CDN delivery via **Cloudinary** with `resource_type: 'auto'` for universal file support.
- **Base64 Transport**: Files are sent as Base64-encoded strings over Socket.io for seamless real-time delivery.
- **Persistent File Records**: Every uploaded file is stored in a dedicated `File` model with full metadata tracking (original name, MIME type, size, URL).
- **Project-Scoped Files**: All uploads are linked to a specific project and the uploading user for auditability.
- **Soft Delete Support**: Files can be soft-deleted without losing historical data.

### 📖 API Documentation & Monitoring
- **Interactive Swagger Docs**: Fully documented REST API endpoints for easy testing and integration.
- **Centralized Validation**: Robust input sanitization and schema validation using **Joi**.
- **Error Handling**: Unified error management for consistent and helpful API responses.

---

## 🛠️ Tech Stack & Technologies Used

We leverage a modern and robust stack to ensure performance, scalability, and security.

| Category | Technologies |
| :--- | :--- |
| **Backend** | ![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white) ![Express.js](https://img.shields.io/badge/Express.js-000000?style=flat-square&logo=express&logoColor=white) |
| **Database** | ![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat-square&logo=mongodb&logoColor=white) ![Mongoose](https://img.shields.io/badge/Mongoose-880000?style=flat-square&logo=mongoose&logoColor=white) |
| **Real-time** | ![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=flat-square&logo=socketdotio&logoColor=white) |
| **Caching/Security** | ![Redis](https://img.shields.io/badge/Redis-DC382D?style=flat-square&logo=redis&logoColor=white) |
| **File Storage** | ![Cloudinary](https://img.shields.io/badge/Cloudinary-3448C5?style=flat-square&logo=cloudinary&logoColor=white) |
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
- A free ![Cloudinary](https://img.shields.io/badge/Cloudinary-3448C5?style=flat-square&logo=cloudinary&logoColor=white) account ([Sign up here](https://cloudinary.com/users/register/free))

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
   # Server
   PORT=5001

   # Database
   MONGO_URI=mongodb://127.0.0.1:27017/ProjectOS_DB

   # Authentication
   ACCESS_TOKEN_SECRET=your_access_token_secret
   REFRESH_TOKEN_SECRET=your_refresh_token_secret

   # Admin Seed
   ADMIN_EMAIL=admin@projectos.com
   ADMIN_PASSWORD=your_admin_password

   # Cloudinary (Required for File Uploads)
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

   > **💡 How to get Cloudinary credentials:**
   > 1. Create a free account at [cloudinary.com](https://cloudinary.com/users/register/free).
   > 2. Navigate to the **Dashboard** after logging in.
   > 3. Copy the **Cloud Name**, **API Key**, and **API Secret** from the dashboard.

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

## 📎 File Upload Feature — Deep Dive

This section provides a comprehensive guide to the File Upload system integrated into ProjectOS's real-time chat.

### 🏗️ Architecture Overview

```
┌──────────────┐    Base64 via     ┌──────────────┐   Upload API    ┌──────────────┐
│              │   Socket.io       │              │                │              │
│    Client    │ ──────────────►   │   Server     │ ────────────►  │  Cloudinary  │
│              │                   │ (chatHandler)│                │    (CDN)     │
│              │   ◄──────────────  │              │   ◄────────── │              │
│              │    chat:receive   │              │  secure_url   │              │
└──────────────┘                   └──────┬───────┘                └──────────────┘
                                          │
                                          │ Save metadata
                                          ▼
                                   ┌──────────────┐
                                   │   MongoDB    │
                                   │  (File +     │
                                   │   Message)   │
                                   └──────────────┘
```

### 📤 How File Upload Works (Step-by-Step)

1. **Client sends** a `chat:send` event with an `attachments` array containing Base64-encoded files.
2. **Server validates** room membership (user must be in the `project:{projectId}` room).
3. **For each attachment**, the server:
   - Uploads the Base64 data to **Cloudinary** using `resource_type: 'auto'` (images, videos, PDFs, etc.).
   - Creates a `File` document in MongoDB storing the metadata (URL, MIME type, size, original name).
4. **A `Message` document** is created with the text content and an array of `File` reference IDs in the `attachments` field.
5. **The complete message** (with attachment references) is broadcast to all clients in the room via `chat:receive`.

### 📡 Socket Event Payloads

#### Sending a Message with Attachments

**Event:** `chat:send`

```json
{
  "projectId": "64f1a2b3c4d5e6f7a8b9c0d1",
  "content": "Here are the design mockups for the homepage",
  "attachments": [
    {
      "base64": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
      "originalName": "homepage-v2.png",
      "mimeType": "image/png",
      "size": 245760
    },
    {
      "base64": "data:application/pdf;base64,JVBERi0xLjQKJcfs...",
      "originalName": "design-spec.pdf",
      "mimeType": "application/pdf",
      "size": 1048576
    }
  ]
}
```

#### Receiving a Message with Attachments

**Event:** `chat:receive`

```json
{
  "_id": "67c1d4e5f6a7b8c9d0e1f2a3",
  "projectId": "64f1a2b3c4d5e6f7a8b9c0d1",
  "senderId": "65a2b3c4d5e6f7a8b9c0d1e2",
  "content": "Here are the design mockups for the homepage",
  "attachments": [
    "67c1d4e5f6a7b8c9d0e1f2a4",
    "67c1d4e5f6a7b8c9d0e1f2a5"
  ],
  "editedAt": null,
  "deletedAt": null,
  "createdAt": "2026-03-09T05:30:00.000Z",
  "updatedAt": "2026-03-09T05:30:00.000Z"
}
```

> **📝 Note:** The `attachments` array contains MongoDB ObjectId references to `File` documents. Clients should populate these to display file details (name, URL, type).

### 🗄️ File Model Schema

Every uploaded file is persisted with the following schema in MongoDB:

| Field | Type | Description |
| :--- | :--- | :--- |
| `projectId` | ObjectId (ref: Project) | The project this file belongs to |
| `uploadedBy` | ObjectId (ref: User) | The user who uploaded the file |
| `originalName` | String | Original filename provided by the client |
| `storageName` | String | Cloudinary `public_id` for the uploaded asset |
| `url` | String | Cloudinary `secure_url` (HTTPS CDN link) |
| `mimeType` | String | File MIME type (e.g., `image/png`, `application/pdf`) |
| `size` | Number | File size in bytes |
| `deletedAt` | Date \| null | Soft-delete timestamp (`null` = active) |
| `createdAt` | Date | Auto-generated creation timestamp |
| `updatedAt` | Date | Auto-generated update timestamp |

**Indexes:**
- `projectId` — Quick lookup by project
- `uploadedBy` — Quick lookup by uploader
- `deletedAt` — Filter soft-deleted files
- Compound: `{ projectId: 1, createdAt: -1 }` — Efficient chronological queries per project

### ☁️ Cloudinary Configuration

Cloudinary is configured in `src/config/cloudinary.js` using environment variables:

```javascript
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
```

The upload utility in `src/utils/cloudinary.utils.js` uses `resource_type: 'auto'` to automatically detect and handle **any file type** — images, videos, documents, and raw files:

```javascript
const options = {
  folder: 'chat_attachments',   // All uploads go to this Cloudinary folder
  resource_type: 'auto',        // Auto-detect: image, video, or raw
};

const result = await cloudinary.uploader.upload(base64Data, options);
// result.secure_url  → HTTPS CDN URL
// result.public_id   → Unique Cloudinary identifier
// result.bytes       → File size
// result.format      → Detected file format
```

### 🔒 Security Considerations

| Concern | How It's Handled |
| :--- | :--- |
| **Unauthorized uploads** | Only authenticated users in a project room can send files |
| **Room validation** | Server checks `socket.rooms.has(room)` before processing |
| **File metadata integrity** | Client-provided metadata is supplemented with Cloudinary's own detection |
| **Soft deletion** | Files are never permanently removed; `deletedAt` timestamp is set |

### 💡 Supported File Types

Since Cloudinary's `resource_type: 'auto'` is used, the following file categories are supported:

| Category | Examples |
| :--- | :--- |
| **Images** | PNG, JPG, JPEG, GIF, SVG, WebP, BMP, TIFF |
| **Videos** | MP4, MOV, AVI, WebM, MKV |
| **Documents** | PDF, DOCX, XLSX, PPTX, TXT, CSV |
| **Archives** | ZIP, RAR, 7Z, TAR.GZ |
| **Audio** | MP3, WAV, OGG, FLAC |

---

## 📂 Project Structure

```text
src/
├── config/           # Database, server, and Cloudinary configurations
│   ├── cloudinary.js # Cloudinary SDK initialization
│   ├── db.js         # MongoDB connection setup
│   ├── redis.js      # Redis client configuration
│   ├── socket.js     # Socket.io server setup
│   └── swagger.js    # Swagger/OpenAPI config
├── controllers/      # Request handlers
├── middlewares/       # Custom Express middlewares (Auth, Validation, Cache, etc.)
├── models/           # Mongoose schemas
│   ├── File.js       # File metadata model (Cloudinary uploads)
│   ├── Message.js    # Chat message model (with attachments ref)
│   ├── Project.js    # Project model
│   ├── User.js       # User model
│   └── ...           # ActivityLog, Notification, ProjectMember, etc.
├── routes/           # API route definitions
├── service/          # Business logic and external integrations
│   └── messageService.js  # Message CRUD + mention/notification logic
├── socket/           # Socket.io event handlers
│   ├── chatHandler.js     # chat:send, chat:edit, chat:delete + file uploads
│   └── ...
├── utils/            # Helper functions
│   ├── cloudinary.utils.js  # uploadToCloudinary() helper
│   ├── mention.utils.js     # @mention parsing
│   └── ...
└── validators/       # Data validation schemas (Joi)
```

---

## 🛡️ Best Practices Applied

- **Validation**: Strict input validation using Joi schemas.
- **Security**: Password hashing with Bcrypt and JWT for session management.
- **Optimization**: Redis-based rate limiting to prevent API abuse.
- **File Storage**: Cloud-based file storage with Cloudinary CDN for fast delivery.
- **Soft Deletes**: Messages and files use `deletedAt` pattern for data safety.
- **Activity Logging**: Every significant action is logged for auditability.
- **Formatting**: ESLint and Prettier for consistent code style.
- **Git Hooks**: Husky + lint-staged for linting before commits.
- **Commit Standards**: Conventional commits enforced via CommitLint.

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
