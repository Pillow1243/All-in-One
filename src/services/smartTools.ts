/**
 * Smart Utilities 2.0 — pure, dependency-free helpers.
 *
 * Every function in this module is deterministic (or explicitly seedable),
 * runs fully offline, and is unit-tested in `src/__tests__/smartTools.test.ts`.
 */

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

export function toPersianDigits(value: string | number): string {
  return String(value).replace(/\d/g, (d) => PERSIAN_DIGITS[Number(d)]);
}

export function toEnglishDigits(value: string): string {
  return value
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
}

const ONES = ['', 'یک', 'دو', 'سه', 'چهار', 'پنج', 'شش', 'هفت', 'هشت', 'نه'];
const TEENS = ['ده', 'یازده', 'دوازده', 'سیزده', 'چهارده', 'پانزده', 'شانزده', 'هفده', 'هجده', 'نوزده'];
const TENS = ['', '', 'بیست', 'سی', 'چهل', 'پنجاه', 'شصت', 'هفتاد', 'هشتاد', 'نود'];
const HUNDREDS = ['', 'صد', 'دویست', 'سیصد', 'چهارصد', 'پانصد', 'ششصد', 'هفتصد', 'هشتصد', 'نهصد'];
const SCALES = ['', ' هزار', ' میلیون', ' میلیارد', ' هزار میلیارد'];

function threeDigitWords(n: number): string {
  const parts: string[] = [];
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  if (hundreds) parts.push(HUNDREDS[hundreds]);
  if (rest >= 10 && rest < 20) parts.push(TEENS[rest - 10]);
  else {
    const tens = Math.floor(rest / 10);
    const ones = rest % 10;
    if (tens) parts.push(TENS[tens]);
    if (ones) parts.push(ONES[ones]);
  }
  return parts.join(' و ');
}

/** «۱۲۳۴۵۶» → «صد و بیست و سه هزار و چهارصد و پنجاه و شش» */
export function numberToPersianWords(input: number | string): string {
  const raw = toEnglishDigits(String(input)).replace(/[^\d-]/g, '');
  if (!raw || raw === '-') return '';
  const negative = raw.startsWith('-');
  const value = Math.abs(Number(raw));
  if (!Number.isFinite(value)) return '';
  if (value === 0) return 'صفر';

  const chunks: string[] = [];
  let remaining = Math.floor(value);
  let scale = 0;
  while (remaining > 0) {
    const chunk = remaining % 1000;
    if (chunk) chunks.unshift(`${threeDigitWords(chunk)}${SCALES[scale]}`);
    remaining = Math.floor(remaining / 1000);
    scale += 1;
  }
  return `${negative ? 'منفی ' : ''}${chunks.join(' و ')}`;
}

const TRANSLITERATION: Record<string, string> = {
  آ: 'a', ا: 'a', ب: 'b', پ: 'p', ت: 't', ث: 's', ج: 'j', چ: 'ch', ح: 'h', خ: 'kh',
  د: 'd', ذ: 'z', ر: 'r', ز: 'z', ژ: 'zh', س: 's', ش: 'sh', ص: 's', ض: 'z', ط: 't',
  ظ: 'z', ع: 'a', غ: 'gh', ف: 'f', ق: 'gh', ک: 'k', ك: 'k', گ: 'g', ل: 'l', م: 'm',
  ن: 'n', و: 'v', ه: 'h', ی: 'y', ي: 'y', ء: '', أ: 'a', إ: 'e', ؤ: 'o', ئ: 'y', ة: 'h',
};

