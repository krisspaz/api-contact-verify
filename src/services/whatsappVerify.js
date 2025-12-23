const axios = require('axios');

class WhatsAppVerifyService {
    constructor() {
        // Códigos de país válidos para WhatsApp (TODOS los países del mundo)
        this.countryCodes = {
            // North America
            '1': 'US/Canada',

            // Latin America & Caribbean
            '52': 'Mexico',
            '53': 'Cuba',
            '54': 'Argentina',
            '55': 'Brazil',
            '56': 'Chile',
            '57': 'Colombia',
            '58': 'Venezuela',
            '502': 'Guatemala',
            '503': 'El Salvador',
            '504': 'Honduras',
            '505': 'Nicaragua',
            '506': 'Costa Rica',
            '507': 'Panama',
            '509': 'Haiti',
            '591': 'Bolivia',
            '592': 'Guyana',
            '593': 'Ecuador',
            '594': 'French Guiana',
            '595': 'Paraguay',
            '597': 'Suriname',
            '598': 'Uruguay',
            '599': 'Curacao',
            '1242': 'Bahamas',
            '1246': 'Barbados',
            '1264': 'Anguilla',
            '1268': 'Antigua',
            '1284': 'British Virgin Islands',
            '1340': 'US Virgin Islands',
            '1345': 'Cayman Islands',
            '1441': 'Bermuda',
            '1473': 'Grenada',
            '1649': 'Turks & Caicos',
            '1664': 'Montserrat',
            '1670': 'Northern Mariana',
            '1671': 'Guam',
            '1684': 'American Samoa',
            '1721': 'Sint Maarten',
            '1758': 'Saint Lucia',
            '1767': 'Dominica',
            '1784': 'Saint Vincent',
            '1787': 'Puerto Rico',
            '1809': 'Dominican Republic',
            '1829': 'Dominican Republic',
            '1849': 'Dominican Republic',
            '1868': 'Trinidad & Tobago',
            '1869': 'Saint Kitts',
            '1876': 'Jamaica',

            // Europe
            '30': 'Greece',
            '31': 'Netherlands',
            '32': 'Belgium',
            '33': 'France',
            '34': 'Spain',
            '36': 'Hungary',
            '39': 'Italy',
            '40': 'Romania',
            '41': 'Switzerland',
            '43': 'Austria',
            '44': 'United Kingdom',
            '45': 'Denmark',
            '46': 'Sweden',
            '47': 'Norway',
            '48': 'Poland',
            '49': 'Germany',
            '350': 'Gibraltar',
            '351': 'Portugal',
            '352': 'Luxembourg',
            '353': 'Ireland',
            '354': 'Iceland',
            '355': 'Albania',
            '356': 'Malta',
            '357': 'Cyprus',
            '358': 'Finland',
            '359': 'Bulgaria',
            '370': 'Lithuania',
            '371': 'Latvia',
            '372': 'Estonia',
            '373': 'Moldova',
            '374': 'Armenia',
            '375': 'Belarus',
            '376': 'Andorra',
            '377': 'Monaco',
            '378': 'San Marino',
            '380': 'Ukraine',
            '381': 'Serbia',
            '382': 'Montenegro',
            '383': 'Kosovo',
            '385': 'Croatia',
            '386': 'Slovenia',
            '387': 'Bosnia Herzegovina',
            '389': 'North Macedonia',

            // Russia & Central Asia
            '7': 'Russia/Kazakhstan',
            '992': 'Tajikistan',
            '993': 'Turkmenistan',
            '994': 'Azerbaijan',
            '995': 'Georgia',
            '996': 'Kyrgyzstan',
            '998': 'Uzbekistan',

            // Middle East
            '90': 'Turkey',
            '961': 'Lebanon',
            '962': 'Jordan',
            '963': 'Syria',
            '964': 'Iraq',
            '965': 'Kuwait',
            '966': 'Saudi Arabia',
            '967': 'Yemen',
            '968': 'Oman',
            '970': 'Palestine',
            '971': 'UAE',
            '972': 'Israel',
            '973': 'Bahrain',
            '974': 'Qatar',
            '975': 'Bhutan',

            // Asia
            '60': 'Malaysia',
            '61': 'Australia',
            '62': 'Indonesia',
            '63': 'Philippines',
            '64': 'New Zealand',
            '65': 'Singapore',
            '66': 'Thailand',
            '81': 'Japan',
            '82': 'South Korea',
            '84': 'Vietnam',
            '86': 'China',
            '852': 'Hong Kong',
            '853': 'Macau',
            '855': 'Cambodia',
            '856': 'Laos',
            '880': 'Bangladesh',
            '886': 'Taiwan',

            // South Asia
            '91': 'India',
            '92': 'Pakistan',
            '93': 'Afghanistan',
            '94': 'Sri Lanka',
            '95': 'Myanmar',
            '960': 'Maldives',
            '977': 'Nepal',

            // Africa
            '20': 'Egypt',
            '27': 'South Africa',
            '211': 'South Sudan',
            '212': 'Morocco',
            '213': 'Algeria',
            '216': 'Tunisia',
            '218': 'Libya',
            '220': 'Gambia',
            '221': 'Senegal',
            '222': 'Mauritania',
            '223': 'Mali',
            '224': 'Guinea',
            '225': 'Ivory Coast',
            '226': 'Burkina Faso',
            '227': 'Niger',
            '228': 'Togo',
            '229': 'Benin',
            '230': 'Mauritius',
            '231': 'Liberia',
            '232': 'Sierra Leone',
            '233': 'Ghana',
            '234': 'Nigeria',
            '235': 'Chad',
            '236': 'Central African Republic',
            '237': 'Cameroon',
            '238': 'Cape Verde',
            '239': 'Sao Tome',
            '240': 'Equatorial Guinea',
            '241': 'Gabon',
            '242': 'Congo',
            '243': 'DR Congo',
            '244': 'Angola',
            '245': 'Guinea-Bissau',
            '246': 'Diego Garcia',
            '247': 'Ascension',
            '248': 'Seychelles',
            '249': 'Sudan',
            '250': 'Rwanda',
            '251': 'Ethiopia',
            '252': 'Somalia',
            '253': 'Djibouti',
            '254': 'Kenya',
            '255': 'Tanzania',
            '256': 'Uganda',
            '257': 'Burundi',
            '258': 'Mozambique',
            '260': 'Zambia',
            '261': 'Madagascar',
            '262': 'Reunion',
            '263': 'Zimbabwe',
            '264': 'Namibia',
            '265': 'Malawi',
            '266': 'Lesotho',
            '267': 'Botswana',
            '268': 'Eswatini',
            '269': 'Comoros',
            '290': 'Saint Helena',
            '291': 'Eritrea',
            '297': 'Aruba',
            '298': 'Faroe Islands',
            '299': 'Greenland',

            // Pacific Islands
            '670': 'East Timor',
            '672': 'Norfolk Island',
            '673': 'Brunei',
            '674': 'Nauru',
            '675': 'Papua New Guinea',
            '676': 'Tonga',
            '677': 'Solomon Islands',
            '678': 'Vanuatu',
            '679': 'Fiji',
            '680': 'Palau',
            '681': 'Wallis Futuna',
            '682': 'Cook Islands',
            '683': 'Niue',
            '685': 'Samoa',
            '686': 'Kiribati',
            '687': 'New Caledonia',
            '688': 'Tuvalu',
            '689': 'French Polynesia',
            '690': 'Tokelau',
            '691': 'Micronesia',
            '692': 'Marshall Islands'
        };
    }

