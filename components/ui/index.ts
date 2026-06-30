export * from './button';
export * from './card';
export * from './collection';
export * from './feedback';
export * from './field';
export * from './icon';
export * from './overlay';
// Phosphor's deprecated (non-Icon-suffixed) aliases clash with UI component names.
// Explicit re-exports resolve the ambiguity — UI components take precedence.
export { Table, Tabs } from './collection';
export { Spinner } from './feedback';