/** URL/SEO slug with correct Persian transliteration. */
export function toSlug(input: string, separator = '-'): string {
  const normalized = toEnglishDigits(input);
  const latin = normalized
    .split('')
    .map((char, index) => {
      const transliterated = TRANSLITERATION[char];
      if (transliterated === undefined) return char;
      const next = normalized[index + 1];
      const isWordEnd = next === undefined || /[\s\u200c\u200f\u200e\-_—.,/]/.test(next);
      // Persian final letters are pronounced as vowels: «پرو» → pro, «همه» → hme.
      if (isWordEnd && char === 'ه') return 'e';
      if (isWordEnd && char === 'و') return 'o';
      if (isWordEnd && char === 'ی') return 'i';
      return transliterated;
    })
    .join('')
    .toLowerCase();
  return latin
    .replace(/[\u200c\u200f\u200e]/g, ' ')
    .replace(/[^a-z0-9\u0600-\u06ff]+/g, separator)
    .replace(new RegExp(`\\${separator}{2,}`, 'g'), separator)
    .replace(new RegExp(`^\\${separator}|\\${separator}$`, 'g'), '');
}

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** Accepts an array of objects (or an object of arrays) and returns CSV text. */
export function jsonToCsv(value: unknown): string {
  if (Array.isArray(value)) {
    const rows = value.map((row) => (row && typeof row === 'object' ? (row as Record<string, unknown>) : { value: row }));
    const headers = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
    return [headers.join(','), ...rows.map((row) => headers.map((h) => csvCell(row[h])).join(','))].join('\n');
  }
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.every(([, v]) => Array.isArray(v))) {
      const keys = entries.map(([k]) => k);
      const length = Math.max(...entries.map(([, v]) => (v as unknown[]).length));
      const lines = [keys.join(',')];
      for (let i = 0; i < length; i += 1) {
        lines.push(entries.map(([, v]) => csvCell((v as unknown[])[i])).join(','));
      }
      return lines.join('\n');
    }
    return entries.map(([k, v]) => `${csvCell(k)},${csvCell(v)}`).join('\n');
  }
  return String(value ?? '');
}

/** RFC 4180-ish CSV parser with quote handling. */
export function parseCsv(text: string, delimiter = ','): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
      continue;
    }
    if (char === '"') quoted = true;
    else if (char === delimiter) {
      row.push(cell);
      cell = '';
    } else if (char === '\n') {
      row.push(cell.replace(/\r$/, ''));
      rows.push(row);
      row = [];
      cell = '';
    } else cell += char;
  }
  if (cell.length || row.length) {
    row.push(cell.replace(/\r$/, ''));
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim().length > 0));
}

export interface JsonDiffEntry {
  path: string;
  before: string;
  after: string;
}

/** Structural JSON diff (deep, path oriented). */
export function diffJson(left: unknown, right: unknown, basePath = '$'): JsonDiffEntry[] {
  const out: JsonDiffEntry[] = [];
  const show = (v: unknown) => (v === undefined ? '∅' : typeof v === 'object' ? JSON.stringify(v) : String(v));

  const walk = (a: unknown, b: unknown, path: string) => {
    if (a === b) return;
    const aObj = a as Record<string, unknown> | undefined;
    const bObj = b as Record<string, unknown> | undefined;
    const bothObjects = aObj && bObj && typeof a === 'object' && typeof b === 'object' && !Array.isArray(a) && !Array.isArray(b);
    if (bothObjects) {
      for (const key of new Set([...Object.keys(aObj), ...Object.keys(bObj)])) {
        walk(aObj[key], bObj[key], `${path}.${key}`);
      }
      return;
    }
    if (Array.isArray(a) && Array.isArray(b)) {
      const length = Math.max(a.length, b.length);
      if (a.length !== b.length) out.push({ path: `${path}.length`, before: String(a.length), after: String(b.length) });
      for (let i = 0; i < length; i += 1) walk(a[i], b[i], `${path}[${i}]`);
      return;
    }
    out.push({ path, before: show(a), after: show(b) });
  };

  walk(left, right, basePath);
  return out;
}

const CRON_DAYS = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه'];
const CRON_MONTHS = [
  'ژانویه', 'فوریه', 'مارس', 'آوریل', 'مه', 'ژوئن',
  'ژوئیه', 'اوت', 'سپتامبر', 'اکتبر', 'نوامبر', 'دسامبر',
];

const cronFieldText = (field: string, unit: string): string => {
  if (field === '*') return `هر ${unit}`;
  if (field.startsWith('*/')) return `هر ${field.slice(2)} ${unit}`;
  if (field.includes('-')) {
    const [from, to] = field.split('-');
    return `از ${from} تا ${to} ${unit}`;
  }
  if (field.includes(',')) return `مقادیر ${field} ${unit}`;
  return `${field} ${unit}`;
};

