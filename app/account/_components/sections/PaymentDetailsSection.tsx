'use client';

import { useRef, useState, type ReactNode } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
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
  paymentMethodCreateInputSchema,
  paymentMethodUpdateInputSchema,
  normalizeCardNumber,
  usePaymentMethods,
  useCreatePaymentMethod,
  useDeletePaymentMethod,
  useUpdatePaymentMethod,
  type PaymentMethod,
  type PaymentMethodCreateInput,
  type PaymentMethodUpdateInput,
} from '@/api/billing';
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

function formatCardBrand(brand: string) {
  return brand.charAt(0).toUpperCase() + brand.slice(1).toLowerCase();
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

function PaymentMethodCardItem({
  method,
  onEdit,
  onDelete,
}: {
  method: PaymentMethod;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const t = useTranslations('account.paymentDetails');

  return (
    <Card className="!gap-4">
      <CardContent className="!flex !flex-row items-center gap-3">
        <span className="bg-accent-soft text-accent flex size-9 shrink-0 items-center justify-center rounded-full">
          <CreditCard size={16} weight="fill" aria-hidden />
        </span>
        <div className="text-foreground min-w-0 flex-1 text-sm leading-relaxed">
          <p className="truncate font-semibold">
            {method.brand
              ? `${formatCardBrand(method.brand)} •••• ${method.last4 ?? ''}`
              : method.label}
          </p>
          {method.expMonth != null && method.expYear != null ? (
            <p className="text-muted truncate">
              {t('cardExpires', {
                month: String(method.expMonth).padStart(2, '0'),
                year: String(method.expYear),
              })}
            </p>
          ) : null}
        </div>
        <CardActions
          onEdit={onEdit}
          onDelete={onDelete}
          editLabel={t('editPaymentMethod')}
          deleteLabel={t('deletePaymentMethod')}
        />
      </CardContent>
    </Card>
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

function cardNumberSegments(value: string) {
  const digits = normalizeCardNumber(value);
  return Array.from({ length: 4 }, (_, index) => digits.slice(index * 4, index * 4 + 4));
}

function CardNumberSegmentFields({
  value,
  onChange,
  segmentAriaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  segmentAriaLabel: (index: number) => string;
}) {
  const segmentRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];
  const segments = cardNumberSegments(value);

  function updateSegments(nextSegments: string[], focusIndex?: number) {
    onChange(nextSegments.join(''));
    if (focusIndex != null) {
      segmentRefs[focusIndex]?.current?.focus();
    }
  }

  function handleSegmentChange(index: number, raw: string) {
    const cleaned = raw.replace(/\D/g, '').slice(0, 4);
    const nextSegments = [...segments];
    nextSegments[index] = cleaned;
    updateSegments(nextSegments, cleaned.length === 4 && index < 3 ? index + 1 : undefined);
  }

  function handleKeyDown(index: number, key: string) {
    if (key === 'Backspace' && segments[index] === '' && index > 0) {
      segmentRefs[index - 1]?.current?.focus();
    }
  }

  function handlePaste(raw: string) {
    const cleaned = raw.replace(/\D/g, '').slice(0, 16);
    onChange(cleaned);
    const focusIndex = Math.min(3, Math.floor((cleaned.length - 1) / 4));
    segmentRefs[focusIndex]?.current?.focus();
  }

  return (
    <div className="grid grid-cols-4 gap-2">
      {segments.map((segment, index) => (
        <Input
          key={index}
          ref={segmentRefs[index]}
          id={`cardNumberSegment${index + 1}`}
          variant="secondary"
          fullWidth
          inputMode="numeric"
          autoComplete={index === 0 ? 'cc-number' : 'off'}
          maxLength={4}
          placeholder="0000"
          aria-label={segmentAriaLabel(index + 1)}
          value={segment}
          onChange={(event) => {
            handleSegmentChange(index, event.target.value);
          }}
          onKeyDown={(event) => {
            handleKeyDown(index, event.key);
          }}
          onPaste={(event) => {
            event.preventDefault();
            handlePaste(event.clipboardData.getData('text'));
          }}
        />
      ))}
    </div>
  );
}

function emptyPaymentMethodCreateInput(): PaymentMethodCreateInput {
  return {
    type: 'card',
    cardholderName: '',
    cardNumber: '',
    cvv: '',
    expMonth: 1,
    expYear: new Date().getFullYear(),
  };
}

function emptyPaymentMethodUpdateInput(method: PaymentMethod): PaymentMethodUpdateInput {
  return {
    type: 'card',
    cardholderName: method.cardholderName ?? '',
    expMonth: method.expMonth ?? 1,
    expYear: method.expYear ?? new Date().getFullYear(),
  };
}

function PaymentMethodCreateDialog({
  state,
  onSaved,
}: {
  state: ReturnType<typeof useOverlayState>;
  onSaved: () => void;
}) {
  const t = useTranslations('account.paymentDetails');
  const tRoot = useTranslations();
  const create = useCreatePaymentMethod();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<PaymentMethodCreateInput>({
    resolver: zodResolver(paymentMethodCreateInputSchema),
    defaultValues: emptyPaymentMethodCreateInput(),
  });

  function onSubmit(values: PaymentMethodCreateInput) {
    create.mutate(values, {
      onSuccess: () => {
        toast.success(t('paymentMethodCreated'));
        state.close();
        reset(emptyPaymentMethodCreateInput());
        onSaved();
      },
    });
  }

  const err = (key: keyof PaymentMethodCreateInput) => {
    const message = errors[key]?.message;
    if (!message) return undefined;
    return message.startsWith('validation.') ? tRoot(message) : message;
  };

  return (
    <ModalRoot state={state}>
      <ModalBackdrop isDismissable>
        <ModalContainer size="md">
          <ModalDialog>
            <ModalHeader>
              <ModalHeading>{t('addPaymentMethodTitle')}</ModalHeading>
            </ModalHeader>
            <ModalBody>
              <div className="flex flex-col gap-6">
                <Field
                  id="cardholderName"
                  label={t('cardholderName')}
                  error={err('cardholderName')}
                >
                  <Input
                    id="cardholderName"
                    variant="secondary"
                    fullWidth
                    autoComplete="cc-name"
                    {...register('cardholderName')}
                  />
                </Field>
                <Field id="cardNumber" label={t('cardNumber')} error={err('cardNumber')}>
                  <Controller
                    name="cardNumber"
                    control={control}
                    render={({ field }) => (
                      <CardNumberSegmentFields
                        value={field.value}
                        onChange={field.onChange}
                        segmentAriaLabel={(part) => t('cardNumberSegment', { part })}
                      />
                    )}
                  />
                </Field>
                <div className="grid grid-cols-3 gap-3">
                  <Field id="cardExpMonth" label={t('cardExpMonth')} error={err('expMonth')}>
                    <Input
                      id="cardExpMonth"
                      type="number"
                      min={1}
                      max={12}
                      variant="secondary"
                      fullWidth
                      autoComplete="cc-exp-month"
                      placeholder="MM"
                      {...register('expMonth', { valueAsNumber: true })}
                    />
                  </Field>
                  <Field id="cardExpYear" label={t('cardExpYear')} error={err('expYear')}>
                    <Input
                      id="cardExpYear"
                      type="number"
                      min={new Date().getFullYear()}
                      variant="secondary"
                      fullWidth
                      autoComplete="cc-exp-year"
                      placeholder="YYYY"
                      {...register('expYear', { valueAsNumber: true })}
                    />
                  </Field>
                  <Field id="cardCvv" label={t('cardCvv')} error={err('cvv')}>
                    <Input
                      id="cardCvv"
                      variant="secondary"
                      fullWidth
                      inputMode="numeric"
                      autoComplete="cc-csc"
                      maxLength={4}
                      placeholder="123"
                      {...register('cvv')}
                    />
                  </Field>
                </div>
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
                isDisabled={create.isPending}
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

function PaymentMethodEditDialog({
  state,
  method,
  onSaved,
}: {
  state: ReturnType<typeof useOverlayState>;
  method: PaymentMethod;
  onSaved: () => void;
}) {
  const t = useTranslations('account.paymentDetails');
  const tRoot = useTranslations();
  const update = useUpdatePaymentMethod();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PaymentMethodUpdateInput>({
    resolver: zodResolver(paymentMethodUpdateInputSchema),
    values: emptyPaymentMethodUpdateInput(method),
  });

  function onSubmit(values: PaymentMethodUpdateInput) {
    update.mutate(
      { id: method.id, input: values },
      {
        onSuccess: () => {
          toast.success(t('paymentMethodUpdated'));
          state.close();
          reset(emptyPaymentMethodUpdateInput(method));
          onSaved();
        },
      }
    );
  }

  const err = (key: keyof PaymentMethodUpdateInput) => {
    const message = errors[key]?.message;
    if (!message) return undefined;
    return message.startsWith('validation.') ? tRoot(message) : message;
  };

  const maskedNumber =
    method.brand && method.last4
      ? `${formatCardBrand(method.brand)} •••• ${method.last4}`
      : method.label;

  return (
    <ModalRoot state={state}>
      <ModalBackdrop isDismissable>
        <ModalContainer size="md">
          <ModalDialog>
            <ModalHeader>
              <ModalHeading>{t('editPaymentMethodTitle')}</ModalHeading>
            </ModalHeader>
            <ModalBody>
              <div className="flex flex-col gap-6">
                <Field id="cardNumberReadonly" label={t('cardNumber')}>
                  <p id="cardNumberReadonly" className="text-foreground text-sm font-medium">
                    {maskedNumber}
                  </p>
                </Field>
                <Field
                  id="cardholderNameEdit"
                  label={t('cardholderName')}
                  error={err('cardholderName')}
                >
                  <Input
                    id="cardholderNameEdit"
                    variant="secondary"
                    fullWidth
                    autoComplete="cc-name"
                    {...register('cardholderName')}
                  />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field id="cardExpMonthEdit" label={t('cardExpMonth')} error={err('expMonth')}>
                    <Input
                      id="cardExpMonthEdit"
                      type="number"
                      min={1}
                      max={12}
                      variant="secondary"
                      fullWidth
                      autoComplete="cc-exp-month"
                      placeholder="MM"
                      {...register('expMonth', { valueAsNumber: true })}
                    />
                  </Field>
                  <Field id="cardExpYearEdit" label={t('cardExpYear')} error={err('expYear')}>
                    <Input
                      id="cardExpYearEdit"
                      type="number"
                      min={new Date().getFullYear()}
                      variant="secondary"
                      fullWidth
                      autoComplete="cc-exp-year"
                      placeholder="YYYY"
                      {...register('expYear', { valueAsNumber: true })}
                    />
                  </Field>
                </div>
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
                isDisabled={update.isPending}
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

function PaymentMethodDialog({
  state,
  method,
  onSaved,
}: {
  state: ReturnType<typeof useOverlayState>;
  method: PaymentMethod | null;
  onSaved: () => void;
}) {
  if (method) {
    return <PaymentMethodEditDialog state={state} method={method} onSaved={onSaved} />;
  }

  return <PaymentMethodCreateDialog state={state} onSaved={onSaved} />;
}

export function PaymentDetailsSection() {
  const t = useTranslations('account.paymentDetails');
  const tFooter = useTranslations('footer');
  const addresses = useAddresses();
  const paymentMethods = usePaymentMethods();
  const deleteAddress = useDeleteAddress();
  const deletePaymentMethod = useDeletePaymentMethod();

  const addressDrawer = useOverlayState();
  const paymentMethodDrawer = useOverlayState();
  const deleteAddressConfirm = useOverlayState();
  const deletePaymentMethodConfirm = useOverlayState();

  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [addressPendingDelete, setAddressPendingDelete] = useState<Address | null>(null);
  const [methodPendingDelete, setMethodPendingDelete] = useState<PaymentMethod | null>(null);

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

  function handleDeletePaymentMethod() {
    if (!methodPendingDelete) return;
    deletePaymentMethod.mutate(methodPendingDelete.id, {
      onSuccess: () => {
        toast.success(t('paymentMethodDeleted'));
        deletePaymentMethodConfirm.close();
      },
    });
  }

  return (
    <>
      <div className="divide-border flex min-h-0 flex-1 flex-col divide-y lg:flex-row lg:divide-x lg:divide-y-0">
        <div className="divide-border flex min-h-0 min-w-0 flex-1 flex-col divide-y">
          <AccountSection
            title={t('paymentMethodsTitle')}
            className="gap-6"
            contentClassName="gap-6"
            action={
              <Button
                variant="outline"
                size="sm"
                onPress={() => {
                  setEditingMethod(null);
                  paymentMethodDrawer.open();
                }}
              >
                <Plus size={14} aria-hidden />
                {t('addPaymentMethod')}
              </Button>
            }
          >
            <DataState
              isLoading={paymentMethods.isLoading}
              isError={paymentMethods.isError}
              onRetry={() => void paymentMethods.refetch()}
            >
              {paymentMethods.data && paymentMethods.data.length === 0 ? (
                <EmptyState message={t('paymentMethodsEmpty')} />
              ) : (
                <div className="flex flex-col gap-4">
                  {paymentMethods.data?.map((method) => (
                    <PaymentMethodCardItem
                      key={method.id}
                      method={method}
                      onEdit={() => {
                        setEditingMethod(method);
                        paymentMethodDrawer.open();
                      }}
                      onDelete={() => {
                        setMethodPendingDelete(method);
                        deletePaymentMethodConfirm.open();
                      }}
                    />
                  ))}
                </div>
              )}
            </DataState>
          </AccountSection>

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
      <PaymentMethodDialog
        state={paymentMethodDrawer}
        method={editingMethod}
        onSaved={() => {
          setEditingMethod(null);
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
      <ConfirmDialog
        state={deletePaymentMethodConfirm}
        title={t('deletePaymentMethodTitle')}
        body={t('deletePaymentMethodBody')}
        confirmLabel={t('deletePaymentMethodConfirm')}
        cancelLabel={t('drawerCancel')}
        onConfirm={handleDeletePaymentMethod}
        isPending={deletePaymentMethod.isPending}
      />
    </>
  );
}
