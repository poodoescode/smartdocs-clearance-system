const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

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

// Use routes
app.use('/api/requests', requestRoutes);
app.use('/api/auth', signupLimiter, authRoutes); // Apply rate limiting to all auth routes

app.get('/', (req, res) => {
    res.send('EcoDocs backend running!');
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