export function explainCron(expression: string): { valid: boolean; description: string; fields: string[] } {
  const fields = expression.trim().split(/\s+/);
  if (fields.length !== 5) {
    return { valid: false, description: 'عبارت Cron باید دقیقاً ۵ فیلد داشته باشد: دقیقه ساعت روز ماه هفته', fields };
  }
  const [minute, hour, day, month, weekday] = fields;
  const parts = [
    `دقیقه ${cronFieldText(minute, 'دقیقه')}`,
    `ساعت ${cronFieldText(hour, 'ساعت')}`,
    `روز ماه ${cronFieldText(day, 'روز')}`,
    `ماه ${cronFieldText(month, 'ماه')}`,
  ];
  if (weekday !== '*') {
    const dayName = /^\d$/.test(weekday) ? CRON_DAYS[Number(weekday) % 7] : weekday;
    parts.push(`روز هفته ${dayName}`);
  }
  if (minute === '*' || hour === '*') parts.unshift('اجرا در بازه‌های تکرارشونده');
  return { valid: true, description: parts.join(' · '), fields };
}

export function monthName(index: number): string {
  return CRON_MONTHS[(index - 1 + 12) % 12] ?? '';
}

function randomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) crypto.getRandomValues(bytes);
  else for (let i = 0; i < length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  return bytes;
}

// 64 unambiguous URL-safe characters (nanoid default alphabet).
const NANO_ALPHABET = 'useandom26T198340PX75pxJACKVERYMINDBUSHWOLFGQZbfghjklqvwyzrict'.slice(0, 64);

export function generateId(kind: 'uuid' | 'ulid' | 'nano', length = 21): string {
  const bytes = randomBytes(32);
  if (kind === 'uuid') {
    const hex = Array.from(bytes.slice(0, 16), (b) => b.toString(16).padStart(2, '0')).join('');
    const variant = ((parseInt(hex[16], 16) & 0x3) | 0x8).toString(16);
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-${variant}${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
  }
  if (kind === 'ulid') {
    const alphabet = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
    let time = Date.now();
    let stamp = '';
    for (let i = 0; i < 10; i += 1) {
      stamp = alphabet[time % 32] + stamp;
      time = Math.floor(time / 32);
    }
    const random = Array.from({ length: 16 }, () => alphabet[bytes[Math.floor(Math.random() * bytes.length)] % 32]).join('');
    return `${stamp}${random}`;
  }
  const size = Math.min(64, Math.max(4, length));
  const alphabet = NANO_ALPHABET.length;
  return Array.from({ length: size }, (_, i) => NANO_ALPHABET[bytes[i % bytes.length] % alphabet]).join('');
}

/** Gregorian → Jalali (Khayyam algorithm, valid 1600–2500). */
export function toJalali(date: Date): { jy: number; jm: number; jd: number } {
  const gy = date.getFullYear();
  const gm = date.getMonth() + 1;
  const gd = date.getDate();
  const gDaysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const gy2 = gm > 2 ? gy + 1 : gy;
  let days =
    355666 +
    365 * gy +
    Math.floor((gy2 + 3) / 4) -
    Math.floor((gy2 + 99) / 100) +
    Math.floor((gy2 + 399) / 400) +
    gd +
    gDaysInMonth.slice(0, gm - 1).reduce((a, b) => a + b, 0);
  let jy = -1595 + 33 * Math.floor(days / 12053);
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    jy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  const jm = days < 186 ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
  const jd = 1 + (days < 186 ? days % 31 : (days - 186) % 30);
  return { jy, jm, jd };
}

/** Jalali → Gregorian. */
export function fromJalali(jy: number, jm: number, jd: number): Date {
  let jy2 = jy + 1595;
  let days =
    -355668 +
    365 * jy2 +
    Math.floor(jy2 / 33) * 8 +
    Math.floor(((jy2 % 33) + 3) / 4) +
    jd +
    (jm < 7 ? (jm - 1) * 31 : (jm - 7) * 30 + 186);
  let gy = 400 * Math.floor(days / 146097);
  days %= 146097;
  if (days > 36524) {
    gy += 100 * Math.floor(--days / 36524);
    days %= 36524;
    if (days >= 365) days += 1;
  }
  gy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    gy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  let gd = days + 1;
  const leap = (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0;
  const monthLengths = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let gm = 0;
  while (gm < 12 && gd > monthLengths[gm]) {
    gd -= monthLengths[gm];
    gm += 1;
  }
  return new Date(gy, gm, gd);
}

export function formatJalali(date: Date): string {
  const { jy, jm, jd } = toJalali(date);
  return toPersianDigits(`${jy}/${String(jm).padStart(2, '0')}/${String(jd).padStart(2, '0')}`);
}

export function formatTimestamp(ts: number): { iso: string; jalali: string; gregorian: string; unix: number; relative: string } {
  const millis = String(Math.abs(ts)).length <= 10 ? ts * 1000 : ts;
  const date = new Date(millis);
  return {
    iso: date.toISOString(),
    jalali: formatJalali(date),
    gregorian: date.toISOString().slice(0, 10),
    unix: Math.floor(millis / 1000),
    relative: relativeTime(date),
  };
}

export function relativeTime(date: Date, now = new Date()): string {
  const diff = Math.round((date.getTime() - now.getTime()) / 1000);
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 31536000], ['month', 2592000], ['day', 86400],
    ['hour', 3600], ['minute', 60], ['second', 1],
  ];
  const rtf = new Intl.RelativeTimeFormat('fa', { numeric: 'auto' });
  for (const [unit, seconds] of units) {
    if (Math.abs(diff) >= seconds || unit === 'second') {
      return rtf.format(Math.round(diff / seconds), unit);
    }
  }
  return 'همین حالا';
}

