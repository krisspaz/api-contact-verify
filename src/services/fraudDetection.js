/**
 * Fraud Detection Service
 * Detecta patrones de fraude en emails y teléfonos
 */

class FraudDetectionService {
    constructor() {
        // Dominios desechables extendidos (más de 200)
        this.disposableDomains = new Set([
            // Populares
            'tempmail.com', 'throwaway.email', 'guerrillamail.com', 'mailinator.com',
            '10minutemail.com', 'temp-mail.org', 'fakeinbox.com', 'trashmail.com',
            'yopmail.com', 'sharklasers.com', 'mailnesia.com', 'maildrop.cc',
            'dispostable.com', 'getnada.com', 'tmpail.org', 'tempail.com',
            'mohmal.com', 'emailondeck.com', 'temp-mail.io', 'burnermail.io',
            // Adicionales
            'guerrillamail.info', 'grr.la', 'guerrillamail.biz', 'guerrillamail.de',
            'guerrillamail.net', 'guerrillamail.org', 'spam4.me', 'getairmail.com',
            'fakemailgenerator.com', 'generator.email', 'inboxalias.com', 'mailcatch.com',
            'mailexpire.com', 'mailforspam.com', 'meltmail.com', 'mintemail.com',
            'mytrashmail.com', 'nowmymail.com', 'spambox.us', 'spamfree24.org',
            'tempmailaddress.com', 'throwawaymail.com', 'trash-mail.at', 'wegwerfmail.de',
            'tempr.email', 'discard.email', 'discardmail.com', 'spamgourmet.com',
            'mailnull.com', 'e4ward.com', 'spamex.com', 'mynetstore.de', 'safetymail.info',
            'incognitomail.com', 'mailslite.com', 'mailmoat.com', 'spamhole.com',
            'temporaryemail.net', 'temporarymail.net', 'mail-temp.com', 'tempinbox.com',
            'fakemailgenerator.net', 'emailsensei.com', 'binkmail.com', 'bobmail.info'
        ]);

        // Patrones sospechosos en emails
        this.suspiciousPatterns = [
            /^test[0-9]*@/i,
            /^fake[0-9]*@/i,
            /^spam[0-9]*@/i,
            /^noreply[0-9]*@/i,
            /^(asdf|qwerty|1234|abcd)+/i,
            /^[a-z]{1,2}[0-9]{5,}@/i,  // a12345@
            /^[0-9]+[a-z]+[0-9]+@/i,   // 123abc456@
        ];

        // Códigos de país riesgosos para SMS/llamadas
        this.highRiskCountryCodes = ['882', '883', '870', '881'];  // Satélite/VOIP global

        // Prefijos VOIP conocidos
        this.voipPrefixes = [
            '1900', '1976', '5900',  // Premium rate
        ];
    }

    /**
     * Analizar riesgo de fraude de un email
     */
    analyzeEmail(email, emailVerifyResult = null) {
        const normalized = email.toLowerCase().trim();
        const [localPart, domain] = normalized.split('@');

        const analysis = {
            email: normalized,
            risk_level: 'low',
            risk_score: 0,  // 0-100
            flags: [],
            details: {
                is_disposable: false,
                is_suspicious_pattern: false,
                domain_age_risk: 'unknown',
                has_mx_records: true,
                is_role_account: false
            }
        };

        // Check 1: Dominio desechable (-40 puntos)
        if (this.isDisposableEmail(domain)) {
            analysis.risk_score += 40;
            analysis.flags.push('disposable_email');
            analysis.details.is_disposable = true;
        }

        // Check 2: Patrón sospechoso (-20 puntos)
        if (this.hasSuspiciousPattern(localPart)) {
            analysis.risk_score += 20;
            analysis.flags.push('suspicious_pattern');
            analysis.details.is_suspicious_pattern = true;
        }

        // Check 3: Sin MX records (-25 puntos)
        if (emailVerifyResult && !emailVerifyResult.checks?.mx) {
            analysis.risk_score += 25;
            analysis.flags.push('no_mx_records');
            analysis.details.has_mx_records = false;
        }

        // Check 4: Cuenta de rol (-5 puntos, menor riesgo)
        if (emailVerifyResult?.checks?.role_account) {
            analysis.risk_score += 5;
            analysis.flags.push('role_account');
            analysis.details.is_role_account = true;
        }

        // Check 5: Dominio muy nuevo o sospechoso (-15 puntos)
        if (this.isSuspiciousDomain(domain)) {
            analysis.risk_score += 15;
            analysis.flags.push('suspicious_domain');
        }

        // Check 6: Longitud excesiva del email (-10 puntos)
        if (normalized.length > 50) {
            analysis.risk_score += 10;
            analysis.flags.push('excessively_long');
        }

        // Determinar nivel de riesgo
        analysis.risk_level = this.getRiskLevel(analysis.risk_score);
        analysis.risk_score = Math.min(100, analysis.risk_score);

        return analysis;
    }

