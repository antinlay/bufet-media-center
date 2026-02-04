# BUFET Digital Signage MVP - Installation & Setup Guide

## 🚀 Quick Start

### 1. Install Dependencies
```bash
# Install pnpm if you don't have it
npm install -g pnpm

# Install all project dependencies
pnpm install
```

### 2. Environment Setup
```bash
# Copy environment templates
cp apps/api/.env.example apps/api/.env
cp apps/dashboard/.env.example apps/dashboard/.env
cp apps/player/.env.example apps/player/.env
```

### 3. Database Setup
```bash
# Start PostgreSQL (using Docker)
docker-compose up postgres -d

# Or install PostgreSQL locally and use:
# DATABASE_URL="postgresql://bufet:bufet123@localhost:5432/bufet"

# Run database migrations and seed data
cd apps/api
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

### 4. Start Development Servers
```bash
# Start all services from root directory
pnpm dev

# Or start individually:
pnpm --filter @bufet/api dev      # API on http://localhost:3001
pnpm --filter @bufet/dashboard dev # Dashboard on http://localhost:3000
pnpm --filter @bufet/player start   # Expo dev server
```

## 📱 Testing the Flow

### Step 1: Dashboard Access
1. Open http://localhost:3000
2. Login with demo credentials:
   - Email: `demo@bufet.com`
   - Password: `password123`

### Step 2: Pair Device
1. Run Player app on Android device/emulator:
   ```bash
   cd apps/player
   expo start
   ```
2. Scan QR code with Expo Go app
3. Note the 6-digit pairing code displayed
4. In dashboard: "Pair New Device" → Enter code

### Step 3: Configure Content
1. Create a playlist in dashboard
2. Add sample image URLs (or use provided seed data)
3. Assign playlist to your device

### Step 4: Verify Playback
- Player app should auto-detect and start displaying content
- Test image/video transitions
- Verify full-screen playback

## 🐳 Docker Production Setup

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 📋 Available Scripts

```bash
# Root level
pnpm dev          # Start all apps in development
pnpm build        # Build all packages
pnpm lint         # Lint all packages
pnpm typecheck    # Type check all packages

# API (apps/api)
pnpm dev          # Development server
pnpm build        # Build for production
pnpm db:generate  # Generate Prisma client
pnpm db:migrate   # Run migrations
pnpm db:seed      # Seed test data

# Dashboard (apps/dashboard)
pnpm dev          # Development server
pnpm build        # Build for production
pnpm preview      # Preview production build

# Player (apps/player)
pnpm start        # Expo development server
pnpm android      # Run on Android device
pnpm ios          # Run on iOS device
```

## 🔧 Development Notes

### Shared Package
All TypeScript types and Zod schemas are in `packages/shared` and automatically shared across all applications.

### Database Schema
- PostgreSQL with Prisma ORM
- Models: User, Device, Pairing, Playlist, PlaylistItem, DeviceConfig
- Seed data includes demo user and sample playlist

### API Architecture
- NestJS with JWT authentication
- RESTful endpoints with TypeScript validation
- CORS configured for local development

### Mobile App
- React Native with Expo
- Secure device ID storage
- Full-screen media playback
- Offline content caching

### Web Dashboard
- React with TypeScript
- TanStack Query for data fetching
- Tailwind CSS for styling
- Radix UI components

## 🌐 Service URLs

- **API**: http://localhost:3001
- **Dashboard**: http://localhost:3000
- **Expo**: http://localhost:8081 (scannable QR code)

## 📚 API Documentation

### Player Endpoints
- `GET /api/player/bootstrap?deviceId=<id>` - Get device status
- `POST /api/player/pairing` - Create pairing code
- `GET /api/player/pairing/status?deviceId=<id>` - Check pairing status
- `GET /api/player/config?deviceId=<id>` - Get device configuration

### Dashboard Endpoints (JWT Protected)
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/devices` - List user devices
- `POST /api/devices/pair` - Pair new device
- `GET /api/playlists` - List playlists
- `POST /api/playlists` - Create playlist
- `POST /api/playlists/:id/items` - Add content to playlist

Happy coding! 🎉