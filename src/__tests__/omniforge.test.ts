import { describe, it, expect } from 'vitest';
import { ALL_TOOLS, CATEGORIES, CATEGORY_MAP, TOOL_MAP, getToolsByCategory } from '../data/catalog';
import { PUBLIC_APIS_DIRECTORY } from '../data/publicApisData';
import { FOOD_CALORIES_DB, HTTP_STATUS_CODES, MIME_TYPES, OBD2_CODES, PLANTS_DB, WORLD_COUNTRIES } from '../data/referenceData';
import {
  aesDecrypt, aesEncrypt, digestText, evaluatePasswordStrength, fromBase64,
  generateSecurePassword, generateTotp, hmacSign, md5, toBase64,
} from '../services/cryptoEngine';
import {
  analyzeSentiment, answerFromDocumentLocal, computePlagiarismSimilarity,
  convertNumerals, extractEntities, persianVirastar, summarizeTextLocal,
} from '../services/localAi';
import {
  buildPalette, calcPercentage, compareUnitPrice, contrastRatio, daysBetween, diffJson,
  exactAge, explainCron, formatTimestamp, fromJalali, generateId, generatePassphrase,
  jsonToCsv, loremFa, luhnValid, numberToPersianWords, parseCsv, passphraseEntropyBits,
  pickRandom, qrPayload, toJalali, toSlug, validateNationalId, validateSheba, wcagGrade,
} from '../services/smartTools';

describe('OmniForge Pro Catalog Integrity (32 Categories & 1,000+ Tools)', () => {
  it('contains all 32 distinct tool categories', () => {
    expect(CATEGORIES.length).toBe(32);
    const ids = new Set(CATEGORIES.map((c) => c.id));
    expect(ids.size).toBe(32);
  });

  it('ships the Smart Utilities 2.0 category with working tools', () => {
    const smartTools = getToolsByCategory('smart');
    expect(smartTools.length).toBeGreaterThanOrEqual(20);
    expect(smartTools.map((t) => t.mode)).toContain('words');
    expect(smartTools.map((t) => t.mode)).toContain('qr');
    expect(smartTools.every((t) => t.nameEn.length > 1)).toBe(true);
  });

  it('ships 12 operational Industrial Workshop calculators', () => {
    const workshopTools = getToolsByCategory('workshop');
    expect(workshopTools).toHaveLength(12);
    expect(workshopTools.map((tool) => tool.mode)).toContain('cutting');
    expect(workshopTools.map((tool) => tool.mode)).toContain('ohms');
    expect(workshopTools.map((tool) => tool.mode)).toContain('maintenance');
  });

  it('contains 1,072 uniquely identified tools routed to valid categories', () => {
    expect(ALL_TOOLS.length).toBe(1072);
    expect(Object.keys(TOOL_MAP).length).toBe(ALL_TOOLS.length);
    for (const tool of ALL_TOOLS) {
      expect(CATEGORY_MAP[tool.categoryId]).toBeDefined();
      expect(tool.nameFa.length).toBeGreaterThan(1);
      expect(tool.nameEn.length).toBeGreaterThan(1);
      expect(tool.mode.length).toBeGreaterThan(0);
    }
  });

  it('populates every single category with tools', () => {
    for (const cat of CATEGORIES) {
      const items = getToolsByCategory(cat.id);
      expect(items.length).toBeGreaterThanOrEqual(10);
    }
  });

  it('ships 170+ curated zero-auth HTTPS APIs from public-apis', () => {
    expect(PUBLIC_APIS_DIRECTORY.length).toBeGreaterThanOrEqual(170);
    for (const api of PUBLIC_APIS_DIRECTORY) {
      expect(api.https).toBe(true);
      expect(api.auth).toBe('No');
      expect(api.url.startsWith('http')).toBe(true);
    }
  });

  it('ships populated offline reference databases', () => {
    expect(OBD2_CODES.length).toBeGreaterThanOrEqual(10);
    expect(HTTP_STATUS_CODES.length).toBeGreaterThanOrEqual(15);
    expect(MIME_TYPES.length).toBeGreaterThanOrEqual(10);
    expect(PLANTS_DB.length).toBeGreaterThanOrEqual(5);
    expect(FOOD_CALORIES_DB.length).toBeGreaterThanOrEqual(10);
    expect(WORLD_COUNTRIES.length).toBeGreaterThanOrEqual(10);
  });
});

