require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

// Routes
const emailRoutes = require('./routes/email');
const whatsappRoutes = require('./routes/whatsapp');
const docsRoutes = require('./routes/docs');
const contactRoutes = require('./routes/contact');
const socialRoutes = require('./routes/social');
const carrierRoutes = require('./routes/carrier');
const bulkRoutes = require('./routes/bulk');

// Middleware
const authMiddleware = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increased for bulk requests

// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: {
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please upgrade your plan for more requests.',
        retryAfter: 60
    }
});
app.use(limiter);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'contact-verify-api', version: '2.0.0' });
});

// API Info (for RapidAPI)
app.get('/', (req, res) => {
    res.json({
        name: 'Contact Intelligence API',
        version: '2.0.0',
        description: 'Complete contact verification and intelligence platform. Verify emails, WhatsApp numbers, detect fraud, score leads, and discover social profiles.',
        features: [
            'Email verification with SMTP check',
            'WhatsApp number verification (200+ countries)',
            'Contact Quality Score (0-100)',
            'AI Fraud Detection',
            'Social Profile Discovery',
            'Carrier Intelligence',
            'Bulk Processing with Webhooks'
        ],
        documentation: '/api/docs',
        health: '/health',
        endpoints: {
            email: '/api/email/*',
            whatsapp: '/api/whatsapp/*',
            contact: '/api/contact/*',
            social: '/api/social/*',
            carrier: '/api/carrier/*',
            bulk: '/api/bulk/*'
        }
    });
});

// API Documentation (public)
app.use('/api/docs', docsRoutes);

// === PROTECTED ROUTES (require API key) ===

// Original routes
app.use('/api/email', authMiddleware, emailRoutes);
app.use('/api/whatsapp', authMiddleware, whatsappRoutes);

// NEW: Contact Intelligence routes
app.use('/api/contact', authMiddleware, contactRoutes);
app.use('/api/social', authMiddleware, socialRoutes);
app.use('/api/carrier', authMiddleware, carrierRoutes);
app.use('/api/bulk', authMiddleware, bulkRoutes);

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Contact Intelligence API v2.0.0 running on port ${PORT}`);
    console.log(`📖 Endpoints:`);
    console.log(`   Original:`);
    console.log(`   POST /api/email/verify - Verify email address`);
    console.log(`   POST /api/whatsapp/verify - Verify WhatsApp number`);
    console.log(`   `);
    console.log(`   NEW Premium Features:`);
    console.log(`   POST /api/contact/analyze - Complete contact analysis`);
    console.log(`   POST /api/contact/score - Quality score only`);
    console.log(`   POST /api/contact/fraud-check - Fraud detection`);
    console.log(`   POST /api/social/lookup - Social profile discovery`);
    console.log(`   POST /api/social/enrich - Contact enrichment`);
    console.log(`   POST /api/carrier/lookup - Carrier intelligence`);
    console.log(`   POST /api/carrier/sms-check - SMS deliverability`);
    console.log(`   POST /api/bulk/process - Async bulk processing`);
    console.log(`   GET  /api/bulk/status/:jobId - Check job status`);
});

module.exports = app;

