import { describe, it, expect } from 'vitest';
import { formatDate, formatJson } from './format';

describe('formatDate', () => {
  it('returns an em dash for missing values', () => {
    expect(formatDate(undefined)).toBe('—');
    expect(formatDate(null)).toBe('—');
  });

  it('returns an em dash for invalid dates', () => {
    expect(formatDate('not-a-date')).toBe('—');
  });

  it('formats Date objects and strings consistently', () => {
    const date = new Date('2024-06-01T12:00:00Z');
    expect(formatDate(date)).toBe(date.toLocaleString());
    expect(formatDate('2024-06-01T12:00:00Z')).toBe(date.toLocaleString());
  });
});

describe('formatJson', () => {
  it('pretty-prints compact JSON', () => {
    expect(formatJson('{"Version":"2012-10-17"}')).toBe(
      '{\n  "Version": "2012-10-17"\n}'
    );
  });

  it('reformats already pretty JSON stably', () => {
    const pretty = '{\n  "a": 1\n}';
    expect(formatJson(pretty)).toBe(pretty);
  });

  it('returns null for invalid JSON', () => {
    expect(formatJson('not json')).toBeNull();
    expect(formatJson('')).toBeNull();
  });
});
