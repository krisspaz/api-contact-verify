/**
 * Social Profile Discovery Service
 * Encuentra perfiles de redes sociales vinculados a un email o teléfono
 */

const crypto = require('crypto');

class SocialLookupService {
    constructor() {
        // Patrones de email empresariales conocidos
        this.businessEmailPatterns = [
            /^[a-z]+\.[a-z]+@/i,  // nombre.apellido@
            /^[a-z]\.?[a-z]+@/i,  // j.smith@ or jsmith@
        ];

        // Dominios de email personales
        this.personalEmailDomains = [
            'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
            'icloud.com', 'aol.com', 'protonmail.com', 'live.com'
        ];
    }

    /**
     * Buscar perfiles sociales desde un email
     */
    async lookupByEmail(email) {
        const normalized = email.toLowerCase().trim();
        const [localPart, domain] = normalized.split('@');

        const result = {
            email: normalized,
            profiles: {},
            gravatar: null,
            email_type: this.detectEmailType(normalized),
            name_extracted: this.extractNameFromEmail(localPart),
            domain_info: await this.analyzeDomain(domain)
        };

        // Gravatar (funciona con cualquier email)
        result.gravatar = this.getGravatarInfo(normalized);
        if (result.gravatar.has_image) {
            result.profiles.gravatar = result.gravatar.url;
        }

        // Detectar posibles perfiles basados en el email
        result.profiles.linkedin = this.generateLinkedInSearchUrl(result.name_extracted, domain);
        result.profiles.twitter = this.estimateTwitterHandle(localPart);
        result.profiles.github = this.estimateGitHubProfile(localPart);

        // Si es dominio empresarial, buscar info de la empresa
        if (result.email_type === 'business') {
            result.company = {
                domain: domain,
                website: `https://${domain}`,
                linkedin_company: `https://www.linkedin.com/company/${domain.split('.')[0]}`
            };
        }

        return result;
    }

    /**
     * Buscar perfiles desde un número de teléfono
     */
    async lookupByPhone(phone) {
        const normalized = phone.replace(/\D/g, '');

        return {
            phone: normalized,
            profiles: {
                whatsapp: `https://wa.me/${normalized}`,
                telegram: `https://t.me/+${normalized}`,
                viber: `viber://chat?number=${normalized}`
            },
            messaging_apps: ['whatsapp', 'telegram', 'viber', 'signal'],
            note: 'Phone-based social lookup provides messaging app links. For privacy reasons, we cannot directly lookup social profiles from phone numbers.'
        };
    }

    /**
     * Obtener información de Gravatar
     */
    getGravatarInfo(email) {
        const hash = crypto.createHash('md5').update(email.toLowerCase().trim()).digest('hex');
        const baseUrl = `https://www.gravatar.com/avatar/${hash}`;

        return {
            hash,
            url: `${baseUrl}?d=404`,
            url_with_default: `${baseUrl}?d=identicon`,
            profile_url: `https://www.gravatar.com/${hash}.json`,
            has_image: true // Se asume que tiene, el cliente puede verificar con ?d=404
        };
    }

    /**
     * Detectar si el email es personal o empresarial
     */
    detectEmailType(email) {
        const domain = email.split('@')[1];

        if (this.personalEmailDomains.includes(domain)) {
            return 'personal';
        }

        // Si tiene patrón empresarial
        if (this.businessEmailPatterns.some(pattern => pattern.test(email))) {
            return 'business';
        }

        // Si el dominio no es personal conocido, probablemente es empresarial
        return 'business';
    }

    /**
     * Extraer nombre del email
     */
    extractNameFromEmail(localPart) {
        // Remover números y caracteres especiales
        let cleaned = localPart.replace(/[0-9_]/g, ' ').replace(/\./g, ' ');

        // Capitalizar
        const parts = cleaned.split(' ').filter(p => p.length > 1);
        const formatted = parts.map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ');

        return {
            raw: localPart,
            parsed: formatted || localPart,
            confidence: parts.length >= 2 ? 'high' : 'low'
        };
    }

    /**
     * Analizar dominio
     */
    async analyzeDomain(domain) {
        const isPersonal = this.personalEmailDomains.includes(domain);

        return {
            domain,
            type: isPersonal ? 'personal' : 'business',
            website: isPersonal ? null : `https://${domain}`,
            is_free_email: isPersonal
        };
    }

    /**
     * Generar URL de búsqueda en LinkedIn
     */
    generateLinkedInSearchUrl(nameInfo, domain) {
        if (nameInfo.confidence === 'high') {
            const name = encodeURIComponent(nameInfo.parsed);
            return `https://www.linkedin.com/search/results/people/?keywords=${name}`;
        }
        return null;
    }

    /**
     * Estimar handle de Twitter
     */
    estimateTwitterHandle(localPart) {
        const cleaned = localPart.replace(/[^a-zA-Z0-9_]/g, '');
        if (cleaned.length >= 4 && cleaned.length <= 15) {
            return {
                estimated: `@${cleaned}`,
                search_url: `https://twitter.com/${cleaned}`,
                confidence: 'low'
            };
        }
        return null;
    }

    /**
     * Estimar perfil de GitHub
     */
    estimateGitHubProfile(localPart) {
        const cleaned = localPart.replace(/[^a-zA-Z0-9-]/g, '');
        if (cleaned.length >= 1) {
            return {
                estimated: cleaned,
                profile_url: `https://github.com/${cleaned}`,
                confidence: 'low'
            };
        }
        return null;
    }
}

module.exports = new SocialLookupService();
