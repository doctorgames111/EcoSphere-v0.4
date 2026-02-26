// validation.js - shared client-side validation utilities

// hateful/profanity filter list (mirrors server list)
const badWords = ['shit', 'pussy', 'ass', 'dick', 'cunt', 'whore', 'fuck',
  'slut', 'nigga', 'nigger', 'motherfucker', 'damn','bitch','asshole','bastard'];

function containsProfanity(str) {
  if (!str) return false;
  const lower = str.toLowerCase();
  return badWords.some(w => new RegExp(`\\b${w}\\b`, 'i').test(lower));
}

function validateEmailFormat(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function validatePasswordRules(pwd) {
  return {
    length: pwd.length >= 8,
    uppercase: /[A-Z]/.test(pwd),
    number: /[0-9]/.test(pwd)
  };
}

function validateUsername(name) {
  const trimmed = (name || '').trim();
  if (!trimmed) return { valid: false, message: 'Username required' };
  if (trimmed.length < 4) return { valid: false, message: 'Must be at least 4 characters' };
  if (trimmed.length > 20) return { valid: false, message: 'Cannot exceed 20 characters' };
  if (/\s/.test(trimmed)) return { valid: false, message: 'Cannot contain spaces' };
  if (containsProfanity(trimmed)) return { valid: false, message: 'Please avoid offensive words' };
  return { valid: true, message: '' };
}

function validateName(name) {
  const trimmed = (name || '').trim();
  if (!trimmed) return { valid: false, message: 'This field is required' };
  if (trimmed.length > 20) return { valid: false, message: 'Cannot exceed 20 characters' };
  if (containsProfanity(trimmed)) return { valid: false, message: 'Please avoid offensive words' };
  return { valid: true, message: '' };
}

function validatePin(pin) {
  const trimmed = (pin || '').trim();
  if (!trimmed) return { valid: false, message: 'PIN required' };
  if (!/^[0-9]+$/.test(trimmed)) return { valid: false, message: 'PIN must be numeric' };
  if (trimmed.length > 6) return { valid: false, message: 'PIN too long' };
  return { valid: true, message: '' };
}

// expose as global object for easy consumption by other scripts
window.validation = {
  containsProfanity,
  validateEmailFormat,
  validatePasswordRules,
  validateUsername,
  validateName,
  validatePin
};
