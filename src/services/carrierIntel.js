/**
 * Carrier Intelligence Service
 * Proporciona información sobre el operador y tipo de línea telefónica
 */

class CarrierIntelService {
    constructor() {
        // Mapeo de códigos de país a información
        this.countryInfo = {
            '1': { country: 'United States/Canada', region: 'North America', timezone: 'America/New_York' },
            '52': { country: 'Mexico', region: 'Latin America', timezone: 'America/Mexico_City' },
            '54': { country: 'Argentina', region: 'South America', timezone: 'America/Buenos_Aires' },
            '55': { country: 'Brazil', region: 'South America', timezone: 'America/Sao_Paulo' },
            '56': { country: 'Chile', region: 'South America', timezone: 'America/Santiago' },
            '57': { country: 'Colombia', region: 'South America', timezone: 'America/Bogota' },
            '502': { country: 'Guatemala', region: 'Central America', timezone: 'America/Guatemala' },
            '503': { country: 'El Salvador', region: 'Central America', timezone: 'America/El_Salvador' },
            '504': { country: 'Honduras', region: 'Central America', timezone: 'America/Tegucigalpa' },
            '505': { country: 'Nicaragua', region: 'Central America', timezone: 'America/Managua' },
            '506': { country: 'Costa Rica', region: 'Central America', timezone: 'America/Costa_Rica' },
            '507': { country: 'Panama', region: 'Central America', timezone: 'America/Panama' },
            '51': { country: 'Peru', region: 'South America', timezone: 'America/Lima' },
            '591': { country: 'Bolivia', region: 'South America', timezone: 'America/La_Paz' },
            '593': { country: 'Ecuador', region: 'South America', timezone: 'America/Guayaquil' },
            '595': { country: 'Paraguay', region: 'South America', timezone: 'America/Asuncion' },
            '598': { country: 'Uruguay', region: 'South America', timezone: 'America/Montevideo' },
            '58': { country: 'Venezuela', region: 'South America', timezone: 'America/Caracas' },
            '34': { country: 'Spain', region: 'Europe', timezone: 'Europe/Madrid' },
            '44': { country: 'United Kingdom', region: 'Europe', timezone: 'Europe/London' },
            '49': { country: 'Germany', region: 'Europe', timezone: 'Europe/Berlin' },
            '33': { country: 'France', region: 'Europe', timezone: 'Europe/Paris' },
            '39': { country: 'Italy', region: 'Europe', timezone: 'Europe/Rome' },
            '91': { country: 'India', region: 'Asia', timezone: 'Asia/Kolkata' },
            '86': { country: 'China', region: 'Asia', timezone: 'Asia/Shanghai' },
            '81': { country: 'Japan', region: 'Asia', timezone: 'Asia/Tokyo' },
            '82': { country: 'South Korea', region: 'Asia', timezone: 'Asia/Seoul' },
            '61': { country: 'Australia', region: 'Oceania', timezone: 'Australia/Sydney' },
            '64': { country: 'New Zealand', region: 'Oceania', timezone: 'Pacific/Auckland' },
        };

        // Operadores por país (ejemplos principales)
        this.carriersByCountry = {
            '1': ['AT&T', 'Verizon', 'T-Mobile', 'Sprint'],
            '52': ['Telcel', 'Movistar', 'AT&T Mexico'],
            '55': ['Claro', 'Vivo', 'TIM', 'Oi'],
            '502': ['Tigo', 'Claro', 'Movistar'],
            '34': ['Movistar', 'Vodafone', 'Orange'],
            '44': ['EE', 'Vodafone', 'O2', 'Three'],
            '91': ['Jio', 'Airtel', 'Vodafone Idea', 'BSNL'],
        };

        // Patrones de prefijos VOIP conocidos
        this.voipPatterns = [
            /^1[0-9]{3}555/,  // Números ficticios US
            /^44870/,         // UK premium
            /^44871/,
            /^44872/,
        ];

        // Prefijos de línea fija por país
        this.landlinePatterns = {
            '52': /^52(55|33|81|222|444|477)/,  // Mexico ciudades principales
            '1': /^1[2-9]\d{2}[2-9]\d{2}/,       // US patrones tradicionales
        };
    }

