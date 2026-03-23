# Civic Connect Authentication Setup Guide

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Create Environment File
Create a `.env` file in the root directory with the following content:

```env
# Server Configuration
PORT=5000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-environment-12345

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/civicconnect

# Client Configuration
VITE_API_URL=http://localhost:5000/api
```

### 3. Install and Start MongoDB
Make sure MongoDB is installed and running on your system:

**macOS (using Homebrew):**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb/brew/mongodb-community
```

**Windows:**
- Download MongoDB Community Server from https://www.mongodb.com/try/download/community
- Follow the installation wizard
- Start MongoDB service

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get install mongodb
sudo systemctl start mongodb
sudo systemctl enable mongodb
```

### 4. Start the Application

**Option 1: Start both frontend and backend together (Recommended):**
```bash
npm run dev:full
```

**Option 2: Start separately:**

Terminal 1 (Backend):
```bash
npm run dev:server
```

Terminal 2 (Frontend):
```bash
npm run dev
```

### 5. Access the Application
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api

## 🔐 Authentication Features

### User Registration
- Email validation
- Password strength indicator
- Secure password hashing with bcrypt
- Real-time form validation
- Confirm password matching

### User Login
- Email/password authentication
- JWT token generation
- Persistent sessions
- Error handling with user-friendly messages

### Protected Dashboard
- User profile information
- Activity tracking
- Quick action buttons
- Civic engagement statistics

### Security Features
- JWT token verification
- Protected routes
- Secure password hashing (bcrypt with 12 salt rounds)
- Input validation and sanitization
- Session management

## 🎨 UI Enhancements

### Custom Cursor Effects
- Soft glow animation
- Interactive hover states
- Click feedback
- Mobile-friendly (disabled on touch devices)

### Scroll Animations
- Fade in effects with glow
- Slide animations from different directions
- Zoom and flip effects
- Smooth transitions
- Reduced motion support for accessibility

### Form Animations
- Smooth form transitions
- Loading states with spinners
- Success/error feedback
- Password strength visualization

## 📱 Responsive Design
- Mobile-first approach
- Touch-friendly interactions
- Optimized animations for mobile
- Accessibility features
- High contrast mode support

## 🔧 Technical Stack

### Frontend
- React 19.1.0
- React Router DOM 6.20.1
- Tailwind CSS 4.1.11
- AOS (Animate On Scroll) 2.3.4
- Axios 1.6.2

### Backend
- Node.js with Express 4.18.2
- MongoDB with Mongoose 8.0.3
- JSON Web Tokens 9.0.2
- bcryptjs 2.4.3
- CORS 2.8.5

### Development Tools
- Vite 7.0.0
- Concurrently 8.2.2
- ESLint 9.29.0

## 🛠️ Development Commands

```bash
# Install dependencies
npm install

# Start development (frontend + backend)
npm run dev:full

# Start only frontend
npm run dev

# Start only backend
npm run dev:server

# Build for production
npm run build

# Run linting
npm run lint

# Preview production build
npm run preview
```

## 🔒 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 5000 |
| JWT_SECRET | Secret key for JWT tokens | (must be set) |
| MONGODB_URI | MongoDB connection string | mongodb://localhost:27017/civicconnect |
| VITE_API_URL | API URL for frontend | http://localhost:5000/api |

## 🚨 Troubleshooting

### MongoDB Connection Issues
1. Ensure MongoDB is running: `brew services list | grep mongodb` (macOS)
2. Check if port 27017 is available
3. Verify MONGODB_URI in .env file

### CORS Issues
1. Check if backend is running on port 5000
2. Verify frontend is running on port 5173
3. Clear browser cache and cookies

### Authentication Issues
1. Check JWT_SECRET is set in .env
2. Verify tokens in browser localStorage
3. Check browser console for detailed error messages

### Performance Issues
1. Animations can be disabled for reduced motion preference
2. Custom cursor is automatically disabled on mobile devices
3. Use `prefers-reduced-motion` CSS media query for accessibility

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/verify` - Token verification
- `POST /api/auth/logout` - User logout

### User Management
- `GET /api/user/profile` - Get user profile

## 🎯 Features Implemented

✅ User registration with validation  
✅ Secure password hashing  
✅ User login with JWT  
✅ Protected routes  
✅ Dashboard with user data  
✅ Logout functionality  
✅ Custom cursor effects  
✅ Enhanced scroll animations  
✅ Mobile-responsive design  
✅ Dark mode support  
✅ Form validation  
✅ Loading states  
✅ Error handling  
✅ Session persistence  

## 🔮 Future Enhancements

- Email verification
- Password reset functionality
- Social media login (Google, Facebook)
- Two-factor authentication
- User profile management
- Real civic issue reporting
- Interactive maps integration
- Admin dashboard
- Push notifications
- Progressive Web App (PWA) features

## 📄 License

This project is part of the Civic Connect platform for community engagement and civic issue reporting. 