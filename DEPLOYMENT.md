# 🏟️ SportBook Pro - Deployment & Setup Guide

## 📋 Table of Contents
1. [System Requirements](#system-requirements)
2. [Environment Setup](#environment-setup)
3. [Database Configuration](#database-configuration)
4. [Local Development](#local-development)
5. [Production Deployment](#production-deployment)
6. [Docker Deployment](#docker-deployment)
7. [Initial Setup & Admin Creation](#initial-setup--admin-creation)
8. [Environment Variables](#environment-variables)
9. [Troubleshooting](#troubleshooting)

---

## 🔧 System Requirements

### Minimum Requirements
- **Node.js**: 18.x or higher
- **npm**: 8.x or higher (or yarn 1.22+)
- **PostgreSQL**: 14.x or higher
- **Memory**: 2GB RAM
- **Storage**: 10GB available space

### Recommended for Production
- **Node.js**: 20.x LTS
- **Memory**: 4GB+ RAM
- **Storage**: 50GB+ SSD
- **CPU**: 2+ cores

---

## 🌍 Environment Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd sports-booking-system
```

### 2. Install Dependencies
```bash
# Install backend and frontend dependencies
npm install

# Or using yarn
yarn install
```

### 3. Environment Configuration
Create a `.env` file in the root directory:

```env
# Development Environment
NODE_ENV=development

# Database Configuration
DATABASE_URL=postgresql://username:password@host:port/database

# Server Configuration
PORT=5000

# Session Configuration
SESSION_SECRET=your-super-secret-session-key-here

# Firebase Configuration (Optional - for push notifications)
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY=your-firebase-private-key
FIREBASE_CLIENT_EMAIL=your-firebase-client-email
```

---

## 🗄️ Database Configuration

### PostgreSQL Setup

#### Option 1: Local PostgreSQL
```bash
# Install PostgreSQL (Ubuntu/Debian)
sudo apt update
sudo apt install postgresql postgresql-contrib

# Create database and user
sudo -u postgres createdb sports_booking
sudo -u postgres createuser --interactive sports_user
sudo -u postgres psql -c "ALTER USER sports_user PASSWORD 'secure_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE sports_booking TO sports_user;"
```

#### Option 2: Cloud Database (Recommended)
- **Supabase**: Create a new project at [supabase.com](https://supabase.com)
- **Neon**: Create database at [neon.tech](https://neon.tech)
- **Railway**: Deploy PostgreSQL at [railway.app](https://railway.app)

### Database Migration
```bash
# Generate migration files
npx drizzle-kit generate

# Apply migrations to database
npx drizzle-kit migrate

# Or push schema directly (development)
npm run db:push
```

---

## 💻 Local Development

### 1. Start Development Server
```bash
# Start the full-stack development server
npm run dev

# This starts:
# - Backend API server on port 5000
# - Frontend dev server with HMR
# - Automatic proxy configuration
```

### 2. Access the Application
- **Frontend**: Available via the Builder.io interface
- **API**: `http://localhost:5000/api`
- **Database**: Connect using your DATABASE_URL

### 3. Development Commands
```bash
# Type checking
npm run check

# Database operations
npm run db:push          # Push schema changes
npx drizzle-kit studio   # Open database studio

# Build for production
npm run build
```

---

## 🚀 Production Deployment

### Option 1: Traditional VPS/Server

#### 1. Server Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Install PostgreSQL (if needed)
sudo apt install postgresql postgresql-contrib
```

#### 2. Application Deployment
```bash
# Clone and setup
git clone <repository-url> sports-booking
cd sports-booking
npm install

# Configure environment
cp .env.example .env
nano .env  # Edit with production values

# Build application
npm run build

# Start with PM2
pm2 start dist/index.js --name "sports-booking"
pm2 startup
pm2 save
```

#### 3. Nginx Configuration
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Option 2: Platform-as-a-Service

#### Vercel Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Configure environment variables in Vercel dashboard
```

#### Railway Deployment
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

#### Render Deployment
1. Connect your GitHub repository
2. Configure build command: `npm run build`
3. Configure start command: `npm start`
4. Add environment variables

---

## 🐳 Docker Deployment

### 1. Dockerfile
```dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build application
RUN npm run build

# Expose port
EXPOSE 5000

# Start application
CMD ["npm", "start"]
```

### 2. Docker Compose
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@db:5432/sports_booking
      - SESSION_SECRET=your-session-secret
    depends_on:
      - db

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=sports_booking
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

### 3. Deploy with Docker
```bash
# Build and run
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

---

## 👤 Initial Setup & Admin Creation

### 1. Create App Admin (First-time Setup)

#### Option A: Using API
```bash
# POST request to create app admin
curl -X POST http://localhost:5000/api/app-admin/setup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "System Administrator",
    "email": "admin@yourdomain.com",
    "password": "SecurePassword123!",
    "phone": "+1234567890"
  }'
```

#### Option B: Database Direct Insert
```sql
-- Insert app admin directly into database
INSERT INTO app_admins (name, email, password_hash, phone)
VALUES (
  'System Administrator',
  'admin@yourdomain.com',
  '$2b$10$encrypted_password_hash_here',
  '+1234567890'
);
```

### 2. Create Organizations
```bash
# Login as app admin first, then create organization
curl -X POST http://localhost:5000/api/organizations \
  -H "Content-Type: application/json" \
  -H "Cookie: session_cookie_here" \
  -d '{
    "name": "Downtown Sports Complex",
    "type": "public",
    "city": "New York",
    "latitude": "40.7128",
    "longitude": "-74.0060"
  }'
```

### 3. Setup Process Flow
1. **Create App Admin** → System superuser
2. **Login as App Admin** → Access admin panel
3. **Create Organizations** → Public/Private sports organizations
4. **Add Organization Admins** → Delegate organization management
5. **Create Facilities & Courts** → Add sports venues
6. **Configure User Groups** → Set up access control
7. **Add Staff Members** → Operational team
8. **Create Slots & Restrictions** → Define booking rules

---

## 🔐 Environment Variables Reference

### Required Variables
```env
# Database (Required)
DATABASE_URL=postgresql://user:pass@host:port/db

# Session Security (Required)
SESSION_SECRET=random-secure-string-min-32-chars

# Server Configuration
NODE_ENV=production|development
PORT=5000
```

### Optional Variables
```env
# Firebase Push Notifications
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."
FIREBASE_CLIENT_EMAIL=firebase-service@project.iam.gserviceaccount.com

# External Services
PAYMENT_GATEWAY_KEY=your-payment-key
EMAIL_SERVICE_KEY=your-email-key
SMS_SERVICE_KEY=your-sms-key

# Redis (for sessions in production)
REDIS_URL=redis://localhost:6379

# Logging
LOG_LEVEL=info|debug|error
```

---

## 🔧 Troubleshooting

### Common Issues

#### 1. Database Connection Error
```
Error: DATABASE_URL must be set
```
**Solution**: Ensure DATABASE_URL is properly set in .env file and database is accessible.

#### 2. Session Secret Error
```
Warning: connect.session() MemoryStore is not designed for production
```
**Solution**: Set SESSION_SECRET and configure Redis for production sessions.

#### 3. Port Already in Use
```
Error: listen EADDRINUSE :::5000
```
**Solution**: 
```bash
# Find process using port 5000
lsof -ti:5000

# Kill process
kill -9 <PID>

# Or change PORT in .env
```

#### 4. Migration Errors
```
Error: relation "users" already exists
```
**Solution**:
```bash
# Reset database (development only)
npx drizzle-kit drop
npx drizzle-kit push

# Or use force push
npx drizzle-kit push --force
```

### Performance Optimization

#### 1. Database Indexing
```sql
-- Add indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_bookings_user_date ON bookings(user_id, date);
CREATE INDEX idx_slots_court_date ON slots(court_id, date);
```

#### 2. Caching Setup
```javascript
// Add Redis for session storage (production)
import redis from 'redis';
const client = redis.createClient(process.env.REDIS_URL);
```

#### 3. Load Balancing
```nginx
upstream sports_booking {
    server localhost:5000;
    server localhost:5001;
    server localhost:5002;
}
```

---

## 📱 Mobile App Setup (Future)

### React Native Configuration
```bash
# Install React Native CLI
npm install -g react-native-cli

# Create mobile app
npx react-native init SportBookMobile

# Configure API endpoint
const API_BASE_URL = 'https://your-domain.com/api';
```

### Firebase Setup for Push Notifications
1. Create Firebase project
2. Add Android/iOS apps
3. Download configuration files
4. Configure FCM tokens

---

## 🔄 Backup & Recovery

### Database Backup
```bash
# Create backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
psql $DATABASE_URL < backup_file.sql

# Automated daily backup (cron)
0 2 * * * pg_dump $DATABASE_URL > /backups/sports_booking_$(date +\%Y\%m\%d).sql
```

### File Backup
```bash
# Backup uploaded files
tar -czf uploads_backup.tar.gz uploads/

# Backup configuration
cp .env .env.backup
```

---

## 📊 Monitoring & Logging

### Setup PM2 Monitoring
```bash
# Install PM2 monitoring
pm2 install pm2-logrotate

# View logs
pm2 logs sports-booking

# Monitor processes
pm2 monit
```

### Application Monitoring
```javascript
// Add monitoring middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});
```

---

## 📞 Support & Maintenance

### Regular Maintenance Tasks
1. **Weekly**: Check logs for errors
2. **Monthly**: Update dependencies
3. **Quarterly**: Review security updates
4. **Annually**: Database optimization

### Getting Help
- **Documentation**: Check this guide first
- **Issues**: Create GitHub issues for bugs
- **Security**: Email security@yourdomain.com
- **General**: Contact support@yourdomain.com

---

**🎉 Congratulations!** Your SportBook Pro system is now ready for deployment. Follow the steps above carefully and reach out if you need assistance.
