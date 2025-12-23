const validApiKeys = (process.env.API_KEYS || '').split(',').filter(Boolean);
const RAPIDAPI_PROXY_SECRET = process.env.RAPIDAPI_PROXY_SECRET;

const authMiddleware = (req, res, next) => {
    // 1. Check RapidAPI Proxy Secret (most secure for RapidAPI)
    const proxySecret = req.headers['x-rapidapi-proxy-secret'];
    if (RAPIDAPI_PROXY_SECRET && proxySecret === RAPIDAPI_PROXY_SECRET) {
        return next(); // ✓ Valid RapidAPI request
    }

    // 2. Check multiple API key headers (for compatibility)
    const apiKey = req.headers['x-rapidapi-key']
        || req.headers['x-api-key']
        || req.query.api_key;

    if (!apiKey) {
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'API key is required.'
        });
    }

    // 3. Validate API key (for direct usage, not through RapidAPI)
    if (validApiKeys.length > 0 && !validApiKeys.includes(apiKey)) {
        return res.status(403).json({
            error: 'Forbidden',
            message: 'Invalid API key.'
        });
    }

    next();
};

module.exports = authMiddleware;
