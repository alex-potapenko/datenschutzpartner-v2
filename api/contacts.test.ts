import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { createQueryWrapper } from '@/tests/test-utils';
import { useContacts } from './contacts';

describe('useContacts', () => {
  it('returns the contacts served by the mock API', async () => {
    const { result } = renderHook(() => useContacts(), { wrapper: createQueryWrapper() });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).not.toHaveLength(0);
    expect(result.current.data?.[0]).toMatchObject({ name: expect.any(String) as string });
  });
});
