const express = require('express');
const router = express.Router();
const whatsappService = require('../services/whatsappVerify');

/**
 * POST /api/whatsapp/verify
 * Verificar un número de WhatsApp
 */
router.post('/verify', async (req, res) => {
    try {
        const { phone } = req.body;

        if (!phone) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Phone number is required'
            });
        }

        const result = await whatsappService.verify(phone);

        res.json({
            success: true,
            ...result
        });

    } catch (error) {
        console.error('WhatsApp verification error:', error);
        res.status(500).json({
            error: 'Verification Failed',
            message: error.message
        });
    }
});

/**
 * POST /api/whatsapp/quick
 * Verificación rápida (solo formato)
 */
router.post('/quick', (req, res) => {
    try {
        const { phone } = req.body;

        if (!phone) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Phone number is required'
            });
        }

        const result = whatsappService.quickVerify(phone);

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
 * POST /api/whatsapp/batch
 * Verificar múltiples números
 */
router.post('/batch', async (req, res) => {
    try {
        const { phones, quick = true } = req.body;

        if (!Array.isArray(phones) || phones.length === 0) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Phones array is required'
            });
        }

        if (phones.length > 25) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Maximum 25 numbers per batch'
            });
        }

        const results = await Promise.all(
            phones.map(async (phone) => {
                try {
                    if (quick) {
                        return whatsappService.quickVerify(phone);
                    }
                    return await whatsappService.verify(phone);
                } catch (error) {
                    return { phone, valid: false, error: error.message };
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
 * POST /api/whatsapp/link
 * Generar enlace de WhatsApp
 */
router.post('/link', (req, res) => {
    try {
        const { phone, message = '' } = req.body;

        if (!phone) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Phone number is required'
            });
        }

        const link = whatsappService.generateLink(phone, message);
        const normalized = whatsappService.normalizePhone(phone);

        res.json({
            success: true,
            phone: normalized,
            link,
            qr_api_link: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(link)}`
        });

    } catch (error) {
        res.status(500).json({
            error: 'Link Generation Failed',
            message: error.message
        });
    }
});

module.exports = router;
