'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  useDocuments,
  resolveDocumentSite,
  uniqueDocumentsBySite,
  type GeneratedDocument,
} from '@/api/documents';
import { useEuRepContracts, useLinkEuRepDocuments } from '@/api/eu-rep';
import {
  Button,
  Checkbox,
  CheckboxContent,
  CheckboxControl,
  CheckboxIndicator,
  ModalBackdrop,
  ModalBody,
  ModalContainer,
  ModalDialog,
  ModalFooter,
  ModalHeader,
  ModalHeading,
  ModalRoot,
  Spinner,
  useOverlayState,
} from '@/components/ui';

type OverlayState = ReturnType<typeof useOverlayState>;

function isUnlinked(document: GeneratedDocument): boolean {
  return !document.euRepContractId;
}

export function EuRepLinkPoliciesDialog({
  state,
  contractId,
  linkedDocumentIds,
  onLinked,
  closeOnComplete = true,
}: {
  state: OverlayState;
  contractId: string;
  linkedDocumentIds: readonly string[];
  onLinked?: () => void;
  /** When false, the parent keeps the dialog open (queued multi-contract linking). */
  closeOnComplete?: boolean;
}) {
  const t = useTranslations('account.euRep.contract');
  const tCommon = useTranslations('common');
  const documents = useDocuments();
  const contracts = useEuRepContracts();
  const link = useLinkEuRepDocuments();
  const contract = (contracts.data ?? []).find((row) => row.id === contractId);
  const linkedIds = useMemo(() => new Set(linkedDocumentIds), [linkedDocumentIds]);
  const unlinked = useMemo(
    () => (documents.data ?? []).filter((doc) => isUnlinked(doc) && !linkedIds.has(doc.id)),
    [documents.data, linkedIds]
  );
  const linkable = useMemo(
    () =>
      uniqueDocumentsBySite(unlinked).sort((a, b) =>
        resolveDocumentSite(a).localeCompare(resolveDocumentSite(b))
      ),
    [unlinked]
  );
  const [selected, setSelected] = useState<string[]>([]);
  const [wasOpen, setWasOpen] = useState(state.isOpen);
  const [activeContractId, setActiveContractId] = useState(contractId);
  if (state.isOpen !== wasOpen) {
    setWasOpen(state.isOpen);
    if (state.isOpen) {
      setSelected([]);
    }
  }
  if (contractId !== activeContractId) {
    setActiveContractId(contractId);
    setSelected([]);
  }

  function toggle(id: string, checked: boolean) {
    setSelected((current) =>
      checked ? [...current, id] : current.filter((value) => value !== id)
    );
  }

  function finish() {
    setSelected([]);
    if (closeOnComplete) {
      state.close();
    }
    onLinked?.();
  }

  async function handleLink() {
    if (selected.length === 0) return;
    try {
      await link.mutateAsync({ contractId, documentIds: selected });
      toast.success(t('linkedCount', { count: selected.length }));
      finish();
    } catch {
      toast.error(t('linkFailed'));
    }
  }

  return (
    <ModalRoot state={state}>
      <ModalBackdrop isDismissable={!onLinked}>
        <ModalContainer size="lg">
          <ModalDialog>
            <ModalHeader>
              <ModalHeading>
                {contract?.legalEntity
                  ? t('linkTitleForEntity', { entity: contract.legalEntity })
                  : t('linkTitle')}
              </ModalHeading>
            </ModalHeader>
            <ModalBody>
              <p className="text-foreground text-sm leading-relaxed">{t('linkBody')}</p>
              {documents.isLoading ? (
                <div className="flex justify-center py-8">
                  <Spinner aria-label={tCommon('loading')} />
                </div>
              ) : linkable.length === 0 ? (
                <p className="text-foreground text-sm">{t('linkEmpty')}</p>
              ) : (
                <ul className="mt-4 flex flex-col gap-3">
                  {linkable.map((document) => {
                    const site = resolveDocumentSite(document);
                    const checked = selected.includes(document.id);
                    return (
                      <li key={document.id}>
                        <Checkbox
                          variant="secondary"
                          isSelected={checked}
                          onChange={(value) => {
                            toggle(document.id, value);
                          }}
                        >
                          <CheckboxControl>
                            <CheckboxIndicator />
                          </CheckboxControl>
                          <CheckboxContent>
                            <span className="text-foreground font-medium">{site}</span>
                          </CheckboxContent>
                        </Checkbox>
                      </li>
                    );
                  })}
                </ul>
              )}
            </ModalBody>
            <ModalFooter>
              <Button
                variant="outline"
                onPress={() => {
                  finish();
                }}
              >
                {t('linkSkip')}
              </Button>
              <Button
                variant="primary"
                isDisabled={selected.length === 0 || link.isPending}
                onPress={() => {
                  void handleLink();
                }}
              >
                {t('linkConfirm')}
              </Button>
            </ModalFooter>
          </ModalDialog>
        </ModalContainer>
      </ModalBackdrop>
    </ModalRoot>
  );
}
