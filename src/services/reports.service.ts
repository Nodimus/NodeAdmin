export interface RelatorioItem {
  id: string;
  titulo: string;
  descricao: string;
  permissao: string;
  temDadosPacientes: boolean;
  filtrosSuportados: string[];
}

export interface RelatorioDados {
  id: string;
  titulo: string;
  descricao: string;
  permissao: string;
  temDadosPacientes: boolean;
  dataHoraEmissao: string;
  usuarioEmissor: string;
  filtrosAplicados: { rotulo: string; valor: string }[];
  colunas: string[];
  linhas: (string | number)[][];
  totais: { rotulo: string; valor: string }[];
  consultorio: {
    razaoSocial: string;
    nomeFantasia: string;
    cnpj?: string;
    registroProfissional?: string;
    responsavelTecnico?: string;
    telefone?: string;
    whatsapp?: string;
    email?: string;
    endereco?: {
      logradouro: string;
      numero: string;
      complemento?: string;
      bairro: string;
      cidade: string;
      uf: string;
      cep: string;
    };
    logoUrl?: string;
    textoRodapeRelatorio?: string;
  };
}

export const reportsService = {
  async getCatalogo(): Promise<RelatorioItem[]> {
    const res = await fetch('/api/admin/relatorios', {
      headers: {
        'Accept': 'application/json',
      },
    });
    if (!res.ok) {
      throw new Error('Falha ao carregar catálogo de relatórios disponíveis.');
    }
    const data = await res.json();
    return data.relatorios || [];
  },

  async getDados(tipo: string, params: Record<string, string | undefined>): Promise<RelatorioDados> {
    const query = new URLSearchParams({ tipo });
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== '' && val !== 'todos') {
        query.append(key, val);
      }
    });

    const res = await fetch(`/api/admin/relatorios/dados?${query.toString()}`, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erro ao gerar dados do relatório.');
    }

    const data = await res.json();
    return data.relatorio;
  },
};
