/**
 * Validadores e formatadores de documentos e contatos brasileiros (CNPJ, CEP, Telefone, E-mail)
 * Conforme exigências de validação em docs/modulos/empresa.md e prompts/06-crud-dados-da-empresa.md
 */

/**
 * Validação algorítmica de CNPJ (14 dígitos com cálculo de dígitos verificadores)
 */
export function validarCNPJ(cnpjStr: string): boolean {
  if (!cnpjStr) return false;
  const digits = cnpjStr.replace(/\D/g, '');

  if (digits.length !== 14) return false;

  // Rejeita sequências de dígitos idênticos (ex: 00000000000000, 11111111111111)
  if (/^(\d)\1{13}$/.test(digits)) return false;

  // Primeiro dígito verificador
  let tamanho = 12;
  let numeros = digits.substring(0, tamanho);
  let soma = 0;
  let pos = tamanho - 7;
  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i), 10) * pos--;
    if (pos < 2) pos = 9;
  }
  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digits.charAt(12), 10)) return false;

  // Segundo dígito verificador
  tamanho = 13;
  numeros = digits.substring(0, tamanho);
  soma = 0;
  pos = tamanho - 7;
  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i), 10) * pos--;
    if (pos < 2) pos = 9;
  }
  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digits.charAt(13), 10)) return false;

  return true;
}

/**
 * Formata CNPJ: 00.000.000/0000-00
 */
export function formatarCNPJ(cnpjStr: string): string {
  const digits = cnpjStr.replace(/\D/g, '').slice(0, 14);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12)
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`;
}

/**
 * Validação algorítmica de CPF brasileiro (11 dígitos e dígitos verificadores)
 */
export function validarCPF(cpfStr: string): boolean {
  if (!cpfStr) return false;
  const digits = cpfStr.replace(/\D/g, '');

  if (digits.length !== 11) return false;

  // Rejeita números com dígitos todos iguais (ex: 111.111.111-11)
  if (/^(\d)\1{10}$/.test(digits)) return false;

  // Primeiro dígito verificador
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(digits.charAt(i), 10) * (10 - i);
  }
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(digits.charAt(9), 10)) return false;

  // Segundo dígito verificador
  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(digits.charAt(i), 10) * (11 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(digits.charAt(10), 10)) return false;

  return true;
}

/**
 * Formata CPF: 000.000.000-00
 */
export function formatarCPF(cpfStr: string): string {
  const digits = cpfStr.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
}

/**
 * Validação de CEP brasileiro (8 dígitos)
 */
export function validarCEP(cepStr: string): boolean {
  if (!cepStr) return false;
  const digits = cepStr.replace(/\D/g, '');
  return digits.length === 8;
}

/**
 * Formata CEP: 00000-000
 */
export function formatarCEP(cepStr: string): string {
  const digits = cepStr.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5, 8)}`;
}

/**
 * Validação de Telefone/WhatsApp brasileiro (10 ou 11 dígitos com DDD válido)
 */
export function validarTelefoneBR(telStr: string): boolean {
  if (!telStr) return false;
  const digits = telStr.replace(/\D/g, '');
  if (digits.length !== 10 && digits.length !== 11) return false;

  const ddd = parseInt(digits.slice(0, 2), 10);
  // DDDs válidos no Brasil variam de 11 a 99
  if (ddd < 11 || ddd > 99) return false;

  // Se tiver 11 dígitos (celular), o 3º dígito deve ser 9
  if (digits.length === 11 && digits.charAt(2) !== '9') return false;

  return true;
}

/**
 * Formata Telefone ou Celular: (00) 0000-0000 ou (00) 00000-0000
 */
export function formatarTelefoneBR(telStr: string): string {
  const digits = telStr.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits ? `(${digits}` : '';
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

/**
 * Validação de E-mail
 */
export function validarEmail(emailStr: string): boolean {
  if (!emailStr) return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(emailStr.trim());
}

/**
 * Validação de arquivo de imagem (máximo de 2 MB e tipos de imagem aceitos)
 */
export function validarArquivoImagem(file: File): { valido: boolean; erro?: string } {
  const MAX_BYTES = 2 * 1024 * 1024; // 2 Megabytes
  const TIPOS_VALIDOS = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];

  if (!TIPOS_VALIDOS.includes(file.type)) {
    return {
      valido: false,
      erro: `Tipo de arquivo inválido (${file.type}). Permitido somente JPG, PNG, WEBP ou SVG.`,
    };
  }

  if (file.size > MAX_BYTES) {
    const tamanhoMB = (file.size / (1024 * 1024)).toFixed(2);
    return {
      valido: false,
      erro: `Arquivo muito grande (${tamanhoMB} MB). O limite máximo permitido é 2 MB.`,
    };
  }

  return { valido: true };
}
