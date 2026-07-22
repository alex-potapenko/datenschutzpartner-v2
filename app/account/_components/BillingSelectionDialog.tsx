'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useAddresses } from '@/api/account';
import { useUpdateSubscriptionBilling, type Subscription } from '@/api/billing';
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
import { DataState, EmptyState } from './account-ui';

type OverlayState = ReturnType<typeof useOverlayState>;

/**
 * Lets a member pick which saved billing address applies to a given
 * subscription. Selection only — CRUD on the underlying addresses happens
 * exclusively in Account Details → Billing Addresses. Payments themselves run
 * through Payrexx, so there is no card selection here.
 */
export function BillingSelectionDialog({
  state,
  subscription,
  onManage,
}: {
  state: OverlayState;
  subscription: Subscription;
  onManage?: () => void;
}) {
  const t = useTranslations('account.billingSelection');
  const tCommon = useTranslations('common');
  const addresses = useAddresses();
  const update = useUpdateSubscriptionBilling();

  const [selectedId, setSelectedId] = useState<string | undefined>(subscription.billingAddressId);

  // Re-sync the selection to the subscription's current pick whenever the
  // dialog transitions into the open state (adjusting state during render —
  // see https://react.dev/learn/you-might-not-need-an-effect).
  const [wasOpen, setWasOpen] = useState(state.isOpen);
  if (state.isOpen !== wasOpen) {
    setWasOpen(state.isOpen);
    if (state.isOpen) {
      setSelectedId(subscription.billingAddressId);
    }
  }

  const billingAddresses = addresses.data?.filter((address) => address.type === 'billing') ?? [];

  function handleConfirm() {
    if (!selectedId) return;
    update.mutate(
      { id: subscription.id, input: { billingAddressId: selectedId } },
      {
        onSuccess: () => {
          toast.success(t('saved'));
          state.close();
        },
      }
    );
  }

  return (
    <ModalRoot state={state}>
      <ModalBackdrop isDismissable>
        <ModalContainer size="md">
          <ModalDialog>
            <ModalHeader>
              <ModalHeading>{t('addressTitle')}</ModalHeading>
            </ModalHeader>
            <ModalBody>
              <DataState
                isLoading={addresses.isLoading}
                isError={addresses.isError}
                onRetry={() => void addresses.refetch()}
              >
                {billingAddresses.length === 0 ? (
                  <EmptyState message={t('addressEmpty')} />
                ) : (
                  <div
                    role="radiogroup"
                    aria-label={t('addressTitle')}
                    className="flex flex-col gap-3"
                  >
                    {billingAddresses.map((address) => (
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
