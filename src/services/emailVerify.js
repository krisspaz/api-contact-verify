const dns = require('dns').promises;
const net = require('net');

// Lista de dominios desechables (los más comunes)
const disposableDomains = [
    'tempmail.com', 'throwaway.email', 'guerrillamail.com', 'mailinator.com',
    '10minutemail.com', 'temp-mail.org', 'fakeinbox.com', 'trashmail.com',
    'yopmail.com', 'sharklasers.com', 'mailnesia.com', 'maildrop.cc',
    'dispostable.com', 'getnada.com', 'tmpail.org', 'tempail.com',
    'mohmal.com', 'emailondeck.com', 'temp-mail.io', 'burnermail.io'
];

// Cuentas de rol comunes
const roleAccounts = [
    'admin', 'administrator', 'webmaster', 'postmaster', 'hostmaster',
    'info', 'support', 'sales', 'contact', 'hello', 'help',
    'billing', 'abuse', 'noreply', 'no-reply', 'mailer-daemon',
    'root', 'security', 'privacy', 'legal', 'hr', 'marketing'
];

class EmailVerifyService {
    /**
     * Verificar email completo
     */
    async verify(email) {
        const result = {
            email: email.toLowerCase().trim(),
            valid: false,
            checks: {
                format: false,
                mx: false,
                smtp: null, // null = no verificado
                disposable: false,
                role_account: false
            },
            suggestion: null,
            details: {}
        };

        // 1. Validar formato
        const formatCheck = this.validateFormat(result.email);
        result.checks.format = formatCheck.valid;
        if (!formatCheck.valid) {
            result.details.format_error = formatCheck.error;
            return result;
        }

        const [localPart, domain] = result.email.split('@');
        result.details.local_part = localPart;
        result.details.domain = domain;

        // 2. Verificar si es dominio desechable
        result.checks.disposable = this.isDisposable(domain);

        // 3. Verificar si es cuenta de rol
        result.checks.role_account = this.isRoleAccount(localPart);

        // 4. Verificar MX records
        try {
            const mxRecords = await this.checkMX(domain);
            result.checks.mx = mxRecords.length > 0;
            result.details.mx_records = mxRecords.slice(0, 3);
        } catch (error) {
            result.checks.mx = false;
            result.details.mx_error = error.message;
        }

        // 5. Verificación SMTP (opcional, puede ser lenta)
        if (result.checks.mx) {
            try {
                const smtpResult = await this.checkSMTP(result.email, result.details.mx_records[0]);
                result.checks.smtp = smtpResult.valid;
                result.details.smtp_response = smtpResult.response;
            } catch (error) {
                result.checks.smtp = null;
                result.details.smtp_error = 'SMTP check skipped or failed';
            }
        }

        // Determinar si es válido
        result.valid = result.checks.format && result.checks.mx && !result.checks.disposable;

        // Sugerencia de corrección para typos comunes
        result.suggestion = this.getSuggestion(domain);

        return result;
    }

    validateFormat(email) {
        const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

        if (!email || typeof email !== 'string') {
            return { valid: false, error: 'Email is required' };
        }

        if (email.length > 254) {
            return { valid: false, error: 'Email too long' };
        }

        if (!emailRegex.test(email)) {
            return { valid: false, error: 'Invalid email format' };
        }

        const [localPart, domain] = email.split('@');

        if (!domain || !domain.includes('.')) {
            return { valid: false, error: 'Invalid domain' };
        }

        if (localPart.length > 64) {
            return { valid: false, error: 'Local part too long' };
        }

        return { valid: true };
    }

    isDisposable(domain) {
        const lowerDomain = domain.toLowerCase();
        return disposableDomains.some(d => lowerDomain === d || lowerDomain.endsWith('.' + d));
    }

    isRoleAccount(localPart) {
        return roleAccounts.includes(localPart.toLowerCase());
    }

    async checkMX(domain) {
        try {
            const records = await dns.resolveMx(domain);
            return records
                .sort((a, b) => a.priority - b.priority)
                .map(r => r.exchange);
        } catch (error) {
            return [];
        }
    }

    async checkSMTP(email, mxHost) {
        return new Promise((resolve) => {
            const timeout = 5000;
            const socket = new net.Socket();
            let response = '';

            socket.setTimeout(timeout);

            socket.on('connect', () => {
                // Wait for greeting
            });

            socket.on('data', (data) => {
                response += data.toString();

                if (response.includes('220')) {
                    socket.write(`HELO verify.local\r\n`);
                } else if (response.includes('250') && !response.includes('MAIL FROM')) {
                    socket.write(`MAIL FROM:<verify@verify.local>\r\n`);
                } else if (response.includes('250') && response.includes('MAIL FROM')) {
                    socket.write(`RCPT TO:<${email}>\r\n`);
                } else if (response.includes('RCPT TO')) {
                    socket.write('QUIT\r\n');
                    const valid = response.includes('250') || response.includes('251');
                    socket.destroy();
                    resolve({ valid, response: response.substring(0, 200) });
                }
            });

            socket.on('timeout', () => {
                socket.destroy();
                resolve({ valid: null, response: 'Timeout' });
            });

            socket.on('error', () => {
                socket.destroy();
                resolve({ valid: null, response: 'Connection error' });
            });

            socket.connect(25, mxHost);
        });
    }

    getSuggestion(domain) {
        const commonDomains = {
            'gmial.com': 'gmail.com',
            'gmai.com': 'gmail.com',
            'gnail.com': 'gmail.com',
            'gamil.com': 'gmail.com',
            'hotmal.com': 'hotmail.com',
            'hotmai.com': 'hotmail.com',
            'hotamil.com': 'hotmail.com',
            'outlok.com': 'outlook.com',
            'outloo.com': 'outlook.com',
            'yahooo.com': 'yahoo.com',
            'yaho.com': 'yahoo.com'
        };

        return commonDomains[domain.toLowerCase()] || null;
    }

    /**
     * Verificación rápida (solo formato y MX)
     */
    async quickVerify(email) {
        const normalized = email.toLowerCase().trim();
        const formatCheck = this.validateFormat(normalized);

        if (!formatCheck.valid) {
            return { email: normalized, valid: false, reason: formatCheck.error };
        }

        const [, domain] = normalized.split('@');

        try {
            const mxRecords = await this.checkMX(domain);
            const valid = mxRecords.length > 0;
            return {
                email: normalized,
                valid,
                reason: valid ? 'Valid MX records found' : 'No MX records found'
            };
        } catch (error) {
            return { email: normalized, valid: false, reason: 'DNS lookup failed' };
        }
    }
}

module.exports = new EmailVerifyService();
