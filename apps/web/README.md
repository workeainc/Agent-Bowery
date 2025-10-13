# Agent Bowery Frontend

A modern React/Next.js dashboard for the Agent Bowery content management system.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:43000`

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── dashboard/         # Dashboard page
│   ├── content/           # Content management
│   ├── auth/              # Authentication pages
│   └── layout.tsx         # Root layout
├── components/            # Reusable components
│   ├── ui/                # Basic UI components
│   ├── layout/            # Layout components
│   └── dashboard/         # Dashboard widgets
├── lib/                   # Utilities and configurations
│   └── api-client.ts      # API client
├── types/                 # TypeScript type definitions
├── stores/                # State management (Zustand)
└── hooks/                 # Custom React hooks
```

## 🎨 Features Implemented

### ✅ Completed Features
- **Next.js 14 Setup**: Modern React framework with App Router
- **TypeScript**: Full type safety
- **Tailwind CSS**: Utility-first styling with custom design system
- **API Client**: Axios-based client with authentication
- **Layout System**: Responsive sidebar navigation
- **Dashboard**: System health monitoring and quick actions
- **Content Management**: Content list with filtering and search
- **Authentication**: Login page with mock authentication
- **Error Handling**: Loading states and error boundaries

### 🔄 In Progress
- Content editor with rich text editing
- Calendar with drag-and-drop scheduling
- Social inbox for unified message management
- Analytics dashboard with charts
- Platform management interface

## 🛠️ Technology Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Heroicons
- **HTTP Client**: Axios
- **State Management**: Zustand (planned)
- **Charts**: Recharts (planned)
- **Calendar**: React Big Calendar (planned)

## 🔧 Configuration

### Environment Variables
```bash
# NextAuth.js Configuration
NEXTAUTH_URL=http://localhost:43000
NEXTAUTH_SECRET=your-secret-key-here

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8081
NEXT_PUBLIC_APP_NAME=Agent Bowery
NEXT_PUBLIC_APP_VERSION=1.0.0
```

### API Integration
The frontend connects to the Agent Bowery API running on port 8081. The API client handles:
- Authentication with JWT tokens
- Request/response interceptors
- Error handling and retries
- Type-safe API calls

## 📱 Pages

### Home Page (`/`)
- Welcome screen with feature overview
- Navigation to dashboard and login

### Dashboard (`/dashboard`)
- System health monitoring
- Quick action buttons
- Recent activity feed
- Platform connection status

### Content Management (`/content`)
- Content list with filtering
- Search functionality
- Status and type filtering
- Mock data for testing

### Authentication (`/auth/login`)
- Login form with validation
- NextAuth.js integration with JWT strategy
- Session management and route protection
- Demo credentials: admin@agentbowery.com / password123

## 🎯 Next Steps

1. **Content Editor**: Rich text editor with platform previews
2. **Calendar**: Drag-and-drop scheduling interface
3. **Social Inbox**: Unified message management
4. **Analytics**: Performance charts and metrics
5. **Platform Management**: OAuth integration and account management
6. **Lead Management**: Lead scoring and conversation tracking
7. **Admin Panel**: System configuration and user management

## 🚀 Development

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript checks
```

### Code Style
- ESLint for code linting
- Prettier for code formatting
- TypeScript for type safety
- Tailwind CSS for styling

## 🔗 API Endpoints Used

The frontend integrates with these backend endpoints:
- `GET /health/system` - System health status
- `GET /content` - Content list
- `GET /platforms/connected` - Platform connections
- `POST /content/generate` - AI content generation
- `GET /analytics` - Analytics data

## 📊 Current Status

- ✅ **Foundation**: Next.js setup complete
- ✅ **Layout**: Navigation and shell components
- ✅ **Dashboard**: Basic dashboard with system health
- ✅ **Content**: Content list interface
- ✅ **Authentication**: Login page structure
- 🔄 **In Progress**: Content editor and calendar
- ⏳ **Planned**: Analytics, platform management, lead management

## 🤝 Contributing

1. Follow the established code style
2. Use TypeScript for all new code
3. Add proper error handling
4. Test components thoroughly
5. Update documentation as needed

## 📄 License

This project is part of the Agent Bowery system.
