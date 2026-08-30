import { describe, it, expect } from 'vitest';
import { errorFromCaught } from './error';

describe('errorFromCaught', () => {
  it('maps an Error with name, code and message', () => {
    const error = new Error('Access denied');
    error.name = 'AccessDeniedException';
    (error as { code?: string }).code = 'AccessDeniedException';

    expect(errorFromCaught(error)).toEqual({
      name: 'AccessDeniedException',
      code: 'AccessDeniedException',
      message: 'Access denied',
    });
  });

  it('falls back to undefined code when missing', () => {
    expect(errorFromCaught(new Error('boom'))).toEqual({
      name: 'Error',
      code: undefined,
      message: 'boom',
    });
  });

  it('stringifies non-Error values', () => {
    expect(errorFromCaught('nope')).toEqual({ message: 'nope' });
    expect(errorFromCaught(42)).toEqual({ message: '42' });
  });
});
