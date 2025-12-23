require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const emailRoutes = require('./routes/email');
const whatsappRoutes = require('./routes/whatsapp');
const docsRoutes = require('./routes/docs');
const authMiddleware = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Rate limiting (más estricto para verificación)
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 50,
    message: {
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please upgrade your plan for more requests.',
        retryAfter: 60
    }
});
app.use(limiter);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'api-contact-verify', version: '1.0.0' });
});

// API Info (for RapidAPI)
app.get('/', (req, res) => {
    res.json({
        name: 'Contact Verify API',
        version: '1.0.0',
        description: 'Verify email addresses and WhatsApp numbers worldwide (200+ countries)',
        documentation: '/api/docs',
        health: '/health'
    });
});

// API Documentation (public)
app.use('/api/docs', docsRoutes);

// API Routes (protected with API key)
app.use('/api/email', authMiddleware, emailRoutes);
app.use('/api/whatsapp', authMiddleware, whatsappRoutes);

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Contact Verify API running on port ${PORT}`);
    console.log(`📖 Endpoints:`);
    console.log(`   GET  /api/docs - API Documentation`);
    console.log(`   POST /api/email/verify - Verify email address`);
    console.log(`   POST /api/email/batch - Batch verify emails`);
    console.log(`   POST /api/whatsapp/verify - Verify WhatsApp number`);
    console.log(`   POST /api/whatsapp/batch - Batch verify numbers`);
    console.log(`   POST /api/whatsapp/link - Generate WhatsApp link`);
    console.log(`   GET  /health - Health check`);
});

module.exports = app;
