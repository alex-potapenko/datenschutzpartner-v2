/** Prototype seed accounts — keep in sync with `mocks/handlers.ts`. */
export const MOCK_MEMBER_LOGIN = {
  role: 'member' as const,
  email: 'lucas.baumgartner@gmail.com',
  password: 'dspmp',
};

export const MOCK_ADMIN_LOGIN = {
  role: 'admin' as const,
  email: 'admin@datenschutzpartner.ch',
};
