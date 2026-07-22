'use client';

import { useState, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { openPayrexxPortal } from '@/api/checkout';
import {
  addressInputSchema,
  useAddresses,
  useCreateAddress,
  useDeleteAddress,
  useUpdateAddress,
  type Address,
  type AddressInput,
} from '@/api/account';
import {
  Button,
  Card,
  CardContent,
  CreditCard,
  Input,
  MapPin,
  ModalRoot,
  ModalBackdrop,
  ModalContainer,
  ModalDialog,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalHeading,
  PencilSimple,
  Plus,
  Trash,
  useOverlayState,
} from '@/components/ui';
import { NavigationLink } from '@/components/shared/NavigationLink';
import { ConfirmDialog, DataState, EmptyState, AccountSection } from '../account-ui';
import { SECTION_ICON, type AccountSectionId } from '../account-sections';

const ASSIGNMENT_PRODUCT_IDS = [
  'generator',
  'academy',
  'euRep',
] as const satisfies ReadonlyArray<AccountSectionId>;

function PaymentDetailsAboutSection() {
  const t = useTranslations('account.paymentDetails');
  const tNav = useTranslations('account.nav');

  return (
    <AccountSection size="small" title={t('aboutEyebrow')} contentClassName="gap-3">
      <p className="text-foreground text-sm leading-relaxed">{t('aboutIntro')}</p>
      <ul className="flex flex-col gap-2">
        {ASSIGNMENT_PRODUCT_IDS.map((id) => {
          const Icon = SECTION_ICON[id];
          return (
            <li key={id} className="text-foreground flex items-center gap-2.5 text-sm font-medium">
              <span
                className="text-accent flex size-8 shrink-0 items-center justify-center rounded-lg"
                style={{ background: 'color-mix(in srgb, var(--accent) 10%, transparent)' }}
                aria-hidden
              >
                <Icon size={16} weight="fill" />
              </span>
              {tNav(id)}
            </li>
          );
        })}
      </ul>
    </AccountSection>
  );
}

/**
 * Payments run entirely through Payrexx (hosted checkout). The member area
 * never stores card details — changing the card used for renewals happens on
 * Payrexx, so this surface only explains that and links out.
 */
function PayrexxSection() {
  const t = useTranslations('account.payrexx');

  return (
    <AccountSection title={t('title')} className="gap-6" contentClassName="gap-4">
      <div className="flex items-start gap-3">
        <span className="bg-accent-soft text-accent flex size-9 shrink-0 items-center justify-center rounded-full">
          <CreditCard size={16} weight="fill" aria-hidden />
        </span>
        <p className="text-foreground text-sm leading-relaxed">{t('body')}</p>
      </div>
      <div>
        <Button
          variant="outline"
          size="md"
          onPress={() => {
            void openPayrexxPortal().catch(() => {
              toast.info(t('redirecting'));
            });
          }}
        >
          {t('manage')}
        </Button>
      </div>
    </AccountSection>
  );
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-foreground text-sm font-medium">
        {label}
      </label>
      {children}
      {error ? <p className="text-danger text-xs">{error}</p> : null}
    </div>
  );
}

function CardActions({
  onEdit,
  onDelete,
  editLabel,
  deleteLabel,
}: {
  onEdit: () => void;
  onDelete: () => void;
  editLabel: string;
  deleteLabel: string;
}) {
  return (
    <div className="flex shrink-0 items-center gap-1.5">
      <Button variant="outline" size="sm" isIconOnly aria-label={editLabel} onPress={onEdit}>
        <PencilSimple size={14} aria-hidden />
      </Button>
      <Button
        variant="outline"
        size="sm"
        isIconOnly
        aria-label={deleteLabel}
        className="text-danger"
        onPress={onDelete}
      >
        <Trash size={14} aria-hidden />
      </Button>
    </div>
  );
}

