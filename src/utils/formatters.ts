/**
 * Utilitários de Formatação — Padrão Brasil (pt-BR, Fuso America/Sao_Paulo, Centavos Inteiros e dd/mm/aaaa)
 */

/**
 * Converte valor em centavos inteiros (ex: 18000) para formato monetário BRL ("R$ 180,00")
 */
export function formatCurrencyFromCents(cents: number): string {
  const reais = (cents || 0) / 100;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(reais);
}

/**
 * Converte valor digitado (ex: "180,50" ou 180.5) para centavos inteiros (18050)
 */
export function parseToCents(val: number | string): number {
  if (typeof val === 'number') {
    return Math.round(val * 100);
  }
  if (!val) return 0;
  const clean = val.replace(/[^\d,-]/g, '').replace(',', '.');
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : Math.round(num * 100);
}

/**
 * Converte data ISO ou YYYY-MM-DD para dd/mm/aaaa
 */
export function formatDateBR(dateStr?: string): string {
  if (!dateStr) return '';
  if (dateStr.includes('/')) return dateStr; // Já formatado
  const parts = dateStr.split('T')[0].split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
  }
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  } catch {
    return dateStr;
  }
}

/**
 * Converte dd/mm/aaaa para YYYY-MM-DD para campos <input type="date">
 */
export function parseDateBRToISO(brDate: string): string {
  if (!brDate) return '';
  const parts = brDate.split('/');
  if (parts.length === 3) {
    const [day, month, year] = parts;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  return brDate;
}

/**
 * Formata CPF para o padrão 000.000.000-00
 */
export function formatCPF(cpf?: string): string {
  if (!cpf) return '';
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11) return cpf;
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/**
 * Formata telefone brasileiro para (00) 00000-0000 ou (00) 0000-0000
 */
export function formatPhoneBR(phone?: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11) {
    return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  if (digits.length === 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  return phone;
}
