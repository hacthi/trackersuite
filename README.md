# Tracker Suite - Client Relationship Management System

A comprehensive full-stack HR CRM system built with modern technologies to help professionals manage client relationships, track interactions, and schedule follow-ups efficiently.

## 🚀 Features

- **Client Management**: Complete CRUD operations with search and filtering
- **Follow-up Tracking**: Schedule and manage client follow-ups with reminders
- **Communication History**: Log and track all client interactions
- **User Journey System**: Gamified milestone tracking and progress visualization
- **Advanced Analytics**: Comprehensive reporting and data visualization
- **Role-Based Access Control**: Admin, Master Admin, and User roles
- **Trial System**: 7-day free trial with automatic monitoring
- **Email Integration**: Automated notifications via Resend
- **Dark/Light Mode**: Full theme support with system preference detection
- **Mobile Responsive**: Optimized for all device sizes

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** with shadcn/ui components
- **TanStack Query** for server state management
- **Wouter** for lightweight routing
- **React Hook Form** with Zod validation
- **Framer Motion** for animations

### Backend
- **Node.js** with Express.js
- **TypeScript** with ES modules
- **PostgreSQL** with Drizzle ORM
- **Neon Database** for serverless PostgreSQL
- **Passport.js** for authentication
- **Express Session** with PostgreSQL store
- **Resend** for email services

### DevOps & Tools
- **Docker** & Docker Compose for containerization
- **ESLint** & Prettier for code quality
- **Vitest** for testing
- **GitHub Actions** for CI/CD
- **Drizzle Kit** for database migrations

## 📋 Prerequisites

- Node.js 18.x or 20.x
- PostgreSQL 16+ (or use Docker)
- npm or yarn

## 🔧 Installation

### 1. Clone the repository
```bash
git clone <repository-url>
cd ClientRelationTracker
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables
Copy the example environment file and configure it:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
DATABASE_URL="postgresql://user:password@host:port/database"
SESSION_SECRET="your-secret-key-here"
NODE_ENV="development"
RESEND_API_KEY="re_123456789"  # Optional for email features
```

### 4. Set up the database
```bash
npm run db:push
```

## 🐳 Docker Setup

### Using Docker Compose (Recommended for Development)
```bash
# Start the application and database
docker-compose up

# Stop the services
docker-compose down

# Rebuild after changes
docker-compose up --build
```

This will:
- Start PostgreSQL on port 5432
- Start the application on port 5000
- Create persistent volumes for database data

### Manual Docker Build
```bash
# Build the image
docker build -t tracker-suite .

# Run the container
docker run -p 5000:5000 \
  -e DATABASE_URL="postgresql://..." \
  -e SESSION_SECRET="your-secret" \
  tracker-suite
```

## 🚀 Development

### Start development server
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

### Run tests
```bash
# Run tests once
npm test run

# Run tests in watch mode
npm test
```

### Lint code
```bash
npm run lint
```

### Format code
```bash
npm run format
```

### Type checking
```bash
npm run check
```

## 🏗️ Production Build

### Build the application
```bash
npm run build
```

### Start production server
```bash
npm start
```

## 📁 Project Structure

```
ClientRelationTracker/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Route components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utilities and API client
│   │   └── test/          # Test files
│   └── index.html
├── server/                # Express backend
│   ├── routes.ts          # API route definitions
│   ├── storage.ts         # Data layer abstraction
│   ├── db.ts              # Database connection
│   ├── auth.ts            # Authentication logic
│   ├── middleware/        # Express middleware
│   └── index.ts           # Server entry point
├── shared/                # Shared TypeScript types
│   └── schema.ts          # Zod schemas
├── .github/
│   └── workflows/         # GitHub Actions CI/CD
├── dist/                  # Production build output
├── Dockerfile             # Docker configuration
├── docker-compose.yml     # Docker Compose setup
└── package.json
```

## 🔐 Default Admin Account

For initial setup, a master admin account is available:
- **Email**: admin@trackercrm.com
- **Password**: admin123

**⚠️ Important**: Change this password immediately in production!

## 🧪 Testing

The project uses Vitest for testing:

```bash
# Run all tests
npm test run

# Run tests in watch mode
npm test

# Run tests with coverage
npm test -- --coverage
```

## 📊 Database Management

### Push schema changes
```bash
npm run db:push
```

### Generate migrations
```bash
npx drizzle-kit generate
```

### View database in Drizzle Studio
```bash
npx drizzle-kit studio
```

## 🔄 CI/CD

The project includes a GitHub Actions workflow that:
- Runs on push to main/master branches
- Tests on Node.js 18.x and 20.x
- Runs linting (with soft fail)
- Runs tests
- Builds the application

## 🌐 Deployment

### Environment Variables for Production
Ensure these are set in your production environment:
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Strong random secret for sessions
- `NODE_ENV`: Set to "production"
- `RESEND_API_KEY`: (Optional) For email functionality
- `PORT`: (Optional) Defaults to 5000

### Cloud Deployment
The application is configured for deployment on:
- **Google Cloud Run**
- **Replit**
- **Heroku**
- **Railway**
- **Render**

Health check endpoints are available at:
- `/health` - Basic health check
- `/ready` - Readiness check with database status

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style
- Follow the ESLint configuration
- Run `npm run format` before committing
- Write tests for new features
- Update documentation as needed

## 📝 License

MIT License - see LICENSE file for details

## 🐛 Known Issues

- Linting shows 389 issues (mostly warnings) - being addressed incrementally
- Some TypeScript `any` types need refinement
- Email functionality requires Resend API key configuration

## 📞 Support

For support and questions:
- Check the [Documentation](./replit.md)
- Open an issue on GitHub
- Contact the development team

## 🎯 Roadmap

- [ ] Complete unit test coverage
- [ ] Fix all linting warnings
- [ ] Add E2E tests with Playwright
- [ ] Implement real-time notifications with WebSockets
- [ ] Add data export to Excel
- [ ] Implement advanced filtering and sorting
- [ ] Add calendar view for follow-ups
- [ ] Mobile app (React Native)

---

**Built with ❤️ by the Tracker Suite Team**
