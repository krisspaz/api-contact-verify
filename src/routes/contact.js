/**
 * Contact Analysis Routes
 * Complete contact intelligence with scoring, fraud detection, and carrier info
 */

const express = require('express');
const router = express.Router();
const emailVerifyService = require('../services/emailVerify');
const whatsappVerifyService = require('../services/whatsappVerify');
const scoringService = require('../services/scoringService');
const fraudDetection = require('../services/fraudDetection');
const carrierIntel = require('../services/carrierIntel');
const socialLookup = require('../services/socialLookup');

/**
 * POST /api/contact/analyze
 * Complete contact analysis in one call
 */
router.post('/analyze', async (req, res) => {
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
            contact: { email, phone },
            verification: {},
            quality_score: null,
            fraud_analysis: null,
            carrier_info: null
        };

        // Verify email if provided
        let emailResult = null;
        if (email) {
            emailResult = await emailVerifyService.verify(email);
            result.verification.email = emailResult;
        }

        // Verify phone if provided
        let phoneResult = null;
        if (phone) {
            phoneResult = await whatsappVerifyService.verify(phone);
            result.verification.phone = phoneResult;

            // Add carrier intelligence
            result.carrier_info = await carrierIntel.getCarrierInfo(phone);
            result.carrier_info.sms_deliverability = carrierIntel.getSmsDeliverability(result.carrier_info);
        }

        // Calculate quality score
        result.quality_score = scoringService.calculateScore(emailResult, phoneResult);

        // Fraud analysis
        result.fraud_analysis = fraudDetection.analyzeContact(email, phone, emailResult, phoneResult);

        // Summary
        result.summary = {
            is_valid: result.quality_score.score >= 50,
            is_safe: result.fraud_analysis.overall_risk_level !== 'high',
            quality: result.quality_score.quality,
            risk: result.fraud_analysis.overall_risk_level,
            recommendation: getRecommendation(result.quality_score.score, result.fraud_analysis.overall_risk_score)
        };

        res.json(result);
    } catch (error) {
        console.error('Contact analysis error:', error);
        res.status(500).json({
            success: false,
            error: 'Analysis failed',
            message: error.message
        });
    }
});

/**
 * POST /api/contact/score
 * Get quality score only (faster)
 */
router.post('/score', async (req, res) => {
    try {
        const { email, phone } = req.body;

        if (!email && !phone) {
            return res.status(400).json({
                success: false,
                error: 'At least one of email or phone is required'
            });
        }

        let emailResult = null;
        let phoneResult = null;

        if (email) {
            emailResult = await emailVerifyService.quickVerify(email);
            emailResult.checks = { format: emailResult.valid, mx: emailResult.valid };
        }

        if (phone) {
            phoneResult = whatsappVerifyService.quickVerify(phone);
            phoneResult.checks = { format: phoneResult.valid, country_code: !!phoneResult.country, length: true };
        }

        const score = scoringService.calculateScore(emailResult, phoneResult);

        res.json({
            success: true,
            contact: { email, phone },
            ...score
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Scoring failed',
            message: error.message
        });
    }
});

/**
 * POST /api/contact/fraud-check
 * Fraud detection only
 */
router.post('/fraud-check', async (req, res) => {
    try {
        const { email, phone } = req.body;

        if (!email && !phone) {
            return res.status(400).json({
                success: false,
                error: 'At least one of email or phone is required'
            });
        }

        const analysis = fraudDetection.analyzeContact(email, phone);

        res.json({
            success: true,
            contact: { email, phone },
            ...analysis
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Fraud check failed',
            message: error.message
        });
    }
});

function getRecommendation(qualityScore, fraudScore) {
    if (qualityScore >= 70 && fraudScore < 30) {
        return 'Excellent contact - safe to proceed';
    } else if (qualityScore >= 50 && fraudScore < 50) {
        return 'Good contact - proceed with normal verification';
    } else if (fraudScore >= 50) {
        return 'High fraud risk - additional verification recommended';
    } else {
        return 'Low quality contact - verify before engaging';
    }
}

module.exports = router;