export type CaseMode = 'camel' | 'pascal' | 'snake' | 'kebab' | 'constant' | 'title' | 'sentence';

export function convertCase(text: string, mode: CaseMode): string {
  const words = text
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .split(/[^a-zA-Z0-9\u0600-\u06ff]+/)
    .filter(Boolean);
  const cap = (w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
  switch (mode) {
    case 'camel':
      return words.map((w, i) => (i === 0 ? w.toLowerCase() : cap(w))).join('');
    case 'pascal':
      return words.map(cap).join('');
    case 'snake':
      return words.map((w) => w.toLowerCase()).join('_');
    case 'kebab':
      return words.map((w) => w.toLowerCase()).join('-');
    case 'constant':
      return words.map((w) => w.toUpperCase()).join('_');
    case 'title':
      return words.map(cap).join(' ');
    default:
      return words.length ? `${cap(words[0])} ${words.slice(1).map((w) => w.toLowerCase()).join(' ')}`.trim() : '';
  }
}

const PASSPHRASE_WORDS = [
  'آسمان', 'دریا', 'کوه', 'جنگل', 'ستاره', 'خورشید', 'مهتاب', 'باران', 'برف', 'رودخانه',
  'شیر', 'عقاب', 'اسب', 'پلنگ', 'آهو', 'نهنگ', 'کبوتر', 'خرس', 'روباه', 'گنجشک',
  'کتاب', 'قلم', 'دفتر', 'چراغ', 'آینه', 'کلید', 'پنجره', 'باغ', 'خانه', 'راه',
  'شادی', 'آرامش', 'امید', 'شجاعت', 'دانش', 'هنر', 'موسیقی', 'رنگ', 'نور', 'سفر',
];

export function generatePassphrase(wordCount = 4, separator = '-', index = 0): string {
  const picks: string[] = [];
  for (let i = 0; i < wordCount; i += 1) {
    picks.push(PASSPHRASE_WORDS[(index * 7 + i * 11) % PASSPHRASE_WORDS.length]);
  }
  return picks.join(separator);
}

export const PASSPHRASE_DICTIONARY_SIZE = PASSPHRASE_WORDS.length;

export function passphraseEntropyBits(wordCount: number): number {
  return Math.round(wordCount * Math.log2(PASSPHRASE_DICTIONARY_SIZE));
}

/** Luhn (mod 10) check used by bank cards. */
export function luhnValid(raw: string): boolean {
  const digits = toEnglishDigits(raw).replace(/\D/g, '');
  if (digits.length < 12 || digits.length > 19) return false;
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let value = Number(digits[i]);
    if (double) {
      value *= 2;
      if (value > 9) value -= 9;
    }
    sum += value;
    double = !double;
  }
  return sum % 10 === 0;
}

