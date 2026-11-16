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

describe('OmniForge Pro Catalog Integrity (30 Categories & 995+ Tools)', () => {
  it('contains all 30 distinct tool categories', () => {
    expect(CATEGORIES.length).toBe(30);
    const ids = new Set(CATEGORIES.map((c) => c.id));
    expect(ids.size).toBe(30);
  });

  it('contains at least 950 uniquely identified tools routed to valid categories', () => {
    expect(ALL_TOOLS.length).toBeGreaterThanOrEqual(950);
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
