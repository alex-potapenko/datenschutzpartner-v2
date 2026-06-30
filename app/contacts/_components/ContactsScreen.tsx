'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useContacts, useDeleteContact } from '@/api/contacts';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
  TrashIcon,
} from '@/components/ui';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { ContactForm } from './ContactForm';

export function ContactsScreen() {
  const t = useTranslations('contacts');
  const { data: contacts, isPending, isError, refetch } = useContacts();
  const deleteContact = useDeleteContact();
  const prefersReducedMotion = useReducedMotion();

  const cardVariants = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 8 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: prefersReducedMotion ? 0 : -8 },
  };

  return (
    <main className="mx-auto w-full max-w-2xl grow space-y-8 px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <ThemeToggle />
      </div>

      <section aria-label={t('title')} className="space-y-3">
        {isPending && (
          <>
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </>
        )}

        {isError && <ErrorState onRetry={() => void refetch()} />}

        {contacts?.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="font-semibold">{t('empty')}</p>
              <p className="text-sm">{t('emptyHint')}</p>
            </CardContent>
          </Card>
        )}

        <AnimatePresence initial={false}>
          {contacts?.map((contact) => (
            <motion.div
              key={contact.id}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>{contact.name}</CardTitle>
                  <CardDescription>
                    {contact.email}
                    {contact.company ? ` · ${contact.company}` : ''}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="danger-soft"
                    size="sm"
                    isDisabled={deleteContact.isPending}
                    onPress={() => {
                      deleteContact.mutate(contact.id, {
                        onSuccess: () => toast.success(t('deleted')),
                      });
                    }}
                  >
                    <TrashIcon aria-hidden />
                    {t('delete')}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </section>

      <ContactForm />
    </main>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  const t = useTranslations('common');
  return (
    <Card>
      <CardContent className="space-y-3 py-8 text-center">
        <p className="font-semibold">{t('error')}</p>
        <Button variant="secondary" onPress={onRetry}>
          {t('retry')}
        </Button>
      </CardContent>
    </Card>
  );
}
