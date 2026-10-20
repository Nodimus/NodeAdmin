import {
  SolicitacaoAgendamentoInput,
  HorariosDisponiveisResponse,
  ResultadoAgendamento,
  AgendamentoSite,
} from '../types';

/**
 * Camada de Acesso a Dados para Agendamento Público (Landing Page)
 * Garante que NENHUM componente consulte o banco diretamente e que todas
 * as regras de cálculo de horários livres, unicidade e prevenção de concorrência
 * sejam estritamente executadas no servidor.
 */
class AgendamentoPublicoService {
  private baseUrl = '/api/public';

  /**
   * Consulta horários livres disponíveis calculados no servidor para uma data e serviço
   */
  public async obterHorariosDisponiveis(
    data: string,
    servicoId: string
  ): Promise<HorariosDisponiveisResponse> {
    if (!data || !servicoId) {
      return { data, servicoId, duracaoMin: 30, horarios: [] };
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/horarios-disponiveis?data=${encodeURIComponent(
          data
        )}&servicoId=${encodeURIComponent(servicoId)}`
      );

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.erro || 'Falha ao consultar horários disponíveis no servidor.');
      }

      return json;
    } catch (err: any) {
      console.error('Erro no serviço de horários livres:', err);
      throw err;
    }
  }

  /**
   * Envia a solicitação de agendamento para validação rígida e reserva atômica no servidor
   */
  public async solicitarAgendamento(
    dados: SolicitacaoAgendamentoInput
  ): Promise<ResultadoAgendamento> {
    try {
      const response = await fetch(`${this.baseUrl}/agendamentos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dados),
      });

      const json = await response.json();

      if (!response.ok) {
        const error: any = new Error(json.mensagem || 'Não foi possível concluir o agendamento.');
        error.status = response.status;
        error.isConflict = response.status === 409;
        throw error;
      }

      return json;
    } catch (err: any) {
      console.error('Erro na submissão do agendamento:', err);
      throw err;
    }
  }

  /**
   * Consulta dados resumidos de um agendamento pelo protocolo para exibir na tela de confirmação
   */
  public async consultarPorProtocolo(protocolo: string): Promise<Partial<AgendamentoSite>> {
    try {
      const response = await fetch(
        `${this.baseUrl}/agendamentos/protocolo/${encodeURIComponent(protocolo)}`
      );

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.erro || 'Agendamento não localizado.');
      }

      return json;
    } catch (err: any) {
      console.error('Erro ao consultar agendamento por protocolo:', err);
      throw err;
    }
  }
}

export const agendamentoPublicoService = new AgendamentoPublicoService();