    /**
     * Analizar riesgo de fraude de un teléfono
     */
    analyzePhone(phone, phoneVerifyResult = null) {
        const normalized = phone.replace(/\D/g, '');

        const analysis = {
            phone: normalized,
            risk_level: 'low',
            risk_score: 0,
            flags: [],
            details: {
                is_voip: false,
                is_high_risk_country: false,
                is_premium_number: false,
                is_valid_format: true
            }
        };

        // Check 1: Código de país de alto riesgo (-30 puntos)
        for (const code of this.highRiskCountryCodes) {
            if (normalized.startsWith(code)) {
                analysis.risk_score += 30;
                analysis.flags.push('high_risk_country_code');
                analysis.details.is_high_risk_country = true;
                break;
            }
        }

        // Check 2: Prefijo VOIP/Premium (-25 puntos)
        for (const prefix of this.voipPrefixes) {
            if (normalized.includes(prefix)) {
                analysis.risk_score += 25;
                analysis.flags.push('premium_or_voip_number');
                analysis.details.is_premium_number = true;
                break;
            }
        }

        // Check 3: Longitud inválida (-20 puntos)
        if (normalized.length < 10 || normalized.length > 15) {
            analysis.risk_score += 20;
            analysis.flags.push('invalid_length');
            analysis.details.is_valid_format = false;
        }

        // Check 4: Número con patrón repetitivo (-15 puntos)
        if (this.hasRepetitivePattern(normalized)) {
            analysis.risk_score += 15;
            analysis.flags.push('repetitive_pattern');
        }

        // Check 5: Sin código de país válido (-10 puntos)
        if (phoneVerifyResult && !phoneVerifyResult.checks?.country_code) {
            analysis.risk_score += 10;
            analysis.flags.push('unknown_country_code');
        }

        analysis.risk_level = this.getRiskLevel(analysis.risk_score);
        analysis.risk_score = Math.min(100, analysis.risk_score);

        return analysis;
    }

    /**
     * Análisis combinado de fraude
     */
    analyzeContact(email = null, phone = null, emailResult = null, phoneResult = null) {
        const emailAnalysis = email ? this.analyzeEmail(email, emailResult) : null;
        const phoneAnalysis = phone ? this.analyzePhone(phone, phoneResult) : null;

        // Calcular score combinado
        let combinedScore = 0;
        let count = 0;

        if (emailAnalysis) {
            combinedScore += emailAnalysis.risk_score;
            count++;
        }
        if (phoneAnalysis) {
            combinedScore += phoneAnalysis.risk_score;
            count++;
        }

        const avgScore = count > 0 ? Math.round(combinedScore / count) : 0;

        return {
            overall_risk_score: avgScore,
            overall_risk_level: this.getRiskLevel(avgScore),
            email_analysis: emailAnalysis,
            phone_analysis: phoneAnalysis,
            recommendation: this.getRecommendation(avgScore),
            flags_count: (emailAnalysis?.flags?.length || 0) + (phoneAnalysis?.flags?.length || 0)
        };
    }

    isDisposableEmail(domain) {
        return this.disposableDomains.has(domain.toLowerCase());
    }

    hasSuspiciousPattern(localPart) {
        return this.suspiciousPatterns.some(pattern => pattern.test(localPart));
    }

    isSuspiciousDomain(domain) {
        // Dominios con muchos números o caracteres extraños
        const numberCount = (domain.match(/[0-9]/g) || []).length;
        const hyphenCount = (domain.match(/-/g) || []).length;

        return numberCount > 4 || hyphenCount > 3 || domain.length > 30;
    }

    hasRepetitivePattern(phone) {
        // Detectar patrones como 1111111, 1234567, etc.
        const repeated = /(.)\1{5,}/;  // 6+ caracteres iguales
        const sequential = /(012345|123456|234567|345678|456789|567890|987654|876543)/;

        return repeated.test(phone) || sequential.test(phone);
    }

    getRiskLevel(score) {
        if (score >= 70) return 'high';
        if (score >= 40) return 'medium';
        if (score >= 20) return 'low';
        return 'minimal';
    }

    getRecommendation(score) {
        if (score >= 70) return 'Block or require additional verification';
        if (score >= 40) return 'Proceed with caution, consider verification';
        if (score >= 20) return 'Low risk, normal processing';
        return 'Safe to proceed';
    }
}

module.exports = new FraudDetectionService();
