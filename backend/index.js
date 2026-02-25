// Load environment variables FIRST before any other requires
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// Rate limiting for signup endpoint
const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 requests per hour per IP
  message: {
    success: false,
    error: 'Too many signup attempts from this IP. Please try again in an hour.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Import routes
const requestRoutes = require('./routes/requestRoutes');
const authRoutes = require('./routes/authRoutes');
const documentRoutes = require('./routes/documentRoutes');
const commentRoutes = require('./routes/commentRoutes');
const certificateRoutes = require('./routes/certificateRoutes');
const escalationRoutes = require('./routes/escalationRoutes');
const graduationRoutes = require('./routes/graduationRoutes'); // NEW: Graduation clearance routes
const adminAccountRoutes = require('./routes/adminAccountRoutes'); // NEW: Admin account management

// Use routes
app.use('/api/requests', requestRoutes);
app.use('/api/auth', signupLimiter, authRoutes); // Apply rate limiting to all auth routes
app.use('/api/documents', documentRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/clearance', commentRoutes); // NEW: Clearance comment system endpoints
app.use('/api/certificates', certificateRoutes);
app.use('/api/escalation', escalationRoutes);
app.use('/api/graduation', graduationRoutes); // NEW: Graduation clearance endpoints
app.use('/api/admin', adminAccountRoutes); // NEW: Admin account management endpoints

app.get('/', (req, res) => {
  res.send('Smart Clearance System backend running!');
});

// Note: Automatic escalation removed - use manual escalation via /api/escalation/check endpoint
// This gives admins more control over when to check for delayed requests

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
