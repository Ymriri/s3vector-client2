/**
 * Sanitizes AWS credential strings that were mangled by copy/paste chains.
 *
 * AWS access keys and secret keys draw from tiny charsets:
 *   AccessKeyId:     [A-Za-z0-9]  (20 chars, e.g. AKIA...)
 *   SecretAccessKey: [A-Za-z0-9/+=] (40 chars)
 *
 * Neither charset contains backslashes or whitespace. Therefore any
 * backslash / whitespace / control characters found in pasted input are
 * guaranteed corruption from an escaping layer (JSON-escaped sources emit
 * `\/` for `/`, `\u002F`-style escapes, `\\`, `\n`, ...), not part of the
 * real credential — and can be decoded or stripped safely.
 */

const SECRET_KEY_CHARSET = /^[A-Za-z0-9/+=]+$/;
const ACCESS_KEY_CHARSET = /^[A-Za-z0-9]+$/;
export const SECRET_KEY_EXPECTED_LENGTH = 40;
export const ACCESS_KEY_EXPECTED_LENGTH = 20;

/** Best-effort decode of JSON escape sequences (`\/`, `\uXXXX`, `\\`, ...). */
function decodeJsonEscapes(value: string): string {
  if (!value.includes('\\')) {
    return value;
  }
  try {
    // Wrap in quotes so JSON.parse treats the whole string as one JSON
    // string literal; escape any real quotes first so this cannot break.
    const decoded = JSON.parse(`"${value.replace(/"/g, '\\"')}"`);
    if (typeof decoded === 'string') {
      return decoded;
    }
  } catch {
    // Malformed escape tail (e.g. a lone `\u00`) — fall through to the
    // conservative stripper below.
  }
  return value;
}

/** Strips whitespace anywhere and backslashes directly escaping SK-safe punctuation. */
function stripResidualNoise(value: string): string {
  return value
    .replace(/\s+/g, '')
    .replace(/\\+([/+=])/g, '$1')
    .replace(/\\+/g, '');
}

export interface SanitizeResult {
  value: string;
  /** True when the sanitized value fits the AWS charset (and length, when enforced). */
  valid: boolean;
  /** Human-readable reason when invalid. */
  reason?: string;
}

/**
 * Sanitizes a SecretAccessKey: trims, decodes JSON-style escapes, strips
 * residual backslashes/whitespace, and validates the final charset+length.
 */
export function sanitizeSecretAccessKey(raw: string): SanitizeResult {
  const value = stripResidualNoise(decodeJsonEscapes(raw.trim()));
  if (!value) {
    return { value, valid: false, reason: 'SecretKey 为空' };
  }
  if (!SECRET_KEY_CHARSET.test(value)) {
    return {
      value,
      valid: false,
      reason:
        'SecretKey 含非法字符（合法集为 A-Z a-z 0-9 / + =），请确认复制完整且未被转义',
    };
  }
  if (value.length !== SECRET_KEY_EXPECTED_LENGTH) {
    return {
      value,
      valid: false,
      reason: `SecretKey 长度应为 ${SECRET_KEY_EXPECTED_LENGTH} 位，实际 ${value.length} 位，请检查是否复制完整`,
    };
  }
  return { value, valid: true };
}

/**
 * Sanitizes an AccessKeyId: trims, decodes JSON-style escapes, strips
 * residual backslashes/whitespace, and validates the final charset+length.
 */
export function sanitizeAccessKeyId(raw: string): SanitizeResult {
  const value = stripResidualNoise(decodeJsonEscapes(raw.trim()));
  if (!value) {
    return { value, valid: false, reason: 'AccessKey 为空' };
  }
  if (!ACCESS_KEY_CHARSET.test(value)) {
    return {
      value,
      valid: false,
      reason: 'AccessKey 含非法字符（合法集为 A-Z a-z 0-9），请确认未被转义',
    };
  }
  if (value.length !== ACCESS_KEY_EXPECTED_LENGTH) {
    return {
      value,
      valid: false,
      reason: `AccessKey 长度应为 ${ACCESS_KEY_EXPECTED_LENGTH} 位，实际 ${value.length} 位，请检查是否复制完整`,
    };
  }
  return { value, valid: true };
}

/** Generic sanitizer for region/endpoint: trims and strips stray whitespace only. */
export function sanitizePlainInput(raw: string): string {
  return raw.trim().replace(/\s+/g, '');
}
