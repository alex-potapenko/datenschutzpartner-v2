'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useAddresses } from '@/api/account';
import { usePaymentMethods, useUpdateSubscriptionBilling, type Subscription } from '@/api/billing';
import {
  Button,
  ModalRoot,
  ModalBackdrop,
  ModalContainer,
  ModalDialog,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalHeading,
  useOverlayState,
} from '@/components/ui';
import { AddressItem } from '@/components/shared/AddressItem';
import { NavigationLink } from '@/components/shared/NavigationLink';
import { PaymentItem } from '@/components/shared/PaymentItem';
import { DataState, EmptyState } from './account-ui';

type OverlayState = ReturnType<typeof useOverlayState>;
export type BillingSelectionKind = 'paymentMethod' | 'billingAddress';

function formatCardBrand(brand: string) {
  return brand.charAt(0).toUpperCase() + brand.slice(1).toLowerCase();
}

/**
 * Lets a member pick which saved payment method / billing address applies to
 * a given subscription. Selection only — CRUD on the underlying cards and
 * addresses happens exclusively in Account details → Payment Details.
 */
export function BillingSelectionDialog({
  state,
  kind,
  subscription,
  onManage,
}: {
  state: OverlayState;
  kind: BillingSelectionKind;
  subscription: Subscription;
  onManage?: () => void;
}) {
  const t = useTranslations('account.billingSelection');
  const tCommon = useTranslations('common');
  const paymentMethods = usePaymentMethods();
  const addresses = useAddresses();
  const update = useUpdateSubscriptionBilling();

  const currentId =
    kind === 'paymentMethod' ? subscription.paymentMethodId : subscription.billingAddressId;
  const [selectedId, setSelectedId] = useState<string | undefined>(currentId);

  // Re-sync the selection to the subscription's current billing pick whenever
  // the dialog transitions into the open state (adjusting state during
  // render — see https://react.dev/learn/you-might-not-need-an-effect).
  const [wasOpen, setWasOpen] = useState(state.isOpen);
  if (state.isOpen !== wasOpen) {
    setWasOpen(state.isOpen);
    if (state.isOpen) {
      setSelectedId(currentId);
    }
  }

  const billingAddresses = addresses.data?.filter((address) => address.type === 'billing') ?? [];

  function handleConfirm() {
    if (!selectedId) return;
    update.mutate(
      {
        id: subscription.id,
        input:
          kind === 'paymentMethod'
            ? { paymentMethodId: selectedId }
            : { billingAddressId: selectedId },
      },
      {
        onSuccess: () => {
          toast.success(t('saved'));
          state.close();
        },
      }
    );
  }

  const isLoading = kind === 'paymentMethod' ? paymentMethods.isLoading : addresses.isLoading;
  const isError = kind === 'paymentMethod' ? paymentMethods.isError : addresses.isError;
  const isEmpty =
    kind === 'paymentMethod' ? paymentMethods.data?.length === 0 : billingAddresses.length === 0;
  const title = kind === 'paymentMethod' ? t('paymentTitle') : t('addressTitle');

  return (
    <ModalRoot state={state}>
      <ModalBackdrop isDismissable>
        <ModalContainer size="md">
          <ModalDialog>
            <ModalHeader>
              <ModalHeading>{title}</ModalHeading>
            </ModalHeader>
            <ModalBody>
              <DataState
                isLoading={isLoading}
                isError={isError}
                onRetry={() => {
                  if (kind === 'paymentMethod') void paymentMethods.refetch();
                  else void addresses.refetch();
                }}
              >
                {isEmpty ? (
                  <EmptyState
                    message={kind === 'paymentMethod' ? t('paymentEmpty') : t('addressEmpty')}
                  />
                ) : (
                  <div role="radiogroup" aria-label={title} className="flex flex-col gap-3">
                    {kind === 'paymentMethod'
                      ? paymentMethods.data?.map((method) => (
                          <PaymentItem
                            key={method.id}
                            isSelected={selectedId === method.id}
                            onSelect={() => {
                              setSelectedId(method.id);
                            }}
                            brand={method.brand}
                            title={
                              method.brand
                                ? `${formatCardBrand(method.brand)} •••• ${method.last4 ?? ''}`
                                : method.label
                            }
                            subtitle={
                              method.expMonth != null && method.expYear != null
                                ? t('cardExpires', {
                                    month: String(method.expMonth).padStart(2, '0'),
                                    year: String(method.expYear),
                                  })
                                : undefined
                            }
                          />
                        ))
                      : billingAddresses.map((address) => (
                          <AddressItem
                            key={address.id}
                            isSelected={selectedId === address.id}
                            onSelect={() => {
                              setSelectedId(address.id);
                            }}
                            title={address.label ?? `${address.firstName} ${address.lastName}`}
                            line={`${address.line1}, ${address.postalCode} ${address.city}`}
                          />
                        ))}
                  </div>
                )}
              </DataState>

              {onManage ? (
                <div className="pt-4">
                  <NavigationLink
                    onPress={() => {
                      state.close();
                      onManage();
                    }}
                    size="sm"
                  >
                    {t('manageLink')}
                  </NavigationLink>
                </div>
              ) : null}
            </ModalBody>
            <ModalFooter>
              <Button
                variant="outline"
                onPress={() => {
                  state.close();
                }}
              >
                {tCommon('cancel')}
              </Button>
              <Button
                variant="primary"
                isDisabled={!selectedId || update.isPending}
                onPress={handleConfirm}
              >
                {t('confirm')}
              </Button>
            </ModalFooter>
          </ModalDialog>
        </ModalContainer>
      </ModalBackdrop>
    </ModalRoot>
  );
}
