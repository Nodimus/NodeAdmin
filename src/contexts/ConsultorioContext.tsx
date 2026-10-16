import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { Consultorio } from '../types';
import { consultorioService } from '../services/consultorio.service';
import { INITIAL_CONSULTORIO } from '../services/storage-local';

interface ConsultorioContextType {
  consultorio: Consultorio;
  loading: boolean;
  atualizarConsultorio: (dados: Partial<Omit<Consultorio, 'id'>>) => Promise<Consultorio>;
}

const ConsultorioContext = createContext<ConsultorioContextType | undefined>(undefined);

export const ConsultorioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [consultorio, setConsultorio] = useState<Consultorio>(INITIAL_CONSULTORIO);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = consultorioService.subscribe((dados) => {
      setConsultorio(dados);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const atualizarConsultorio = async (dados: Partial<Omit<Consultorio, 'id'>>) => {
    const atualizado = await consultorioService.atualizarDados(dados);
    setConsultorio(atualizado);
    return atualizado;
  };

  const value = useMemo(
    () => ({
      consultorio,
      loading,
      atualizarConsultorio,
    }),
    [consultorio, loading]
  );

  return (
    <ConsultorioContext.Provider value={value}>
      {children}
    </ConsultorioContext.Provider>
  );
};

export const useConsultorio = (): ConsultorioContextType => {
  const context = useContext(ConsultorioContext);
  if (!context) {
    throw new Error('useConsultorio deve ser utilizado dentro de um ConsultorioProvider');
  }
  return context;
};
