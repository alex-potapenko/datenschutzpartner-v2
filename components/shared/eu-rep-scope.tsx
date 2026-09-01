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

  const activeContracts = useMemo(
    () => (contracts.data ?? []).filter((row) => row.status === 'active'),
    [contracts.data]
  );

  const value = useMemo<EuRepScope>(() => {
    const matched = contractParam
      ? activeContracts.find((row) => row.id === contractParam)
      : undefined;

    return {
      contracts: activeContracts,
      activeContract: matched ?? activeContracts[0] ?? null,
      isLoading: contracts.isLoading,
      selectContract: onSelectContract,
    };
  }, [activeContracts, contractParam, contracts.isLoading, onSelectContract]);

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
