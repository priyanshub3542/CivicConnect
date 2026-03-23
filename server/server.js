import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware
app.use(cors({
  origin: 'http://localhost:5173', // Vite default port
  credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/CivicConnect')
.then(() => console.log('MongoDB connected'))
.catch(err => console.log('MongoDB connection error:', err));

// User Schema
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  username: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  fullName: {
    type: String,
    trim: true
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other']
  },
  address: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const User = mongoose.model('User', userSchema);

// Issue Schema
const issueSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: ['Garbage Collection', 'Pothole', 'Water Leakage', 'Street Light', 'Road Damage', 'Drainage Problem', 'Park Maintenance', 'Traffic Signal', 'Noise Complaint', 'Other']
  },
  description: {
    type: String,
    required: true,
    maxlength: 500
  },
  address: {
    type: String,
    trim: true
  },
  latitude: {
    type: Number,
    required: true
  },
  longitude: {
    type: Number,
    required: true
  },
  images: [{
    filename: String,
    originalName: String,
    path: String,
    size: Number
  }],
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Resolved', 'Rejected'],
    default: 'Pending'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  upvotes: {
    type: Number,
    default: 0
  },
  upvotedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  assignedTo: {
    type: String,
    default: 'Municipal Authority'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const Issue = mongoose.model('Issue', issueSchema);

// Multer configuration for file uploads
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 5 // Max 5 files
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Auth Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Routes

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    console.log('Registration request received:', req.body);
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      console.log('Validation failed: Missing email or password');
      return res.status(400).json({ message: 'Email and password are required' });
    }

    if (password.length < 6) {
      console.log('Validation failed: Password too short');
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    console.log('Checking if user exists...');
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('User already exists with email:', email);
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    console.log('Hashing password...');
    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    console.log('Creating user...');
    // Generate username from email
    const username = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
    
    // Create user
    const user = new User({
      email,
      password: hashedPassword,
      username
    });

    console.log('Saving user to database...');
    await user.save();

    console.log('Generating JWT token...');
    // Generate JWT
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('Registration successful for:', email);
    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Server error during registration', error: error.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        username: user.username || user.email.split('@')[0],
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Verify Token
app.get('/api/auth/verify', authenticateToken, (req, res) => {
  res.json({
    message: 'Token is valid',
    user: req.user
  });
});

// Get User Profile
app.get('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: 'Server error fetching profile' });
  }
});

// Get User Info by ID
app.get('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user is requesting their own info or has admin privileges
    if (req.user.userId !== id) {
      return res.status(403).json({ message: 'Access denied. You can only view your own profile.' });
    }

    const user = await User.findById(id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      id: user._id,
      email: user.email,
      username: user.username || user.email.split('@')[0], // Generate username from email if not set
      fullName: user.fullName || '',
      gender: user.gender || '',
      address: user.address || '',
      phone: user.phone || '',
      createdAt: user.createdAt
    });
  } catch (error) {
    console.error('Get user info error:', error);
    res.status(500).json({ message: 'Server error fetching user info' });
  }
});

// Update User Info
app.put('/api/users/:id/info', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, gender, address, phone } = req.body;

    // Check if user is updating their own info
    if (req.user.userId !== id) {
      return res.status(403).json({ message: 'Access denied. You can only update your own profile.' });
    }

    // Validation
    if (!fullName || !fullName.trim()) {
      return res.status(400).json({ message: 'Full name is required' });
    }

    if (!gender) {
      return res.status(400).json({ message: 'Gender is required' });
    }

    if (!['Male', 'Female', 'Other'].includes(gender)) {
      return res.status(400).json({ message: 'Invalid gender value' });
    }

    if (!address || !address.trim()) {
      return res.status(400).json({ message: 'Address is required' });
    }

    if (!phone || !phone.trim()) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    // Phone number validation (basic)
    const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ message: 'Invalid phone number format' });
    }

    // Update user info
    const updatedUser = await User.findByIdAndUpdate(
      id,
      {
        fullName: fullName.trim(),
        gender,
        address: address.trim(),
        phone: phone.trim(),
        // Generate username if not already set
        username: req.user.username || req.user.email.split('@')[0]
      },
      { 
        new: true, 
        runValidators: true 
      }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'User info updated successfully',
      user: {
        id: updatedUser._id,
        email: updatedUser.email,
        username: updatedUser.username,
        fullName: updatedUser.fullName,
        gender: updatedUser.gender,
        address: updatedUser.address,
        phone: updatedUser.phone,
        createdAt: updatedUser.createdAt
      }
    });
  } catch (error) {
    console.error('Update user info error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation error', details: error.message });
    }
    res.status(500).json({ message: 'Server error updating user info' });
  }
});

