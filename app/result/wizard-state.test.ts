import { describe, expect, it } from 'vitest';
import {
  emptyEuRepState,
  shouldRestoreWizardState,
  type WizardPersistedState,
} from './wizard-state';

function persisted(overrides: Partial<WizardPersistedState>): WizardPersistedState {
  return {
    step: 'improved',
    scanDone: true,
    euRep: emptyEuRepState(),
    visitedSteps: ['improved'],
    ...overrides,
  };
}

describe('shouldRestoreWizardState', () => {
  it('restores policy update sessions when URL is in update mode', () => {
    const restored = persisted({ questionnaireOnly: true, updateDocumentId: '1' });
    const params = new URLSearchParams({
      url: 'https://example.com',
      mode: 'update',
      documentId: '1',
    });

    expect(shouldRestoreWizardState(restored, params, 'example.com')).toBe(true);
  });

  it('does not restore update sessions for a new-site generation URL', () => {
    const restored = persisted({
      questionnaireOnly: true,
      updateDocumentId: '1',
      domain: 'old-site.ch',
    });
    const params = new URLSearchParams({ url: 'https://new-site.ch' });

    expect(shouldRestoreWizardState(restored, params, 'new-site.ch')).toBe(false);
  });

  it('restores generation progress for the same domain', () => {
    const restored = persisted({ domain: 'my-site.ch', scanDone: false });
    const params = new URLSearchParams({ url: 'https://my-site.ch' });

    expect(shouldRestoreWizardState(restored, params, 'my-site.ch')).toBe(true);
  });

  it('does not restore generation progress for a different domain', () => {
    const restored = persisted({ domain: 'old-site.ch' });
    const params = new URLSearchParams({ url: 'https://new-site.ch' });

    expect(shouldRestoreWizardState(restored, params, 'new-site.ch')).toBe(false);
  });
});
