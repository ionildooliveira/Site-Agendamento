/**
 * Utilitário de validação e verificação de cartões de crédito e débito
 * Implementa o Algoritmo de Luhn (padrão internacional ISO/IEC 7812) e validação de expiração e CVV.
 */

function validateCardNumber(number) {
  if (!number) return false;
  const clean = String(number).replace(/\D/g, '');
  
  // Cartões válidos têm entre 13 e 19 dígitos
  if (clean.length < 13 || clean.length > 19) return false;
  
  // Rejeita números com todos os dígitos iguais (ex: 1111111111111111, 0000000000000000)
  if (/^(\d)\1+$/.test(clean)) return false;

  // Algoritmo de Luhn (Módulo 10)
  let sum = 0;
  let shouldDouble = false;
  
  for (let i = clean.length - 1; i >= 0; i--) {
    let digit = parseInt(clean.charAt(i), 10);
    
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  
  return (sum % 10) === 0;
}

function validateCardExpiry(expiry) {
  if (!expiry) return false;
  const clean = String(expiry).trim();
  
  // Formatos aceitos: MM/AA ou MM/AAAA
  if (!/^\d{2}\/\d{2,4}$/.test(clean)) return false;
  
  const [monthStr, yearStr] = clean.split('/');
  const month = parseInt(monthStr, 10);
  let year = parseInt(yearStr, 10);
  
  if (month < 1 || month > 12) return false;
  
  // Normaliza ano de 2 dígitos para 4 dígitos (ex: 28 -> 2028)
  if (year < 100) year += 2000;
  
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1 a 12
  
  if (year < currentYear) return false;
  if (year === currentYear && month < currentMonth) return false;
  if (year > currentYear + 25) return false; // Sanity check
  
  return true;
}

function validateCardCVV(cvv) {
  if (!cvv) return false;
  const clean = String(cvv).replace(/\D/g, '');
  return clean.length >= 3 && clean.length <= 4;
}

function getCardBrand(number) {
  if (!number) return 'Desconhecida';
  const clean = String(number).replace(/\D/g, '');
  
  if (/^4/.test(clean)) return 'visa';
  if (/^(5[1-5]|222[1-9]|22[3-9]|2[3-6]|27[0-1]|2720)/.test(clean)) return 'master';
  if (/^(4011(78|79)|43(1274|8935)|45(1416|7393|763(1|2))|50(4175|6699|67[0-7][0-9]|9000)|627780|63(6297|6368)|650(03[1-3]|0[4-5][0-9]|4(0[5-9]|[1-9][0-9])|5(0[0-9]|1[0-9]|2[0-9]|3[0-8])|7(0[0-9]|1[0-8])|72[0-7]|9(0[1-9]|[1-6][0-9]|7[0-8]))|6516(5[2-9]|[6-7][0-9])|6550([0-1][0-9]|2[1-9]|[3-4][0-9]|5[0-8]))/.test(clean)) return 'elo';
  if (/^3[47]/.test(clean)) return 'amex';
  if (/^(606282|3841)/.test(clean)) return 'hipercard';
  
  return 'visa';
}

module.exports = {
  validateCardNumber,
  validateCardExpiry,
  validateCardCVV,
  getCardBrand
};