describe('Crypto & Security Engine', () => {
  it('computes standard MD5, SHA-256 & HMAC-SHA256 hashes accurately', async () => {
    expect(md5('hello')).toBe('5d41402abc4b2a76b9719d911017c592');
    const sha = await digestText('hello', 'SHA-256');
    expect(sha).toBe('2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824');
    const mac = await hmacSign('hello', 'secret', 'SHA-256');
    expect(mac.length).toBe(64);
  });

  it('encrypts and decrypts AES-256-GCM payloads cleanly', async () => {
    const secret = 'همه‌کاره پرو — Secret Payload 2026!';
    const cipher = await aesEncrypt(secret, 'MasterPass#2026');
    expect(cipher).not.toBe(secret);
    const plain = await aesDecrypt(cipher, 'MasterPass#2026');
    expect(plain).toBe(secret);
  });

  it('generates valid 6-digit RFC 6238 TOTP codes and Base64 UTF-8 roundtrip', async () => {
    const totp = await generateTotp('JBSWY3DPEHPK3PXP');
    expect(totp.code).toMatch(/^\d{6}$/);
    expect(totp.remaining).toBeGreaterThan(0);
    expect(totp.remaining).toBeLessThanOrEqual(30);
    const bytes = new TextEncoder().encode('سلام OmniForge');
    const decoded = new TextDecoder().decode(fromBase64(toBase64(bytes)));
    expect(decoded).toBe('سلام OmniForge');
  });

  it('generates high-entropy passwords and computes strength accurately', () => {
    const pwd = generateSecurePassword({ length: 24, upper: true, lower: true, numbers: true, symbols: true });
    expect(pwd.length).toBe(24);
    const strength = evaluatePasswordStrength(pwd);
    expect(strength.entropyBits).toBeGreaterThan(80);
  });
});

describe('Local Offline Persian NLP & Virastar AI Engine', () => {
  it('fixes Persian ZWNJ half-spaces and converts numerals accurately', () => {
    const fixed = persianVirastar('می خواهم کتاب ها را بخوانم');
    expect(fixed).toContain('می\u200Cخواهم');
    expect(fixed).toContain('کتاب\u200Cها');
    expect(convertNumerals('2026', 'fa')).toBe('۲۰۲۶');
    expect(convertNumerals('۲۰۲۶', 'en')).toBe('2026');
  });

  it('summarizes documents, answers questions, analyzes sentiment, and extracts entities offline', () => {
    const doc = 'اپلیکیشن همه‌کاره پرو بسیار سریع و عالی است. این برنامه ۹۹۵ ابزار رایگان دارد. پشتیبانی از طریق info@omniforge.app انجام می‌شود.';
    expect(summarizeTextLocal(doc, 2).length).toBeGreaterThan(10);
    expect(answerFromDocumentLocal(doc, 'چند ابزار دارد؟')).toContain('۹۹۵');
    expect(analyzeSentiment('این برنامه عالی و فوق‌العاده است').score).toBeGreaterThan(0);
    expect(extractEntities(doc).emails).toContain('info@omniforge.app');
    expect(computePlagiarismSimilarity('سلام دنیا خوب است خیلی', 'سلام دنیا خوب است عالی').similarityPct).toBeGreaterThan(30);
  });
});

