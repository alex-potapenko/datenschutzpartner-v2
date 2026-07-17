type PasswordCredentialInit = {
  id: string;
  password: string;
  name: string;
};

type PasswordCredentialConstructor = new (init: PasswordCredentialInit) => Credential;

/**
 * Prompts the browser / OS password manager (Chrome, Safari Keychain, etc.)
 * to offer saving the login after a successful sign-in.
 */
export async function storeLoginCredential(email: string, password: string): Promise<void> {
  if (typeof window === 'undefined') return;
  if (!('credentials' in navigator)) return;

  const PasswordCredentialCtor = (
    globalThis as typeof globalThis & {
      PasswordCredential?: PasswordCredentialConstructor;
    }
  ).PasswordCredential;

  if (!PasswordCredentialCtor) return;

  try {
    const credential = new PasswordCredentialCtor({
      id: email,
      password,
      name: email,
    });
    await navigator.credentials.store(credential);
  } catch {
    // User dismissed the prompt or the browser blocked storage — ignore.
  }
}
