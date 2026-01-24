// Load environment variables FIRST before any other requires
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { checkAndEscalateRequests } = require('./services/escalationService');

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

// Use routes
app.use('/api/requests', requestRoutes);
app.use('/api/auth', signupLimiter, authRoutes); // Apply rate limiting to all auth routes
app.use('/api/documents', documentRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/escalation', escalationRoutes);

app.get('/', (req, res) => {
    res.send('SmartDocs backend running with production features!');
});

// Escalation cron job - runs every 6 hours
const ESCALATION_INTERVAL = 6 * 60 * 60 * 1000; // 6 hours in milliseconds

setInterval(async () => {
  console.log('🔄 Running scheduled escalation check...');
  try {
    const result = await checkAndEscalateRequests();
    console.log('✅ Escalation check complete:', result);
  } catch (error) {
    console.error('❌ Escalation check failed:', error);
  }
}, ESCALATION_INTERVAL);

// Run escalation check on startup
setTimeout(async () => {
  console.log('🚀 Running initial escalation check...');
  try {
    const result = await checkAndEscalateRequests();
    console.log('✅ Initial escalation check complete:', result);
  } catch (error) {
    console.error('❌ Initial escalation check failed:', error);
  }
}, 5000); // Wait 5 seconds after startup

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