function AddressCardItem({
  address,
  onEdit,
  onDelete,
}: {
  address: Address;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const t = useTranslations('account.paymentDetails');

  return (
    <Card className="!gap-4">
      <CardContent className="!flex !flex-row items-center gap-3">
        <span className="bg-accent-soft text-accent flex size-9 shrink-0 items-center justify-center rounded-full">
          <MapPin size={16} weight="fill" aria-hidden />
        </span>
        <address className="text-foreground min-w-0 flex-1 text-sm leading-relaxed not-italic">
          <p className="truncate font-semibold">
            {address.label ?? `${address.firstName} ${address.lastName}`}
          </p>
          {address.company ? <p className="text-muted truncate">{address.company}</p> : null}
          <p className="text-muted truncate">
            {[
              address.line1,
              address.line2,
              `${address.postalCode} ${address.city}`,
              address.country,
            ]
              .filter(Boolean)
              .join(', ')}
          </p>
        </address>
        <CardActions
          onEdit={onEdit}
          onDelete={onDelete}
          editLabel={t('editAddress')}
          deleteLabel={t('deleteAddress')}
        />
      </CardContent>
    </Card>
  );
}

function emptyAddressInput(): AddressInput {
  return {
    type: 'billing',
    label: '',
    firstName: '',
    lastName: '',
    company: '',
    line1: '',
    line2: '',
    postalCode: '',
    city: '',
    country: '',
    vatId: '',
  };
}

function AddressDialog({
  state,
  address,
  onSaved,
}: {
  state: ReturnType<typeof useOverlayState>;
  address: Address | null;
  onSaved: () => void;
}) {
  const t = useTranslations('account.paymentDetails');
  const tRoot = useTranslations();
  const create = useCreateAddress();
  const update = useUpdateAddress();
  const isPending = create.isPending || update.isPending;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddressInput>({
    resolver: zodResolver(addressInputSchema),
    values: address
      ? {
          type: 'billing',
          label: address.label ?? '',
          firstName: address.firstName,
          lastName: address.lastName,
          company: address.company ?? '',
          line1: address.line1,
          line2: address.line2 ?? '',
          postalCode: address.postalCode,
          city: address.city,
          country: address.country,
          vatId: address.vatId ?? '',
        }
      : emptyAddressInput(),
  });

  function onSubmit(values: AddressInput) {
    const input: AddressInput = { ...values, type: 'billing' };
    const onSuccess = () => {
      toast.success(address ? t('addressUpdated') : t('addressCreated'));
      state.close();
      reset(emptyAddressInput());
      onSaved();
    };

    if (address) {
      update.mutate({ id: address.id, input }, { onSuccess });
    } else {
      create.mutate(input, { onSuccess });
    }
  }

  const err = (key: keyof AddressInput) => {
    const message = errors[key]?.message;
    return message ? tRoot(message) : undefined;
  };

  return (
    <ModalRoot state={state}>
      <ModalBackdrop isDismissable>
        <ModalContainer size="md">
          <ModalDialog>
            <ModalHeader>
              <ModalHeading>{address ? t('editAddressTitle') : t('addAddressTitle')}</ModalHeading>
            </ModalHeader>
            <ModalBody>
              <div className="flex max-h-[min(70vh,640px)] flex-col gap-6 overflow-y-auto">
                <Field id="addressLabel" label={t('addressLabelField')} error={err('label')}>
                  <Input
                    id="addressLabel"
                    variant="secondary"
                    fullWidth
                    placeholder={t('addressLabelPlaceholder')}
                    {...register('label')}
                  />
                </Field>
                <div className="grid gap-6 sm:grid-cols-2">
                  <Field id="addrFirstName" label={t('firstName')} error={err('firstName')}>
                    <Input
                      id="addrFirstName"
                      variant="secondary"
                      fullWidth
                      {...register('firstName')}
                    />
                  </Field>
                  <Field id="addrLastName" label={t('lastName')} error={err('lastName')}>
                    <Input
                      id="addrLastName"
                      variant="secondary"
                      fullWidth
                      {...register('lastName')}
                    />
                  </Field>
                </div>
                <Field id="addrCompany" label={t('company')} error={err('company')}>
                  <Input id="addrCompany" variant="secondary" fullWidth {...register('company')} />
                </Field>
                <Field id="addrLine1" label={t('line1')} error={err('line1')}>
                  <Input id="addrLine1" variant="secondary" fullWidth {...register('line1')} />
                </Field>
                <Field id="addrLine2" label={t('line2')} error={err('line2')}>
                  <Input id="addrLine2" variant="secondary" fullWidth {...register('line2')} />
                </Field>
                <div className="grid gap-6 sm:grid-cols-2">
                  <Field id="addrPostalCode" label={t('postalCode')} error={err('postalCode')}>
                    <Input
                      id="addrPostalCode"
                      variant="secondary"
                      fullWidth
                      {...register('postalCode')}
                    />
                  </Field>
                  <Field id="addrCity" label={t('city')} error={err('city')}>
                    <Input id="addrCity" variant="secondary" fullWidth {...register('city')} />
                  </Field>
                </div>
                <Field id="addrCountry" label={t('country')} error={err('country')}>
                  <Input id="addrCountry" variant="secondary" fullWidth {...register('country')} />
                </Field>
                <Field id="addrVatId" label={t('vatId')} error={err('vatId')}>
                  <Input id="addrVatId" variant="secondary" fullWidth {...register('vatId')} />
                </Field>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button
                variant="outline"
                onPress={() => {
                  state.close();
                }}
              >
                {t('drawerCancel')}
              </Button>
              <Button
                variant="primary"
                isDisabled={isPending}
                onPress={() => {
                  void handleSubmit(onSubmit)();
                }}
              >
                {t('drawerSave')}
              </Button>
            </ModalFooter>
          </ModalDialog>
        </ModalContainer>
      </ModalBackdrop>
    </ModalRoot>
  );
}

export function PaymentDetailsSection() {
  const t = useTranslations('account.paymentDetails');
  const tFooter = useTranslations('footer');
  const addresses = useAddresses();
  const deleteAddress = useDeleteAddress();

  const addressDrawer = useOverlayState();
  const deleteAddressConfirm = useOverlayState();

  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [addressPendingDelete, setAddressPendingDelete] = useState<Address | null>(null);

  const billingAddresses = addresses.data?.filter((address) => address.type === 'billing') ?? [];

  function handleDeleteAddress() {
    if (!addressPendingDelete) return;
    deleteAddress.mutate(addressPendingDelete.id, {
      onSuccess: () => {
        toast.success(t('addressDeleted'));
        deleteAddressConfirm.close();
      },
    });
  }

  return (
    <>
      <div className="divide-border flex min-h-0 flex-1 flex-col divide-y lg:flex-row lg:divide-x lg:divide-y-0">
        <div className="divide-border flex min-h-0 min-w-0 flex-1 flex-col divide-y">
          <PayrexxSection />

          <AccountSection
            title={t('addressesTitle')}
            className="gap-6"
            contentClassName="gap-6"
            action={
              <Button
                variant="outline"
                size="sm"
                onPress={() => {
                  setEditingAddress(null);
                  addressDrawer.open();
                }}
              >
                <Plus size={14} aria-hidden />
                {t('addAddress')}
              </Button>
            }
          >
            <DataState
              isLoading={addresses.isLoading}
              isError={addresses.isError}
              onRetry={() => void addresses.refetch()}
            >
              {billingAddresses.length === 0 ? (
                <EmptyState message={t('addressesEmpty')} />
              ) : (
                <div className="flex flex-col gap-4">
                  {billingAddresses.map((address) => (
                    <AddressCardItem
                      key={address.id}
                      address={address}
                      onEdit={() => {
                        setEditingAddress(address);
                        addressDrawer.open();
                      }}
                      onDelete={() => {
                        setAddressPendingDelete(address);
                        deleteAddressConfirm.open();
                      }}
                    />
                  ))}
                </div>
              )}
            </DataState>
          </AccountSection>
        </div>

        <div className="divide-border flex w-full shrink-0 flex-col divide-y lg:w-[280px]">
          <PaymentDetailsAboutSection />

          <AccountSection size="small" title={t('questionsTitle')}>
            <p className="text-foreground text-sm leading-relaxed">{t('questionsBody')}</p>
            <NavigationLink href="/contact" size="sm">
              {t('contactUs')}
            </NavigationLink>
          </AccountSection>

          <AccountSection size="small" className="gap-1.5" contentClassName="gap-1.5">
            <NavigationLink href="/terms" size="sm">
              {tFooter('termsOfService')}
            </NavigationLink>
            <NavigationLink href="/privacy" size="sm">
              {tFooter('privacyPolicy')}
            </NavigationLink>
          </AccountSection>
        </div>
      </div>

      <AddressDialog
        state={addressDrawer}
        address={editingAddress}
        onSaved={() => {
          setEditingAddress(null);
        }}
      />

      <ConfirmDialog
        state={deleteAddressConfirm}
        title={t('deleteAddressTitle')}
        body={t('deleteAddressBody')}
        confirmLabel={t('deleteAddressConfirm')}
        cancelLabel={t('drawerCancel')}
        onConfirm={handleDeleteAddress}
        isPending={deleteAddress.isPending}
      />
    </>
  );
}
