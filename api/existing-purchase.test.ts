import { describe, expect, it, afterEach } from 'vitest';
import { checkExistingEuRep, checkExistingSitePolicy } from './existing-purchase';
import { clearAuthToken, setAuthToken } from '@/lib/auth-session';

describe('existing purchase checks', () => {
  afterEach(() => {
    clearAuthToken();
  });

  it('does not block guests when the site exists for another account', async () => {
    const result = await checkExistingSitePolicy('https://www.sutter-web.ch');
    expect(result.exists).toBe(false);
  });

  it('detects an existing site on the signed-in account', async () => {
    setAuthToken('mock-member-token');
    const result = await checkExistingSitePolicy('https://www.sutter-web.ch');
    expect(result.exists).toBe(true);
    expect(result.displayName).toBe('sutter-web.ch');
    expect(result.href).toContain('site=sutter-web.ch');
  });

  it('returns false for unknown sites', async () => {
    const result = await checkExistingSitePolicy('https://brand-new-example.ch');
    expect(result.exists).toBe(false);
  });

  it('detects an existing mocked legal entity', async () => {
    const result = await checkExistingEuRep('Baumgartner Digital AG');
    expect(result.exists).toBe(true);
    expect(result.displayName).toBe('Baumgartner Digital AG');
    expect(result.href).toContain('contract=1');
  });
});