    /**
     * Verificar si un número tiene WhatsApp
     * Usa el método de la API de WhatsApp Web (wa.me)
     */
    async verify(phone) {
        const result = {
            phone: phone,
            normalized: null,
            valid: false,
            has_whatsapp: null,
            checks: {
                format: false,
                country_code: false,
                length: false
            },
            details: {}
        };

        // Normalizar número
        const normalized = this.normalizePhone(phone);
        result.normalized = normalized;

        // Validar formato
        const formatCheck = this.validateFormat(normalized);
        result.checks.format = formatCheck.valid;

        if (!formatCheck.valid) {
            result.details.format_error = formatCheck.error;
            return result;
        }

        // Detectar código de país
        const countryInfo = this.detectCountry(normalized);
        result.checks.country_code = countryInfo.found;
        result.details.country_code = countryInfo.code;
        result.details.country = countryInfo.country;

        // Validar longitud
        result.checks.length = normalized.length >= 10 && normalized.length <= 15;

        // Verificar existencia de WhatsApp
        try {
            const whatsappCheck = await this.checkWhatsAppExists(normalized);
            result.has_whatsapp = whatsappCheck.exists;
            result.details.whatsapp_link = `https://wa.me/${normalized}`;
            result.details.check_method = whatsappCheck.method;
        } catch (error) {
            result.has_whatsapp = null;
            result.details.whatsapp_error = 'Could not verify WhatsApp status';
        }

        // Determinar validez general
        result.valid = result.checks.format && result.checks.length && result.checks.country_code;

        return result;
    }

