# Work-Break API – AI-Powered Productivity Backend

The **Work-Break API** is the official backend powering the Work-Break productivity platform. It provides secure REST APIs for authentication, work breaks, tasks, meetings, leave management, AI-powered features, Google Calendar synchronization, and team management.

Built with **NestJS**, **MongoDB**, and **TypeScript**, the API is designed to be fast, scalable, and easy to self-host.

---

## 🌟 Key Features

- 🔐 JWT authentication & authorization
- 🤖 AI-powered Break Buddy integration
- ☕ Work break management
- ✅ Task management with priorities
- 📅 Meeting scheduling
- 🏖 Leave management
- 📆 Google Calendar synchronization
- 👥 Team & employee management
- 📊 Analytics and reporting APIs
- 🌐 RESTful API
- 🔒 Privacy-focused and open source

---

## 🚀 Why Work-Break API?

Most productivity platforms lock users into proprietary ecosystems.

The Work-Break API is designed to be:

- Open source
- Self-hostable
- Lightweight
- Secure
- API-first
- Developer-friendly
- Built for startups, teams, and individuals

Whether you're running the official Work-Break frontend or building your own client, the API provides everything needed to manage productivity workflows.

---

## 🛠 Tech Stack

- NestJS
- TypeScript
- MongoDB
- Mongoose
- JWT Authentication
- Swagger (OpenAPI)
- Google Calendar API
- AI integrations

---

## 🔄 Google Calendar Integration

The API integrates with Google Calendar using secure OAuth authentication.

Supported features:

- Import calendar events
- Create events
- Update synchronized events
- Delete synchronized events
- Automatic timezone handling
- Secure OAuth token management

---

## 📦 Prerequisites

Before running the API, install:

- Node.js 22+
- npm or Yarn
- MongoDB

Optional:

- Google Cloud OAuth credentials (Google Calendar Sync)
- AI provider API key (Break Buddy)

---

# 🚀 Getting Started

## Clone the repository

```bash
git clone https://github.com/work-break/work-break-api.git
cd work-break-api
```

## Install dependencies

Using npm

```bash
npm install
```

Using Yarn

```bash
yarn install
```

---

## Configure Environment

Create a `.env` file in the project root.

Example:

```env
PORT=3020

MONGODB_URI=mongodb://localhost:27017/work-break

HI_BREAKS_JWT_SECRET=your-super-secret-key

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# AI Provider
TOGETHER_API_KEY=
```

---

## Running the API

### Development

```bash
npm run start
```

or

```bash
yarn start
```

### Development (Watch Mode)

```bash
npm run start:dev
```

or

```bash
yarn start:dev
```

### Production

```bash
npm run build
npm run start:prod
```

---

## 🧪 Running Tests

Unit tests

```bash
npm run test
```

Watch mode

```bash
npm run test:watch
```

Coverage

```bash
npm run test:cov
```

---

## 📖 API Documentation

If Swagger is enabled, visit:

```
http://localhost:3020/api
```

---

## 📂 Project Structure

```
src/
├── auth/
├── users/
├── breaks/
├── tasks/
├── meetings/
├── leave/
├── calendar/
├── ai/
├── common/
├── config/
├── database/
└── main.ts
```

---

## 🤝 Contributing

Contributions are always welcome!

To contribute:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push your branch
5. Open a Pull Request

Please read **CONTRIBUTING.md** before submitting your contribution.

---

## 📄 License

This project is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**.

You are free to use, modify, and distribute this software.

If you run a modified version of the Work-Break API as a hosted service (SaaS), you must also make the source code of your modified version available under the same AGPL-3.0 license.

For full details, see the **LICENSE** file.

---

Built with ❤️ by the **Work-Break** community.