/** Top bar layout variants used across the app. */
export type TopBarVariant = 'public' | 'account' | 'nested' | 'wizard';

export type TopBarBackLink = {
  href: string;
  label: string;
  preferHref?: boolean;
  iconOnly?: boolean;
  detailTitle?: string;
  onPress?: () => void;
};

export type TopBarFrameLayout =
  | 'row'
  | 'account'
  | 'public-grid'
  | 'wizard-split'
  | 'drawer-header';
