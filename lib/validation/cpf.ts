/**
 * Validação de CPF (dígitos verificadores). Puro, sem I/O.
 * O CPF nunca é armazenado em claro: o schema do banco guarda hash + valor
 * cifrado (doc §18: `cpf_hash/encrypted`). Esta função só valida o formato/DV
 * antes de qualquer persistência.
 */
export function onlyDigits(value: string): string {
  return value.replace(/\D+/g, "");
}

export function isValidCPF(input: string): boolean {
  const cpf = onlyDigits(input);
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false; // todos iguais

  const calcDigit = (base: string, factor: number): number => {
    let total = 0;
    for (const digit of base) {
      total += Number(digit) * factor--;
    }
    const rest = (total * 10) % 11;
    return rest === 10 ? 0 : rest;
  };

  const d1 = calcDigit(cpf.slice(0, 9), 10);
  if (d1 !== Number(cpf[9])) return false;

  const d2 = calcDigit(cpf.slice(0, 10), 11);
  if (d2 !== Number(cpf[10])) return false;

  return true;
}

export function formatCPF(input: string): string {
  const cpf = onlyDigits(input).slice(0, 11);
  return cpf
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");
}
