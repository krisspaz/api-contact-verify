/**
 * Contact Quality Score Service
 * Calcula una puntuación de 0-100 que indica la calidad de un contacto
 */

class ScoringService {
    /**
     * Calcular puntuación de calidad del contacto
     * @param {Object} emailData - Resultado de verificación de email
     * @param {Object} phoneData - Resultado de verificación de teléfono
     * @returns {Object} - Score y detalles
     */
    calculateScore(emailData = null, phoneData = null) {
        let score = 0;
        let maxScore = 0;
        const factors = [];

        // === EMAIL SCORING (50 puntos máximo) ===
        if (emailData) {
            maxScore += 50;

            // Formato válido (+10)
            if (emailData.checks?.format) {
                score += 10;
                factors.push({ factor: 'email_format_valid', points: 10 });
            }

            // MX records válidos (+15)
            if (emailData.checks?.mx) {
                score += 15;
                factors.push({ factor: 'email_mx_valid', points: 15 });
            }

            // SMTP verificado (+10)
            if (emailData.checks?.smtp === true) {
                score += 10;
                factors.push({ factor: 'email_smtp_verified', points: 10 });
            } else if (emailData.checks?.smtp === false) {
                factors.push({ factor: 'email_smtp_failed', points: 0 });
            }

            // No es desechable (+10)
            if (!emailData.checks?.disposable) {
                score += 10;
                factors.push({ factor: 'email_not_disposable', points: 10 });
            } else {
                factors.push({ factor: 'email_is_disposable', points: -20 });
                score -= 20; // Penalización fuerte
            }

            // No es cuenta de rol (+5)
            if (!emailData.checks?.role_account) {
                score += 5;
                factors.push({ factor: 'email_not_role_account', points: 5 });
            }
        }

        // === PHONE/WHATSAPP SCORING (50 puntos máximo) ===
        if (phoneData) {
            maxScore += 50;

            // Formato válido (+10)
            if (phoneData.checks?.format) {
                score += 10;
                factors.push({ factor: 'phone_format_valid', points: 10 });
            }

            // Código de país válido (+10)
            if (phoneData.checks?.country_code) {
                score += 10;
                factors.push({ factor: 'phone_country_valid', points: 10 });
            }

            // Longitud correcta (+5)
            if (phoneData.checks?.length) {
                score += 5;
                factors.push({ factor: 'phone_length_valid', points: 5 });
            }

            // Tiene WhatsApp (+20)
            if (phoneData.has_whatsapp === true) {
                score += 20;
                factors.push({ factor: 'has_whatsapp', points: 20 });
            } else if (phoneData.has_whatsapp === false) {
                score += 5; // Al menos el número existe
                factors.push({ factor: 'no_whatsapp', points: 5 });
            }

            // No es VOIP (+5)
            if (phoneData.carrier_info && !phoneData.carrier_info.is_voip) {
                score += 5;
                factors.push({ factor: 'not_voip', points: 5 });
            }
        }

        // Normalizar a 100
        const normalizedScore = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
        const finalScore = Math.max(0, Math.min(100, normalizedScore));

        return {
            score: finalScore,
            grade: this.getGrade(finalScore),
            quality: this.getQualityLabel(finalScore),
            factors,
            breakdown: {
                email_score: emailData ? this.calculateEmailOnlyScore(emailData) : null,
                phone_score: phoneData ? this.calculatePhoneOnlyScore(phoneData) : null
            }
        };
    }

    calculateEmailOnlyScore(emailData) {
        let score = 0;
        if (emailData.checks?.format) score += 20;
        if (emailData.checks?.mx) score += 30;
        if (emailData.checks?.smtp === true) score += 20;
        if (!emailData.checks?.disposable) score += 20;
        if (!emailData.checks?.role_account) score += 10;
        return Math.min(100, score);
    }

    calculatePhoneOnlyScore(phoneData) {
        let score = 0;
        if (phoneData.checks?.format) score += 20;
        if (phoneData.checks?.country_code) score += 20;
        if (phoneData.checks?.length) score += 10;
        if (phoneData.has_whatsapp === true) score += 40;
        if (phoneData.has_whatsapp === null) score += 10;
        return Math.min(100, score);
    }

    getGrade(score) {
        if (score >= 90) return 'A+';
        if (score >= 80) return 'A';
        if (score >= 70) return 'B';
        if (score >= 60) return 'C';
        if (score >= 50) return 'D';
        return 'F';
    }

    getQualityLabel(score) {
        if (score >= 90) return 'excellent';
        if (score >= 70) return 'good';
        if (score >= 50) return 'fair';
        if (score >= 30) return 'poor';
        return 'bad';
    }
}

module.exports = new ScoringService();