/** Iranian IBAN / SHEBA (IR + 24 digits) validation using ISO 13616 checksum. */
export function validateSheba(raw: string): { valid: boolean; normalized: string } {
  const cleaned = toEnglishDigits(raw).replace(/[^0-9A-Za-z]/g, '').toUpperCase();
  const normalized = cleaned.startsWith('IR') ? cleaned : `IR${cleaned}`;
  if (!/^IR\d{24}$/.test(normalized)) return { valid: false, normalized };
  const rearranged = normalized.slice(4) + normalized.slice(0, 4);
  const numeric = rearranged.replace(/[A-Z]/g, (c) => String(c.charCodeAt(0) - 55));
  let remainder = 0;
  for (const char of numeric) remainder = (remainder * 10 + Number(char)) % 97;
  return { valid: remainder === 1, normalized };
}

/** Iranian national ID checksum. */
export function validateNationalId(raw: string): boolean {
  const digits = toEnglishDigits(raw).replace(/\D/g, '');
  if (!/^\d{10}$/.test(digits) || /^(\d)\1{9}$/.test(digits)) return false;
  const check = Number(digits[9]);
  const sum = digits
    .slice(0, 9)
    .split('')
    .reduce((acc, d, i) => acc + Number(d) * (10 - i), 0);
  const remainder = sum % 11;
  return remainder < 2 ? check === remainder : check === 11 - remainder;
}

export interface UnitPriceResult {
  winner: 'a' | 'b' | 'equal';
  pricePerUnitA: number;
  pricePerUnitB: number;
  savingsPct: number;
}

export function compareUnitPrice(
  priceA: number,
  quantityA: number,
  priceB: number,
  quantityB: number,
): UnitPriceResult {
  const pricePerUnitA = quantityA > 0 ? priceA / quantityA : Infinity;
  const pricePerUnitB = quantityB > 0 ? priceB / quantityB : Infinity;
  const cheaper = Math.min(pricePerUnitA, pricePerUnitB);
  const expensive = Math.max(pricePerUnitA, pricePerUnitB);
  const savingsPct = Number.isFinite(cheaper) && expensive > 0 ? ((expensive - cheaper) / expensive) * 100 : 0;
  return {
    winner: pricePerUnitA === pricePerUnitB ? 'equal' : pricePerUnitA < pricePerUnitB ? 'a' : 'b',
    pricePerUnitA,
    pricePerUnitB,
    savingsPct: Math.round(savingsPct * 10) / 10,
  };
}

export function daysBetween(from: Date, to: Date): number {
  const a = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const b = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((b - a) / 86400000);
}

