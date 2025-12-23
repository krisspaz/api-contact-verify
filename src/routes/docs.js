const express = require('express');
const router = express.Router();

const apiDocs = {
    name: 'Contact Verify API',
    version: '1.0.0',
    description: 'Verify email addresses and WhatsApp numbers worldwide',
    baseUrl: '/api',
    authentication: {
        type: 'API Key',
        header: 'x-api-key',
        description: 'Include your API key in the x-api-key header'
    },
    endpoints: {
        email: [
            {
                method: 'POST',
                path: '/email/verify',
                description: 'Full email verification (format, MX, SMTP, disposable check)',
                parameters: [
                    { name: 'email', type: 'string', required: true, description: 'Email address to verify' }
                ],
                response: {
                    email: 'user@example.com',
                    valid: true,
                    checks: {
                        format: true,
                        mx: true,
                        smtp: true,
                        disposable: false,
                        role_account: false
                    },
                    details: {
                        domain: 'example.com',
                        mx_records: ['mx1.example.com']
                    }
                }
            },
            {
                method: 'POST',
                path: '/email/quick',
                description: 'Quick verification (format and MX only)'
            },
            {
                method: 'POST',
                path: '/email/batch',
                description: 'Verify multiple emails (max 50)',
                parameters: [
                    { name: 'emails', type: 'array', required: true },
                    { name: 'quick', type: 'boolean', default: true }
                ]
            },
            {
                method: 'POST',
                path: '/email/format',
                description: 'Format validation only (no DNS lookup)'
            }
        ],
        whatsapp: [
            {
                method: 'POST',
                path: '/whatsapp/verify',
                description: 'Verify WhatsApp number (200+ countries supported)',
                parameters: [
                    { name: 'phone', type: 'string', required: true, description: 'Phone number with country code' }
                ],
                response: {
                    phone: '+52 55 1234 5678',
                    normalized: '525512345678',
                    valid: true,
                    has_whatsapp: true,
                    checks: {
                        format: true,
                        country_code: true,
                        length: true
                    },
                    details: {
                        country_code: '52',
                        country: 'Mexico',
                        whatsapp_link: 'https://wa.me/525512345678'
                    }
                }
            },
            {
                method: 'POST',
                path: '/whatsapp/quick',
                description: 'Quick format validation'
            },
            {
                method: 'POST',
                path: '/whatsapp/batch',
                description: 'Verify multiple numbers (max 25)'
            },
            {
                method: 'POST',
                path: '/whatsapp/link',
                description: 'Generate WhatsApp click-to-chat link'
            }
        ]
    },
    supportedCountries: {
        count: '200+',
        regions: [
            'North America',
            'Latin America & Caribbean',
            'Europe',
            'Africa',
            'Middle East',
            'Asia & Pacific',
            'Russia & Central Asia'
        ]
    },
    pricing: {
        free: { requests: 50, period: 'month' },
        basic: { price: 9.99, requests: 1000, period: 'month' },
        pro: { price: 29.99, requests: 10000, period: 'month' },
        business: { price: 99.99, requests: 100000, period: 'month' }
    }
};

router.get('/', (req, res) => {
    res.json(apiDocs);
});

module.exports = router;