describe('Smart Utilities 2.0 engine (offline, deterministic)', () => {
  it('converts numbers to Persian words', () => {
    expect(numberToPersianWords(0)).toBe('صفر');
    expect(numberToPersianWords(1234567)).toBe('یک میلیون و دویست و سی و چهار هزار و پانصد و شصت و هفت');
    expect(numberToPersianWords('۲۵۰۰')).toContain('دو هزار و پانصد');
    expect(numberToPersianWords(-42)).toBe('منفی چهل و دو');
  });

  it('transliterates Persian into clean, SEO-safe slugs', () => {
    const slug = toSlug('همه‌کاره پرو ۲۰۲۶ — OmniForge Pro');
    expect(slug).toContain('omniforge');
    expect(slug).not.toMatch(/[\u0600-\u06ff]/);
    expect(slug).toBe(slug.toLowerCase());
    expect(slug).toBe('hme-kare-pro-2026-omniforge-pro');
  });

  it('round-trips JSON ⇄ CSV and parses quoted cells', () => {
    const csv = jsonToCsv([{ name: 'علی', age: 31 }, { name: 'Sara, "S"', age: 27 }]);
    expect(csv.split('\n')[0]).toBe('name,age');
    const rows = parseCsv(csv);
    expect(rows).toHaveLength(3);
    expect(rows[2][0]).toBe('Sara, "S"');
  });

  it('reports structural JSON differences by path', () => {
    const diff = diffJson({ a: 1, b: { c: 2 } }, { a: 1, b: { c: 3 }, d: true });
    const paths = Array.from(new Set(diff.map((entry) => entry.path))).sort();
    expect(paths).toEqual(['$.b.c', '$.d']);
  });

  it('explains cron expressions and rejects malformed ones', () => {
    expect(explainCron('*/15 9-18 * * 1-5').valid).toBe(true);
    expect(explainCron('*/15 9-18 * * 1-5').description).toContain('هر 15');
    expect(explainCron('* * *').valid).toBe(false);
  });

  it('generates well-formed UUID, ULID and NanoID values', () => {
    expect(generateId('uuid')).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(generateId('ulid')).toHaveLength(26);
    expect(generateId('nano', 16)).toHaveLength(16);
  });

  it('converts between Gregorian and Jalali calendars', () => {
    const nowruz = toJalali(new Date(2026, 2, 21));
    expect(nowruz).toEqual({ jy: 1405, jm: 1, jd: 1 });
    const back = fromJalali(1405, 1, 1);
    expect(back.getFullYear()).toBe(2026);
    expect(back.getMonth()).toBe(2);
    expect(back.getDate()).toBe(21);
    expect(formatTimestamp(1774047600).jalali).toMatch(/[۰-۹]{4}\/[۰-۹]{2}\/[۰-۹]{2}/);
  });

  it('validates bank cards, SHEBA and Iranian national IDs', () => {
    expect(luhnValid('4111111111111111')).toBe(true);
    expect(luhnValid('4111111111111112')).toBe(false);
    const sheba = validateSheba('IR820540102680020817909002');
    expect(sheba.valid).toBe(true);
    expect(validateSheba('IR000000000000000000000000').valid).toBe(false);
    expect(validateNationalId('0499370899')).toBe(true);
    expect(validateNationalId('0499370898')).toBe(false);
  });

  it('compares unit prices, dates and percentages', () => {
    const compare = compareUnitPrice(120000, 1500, 95000, 1000);
    expect(compare.winner).toBe('a');
    expect(compareUnitPrice(120000, 1000, 95000, 1000).winner).toBe('b');
    expect(daysBetween(new Date(2026, 0, 1), new Date(2026, 0, 31))).toBe(30);
    const age = exactAge(new Date(2000, 0, 1), new Date(2026, 0, 1));
    expect(age.years).toBe(26);
    expect(calcPercentage('discount', 200000, 25)).toBe(150000);
  });

  it('computes WCAG contrast and builds palettes', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBe(21);
    expect(wcagGrade(21).normal).toBe('AAA');
    expect(buildPalette('#14b8a6', 4)).toHaveLength(4);
    expect(contrastRatio('#ffffff', '#ffffff')).toBe(1);
  });

  it('generates reproducible passphrases, picks and Persian lorem text', () => {
    expect(generatePassphrase(4, '-', 3)).toBe(generatePassphrase(4, '-', 3));
    expect(passphraseEntropyBits(4)).toBeGreaterThan(20);
    expect(pickRandom([1, 2, 3, 4, 5], 2, 42)).toEqual(pickRandom([1, 2, 3, 4, 5], 2, 42));
    expect(loremFa(1, 2, 5).length).toBeGreaterThan(30);
  });

  it('builds WiFi, vCard and SMS payloads for QR codes', () => {
    expect(qrPayload('wifi', { ssid: 'MyNet', password: 'pass', security: 'WPA' }))
      .toBe('WIFI:T:WPA;S:MyNet;P:pass;H:false;;');
    expect(qrPayload('vcard', { name: 'OmniForge', phone: '+989120000000' })).toContain('TEL;TYPE=CELL:+989120000000');
    expect(qrPayload('sms', { phone: '123', message: 'hi' })).toBe('SMSTO:123:hi');
  });
});