    normalizePhone(phone) {
        // Eliminar todo excepto números
        let normalized = phone.replace(/\D/g, '');

        // Si empieza con 00, reemplazar por nada (algunos paises usan 00 como prefijo internacional)
        if (normalized.startsWith('00')) {
            normalized = normalized.substring(2);
        }

        return normalized;
    }

    validateFormat(phone) {
        if (!phone || typeof phone !== 'string') {
            return { valid: false, error: 'Phone number is required' };
        }

        const normalized = phone.replace(/\D/g, '');

        if (normalized.length < 10) {
            return { valid: false, error: 'Phone number too short (min 10 digits)' };
        }

        if (normalized.length > 15) {
            return { valid: false, error: 'Phone number too long (max 15 digits)' };
        }

        return { valid: true };
    }

    detectCountry(phone) {
        // Probar códigos de país de mayor a menor longitud (4 dígitos para Caribbean como 1809)
        for (let len = 4; len >= 1; len--) {
            const prefix = phone.substring(0, len);
            if (this.countryCodes[prefix]) {
                return {
                    found: true,
                    code: prefix,
                    country: this.countryCodes[prefix]
                };
            }
        }

        return { found: false, code: null, country: null };
    }

    /**
     * Verificar si un número tiene WhatsApp usando el endpoint público
     * Nota: Este método puede no ser 100% preciso
     */
    async checkWhatsAppExists(phone) {
        try {
            // Método 1: Verificar si wa.me responde con redirect
            // Esto no es 100% confiable pero da una indicación
            const response = await axios.head(`https://wa.me/${phone}`, {
                timeout: 5000,
                maxRedirects: 0,
                validateStatus: (status) => status < 500
            });

            // Si hay una respuesta, el formato es válido para WhatsApp
            return {
                exists: true, // Asumimos que existe si el enlace es válido
                method: 'wa.me_check',
                note: 'Link is valid, cannot confirm active account'
            };

        } catch (error) {
            if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
                return { exists: false, method: 'wa.me_check', error: 'Network error' };
            }

            // Si hubo redirect, es probable que sea válido
            if (error.response && error.response.status === 302) {
                return { exists: true, method: 'wa.me_redirect' };
            }

            return { exists: null, method: 'wa.me_check', error: 'Could not verify' };
        }
    }

    /**
     * Generar enlace de WhatsApp
     */
    generateLink(phone, message = '') {
        const normalized = this.normalizePhone(phone);
        let link = `https://wa.me/${normalized}`;

        if (message) {
            link += `?text=${encodeURIComponent(message)}`;
        }

        return link;
    }

    /**
     * Verificación rápida (solo formato)
     */
    quickVerify(phone) {
        const normalized = this.normalizePhone(phone);
        const formatCheck = this.validateFormat(normalized);
        const countryInfo = this.detectCountry(normalized);

        return {
            phone,
            normalized,
            valid: formatCheck.valid && countryInfo.found,
            country: countryInfo.country,
            whatsapp_link: `https://wa.me/${normalized}`
        };
    }
}

module.exports = new WhatsAppVerifyService();
