const validApiKeys = (process.env.API_KEYS || '').split(',').filter(Boolean);

const authMiddleware = (req, res, next) => {
    const apiKey = req.headers['x-api-key'] || req.query.api_key;

    if (!apiKey) {
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'API key is required. Include it in the x-api-key header.'
        });
    }

    if (!validApiKeys.includes(apiKey)) {
        return res.status(403).json({
            error: 'Forbidden',
            message: 'Invalid API key.'
        });
    }

    next();
};

module.exports = authMiddleware;