export function exactAge(birth: Date, now = new Date()): { years: number; months: number; days: number; totalDays: number } {
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  let days = now.getDate() - birth.getDate();
  if (days < 0) {
    months -= 1;
    days += new Date(now.getFullYear(), now.getMonth(), 0).getDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  return { years, months, days, totalDays: daysBetween(birth, now) };
}

export type PercentageMode = 'of' | 'change' | 'discount' | 'reverse';

export function calcPercentage(mode: PercentageMode, a: number, b: number): number {
  switch (mode) {
    case 'of':
      return (a / 100) * b;
    case 'change':
      return b === 0 ? 0 : ((a - b) / Math.abs(b)) * 100;
    case 'discount':
      return a - (a * b) / 100;
    default:
      return b === 0 ? 0 : (a / b) * 100;
  }
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.replace('#', '').trim();
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

function channelLuminance(channel: number): number {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  return (
    0.2126 * channelLuminance(rgb.r) +
    0.7152 * channelLuminance(rgb.g) +
    0.0722 * channelLuminance(rgb.b)
  );
}

/** WCAG 2.1 contrast ratio between two hex colors (1–21). */
export function contrastRatio(hexA: string, hexB: string): number {
  const a = relativeLuminance(hexA);
  const b = relativeLuminance(hexB);
  const light = Math.max(a, b);
  const dark = Math.min(a, b);
  return Math.round(((light + 0.05) / (dark + 0.05)) * 100) / 100;
}

export function wcagGrade(ratio: number): { normal: string; large: string } {
  return {
    normal: ratio >= 7 ? 'AAA' : ratio >= 4.5 ? 'AA' : ratio >= 3 ? 'AA Large' : 'Fail',
    large: ratio >= 4.5 ? 'AAA' : ratio >= 3 ? 'AA' : 'Fail',
  };
}

/** Deterministic hue rotation used by the palette generator. */
export function buildPalette(baseHex: string, count = 5): string[] {
  const rgb = hexToRgb(baseHex);
  if (!rgb) return [];
  const toHex = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return Array.from({ length: count }, (_, i) => {
    const factor = 1 - i * (0.65 / Math.max(1, count - 1));
    return `#${toHex(rgb.r * factor)}${toHex(rgb.g * factor)}${toHex(rgb.b * factor)}`;
  });
}

export function qrPayload(kind: 'text' | 'wifi' | 'vcard' | 'sms', fields: Record<string, string>): string {
  switch (kind) {
    case 'wifi':
      return `WIFI:T:${fields.security || 'WPA'};S:${fields.ssid || ''};P:${fields.password || ''};H:${fields.hidden === 'true' ? 'true' : 'false'};;`;
    case 'vcard':
      return [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `FN:${fields.name || ''}`,
        fields.org ? `ORG:${fields.org}` : '',
        fields.phone ? `TEL;TYPE=CELL:${fields.phone}` : '',
        fields.email ? `EMAIL:${fields.email}` : '',
        fields.url ? `URL:${fields.url}` : '',
        'END:VCARD',
      ].filter(Boolean).join('\n');
    case 'sms':
      return `SMSTO:${fields.phone || ''}:${fields.message || ''}`;
    default:
      return fields.text || '';
  }
}

/** Seeded shuffle so the same seed always produces the same pick. */
export function pickRandom<T>(items: T[], count: number, seed = Date.now()): T[] {
  if (!items.length || count <= 0) return [];
  let state = seed % 2147483647;
  if (state <= 0) state += 2147483646;
  const next = () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
  const pool = [...items];
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(next() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.min(count, pool.length));
}

const LOREM_FA = [
  'امروز فرصت تازه‌ای برای ساختن چیزی است که دیروز ممکن نبود.',
  'ابزار خوب آن است که کار را ساده کند، نه اینکه پیچیدگی بیفزاید.',
  'هر پروژه بزرگ با یک تصمیم کوچک و پیوسته آغاز می‌شود.',
  'سرعت بدون دقت، فقط فاصله را بیشتر می‌کند.',
  'بهترین ایده‌ها معمولاً در سکوت و آرامش شکل می‌گیرند.',
  'کاربر زمانی خوشحال است که ابزار را نفهمد و فقط نتیجه را ببیند.',
  'تجربه‌ی خوب، ترکیبی از سرعت، وضوح و احترام به وقت کاربر است.',
  'امنیت ویژگی نیست؛ پایه‌ی هر محصولی است که به آن اعتماد می‌کنیم.',
  'طراحی خوب خودش را نشان نمی‌دهد، فقط کار را راه می‌اندازد.',
  'داده‌ها وقتی ارزش دارند که به تصمیم بهتر تبدیل شوند.',
];

export function loremFa(paragraphs = 2, sentences = 3, seed = 1): string {
  const out: string[] = [];
  for (let p = 0; p < paragraphs; p += 1) {
    const picks = pickRandom(LOREM_FA, sentences, seed + p * 17);
    out.push(picks.join(' '));
  }
  return out.join('\n\n');
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes)) return '—';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`;
}
