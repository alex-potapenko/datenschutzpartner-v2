import { toast } from 'sonner';
import { Alert } from '@/components/ui';

export function showDangerToast(message: string) {
  toast.custom(
    () => (
      <Alert status="danger" role="alert" className="w-full max-w-sm shadow-lg">
        <Alert.Indicator />
        <Alert.Content>
          <Alert.Description className="text-foreground text-sm leading-relaxed">
            {message}
          </Alert.Description>
        </Alert.Content>
      </Alert>
    ),
    { duration: 5000 }
  );
}
