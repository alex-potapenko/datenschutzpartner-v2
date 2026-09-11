'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  useAddPolicyService,
  useRequestPolicyService,
  useSetPolicyServiceHidden,
  useWithdrawPolicyServiceRequest,
  type PolicyMaintenanceState,
  type PolicyService,
} from '@/api/policy-updates';
import { POLICY_SERVICE_CATALOG } from '@/lib/policy-services/catalog';
import { ServiceLogo } from '@/components/shared/ServiceLogo';
import { serviceNameFromDomain } from '@/lib/logo-dev';
import { extractDomainHost, isValidDomainHost } from '@/lib/validation/url';
import { StatusPill } from '@/components/shared/StatusPill';
import { Field, TextInput } from '@/app/result/ui/FormSection';
import {
  Button,
  ChatTeardropText,
  CheckCircle,
  Cube,
  Plus,
  ModalRoot,
  ModalBackdrop,
  ModalContainer,
  ModalDialog,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalHeading,
  SearchField,
  useOverlayState,
} from '@/components/ui';
import { InfoTooltip } from '@/components/shared/InfoTooltip';
import { AccountSection, EmptyState, useDateFormatter } from '../../account-ui';

type OverlayState = ReturnType<typeof useOverlayState>;

function ServiceRow({ service, documentId }: { service: PolicyService; documentId: string }) {
  const t = useTranslations('account.policyUpdates');
  const setHidden = useSetPolicyServiceHidden(documentId);

  return (
    <li className="flex items-center justify-between gap-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <ServiceLogo
          name={service.name}
          logoDomain={service.logoDomain}
          catalogId={service.catalogId}
        />
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span
            className={
              service.hidden
                ? 'text-muted text-sm font-medium line-through'
                : 'text-foreground text-sm font-medium'
            }
          >
            {service.name}
          </span>
          {service.hidden ? (
            <StatusPill tone="neutral">{t('services.hiddenBadge')}</StatusPill>
          ) : null}
          {!service.detected ? (
            <StatusPill tone="neutral">{t('services.manualBadge')}</StatusPill>
          ) : null}
        </div>
      </div>

      <Button
        variant="outline"
        size="sm"
        className="shrink-0 gap-2"
        isDisabled={setHidden.isPending}
        onPress={() => {
          setHidden.mutate(
            { serviceId: service.id, hidden: !service.hidden },
            {
              onSuccess: () => {
                toast.success(service.hidden ? t('services.restored') : t('services.hidden'));
              },
            }
          );
        }}
      >
        {service.hidden ? t('services.restore') : t('services.hide')}
      </Button>
    </li>
  );
}

