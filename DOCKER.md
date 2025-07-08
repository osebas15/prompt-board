# Docker Configuration for Prompt Board

This project includes comprehensive Docker configuration for different environments and use cases.

## Files Overview

- **`Dockerfile`** - Production build optimized for deployment
- **`Dockerfile.dev`** - Development build with hot reload support
- **`docker-compose.yml`** - Main compose file with production and development profiles
- **`docker-compose.local.yml`** - Local development with Supabase Studio integration
- **`.dockerignore`** - Files to exclude from Docker build context

## Environment Files

- **`.env.production`** - Production Supabase and API keys
- **`.env.local`** - Local development with default Supabase CLI values
- **`.env.example`** - Template for environment variables

## Usage Commands

### Quick Start

```bash
# Development with hot reload (uses .env.local)
npm run docker:dev

# Production build (uses .env.production)  
npm run docker:prod

# Local development with Supabase Studio
npm run docker:local

# Stop all containers
npm run docker:stop
```

### Detailed Commands

#### Development Environment
```bash
# Start development server with hot reload
docker-compose --profile dev up

# Build and start development
docker-compose --profile dev up --build

# Run in background
docker-compose --profile dev up -d
```

#### Production Environment
```bash
# Build and start production
docker-compose --profile prod up --build

# Run production in background
docker-compose --profile prod up -d

# Scale production (multiple instances)
docker-compose --profile prod up --scale app-prod=3
```

#### Local Development with Supabase
```bash
# Start local development with Supabase Studio
docker-compose -f docker-compose.local.yml --profile local up

# Background mode
docker-compose -f docker-compose.local.yml --profile local up -d
```

#### Individual Container Management
```bash
# Build production image
docker build -t prompt-board .

# Run production container directly
docker run -p 3000:3000 --env-file .env.production prompt-board

# Run with custom environment
docker run -p 3000:3000 -e VITE_SUPABASE_URL=your-url prompt-board
```

## Port Mapping

| Service | Host Port | Container Port | Description |
|---------|-----------|----------------|-------------|
| Production App | 3000 | 3000 | Built React application |
| Development App | 5173 | 5173 | Vite dev server with HMR |
| Supabase Studio | 54323 | 3000 | Local Supabase dashboard |

## Environment Configuration

### Production (.env.production)
- Uses your live Supabase project
- Production API keys
- Optimized build settings

### Local Development (.env.local)
- Uses `http://localhost:54321` for Supabase
- Default local development anon key
- Works with `supabase start`

## Health Checks

The production container includes health checks:
- **Endpoint**: `http://localhost:3000`
- **Interval**: 30 seconds
- **Timeout**: 10 seconds
- **Retries**: 3
- **Start Period**: 40 seconds

## Development Workflow

### 1. Local Development (Recommended)
```bash
# Start Supabase locally
supabase start

# Start development server
npm run dev
# OR with Docker
npm run docker:dev
```

### 2. Production Testing
```bash
# Test production build locally
npm run docker:prod

# Access at http://localhost:3000
```

### 3. Full Local Stack
```bash
# Start everything including Supabase Studio
npm run docker:local

# Access app at http://localhost:5173
# Access Supabase Studio at http://localhost:54323
```

## Troubleshooting

### Common Issues

1. **Port conflicts**
   ```bash
   # Check what's using a port
   lsof -i :3000
   
   # Kill process on port
   kill -9 $(lsof -t -i:3000)
   ```

2. **Build failures**
   ```bash
   # Clean build with no cache
   docker-compose build --no-cache
   
   # Remove all containers and rebuild
   docker-compose down -v
   docker-compose up --build
   ```

3. **Environment variables not loading**
   ```bash
   # Verify environment file exists
   ls -la .env.*
   
   # Check container environment
   docker-compose exec app-dev env | grep VITE_
   ```

### Logs and Debugging

```bash
# View logs
npm run docker:logs

# Follow logs for specific service
docker-compose logs -f app-dev

# Execute commands in running container
docker-compose exec app-dev sh
```

## Production Deployment

For production deployment, ensure:

1. **Environment variables are set**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_GEMINI_API_KEY`

2. **Security considerations**:
   - Never commit `.env.production` to version control
   - Use secrets management in production
   - Enable HTTPS in production

3. **Performance optimization**:
   - The production Dockerfile is multi-stage optimized
   - Dev dependencies are removed after build
   - Image uses Alpine Linux for smaller size

## Integration with Supabase CLI

The local development setup works seamlessly with Supabase CLI:

```bash
# Start local Supabase
supabase start

# Use with Docker development
npm run docker:dev

# The app will connect to local Supabase at localhost:54321
```
