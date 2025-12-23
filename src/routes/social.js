/**
 * Social Profile Discovery Routes
 * Find social media profiles linked to email or phone
 */

const express = require('express');
const router = express.Router();
const socialLookup = require('../services/socialLookup');

/**
 * POST /api/social/lookup
 * Lookup social profiles from email or phone
 */
router.post('/lookup', async (req, res) => {
    try {
        const { email, phone } = req.body;

        if (!email && !phone) {
            return res.status(400).json({
                success: false,
                error: 'At least one of email or phone is required'
            });
        }

        const result = {
            success: true,
            timestamp: new Date().toISOString(),
            email_lookup: null,
            phone_lookup: null
        };

        if (email) {
            result.email_lookup = await socialLookup.lookupByEmail(email);
        }

        if (phone) {
            result.phone_lookup = await socialLookup.lookupByPhone(phone);
        }

        res.json(result);
    } catch (error) {
        console.error('Social lookup error:', error);
        res.status(500).json({
            success: false,
            error: 'Social lookup failed',
            message: error.message
        });
    }
});

/**
 * GET /api/social/gravatar/:email
 * Get Gravatar info for an email
 */
router.get('/gravatar/:email', (req, res) => {
    try {
        const { email } = req.params;

        if (!email || !email.includes('@')) {
            return res.status(400).json({
                success: false,
                error: 'Valid email address is required'
            });
        }

        const gravatar = socialLookup.getGravatarInfo(email);

        res.json({
            success: true,
            email,
            gravatar
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Gravatar lookup failed',
            message: error.message
        });
    }
});

/**
 * POST /api/social/enrich
 * Enrich contact with all available social data
 */
router.post('/enrich', async (req, res) => {
    try {
        const { email, phone, include_gravatar = true } = req.body;

        if (!email && !phone) {
            return res.status(400).json({
                success: false,
                error: 'At least one of email or phone is required'
            });
        }

        const result = {
            success: true,
            timestamp: new Date().toISOString(),
            contact: { email, phone },
            enrichment: {
                name: null,
                company: null,
                photo_url: null,
                social_profiles: {},
                messaging_apps: []
            }
        };

        if (email) {
            const emailLookup = await socialLookup.lookupByEmail(email);

            result.enrichment.name = emailLookup.name_extracted;
            result.enrichment.email_type = emailLookup.email_type;

            if (emailLookup.email_type === 'business') {
                result.enrichment.company = emailLookup.company;
            }

            if (include_gravatar && emailLookup.gravatar) {
                result.enrichment.photo_url = emailLookup.gravatar.url_with_default;
            }

            Object.assign(result.enrichment.social_profiles, emailLookup.profiles);
        }

        if (phone) {
            const phoneLookup = await socialLookup.lookupByPhone(phone);

            Object.assign(result.enrichment.social_profiles, phoneLookup.profiles);
            result.enrichment.messaging_apps = phoneLookup.messaging_apps;
        }

        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Enrichment failed',
            message: error.message
        });
    }
});

module.exports = router;
