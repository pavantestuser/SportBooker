# 🏟️ SportBook Pro - Sports Booking and Management System

> A comprehensive sports facility booking and management platform with advanced features like location-based discovery, role-based access control, and intelligent booking restrictions.

## ✨ Features

### 🎯 Core Features
- **Multi-Organization Support** - Public and private sports organizations
- **Role-Based Access Control** - App Admin, Org Admin, Staff, and User roles
- **Advanced Booking System** - With restrictions, group access, and slot combinations
- **Location-Based Discovery** - GPS-powered nearby court finder
- **Smart Search** - Fuzzy matching with filters and suggestions
- **Push Notifications** - Firebase FCM integration for real-time updates

### 🏆 Advanced Capabilities
- **Slot Restrictions** - Group-based access, per-user limits, full court booking
- **Coupon System** - Multiple discount types with conditional logic
- **Gender-Based Groups** - Automatic user categorization
- **Extended Booking** - Combine multiple consecutive time slots
- **Real-time Availability** - Live slot status updates
- **Mobile-First Design** - Responsive UI optimized for all devices

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL 14+
- npm or yarn

### 1. Clone & Install
```bash
git clone <repository-url>
cd sports-booking-system
npm install
```

### 2. Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Edit with your database credentials
nano .env
```

### 3. Database Setup
```bash
# Push database schema
npm run db:push
```

### 4. Start Development Server
```bash
npm run dev
```

🎉 **Application will be available in the Builder.io interface!**

---

## 📖 Documentation

- **[📚 Deployment Guide](DEPLOYMENT.md)** - Complete setup and deployment instructions
- **[🔧 API Documentation](API.md)** - REST API endpoints and usage
- **[👥 User Guide](USER_GUIDE.md)** - Feature explanations and workflows
- **[🏗️ Architecture](ARCHITECTURE.md)** - System design and database schema

---

## 🏛️ System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌──��──────────────┐
│   React Client  │────│  Express API    │────│   PostgreSQL    │
│                 │    │                 │    │                 │
│ • Advanced UI   │    │ • Role-based    │    │ • Complete      │
│ • Real-time     │    │   access        │    │   schema        │
│ • Location      │    │ • Booking logic │    │ • Optimized     │
│   services      │    │ • Search APIs   │    │   queries       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │ Firebase FCM    │
                    │ • Push Notifications
                    │ • Real-time updates
                    └─────────────────┘
```

---

## 👥 User Roles & Permissions

| Role | Capabilities |
|------|-------------|
| **🔑 App Admin** | • Create organizations<br>• System-wide oversight<br>• Platform management |
| **🏢 Organization Admin** | • Manage organization<br>• Add facilities & courts<br>• Configure user access |
| **👥 Staff** | • Manage sections<br>• Add slots<br>• Handle daily operations |
| **👤 User** | • Book slots<br>• Search facilities<br>• Manage profile |

---

## 🗄️ Database Schema

### Core Tables
- **users** - User accounts with location data
- **organizations** - Sports organizations (public/private)
- **facilities** - Sports facilities with location
- **courts** - Individual courts/fields
- **slots** - Time slots with advanced restrictions
- **bookings** - User bookings with payment info
- **coupons** - Discount and promotion system

### Key Relationships
```sql
Organization → Facilities → Courts → Slots → Bookings
           ↓
    User_Organization_Map
           ↓
       User_Groups
```

---

## 🔧 Development

### Project Structure
```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Application pages
│   │   ├── hooks/          # Custom React hooks
│   │   └── lib/            # Utilities and configs
├── server/                 # Express backend
│   ├── routes.ts           # API endpoints
│   ├── storage.ts          # Database operations
│   └── services/           # Business logic
├── shared/                 # Shared types and schemas
│   └── schema.ts           # Drizzle database schema
└── migrations/             # Database migrations
```

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run check        # TypeScript type checking
npm run db:push      # Push database schema
```

### Tech Stack
- **Frontend**: React 18, TypeScript, Tailwind CSS, Shadcn/UI
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL, Drizzle ORM
- **Authentication**: Express Sessions
- **Real-time**: WebSocket support
- **Notifications**: Firebase Cloud Messaging

---

## 🎯 Key Features in Detail

### 🔍 Advanced Search & Discovery
- **Multi-criteria search** - Name, location, sport type, availability
- **Location-based results** - GPS-powered distance calculation
- **Smart filters** - Price range, time slots, facility features
- **Auto-suggestions** - Real-time search recommendations

### 🏆 Intelligent Booking System
- **Group restrictions** - Control access by user groups
- **Per-user limits** - Prevent over-booking by individuals
- **Slot combinations** - Book consecutive time slots
- **Full court booking** - Reserve entire facility
- **Dynamic pricing** - Time-based and demand-based pricing

### 📱 Location Services
- **GPS integration** - Automatic location detection
- **City selector** - BookMyShow-style city selection
- **Distance calculation** - Accurate nearby facility discovery
- **Route optimization** - Smart facility recommendations

### 🎫 Coupon & Discount System
- **Multiple discount types** - Flat, percentage, conditional
- **Usage limits** - Control coupon utilization
- **Date-based validity** - Time-restricted promotions
- **Minimum booking amounts** - Conditional discounts

---

## 🚀 Deployment Options

### Quick Deploy (Recommended)
- **[Vercel](https://vercel.com)** - Frontend + API deployment
- **[Railway](https://railway.app)** - Full-stack deployment
- **[Render](https://render.com)** - Complete platform deployment

### Self-Hosted
- **VPS/Dedicated Server** - Complete control
- **Docker** - Containerized deployment
- **Kubernetes** - Scalable container orchestration

---

## 🔐 Security Features

- **Password hashing** with bcrypt
- **Session-based authentication**
- **Role-based API access control**
- **Organization data segregation**
- **Input validation and sanitization**
- **SQL injection prevention**

---

## 📊 Performance Optimizations

- **Database indexing** for fast queries
- **Spatial indexing** for location-based searches
- **Query optimization** with Drizzle ORM
- **Caching strategies** for frequently accessed data
- **Pagination** for large datasets

---

## 🤝 Contributing

1. **Fork the repository**
2. **Create feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit changes** (`git commit -m 'Add amazing feature'`)
4. **Push to branch** (`git push origin feature/amazing-feature`)
5. **Open Pull Request**

### Development Guidelines
- Follow TypeScript best practices
- Write meaningful commit messages
- Add tests for new features
- Update documentation

---

## 📞 Support

- **📖 Documentation**: Check the docs folder
- **🐛 Bug Reports**: Create GitHub issues
- **💡 Feature Requests**: GitHub discussions
- **📧 Security Issues**: security@yourdomain.com

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Drizzle ORM** - Database operations
- **Shadcn/UI** - Component library
- **Tailwind CSS** - Styling framework
- **Firebase** - Push notifications
- **PostgreSQL** - Database platform

---

**Built with ❤️ for the sports community**

🎯 **Ready to revolutionize sports facility management?** Follow the [deployment guide](DEPLOYMENT.md) to get started!