    /**
     * Obtener información del operador y línea
     */
    async getCarrierInfo(phone) {
        const normalized = phone.replace(/\D/g, '');
        const countryCode = this.detectCountryCode(normalized);

        const result = {
            phone: normalized,
            country_code: countryCode,
            country_info: null,
            carrier: null,
            line_type: 'mobile',  // mobile, landline, voip, unknown
            is_voip: false,
            is_prepaid: null,  // No se puede determinar sin API externa
            is_ported: null,   // No se puede determinar sin API externa
            number_info: {
                local_format: null,
                international_format: `+${normalized}`,
                e164_format: `+${normalized}`
            }
        };

        // Obtener info del país
        if (countryCode && this.countryInfo[countryCode]) {
            result.country_info = {
                ...this.countryInfo[countryCode],
                country_code: countryCode
            };
        } else {
            result.country_info = {
                country: 'Unknown',
                region: 'Unknown',
                timezone: 'UTC',
                country_code: countryCode || 'unknown'
            };
        }

        // Detectar tipo de línea
        result.is_voip = this.isVoipNumber(normalized);
        result.line_type = this.detectLineType(normalized, countryCode);

        // Estimar operador (sin API externa, es una estimación)
        result.carrier = this.estimateCarrier(normalized, countryCode);

        // Formato local
        result.number_info.local_format = this.formatLocalNumber(normalized, countryCode);

        return result;
    }

    detectCountryCode(phone) {
        // Probar códigos de 4 a 1 dígito
        for (let len = 4; len >= 1; len--) {
            const prefix = phone.substring(0, len);
            if (this.countryInfo[prefix]) {
                return prefix;
            }
        }
        // Intentar con códigos conocidos
        const knownCodes = ['1', '7', '20', '27', '30', '31', '32', '33', '34', '36', '39',
            '40', '41', '43', '44', '45', '46', '47', '48', '49', '51', '52', '53', '54',
            '55', '56', '57', '58', '60', '61', '62', '63', '64', '65', '66', '81', '82',
            '84', '86', '90', '91', '92', '93', '94', '95'];

        for (const code of knownCodes) {
            if (phone.startsWith(code)) {
                return code;
            }
        }
        return null;
    }

    isVoipNumber(phone) {
        return this.voipPatterns.some(pattern => pattern.test(phone));
    }

    detectLineType(phone, countryCode) {
        if (this.isVoipNumber(phone)) {
            return 'voip';
        }

        if (countryCode && this.landlinePatterns[countryCode]) {
            if (this.landlinePatterns[countryCode].test(phone)) {
                return 'landline';
            }
        }

        // Por defecto asumimos móvil
        return 'mobile';
    }

    estimateCarrier(phone, countryCode) {
        if (!countryCode || !this.carriersByCountry[countryCode]) {
            return {
                name: 'Unknown',
                estimated: true,
                confidence: 'low'
            };
        }

        const carriers = this.carriersByCountry[countryCode];

        // Sin API externa, solo podemos dar una lista de posibles operadores
        return {
            name: 'Unknown - API lookup required',
            possible_carriers: carriers,
            estimated: true,
            confidence: 'low',
            note: 'Carrier detection requires number portability database lookup'
        };
    }

    formatLocalNumber(phone, countryCode) {
        if (!countryCode) return phone;

        const localNumber = phone.substring(countryCode.length);

        // Formateo específico por país
        switch (countryCode) {
            case '1':  // US/Canada
                if (localNumber.length === 10) {
                    return `(${localNumber.substring(0, 3)}) ${localNumber.substring(3, 6)}-${localNumber.substring(6)}`;
                }
                break;
            case '52':  // Mexico
                if (localNumber.length === 10) {
                    return `${localNumber.substring(0, 3)} ${localNumber.substring(3, 6)} ${localNumber.substring(6)}`;
                }
                break;
            case '44':  // UK
                if (localNumber.length === 10) {
                    return `${localNumber.substring(0, 4)} ${localNumber.substring(4)}`;
                }
                break;
        }

        return localNumber;
    }

    /**
     * Obtener información de SMS deliverability
     */
    getSmsDeliverability(carrierInfo) {
        return {
            can_receive_sms: carrierInfo.line_type === 'mobile',
            can_receive_mms: carrierInfo.line_type === 'mobile' && !carrierInfo.is_voip,
            recommended_for_otp: carrierInfo.line_type === 'mobile' && !carrierInfo.is_voip,
            warnings: carrierInfo.is_voip ? ['VOIP numbers may not receive SMS'] : []
        };
    }
}

module.exports = new CarrierIntelService();