// Create Issue Report
app.post('/api/issues', authenticateToken, upload.array('images', 5), async (req, res) => {
  try {
    const { category, description, address, latitude, longitude } = req.body;

    // Validation
    if (!category || !description || !latitude || !longitude) {
      return res.status(400).json({ 
        message: 'Category, description, latitude, and longitude are required' 
      });
    }

    if (description.length > 500) {
      return res.status(400).json({ 
        message: 'Description must be 500 characters or less' 
      });
    }

    const validCategories = ['Garbage Collection', 'Pothole', 'Water Leakage', 'Street Light', 'Road Damage', 'Drainage Problem', 'Park Maintenance', 'Traffic Signal', 'Noise Complaint', 'Other'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ 
        message: 'Invalid category' 
      });
    }

    // Process uploaded images
    const images = req.files ? req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      path: file.path,
      size: file.size
    })) : [];

    // Create issue
    const issue = new Issue({
      category,
      description: description.trim(),
      address: address ? address.trim() : '',
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      images,
      reportedBy: req.user.userId
    });

    await issue.save();

    res.status(201).json({
      message: 'Issue reported successfully',
      issue: {
        id: issue._id,
        category: issue.category,
        description: issue.description,
        address: issue.address,
        latitude: issue.latitude,
        longitude: issue.longitude,
        status: issue.status,
        priority: issue.priority,
        images: issue.images,
        createdAt: issue.createdAt
      }
    });

  } catch (error) {
    console.error('Create issue error:', error);
    
    // Clean up uploaded files if there's an error
    if (req.files) {
      req.files.forEach(file => {
        fs.unlink(file.path, (err) => {
          if (err) console.error('Error deleting file:', err);
        });
      });
    }
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation error', details: error.message });
    }
    res.status(500).json({ message: 'Server error creating issue' });
  }
});

// Get All Issues
app.get('/api/issues', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, category, status } = req.query;
    
    const filter = {};
    if (category) filter.category = category;
    if (status) filter.status = status;

    const issues = await Issue.find(filter)
      .populate('reportedBy', 'email username')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Issue.countDocuments(filter);

    res.json({
      issues,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get issues error:', error);
    res.status(500).json({ message: 'Server error fetching issues' });
  }
});

// Get User's Issues
app.get('/api/issues/my', authenticateToken, async (req, res) => {
  try {
    const issues = await Issue.find({ reportedBy: req.user.userId })
      .sort({ createdAt: -1 })
      .exec();

    res.json({ issues });
  } catch (error) {
    console.error('Get user issues error:', error);
    res.status(500).json({ message: 'Server error fetching your issues' });
  }
});

// Upvote Issue
app.post('/api/issues/:id/upvote', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const issue = await Issue.findById(id);
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    const hasUpvoted = issue.upvotedBy.includes(userId);
    
    if (hasUpvoted) {
      // Remove upvote
      issue.upvotedBy = issue.upvotedBy.filter(id => id.toString() !== userId);
      issue.upvotes = Math.max(0, issue.upvotes - 1);
    } else {
      // Add upvote
      issue.upvotedBy.push(userId);
      issue.upvotes += 1;
    }

    await issue.save();

    res.json({
      message: hasUpvoted ? 'Upvote removed' : 'Issue upvoted',
      upvotes: issue.upvotes,
      hasUpvoted: !hasUpvoted
    });
  } catch (error) {
    console.error('Upvote issue error:', error);
    res.status(500).json({ message: 'Server error updating upvote' });
  }
});

// Logout (client-side mainly, but endpoint for any server-side cleanup)
app.post('/api/auth/logout', authenticateToken, (req, res) => {
  // In a production app, you might want to blacklist the token
  res.json({ message: 'Logout successful' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API endpoints available at http://localhost:${PORT}/api`);
  console.log('MongoDB connection status:', mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected');
}); 