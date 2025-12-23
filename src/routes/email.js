const express = require('express');
const router = express.Router();
const emailService = require('../services/emailVerify');

/**
 * POST /api/email/verify
 * Verificar un email completo
 */
router.post('/verify', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Email is required'
            });
        }

        const result = await emailService.verify(email);

        res.json({
            success: true,
            ...result
        });

    } catch (error) {
        console.error('Email verification error:', error);
        res.status(500).json({
            error: 'Verification Failed',
            message: error.message
        });
    }
});

/**
 * POST /api/email/quick
 * Verificación rápida (solo formato y MX)
 */
router.post('/quick', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Email is required'
            });
        }

        const result = await emailService.quickVerify(email);

        res.json({
            success: true,
            ...result
        });

    } catch (error) {
        console.error('Quick verification error:', error);
        res.status(500).json({
            error: 'Verification Failed',
            message: error.message
        });
    }
});

/**
 * POST /api/email/batch
 * Verificar múltiples emails
 */
router.post('/batch', async (req, res) => {
    try {
        const { emails, quick = true } = req.body;

        if (!Array.isArray(emails) || emails.length === 0) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Emails array is required'
            });
        }

        if (emails.length > 50) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Maximum 50 emails per batch'
            });
        }

        const results = await Promise.all(
            emails.map(async (email) => {
                try {
                    if (quick) {
                        return await emailService.quickVerify(email);
                    }
                    return await emailService.verify(email);
                } catch (error) {
                    return { email, valid: false, error: error.message };
                }
            })
        );

        const stats = {
            total: results.length,
            valid: results.filter(r => r.valid).length,
            invalid: results.filter(r => !r.valid).length
        };

        res.json({
            success: true,
            stats,
            results
        });

    } catch (error) {
        console.error('Batch verification error:', error);
        res.status(500).json({
            error: 'Batch Verification Failed',
            message: error.message
        });
    }
});

/**
 * POST /api/email/format
 * Solo validar formato (más rápido, sin DNS)
 */
router.post('/format', (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Email is required'
            });
        }

        const normalized = email.toLowerCase().trim();
        const formatCheck = emailService.validateFormat(normalized);

        const [localPart, domain] = normalized.split('@') || [];

        res.json({
            success: true,
            email: normalized,
            valid: formatCheck.valid,
            error: formatCheck.error || null,
            details: formatCheck.valid ? {
                local_part: localPart,
                domain: domain,
                disposable: emailService.isDisposable(domain),
                role_account: emailService.isRoleAccount(localPart),
                suggestion: emailService.getSuggestion(domain)
            } : null
        });

    } catch (error) {
        res.status(500).json({
            error: 'Format Check Failed',
            message: error.message
        });
    }
});

module.exports = router;
