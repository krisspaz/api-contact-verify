/**
 * Carrier Intelligence Routes
 * Phone carrier information and SMS deliverability
 */

const express = require('express');
const router = express.Router();
const carrierIntel = require('../services/carrierIntel');

/**
 * POST /api/carrier/lookup
 * Get carrier information for a phone number
 */
router.post('/lookup', async (req, res) => {
    try {
        const { phone } = req.body;

        if (!phone) {
            return res.status(400).json({
                success: false,
                error: 'Phone number is required'
            });
        }

        const carrierInfo = await carrierIntel.getCarrierInfo(phone);
        const smsInfo = carrierIntel.getSmsDeliverability(carrierInfo);

        res.json({
            success: true,
            phone,
            ...carrierInfo,
            sms_deliverability: smsInfo
        });
    } catch (error) {
        console.error('Carrier lookup error:', error);
        res.status(500).json({
            success: false,
            error: 'Carrier lookup failed',
            message: error.message
        });
    }
});

/**
 * POST /api/carrier/batch
 * Batch carrier lookup for multiple numbers
 */
router.post('/batch', async (req, res) => {
    try {
        const { phones } = req.body;

        if (!phones || !Array.isArray(phones) || phones.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Array of phone numbers is required'
            });
        }

        if (phones.length > 50) {
            return res.status(400).json({
                success: false,
                error: 'Maximum 50 phones per batch request'
            });
        }

        const results = await Promise.all(
            phones.map(async (phone) => {
                try {
                    const info = await carrierIntel.getCarrierInfo(phone);
                    return {
                        phone,
                        success: true,
                        ...info
                    };
                } catch (error) {
                    return {
                        phone,
                        success: false,
                        error: error.message
                    };
                }
            })
        );

        res.json({
            success: true,
            count: phones.length,
            results
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Batch lookup failed',
            message: error.message
        });
    }
});

/**
 * POST /api/carrier/sms-check
 * Check if phone can receive SMS
 */
router.post('/sms-check', async (req, res) => {
    try {
        const { phone } = req.body;

        if (!phone) {
            return res.status(400).json({
                success: false,
                error: 'Phone number is required'
            });
        }

        const carrierInfo = await carrierIntel.getCarrierInfo(phone);
        const smsInfo = carrierIntel.getSmsDeliverability(carrierInfo);

        res.json({
            success: true,
            phone,
            can_receive_sms: smsInfo.can_receive_sms,
            can_receive_mms: smsInfo.can_receive_mms,
            recommended_for_otp: smsInfo.recommended_for_otp,
            line_type: carrierInfo.line_type,
            is_voip: carrierInfo.is_voip,
            warnings: smsInfo.warnings
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'SMS check failed',
            message: error.message
        });
    }
});

module.exports = router;
