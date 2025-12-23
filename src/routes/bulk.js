/**
 * Bulk Processing Routes
 * Process large batches of contacts with optional webhook callback
 */

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const emailVerifyService = require('../services/emailVerify');
const whatsappVerifyService = require('../services/whatsappVerify');
const scoringService = require('../services/scoringService');
const fraudDetection = require('../services/fraudDetection');

// In-memory job storage (in production, use Redis or database)
const jobs = new Map();

/**
 * POST /api/bulk/process
 * Start async bulk processing job
 */
router.post('/process', async (req, res) => {
    try {
        const { contacts, webhook_url, options = {} } = req.body;

        if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Array of contacts is required'
            });
        }

        if (contacts.length > 1000) {
            return res.status(400).json({
                success: false,
                error: 'Maximum 1000 contacts per batch. For larger batches, split into multiple requests.'
            });
        }

        const jobId = uuidv4();
        const job = {
            id: jobId,
            status: 'processing',
            created_at: new Date().toISOString(),
            total: contacts.length,
            processed: 0,
            results: [],
            webhook_url,
            options
        };

        jobs.set(jobId, job);

        // Process asynchronously
        processBulkJob(jobId, contacts, options, webhook_url);

        res.json({
            success: true,
            job_id: jobId,
            status: 'processing',
            total_contacts: contacts.length,
            estimated_time_seconds: Math.ceil(contacts.length * 0.5),
            status_url: `/api/bulk/status/${jobId}`
        });
    } catch (error) {
        console.error('Bulk processing error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to start bulk processing',
            message: error.message
        });
    }
});

/**
 * GET /api/bulk/status/:jobId
 * Get status of a bulk processing job
 */
router.get('/status/:jobId', (req, res) => {
    const { jobId } = req.params;
    const job = jobs.get(jobId);

    if (!job) {
        return res.status(404).json({
            success: false,
            error: 'Job not found'
        });
    }

    res.json({
        success: true,
        job_id: job.id,
        status: job.status,
        created_at: job.created_at,
        completed_at: job.completed_at,
        total: job.total,
        processed: job.processed,
        progress_percent: Math.round((job.processed / job.total) * 100),
        results: job.status === 'completed' ? job.results : undefined
    });
});

/**
 * GET /api/bulk/results/:jobId
 * Get full results of a completed job
 */
router.get('/results/:jobId', (req, res) => {
    const { jobId } = req.params;
    const job = jobs.get(jobId);

    if (!job) {
        return res.status(404).json({
            success: false,
            error: 'Job not found'
        });
    }

    if (job.status !== 'completed') {
        return res.status(202).json({
            success: true,
            message: 'Job still in progress',
            status: job.status,
            progress: `${job.processed}/${job.total}`
        });
    }

    res.json({
        success: true,
        job_id: job.id,
        status: 'completed',
        total: job.total,
        processed: job.processed,
        statistics: calculateStatistics(job.results),
        results: job.results
    });
});

/**
 * DELETE /api/bulk/job/:jobId
 * Cancel or delete a job
 */
router.delete('/job/:jobId', (req, res) => {
    const { jobId } = req.params;
    const job = jobs.get(jobId);

    if (!job) {
        return res.status(404).json({
            success: false,
            error: 'Job not found'
        });
    }

    jobs.delete(jobId);

    res.json({
        success: true,
        message: 'Job deleted'
    });
});

async function processBulkJob(jobId, contacts, options, webhookUrl) {
    const job = jobs.get(jobId);
    if (!job) return;

    const includeScore = options.include_score !== false;
    const includeFraud = options.include_fraud !== false;

    for (const contact of contacts) {
        try {
            const result = {
                input: contact,
                success: true
            };

            // Verify email
            if (contact.email) {
                result.email = await emailVerifyService.verify(contact.email);
            }

            // Verify phone
            if (contact.phone) {
                result.phone = await whatsappVerifyService.verify(contact.phone);
            }

            // Calculate score
            if (includeScore) {
                result.score = scoringService.calculateScore(result.email, result.phone);
            }

            // Fraud analysis
            if (includeFraud) {
                result.fraud = fraudDetection.analyzeContact(contact.email, contact.phone, result.email, result.phone);
            }

            job.results.push(result);
        } catch (error) {
            job.results.push({
                input: contact,
                success: false,
                error: error.message
            });
        }

        job.processed++;
    }

    job.status = 'completed';
    job.completed_at = new Date().toISOString();

    // Send webhook if configured
    if (webhookUrl) {
        sendWebhook(webhookUrl, job);
    }
}

async function sendWebhook(url, job) {
    try {
        const axios = require('axios');
        await axios.post(url, {
            event: 'bulk_processing_complete',
            job_id: job.id,
            status: 'completed',
            total: job.total,
            processed: job.processed,
            statistics: calculateStatistics(job.results),
            completed_at: job.completed_at
        }, {
            timeout: 10000,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Webhook delivery failed:', error.message);
    }
}

function calculateStatistics(results) {
    const stats = {
        total: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        emails_valid: 0,
        phones_valid: 0,
        has_whatsapp: 0,
        avg_quality_score: 0,
        high_fraud_risk: 0
    };

    let scoreSum = 0;
    let scoreCount = 0;

    for (const r of results) {
        if (r.email?.valid) stats.emails_valid++;
        if (r.phone?.valid) stats.phones_valid++;
        if (r.phone?.has_whatsapp) stats.has_whatsapp++;
        if (r.score?.score) {
            scoreSum += r.score.score;
            scoreCount++;
        }
        if (r.fraud?.overall_risk_level === 'high') stats.high_fraud_risk++;
    }

    stats.avg_quality_score = scoreCount > 0 ? Math.round(scoreSum / scoreCount) : 0;

    return stats;
}

module.exports = router;
