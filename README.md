# BUFET Digital Signage MVP

Full-stack Digital Signage MVP with two applications and one backend:

- **BUFET Player** - React Native app for Android TV devices
- **BUFET Cabinet** - Web dashboard for device management
- **Backend API** - NestJS service with PostgreSQL

## Architecture

```
├── apps/
│   ├── api/           # NestJS backend API
│   ├── bufet-media-dashboard/ # Expo dashboard (web/mobile)
│   └── bufet-media-player/ # Player app (Expo)
├── packages/
│   └── shared/        # Shared TypeScript types
└── docker-compose.yml
```

## Features

### Player App (React Native)
- Device ID generation and secure storage
- Bootstrap configuration loading
- QR code pairing flow
- Full-screen media playback (images & videos)
- Playlist rotation with configurable durations
- Offline playback with cached content

### Dashboard (Web)
- User authentication (register/login)
- Device management and pairing
- Playlist creation and management
- Device configuration assignment
- Real-time pairing via QR codes

### Backend API
- JWT authentication
- Device pairing management
- Playlist and content management
- RESTful API with TypeScript validation

## Quick Start

### Prerequisites
- Node.js 18+
- pnpm package manager
- PostgreSQL 15+
- Expo CLI (for mobile development)

### Installation

1. Clone and install dependencies:
```bash
git clone <repository-url>
cd buffet-digital-signage
pnpm install
```

2. Set up environment variables:
```bash
# API
cp apps/api/.env.example apps/api/.env
# Dashboard  
cp apps/dashboard/.env.example apps/dashboard/.env
# Player
cp apps/player/.env.example apps/player/.env
```

3. Start database and run migrations:
```bash
# Using Docker (recommended)
docker-compose up postgres -d

# Or run PostgreSQL locally
# Then run migrations and seed
cd apps/api
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

### Development

Start all services in development mode:
```bash
# Root directory - starts all apps
pnpm dev

# Or start individually:
pnpm --filter @bufet/api dev
pnpm --filter @bufet/dashboard dev  
pnpm --filter @bufet/player start
```

Services will be available at:
- API: http://localhost:3001
- Dashboard: http://localhost:3000
- Player: Expo development server

### Production (Docker)

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Testing the Flow

### 1. Create Account
1. Navigate to http://localhost:3000
2. Register a new account or login with demo credentials:
   - Email: `demo@bufet.com`
   - Password: `password123`

### 2. Pair Device
1. Run the Player app on Android device or emulator
2. Note the pairing code shown in the Player app
3. In dashboard, click "Pair New Device" or visit `/pair?code=XXXXXX`
4. Enter the pairing code to link the device

### 3. Configure Playlist
1. In dashboard, create a playlist
2. Add content URLs (images/videos)
3. Assign the playlist to your paired device

### 4. Verify Playback
1. The Player app will automatically detect the assigned playlist
2. Content should start displaying in full-screen mode
3. Test device rotation and content transitions

## API Endpoints

### Player API
```
GET  /api/player/bootstrap?deviceId=<id>
POST /api/player/pairing
GET  /api/player/pairing/status?deviceId=<id>
GET  /api/player/config?deviceId=<id>
```

### Dashboard API (Protected)
```
POST /api/auth/login
POST /api/auth/register
GET  /api/devices
POST /api/devices/pair
PATCH /api/devices/:id
GET  /api/playlists
POST /api/playlists
POST /api/playlists/:id/items
PATCH /api/device-config/:deviceId
```

## Database Schema

### Core Models
- **User** - Authentication and account management
- **Device** - Physical TV devices with unique IDs  
- **Pairing** - Temporary pairing codes for device linking
- **Playlist** - Content collections
- **PlaylistItem** - Individual media items (images/videos)
- **DeviceConfig** - Links devices to playlists

## Development Notes

### Shared Types
The `packages/shared` directory contains TypeScript interfaces and Zod schemas used across all applications.

### Environment Variables
- API uses `DATABASE_URL` for PostgreSQL connection
- Dashboard uses `VITE_API_URL` for API communication  
- Player uses `EXPO_PUBLIC_API_URL` for bootstrap requests

### Code Quality
- TypeScript strict mode enabled
- ESLint and Prettier configured
- Shared validation schemas with Zod
- React Query for data fetching

## Production Deployment

### Environment Setup
1. Set production database URL
2. Generate secure JWT secrets
3. Configure CORS origins
4. Set up SSL certificates

### Scaling Considerations
- Use CDN for media hosting
- Implement Redis for session storage
- Add load balancer for API instances
- Consider WebSocket for real-time updates

## License

MIT License - see LICENSE file for details.