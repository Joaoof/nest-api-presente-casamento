<p align="center">
  <a href="https://nestjs.com/" target="_blank">
    <img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" />
  </a>
</p>

<p align="center">
  A progressive <a href="https://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.
</p>

<p align="center">
  <a href="https://www.npmjs.com/~nestjscore" target="_blank">
    <img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" />
  </a>
  <a href="https://www.npmjs.com/~nestjscore" target="_blank">
    <img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" />
  </a>
  <a href="https://www.npmjs.com/~nestjscore" target="_blank">
    <img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" />
  </a>
  <a href="https://circleci.com/gh/nestjs/nest" target="_blank">
    <img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" />
  </a>
  <a href="https://discord.gg/G7Qnnhy" target="_blank">
    <img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord" />
  </a>
  <a href="https://opencollective.com/nest#backer" target="_blank">
    <img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" />
  </a>
  <a href="https://opencollective.com/nest#sponsor" target="_blank">
    <img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" />
  </a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank">
    <img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us" />
  </a>
  <a href="https://opencollective.com/nest#sponsor" target="_blank">
    <img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us" />
  </a>
  <a href="https://twitter.com/nestframework" target="_blank">
    <img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter" />
  </a>
</p>

---

## 🚀 Project Overview

This is a **NestJS backend API** for managing **gift reservations**, user authentication, email notifications, and caching. The application follows a modular architecture with clear separation of concerns.

### 🔧 Key Features

- ✅ **Authentication & Authorization** using JWT
- ✅ **Gift Management**: Create, update, list, and reserve gifts
- ✅ **Email Notifications** via Nodemailer (Mail Module)
- ✅ **Caching Layer** to improve performance
- ✅ **TypeScript DTOs** for request/response validation
- ✅ **Modular Structure** with clean separation of logic
- ✅ **Swagger Documentation** (automatically generated)

---

## 📁 Project Structure

src/
├── auth/ # Authentication module (login, JWT)
│ ├── dto/
│ ├── guards/
│ ├── strategies/
│ ├── auth.controller.ts
│ ├── auth.module.ts
│ └── auth.service.ts
│
├── cache/ # Cache module (Redis or in-memory)
│ ├── cache.module.ts
│ └── cache.service.ts
│
├── gifts/ # Gift management module
│ ├── dto/
│ ├── gifts.controller.ts
│ ├── gifts.module.ts
│ └── gifts.service.ts
│
├── mail/ # Email notification module
│ ├── mail.module.ts
│ └── mail.service.ts
│
├── shared/ # Shared utilities and types
│ ├── exceptions/
│ └── types/
│
├── app.controller.ts
├── app.module.ts
├── app.service.ts
└── main.ts


---

## 🛠️ Project Setup

```bash
# Install dependencies
npm install

# Development mode (with hot reload)
npm run start:dev

# Production build
npm run start:prod

# Run in watch mode
npm run start:dev
```

```bash
PORT=3000
JWT_SECRET=your_jwt_secret_key
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
REDIS_URL=redis://localhost:6379
```

📚 Resources
NestJS Documentation
NestJS DevTools – Visualize your app structure
NestJS Mau – Deploy to AWS easily
Discord Community – Get help and share ideas
💬 Support & Contact
If you need support or have questions, feel free to reach out:

Discord: Join our community
Twitter: @nestframework
GitHub Issues: Report bugs or feature requests here
📄 License
This project is licensed under the MIT License - see the LICENSE file for details.

👤 Author
Joaoof – Developer
GitHub Profile
📧 Contact: joao@example.com (replace with your contact)

