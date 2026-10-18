/**
 * Validation utility for mobile phone numbers.
 * Supports standard Indian mobile numbers (10 digits starting with 6, 7, 8, or 9)
 * with optional country code (+91, 91, or 0) and formatting characters.
 */

export interface PhoneValidationResult {
  valid: boolean;
  normalized?: string;
  error?: string;
}

export function validatePhoneNumber(phone: unknown): PhoneValidationResult {
  if (phone === null || phone === undefined) {
    return {
      valid: false,
      error: 'Phone number is required. Please enter your mobile number.',
    };
  }

  const str = String(phone).trim();
  if (!str) {
    return {
      valid: false,
      error: 'Phone number cannot be empty. Please enter your mobile number.',
    };
  }

  // Remove spaces, hyphens, parentheses, and dots
  const stripped = str.replace(/[\s\-\(\)\.]/g, '');

  // Indian mobile regex:
  // Optional +91, 91, or 0 followed by 10 digits starting with 6-9
  const indianMobileRegex = /^(?:\+?91|0)?([6-9]\d{9})$/;
  const match = stripped.match(indianMobileRegex);

  if (!match) {
    return {
      valid: false,
      error: 'Please enter a valid 10-digit Indian mobile number (e.g. 9845012345 or +91 9845012345).',
    };
  }

  const tenDigits = match[1];
  const normalized = `+91 ${tenDigits.slice(0, 5)} ${tenDigits.slice(5)}`;

  return {
    valid: true,
    normalized,
  };
}
