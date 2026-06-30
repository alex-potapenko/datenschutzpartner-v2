import { Spinner } from '@/components/ui';

export default function Loading() {
  return (
    <div className="flex grow items-center justify-center py-24">
      <Spinner aria-label="Loading" />
    </div>
  );
}
