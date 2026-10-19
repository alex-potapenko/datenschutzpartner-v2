import { redirect } from 'next/navigation';
import { AFFILIATE_ACCOUNT_HREF } from '@/lib/account-routes';

/** Legacy route — affiliate lives under Mein Profil. */
export default function AccountAffiliateRedirectPage() {
  redirect(AFFILIATE_ACCOUNT_HREF);
}
