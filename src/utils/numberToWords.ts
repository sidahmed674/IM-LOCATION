/**
 * Algerian Dinar (DZD) Number to Words Converter
 * Converts numbers into Arabic and French wording for official invoices and contracts
 */

const onesArabic = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة'];
const tensArabic = ['', 'عشرة', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
const teensArabic = ['عشرة', 'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'];
const hundredsArabic = ['', 'مائة', 'مئتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة'];

function convertUnderThousandArabic(n: number): string {
  if (n === 0) return '';
  const parts: string[] = [];

  const h = Math.floor(n / 100);
  const remainder = n % 100;

  if (h > 0) {
    parts.push(hundredsArabic[h]);
  }

  if (remainder > 0) {
    if (remainder < 10) {
      parts.push(onesArabic[remainder]);
    } else if (remainder >= 11 && remainder <= 19) {
      parts.push(teensArabic[remainder - 10]);
    } else if (remainder === 10 || remainder % 10 === 0) {
      parts.push(tensArabic[Math.floor(remainder / 10)]);
    } else {
      const u = remainder % 10;
      const t = Math.floor(remainder / 10);
      parts.push(`${onesArabic[u]} و${tensArabic[t]}`);
    }
  }

  return parts.join(' و');
}

export function tafqeetArabic(amount: number): string {
  const integerPart = Math.floor(Math.abs(amount));
  if (integerPart === 0) return 'صفر دينار جزائري';

  const billions = Math.floor(integerPart / 1_000_000_000);
  const millions = Math.floor((integerPart % 1_000_000_000) / 1_000_000);
  const thousands = Math.floor((integerPart % 1_000_000) / 1000);
  const units = integerPart % 1000;

  const chunks: string[] = [];

  if (billions > 0) {
    if (billions === 1) chunks.push('مليار');
    else if (billions === 2) chunks.push('ملياران');
    else if (billions >= 3 && billions <= 10) chunks.push(`${convertUnderThousandArabic(billions)} مليارات`);
    else chunks.push(`${convertUnderThousandArabic(billions)} مليار`);
  }

  if (millions > 0) {
    if (millions === 1) chunks.push('مليون');
    else if (millions === 2) chunks.push('مليونان');
    else if (millions >= 3 && millions <= 10) chunks.push(`${convertUnderThousandArabic(millions)} ملايين`);
    else chunks.push(`${convertUnderThousandArabic(millions)} مليون`);
  }

  if (thousands > 0) {
    if (thousands === 1) chunks.push('ألف');
    else if (thousands === 2) chunks.push('ألفان');
    else if (thousands >= 3 && thousands <= 10) chunks.push(`${convertUnderThousandArabic(thousands)} آلاف`);
    else chunks.push(`${convertUnderThousandArabic(thousands)} ألف`);
  }

  if (units > 0) {
    chunks.push(convertUnderThousandArabic(units));
  }

  const wording = chunks.join(' و');
  return `أوقفت هذه الفاتورة عند مبلغ: ${wording} دينار جزائري لا غير.`;
}

// French conversion
const onesFrench = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
const teensFrench = ['dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
const tensFrench = ['', 'dix', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante-dix', 'quatre-vingts', 'quatre-vingt-dix'];

function convertUnderHundredFrench(n: number): string {
  if (n < 10) return onesFrench[n];
  if (n >= 10 && n < 20) return teensFrench[n - 10];

  const t = Math.floor(n / 10);
  const u = n % 10;

  if (t === 7) {
    if (u === 1) return 'soixante-et-onze';
    return `soixante-${teensFrench[u]}`;
  }

  if (t === 8) {
    if (u === 0) return 'quatre-vingts';
    return `quatre-vingt-${onesFrench[u]}`;
  }

  if (t === 9) {
    return `quatre-vingt-${teensFrench[u]}`;
  }

  if (u === 1 && t !== 8) return `${tensFrench[t]}-et-un`;
  if (u > 0) return `${tensFrench[t]}-${onesFrench[u]}`;
  return tensFrench[t];
}

function convertUnderThousandFrench(n: number): string {
  if (n === 0) return '';
  const h = Math.floor(n / 100);
  const remainder = n % 100;

  let str = '';
  if (h === 1) str = 'cent';
  else if (h > 1) str = `${onesFrench[h]} cent${remainder === 0 ? 's' : ''}`;

  if (remainder > 0) {
    const remStr = convertUnderHundredFrench(remainder);
    str = str ? `${str} ${remStr}` : remStr;
  }

  return str;
}

export function numberToWordsFrench(amount: number): string {
  const integerPart = Math.floor(Math.abs(amount));
  if (integerPart === 0) return 'Zéro dinars algériens';

  const millions = Math.floor(integerPart / 1_000_000);
  const thousands = Math.floor((integerPart % 1_000_000) / 1000);
  const units = integerPart % 1000;

  const parts: string[] = [];

  if (millions > 0) {
    if (millions === 1) parts.push('un million');
    else parts.push(`${convertUnderThousandFrench(millions)} millions`);
  }

  if (thousands > 0) {
    if (thousands === 1) parts.push('mille');
    else parts.push(`${convertUnderThousandFrench(thousands)} mille`);
  }

  if (units > 0) {
    parts.push(convertUnderThousandFrench(units));
  }

  const raw = parts.join(' ');
  const capitalized = raw.charAt(0).toUpperCase() + raw.slice(1);
  return `Arrêtée la présente facture à la somme de : ${capitalized} Dinars Algériens.`;
}
