import { parsePhoneNumberFromString, PhoneNumber } from 'libphonenumber-js';

export interface NormalizedPhoneResult {
  isValid: boolean;
  e164: string; // e.g. "+918130896226", "+14155552671"
  nationalNumber: string; // e.g. "8130896226"
  country?: string; // e.g. "IN", "US", "GB"
  countryCallingCode?: string; // e.g. "91", "1"
  formattedInternational: string; // e.g. "+91 81308 96226"
  formattedNational: string; // e.g. "081308 96226"
}

/**
 * Normalizes and validates international and national phone numbers.
 * Supports country codes across the globe, defaulting to 'IN' when no country code is supplied.
 */
export function normalizePhoneNumber(raw: string, defaultCountry: string = 'IN'): NormalizedPhoneResult | null {
  if (!raw || typeof raw !== 'string') return null;
  const clean = raw.trim();
  if (!clean) return null;

  // 1. Try parsing directly (respects leading '+' for international)
  let parsed: PhoneNumber | undefined = parsePhoneNumberFromString(clean);
  if (!parsed || !parsed.isValid()) {
    // 2. Try parsing with defaultCountry fallback
    parsed = parsePhoneNumberFromString(clean, defaultCountry as any);
  }

  if (parsed && parsed.isValid()) {
    return {
      isValid: true,
      e164: parsed.number,
      nationalNumber: parsed.nationalNumber,
      country: parsed.country,
      countryCallingCode: parsed.countryCallingCode,
      formattedInternational: parsed.formatInternational(),
      formattedNational: parsed.formatNational(),
    };
  }

  // 3. Fallback heuristic for emergency helplines or raw clean digits
  const digitsOnly = clean.replace(/\D/g, '');
  if (digitsOnly === '112' || digitsOnly === '911' || digitsOnly === '999') {
    return {
      isValid: true,
      e164: digitsOnly,
      nationalNumber: digitsOnly,
      formattedInternational: digitsOnly,
      formattedNational: digitsOnly,
    };
  }

  if (digitsOnly.length >= 7 && digitsOnly.length <= 15) {
    const e164 = clean.startsWith('+')
      ? `+${digitsOnly}`
      : digitsOnly.length === 10
      ? `+91${digitsOnly}`
      : `+${digitsOnly}`;

    return {
      isValid: true,
      e164,
      nationalNumber: digitsOnly.slice(-10),
      country: digitsOnly.length === 10 ? 'IN' : undefined,
      formattedInternational: e164,
      formattedNational: digitsOnly,
    };
  }

  return null;
}
