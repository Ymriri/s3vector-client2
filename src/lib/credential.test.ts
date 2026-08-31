import { describe, it, expect } from 'vitest';
import {
  sanitizeAccessKeyId,
  sanitizeSecretAccessKey,
  sanitizePlainInput,
} from './credential';

// Format-valid synthetic fixtures (NOT real credentials):
// AK: 20 chars [A-Za-z0-9] starting AKIA; SK: 40 chars [A-Za-z0-9/+=].
const VALID_AK = 'AKIAIOSFODNN7EXAMPLE';
const VALID_SK = 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY';

describe('sanitizeSecretAccessKey', () => {
  it('passes a clean key through unchanged', () => {
    expect(sanitizeSecretAccessKey(VALID_SK)).toEqual({
      value: VALID_SK,
      valid: true,
    });
  });

  it('trims surrounding whitespace', () => {
    expect(sanitizeSecretAccessKey(`  ${VALID_SK}\n`)).toEqual({
      value: VALID_SK,
      valid: true,
    });
  });

  it('removes interior whitespace from accidental line wrapping', () => {
    expect(
      sanitizeSecretAccessKey('wJalrXUtnFEMI/K7MDENG/\nbPxRfiCYEXAMPLEKEY')
    ).toEqual({
      value: VALID_SK,
      valid: true,
    });
  });

  it('decodes JSON-escaped forward slash', () => {
    const mangled = VALID_SK.replace(/\//g, '\\/');
    expect(sanitizeSecretAccessKey(mangled)).toEqual({
      value: VALID_SK,
      valid: true,
    });
  });

  it('decodes unicode escape sequences like \\u002F', () => {
    const mangled = VALID_SK.replace(/\//g, '\\u002F');
    expect(sanitizeSecretAccessKey(mangled)).toEqual({
      value: VALID_SK,
      valid: true,
    });
  });

  it('decodes escaped backslash-plus sequences', () => {
    const mangled = VALID_SK.replace(/\+/g, '\\+');
    expect(sanitizeSecretAccessKey(mangled)).toEqual({
      value: VALID_SK,
      valid: true,
    });
  });

  it('handles a fully JSON-escaped serialization', () => {
    const mangled = JSON.stringify(VALID_SK).slice(1, -1);
    expect(sanitizeSecretAccessKey(mangled)).toEqual({
      value: VALID_SK,
      valid: true,
    });
  });

  it('flags keys with genuinely illegal characters', () => {
    const bad = VALID_SK.slice(0, 39) + '~';
    const result = sanitizeSecretAccessKey(bad);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('非法字符');
  });

  it('flags wrong-length keys', () => {
    const result = sanitizeSecretAccessKey(VALID_SK.slice(0, 39));
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('长度');
  });

  it('flags empty input', () => {
    expect(sanitizeSecretAccessKey('   ').valid).toBe(false);
  });

  it('recovers from a malformed escape tail without throwing', () => {
    const result = sanitizeSecretAccessKey('wJalrXUtnFEMI/K7MDENG\\u00');
    expect(result.value).toBe('wJalrXUtnFEMI/K7MDENGu00');
    expect(result.valid).toBe(false); // wrong length — flagged, not silently accepted
  });
});

describe('sanitizeAccessKeyId', () => {
  it('passes a clean key through unchanged', () => {
    expect(sanitizeAccessKeyId(VALID_AK)).toEqual({
      value: VALID_AK,
      valid: true,
    });
  });

  it('decodes JSON-escaped content and validates charset', () => {
    const mangled = VALID_AK.slice(0, 10) + '\\u002B' + VALID_AK.slice(10);
    const result = sanitizeAccessKeyId(mangled);
    // `+` decodes fine but is NOT legal inside an AccessKeyId → flagged.
    expect(result.value).toBe('AKIAIOSFOD+NN7EXAMPLE');
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('非法字符');
  });

  it('flags keys containing symbols', () => {
    const result = sanitizeAccessKeyId('AKIA/YZOQEXAMPLEKEY');
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('非法字符');
  });

  it('flags wrong-length keys', () => {
    const result = sanitizeAccessKeyId(VALID_AK.slice(0, 19));
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('长度');
  });
});

describe('sanitizePlainInput', () => {
  it('trims and removes whitespace', () => {
    expect(sanitizePlainInput('  ap-southeast-1 \n')).toBe('ap-southeast-1');
    expect(
      sanitizePlainInput('https://s3vectors.ap-southeast-1.api.aws ')
    ).toBe('https://s3vectors.ap-southeast-1.api.aws');
  });
});
