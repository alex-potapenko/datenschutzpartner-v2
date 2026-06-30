'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { contactCreateSchema, useCreateContact, type ContactCreate } from '@/api/contacts';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  FieldError,
  Input,
  Label,
  TextField,
} from '@/components/ui';

/**
 * Reference form: zod schema from the api/ module drives validation,
 * error messages are i18n keys resolved at render time.
 */
export function ContactForm() {
  const t = useTranslations('contacts.form');
  const tValidation = useTranslations();
  const createContact = useCreateContact();

  const { control, handleSubmit, reset } = useForm<ContactCreate>({
    resolver: zodResolver(contactCreateSchema),
    defaultValues: { name: '', email: '', company: '' },
  });

  const onSubmit = handleSubmit((input) => {
    createContact.mutate(input, {
      onSuccess: () => {
        toast.success(tValidation('contacts.created'));
        reset();
      },
    });
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('heading')}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={(e) => void onSubmit(e)} noValidate className="space-y-4">
          <Controller
            control={control}
            name="name"
            render={({ field, fieldState }) => (
              <TextField
                fullWidth
                isInvalid={fieldState.invalid}
                name={field.name}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
              >
                <Label>{t('name')}</Label>
                <Input ref={field.ref} />
                <FieldError>
                  {fieldState.error?.message && tValidation(fieldState.error.message)}
                </FieldError>
              </TextField>
            )}
          />
          <Controller
            control={control}
            name="email"
            render={({ field, fieldState }) => (
              <TextField
                fullWidth
                isInvalid={fieldState.invalid}
                type="email"
                name={field.name}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
              >
                <Label>{t('email')}</Label>
                <Input ref={field.ref} />
                <FieldError>
                  {fieldState.error?.message && tValidation(fieldState.error.message)}
                </FieldError>
              </TextField>
            )}
          />
          <Controller
            control={control}
            name="company"
            render={({ field }) => (
              <TextField
                fullWidth
                name={field.name}
                value={field.value ?? ''}
                onChange={field.onChange}
                onBlur={field.onBlur}
              >
                <Label>{t('company')}</Label>
                <Input ref={field.ref} />
              </TextField>
            )}
          />
          <Button type="submit" isDisabled={createContact.isPending}>
            {t('submit')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
