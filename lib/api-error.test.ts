import { describe, expect, it } from 'vitest';
import { ApiError } from '@/api/client';
import { apiErrorCode, isApiErrorCode } from './api-error';

describe('apiErrorCode', () => {
  it('reads message from JSON bodies', () => {
    const error = new ApiError(401, JSON.stringify({ message: 'invalid_two_factor' }));
    expect(apiErrorCode(error)).toBe('invalid_two_factor');
    expect(isApiErrorCode(error, 'invalid_two_factor')).toBe(true);
  });
});