function AddServiceDialog({
  state,
  documentId,
  services,
}: {
  state: OverlayState;
  documentId: string;
  services: PolicyService[];
}) {
  const t = useTranslations('account.policyUpdates');
  const tCommon = useTranslations('common');
  const addService = useAddPolicyService(documentId);
  const [query, setQuery] = useState('');

  /* Only services that are not already part of the policy can be added. */
  const activeCatalogIds = useMemo(
    () => new Set(services.filter((row) => !row.hidden).map((row) => row.catalogId)),
    [services]
  );

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return POLICY_SERVICE_CATALOG.filter((entry) => {
      if (activeCatalogIds.has(entry.id)) return false;
      if (!needle) return true;
      return entry.name.toLowerCase().includes(needle);
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [activeCatalogIds, query]);

  return (
    <ModalRoot state={state}>
      <ModalBackdrop isDismissable>
        <ModalContainer size="md">
          <ModalDialog>
            <ModalHeader>
              <ModalHeading>{t('services.addDialogTitle')}</ModalHeading>
            </ModalHeader>
            <ModalBody>
              <div className="flex flex-col gap-5">
                <p className="text-foreground text-sm leading-relaxed">
                  {t('services.addDialogBody')}
                </p>

                <div className="border-border flex h-[340px] flex-col overflow-hidden rounded-xl border">
                  <div className="border-border shrink-0 border-b p-3">
                    <SearchField
                      aria-label={tCommon('search')}
                      value={query}
                      onChange={setQuery}
                      variant="secondary"
                      fullWidth
                    >
                      <SearchField.Group>
                        <SearchField.SearchIcon />
                        <SearchField.Input placeholder={tCommon('search')} />
                        <SearchField.ClearButton />
                      </SearchField.Group>
                    </SearchField>
                  </div>

                  {matches.length === 0 ? (
                    <p className="text-muted flex flex-1 items-center justify-center px-4 text-center text-sm leading-relaxed">
                      {t('services.addEmpty')}
                    </p>
                  ) : (
                    <ul className="divide-border flex min-h-0 flex-1 flex-col divide-y overflow-y-auto">
                      {matches.map((entry) => (
                        <li
                          key={entry.id}
                          className="flex items-center justify-between gap-4 px-4 py-3"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <ServiceLogo
                              name={entry.name}
                              logoDomain={entry.logoDomain}
                              catalogId={entry.id}
                            />
                            <div className="flex min-w-0 flex-col">
                              <span className="text-foreground text-sm font-medium">
                                {entry.name}
                              </span>
                              <span className="text-muted text-xs">
                                {t(`services.categories.${entry.categoryId}`)}
                              </span>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="shrink-0 gap-2"
                            isDisabled={addService.isPending}
                            onPress={() => {
                              addService.mutate(entry.id, {
                                onSuccess: () => {
                                  toast.success(t('services.added', { name: entry.name }));
                                },
                              });
                            }}
                          >
                            <Plus size={14} weight="bold" aria-hidden />
                            {t('services.addCta')}
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
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
                {t('services.close')}
              </Button>
            </ModalFooter>
          </ModalDialog>
        </ModalContainer>
      </ModalBackdrop>
    </ModalRoot>
  );
}

function RequestServiceDialog({ state, documentId }: { state: OverlayState; documentId: string }) {
  const t = useTranslations('account.policyUpdates');
  const tCommon = useTranslations('common');
  const requestService = useRequestPolicyService(documentId);
  const [editedName, setEditedName] = useState('');
  const [url, setUrl] = useState('');
  const [note, setNote] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [nameEdited, setNameEdited] = useState(false);

  const logoDomain = useMemo(() => {
    const host = extractDomainHost(url);
    return isValidDomainHost(host) ? host : undefined;
  }, [url]);

  const suggestedName = useMemo(
    () => (logoDomain ? serviceNameFromDomain(logoDomain) : ''),
    [logoDomain]
  );
  const name = nameEdited ? editedName : suggestedName;

  function reset() {
    setEditedName('');
    setUrl('');
    setNote('');
    setSubmitted(false);
    setNameEdited(false);
  }

  function close() {
    reset();
    state.close();
  }

  const dialogState = {
    ...state,
    setOpen: (open: boolean) => {
      if (!open) reset();
      state.setOpen(open);
    },
    close,
  };

  return (
    <ModalRoot state={dialogState}>
      <ModalBackdrop isDismissable>
        <ModalContainer size="md">
          <ModalDialog>
            <ModalHeader>
              <ModalHeading>
                {submitted
                  ? t('services.requestConfirmationTitle')
                  : t('services.requestDialogTitle')}
              </ModalHeading>
            </ModalHeader>
            <ModalBody>
              {submitted ? (
                <div className="flex flex-col items-start gap-4 py-4">
                  <span className="bg-success-soft flex size-14 items-center justify-center rounded-2xl">
                    <CheckCircle size={28} weight="fill" className="text-success" aria-hidden />
                  </span>
                  <p className="text-foreground text-sm leading-relaxed">
                    {t('services.requestConfirmationBody')}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-5">
                  <p className="text-foreground text-sm leading-relaxed">
                    {t('services.requestDialogBody')}
                  </p>

                  <div className="flex flex-col gap-6">
                    {logoDomain ? (
                      <ServiceLogo name={name || suggestedName} logoDomain={logoDomain} size={64} />
                    ) : (
                      <span
                        className="bg-accent-soft flex size-16 shrink-0 items-center justify-center rounded-2xl"
                        aria-hidden
                      >
                        <Cube size={36} weight="fill" className="text-accent" />
                      </span>
                    )}

                    <Field label={t('services.requestUrl')}>
                      <TextInput
                        value={url}
                        placeholder="https://"
                        onChange={(event) => {
                          setUrl(event.target.value);
                        }}
                      />
                    </Field>
                  </div>

                  <Field label={t('services.requestName')}>
                    <TextInput
                      value={name}
                      onChange={(event) => {
                        setNameEdited(true);
                        setEditedName(event.target.value);
                      }}
                    />
                  </Field>

                  <Field label={t('services.requestNote')}>
                    <TextInput
                      value={note}
                      onChange={(event) => {
                        setNote(event.target.value);
                      }}
                    />
                  </Field>
                </div>
              )}
            </ModalBody>
            <ModalFooter>
              {submitted ? (
                <Button variant="primary" onPress={close}>
                  {t('services.done')}
                </Button>
              ) : (
                <>
                  <Button variant="outline" onPress={close}>
                    {tCommon('cancel')}
                  </Button>
                  <Button
                    variant="primary"
                    isDisabled={name.trim() === '' || requestService.isPending}
                    onPress={() => {
                      requestService.mutate(
                        { name, url, note },
                        {
                          onSuccess: () => {
                            setSubmitted(true);
                          },
                        }
                      );
                    }}
                  >
                    {t('services.requestCta')}
                  </Button>
                </>
              )}
            </ModalFooter>
          </ModalDialog>
        </ModalContainer>
      </ModalBackdrop>
    </ModalRoot>
  );
}

function PendingServiceRequestRow({
  row,
  documentId,
}: {
  row: PolicyMaintenanceState['serviceRequests'][number];
  documentId: string;
}) {
  const t = useTranslations('account.policyUpdates');
  const formatDate = useDateFormatter();
  const withdraw = useWithdrawPolicyServiceRequest(documentId);
  const logoDomain = useMemo(() => {
    if (!row.url) return undefined;
    const host = extractDomainHost(row.url);
    return isValidDomainHost(host) ? host : undefined;
  }, [row.url]);

  return (
    <li className="flex items-center justify-between gap-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <ServiceLogo name={row.name} logoDomain={logoDomain} fallback="requested" />
        <div className="flex min-w-0 flex-col">
          <span className="text-foreground text-sm font-medium">{row.name}</span>
          <span className="text-muted text-xs">{formatDate(row.requestedDate)}</span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <StatusPill tone="warning">{t(`services.requestStatus.${row.status}`)}</StatusPill>
        {row.status === 'pending' ? (
          <Button
            variant="outline"
            size="sm"
            className="shrink-0"
            isDisabled={withdraw.isPending}
            onPress={() => {
              withdraw.mutate(row.id, {
                onSuccess: () => {
                  toast.success(t('services.withdrawn'));
                },
                onError: () => {
                  toast.error(t('services.withdrawError'));
                },
              });
            }}
          >
            {t('services.withdraw')}
          </Button>
        ) : null}
      </div>
    </li>
  );
}

export function PolicyServicesSection({ state }: { state: PolicyMaintenanceState }) {
  const t = useTranslations('account.policyUpdates');
  const addDialog = useOverlayState();
  const requestDialog = useOverlayState();
  const services = useMemo(
    () => [...state.services].sort((a, b) => a.name.localeCompare(b.name)),
    [state.services]
  );

  return (
    <AccountSection
      className="pb-0"
      title={t('services.title')}
      titleAside={<InfoTooltip label={t('services.title')}>{t('services.body')}</InfoTooltip>}
      action={
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onPress={() => {
              addDialog.open();
            }}
          >
            <Plus size={14} weight="bold" aria-hidden />
            {t('services.add')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onPress={() => {
              requestDialog.open();
            }}
          >
            <ChatTeardropText size={14} weight="bold" aria-hidden />
            {t('services.request')}
          </Button>
        </div>
      }
      contentClassName="gap-6"
    >
      {services.length === 0 ? (
        <EmptyState message={t('services.empty')} />
      ) : (
        <ul className="divide-border flex flex-col divide-y">
          {services.map((service) => (
            <ServiceRow key={service.id} service={service} documentId={state.documentId} />
          ))}
        </ul>
      )}

      {state.serviceRequests.length > 0 ? (
        <div className="flex flex-col gap-1">
          <h3 className="font-display text-muted text-xs font-semibold tracking-wide uppercase">
            {t('services.pendingRequests')}
          </h3>
          <ul className="divide-border flex flex-col divide-y">
            {state.serviceRequests.map((row) => (
              <PendingServiceRequestRow key={row.id} row={row} documentId={state.documentId} />
            ))}
          </ul>
        </div>
      ) : null}

      <AddServiceDialog state={addDialog} documentId={state.documentId} services={state.services} />
      <RequestServiceDialog state={requestDialog} documentId={state.documentId} />
    </AccountSection>
  );
}
