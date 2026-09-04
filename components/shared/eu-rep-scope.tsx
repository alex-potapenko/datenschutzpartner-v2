'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useEuRepContracts, type EuRepContract } from '@/api/eu-rep';

type EuRepScope = {
  contracts: EuRepContract[];
  activeContract: EuRepContract | null;
  isLoading: boolean;
  selectContract: (id: string) => void;
};

const EuRepScopeContext = createContext<EuRepScope | null>(null);

export function EuRepScopeProvider({
  contractParam,
  onSelectContract,
  children,
}: {
  contractParam: string | null;
  onSelectContract: (id: string) => void;
  children: ReactNode;
}) {
  const contracts = useEuRepContracts();

  const listedContracts = useMemo(() => contracts.data ?? [], [contracts.data]);

  const value = useMemo<EuRepScope>(() => {
    const matched = contractParam
      ? listedContracts.find((row) => row.id === contractParam)
      : undefined;

    return {
      contracts: listedContracts,
      activeContract: matched ?? listedContracts[0] ?? null,
      isLoading: contracts.isLoading,
      selectContract: onSelectContract,
    };
  }, [listedContracts, contractParam, contracts.isLoading, onSelectContract]);

  return <EuRepScopeContext.Provider value={value}>{children}</EuRepScopeContext.Provider>;
}

export function useOptionalEuRepScope(): EuRepScope | null {
  return useContext(EuRepScopeContext);
}

export function useEuRepScope(): EuRepScope {
  const value = useOptionalEuRepScope();
  if (!value) {
    throw new Error('useEuRepScope must be used inside EuRepScopeProvider');
  }
  return value;
}
