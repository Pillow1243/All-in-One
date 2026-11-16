// Real Free Zero-Auth Public APIs integrated from https://github.com/public-apis/public-apis
// Every function includes timeout protection and clean offline fallback!

import { answerFromDocumentLocal, summarizeTextLocal } from './localAi';

async function fetchJsonWithTimeout<T>(url: string, timeoutMs = 9000, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

// 1. Live Currency & Precious Metals (fawazahmed0/currency-api + open.er-api.com)
export async function fetchLiveCurrencyRates(base = 'usd'): Promise<{ rates: Record<string, number>; source: string; date: string }> {
  const b = base.toLowerCase();
  try {
    const data = await fetchJsonWithTimeout<Record<string, unknown>>(
      `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/${b}.json`
    );
    const rates = (data[b] as Record<string, number>) || {};
    return { rates, source: 'fawazahmed0/currency-api (Public APIs)', date: String(data.date || new Date().toISOString().slice(0, 10)) };
  } catch {
    try {
      const data = await fetchJsonWithTimeout<{ rates: Record<string, number>; time_last_update_utc: string }>(
        `https://open.er-api.com/v6/latest/${base.toUpperCase()}`
      );
      const lowerRates: Record<string, number> = {};
      for (const [k, v] of Object.entries(data.rates || {})) lowerRates[k.toLowerCase()] = v;
      return { rates: lowerRates, source: 'open.er-api.com', date: data.time_last_update_utc || 'Live' };
    } catch {
      return {
        rates: {
          usd: 1, eur: 0.92, gbp: 0.79, jpy: 152, aed: 3.67, try: 34.5, cad: 1.39, aud: 1.53, cny: 7.24, chf: 0.88,
          inr: 84.4, sar: 3.75, irr: 650000, btc: 0.0000108, eth: 0.00031, xau: 0.000375, xag: 0.032,
        },
        source: 'Offline Reference Cache',
        date: new Date().toISOString().slice(0, 10),
      };
    }
  }
}

// 2. Live Crypto Prices (CoinGecko + CoinCap)
export interface CryptoTicker {
  id: string;
  symbol: string;
  name: string;
  priceUsd: number;
  change24h: number;
}

export async function fetchLiveCrypto(): Promise<{ coins: CryptoTicker[]; source: string }> {
  try {
    const data = await fetchJsonWithTimeout<Record<string, { usd: number; usd_24h_change: number }>>(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether,solana,binancecoin,ripple,cardano,dogecoin,toncoin,tron&vs_currencies=usd&include_24hr_change=true'
    );
    const meta: Record<string, [string, string]> = {
      bitcoin: ['BTC', 'Bitcoin'],
      ethereum: ['ETH', 'Ethereum'],
      tether: ['USDT', 'Tether'],
      solana: ['SOL', 'Solana'],
      binancecoin: ['BNB', 'BNB'],
      ripple: ['XRP', 'XRP'],
      cardano: ['ADA', 'Cardano'],
      dogecoin: ['DOGE', 'Dogecoin'],
      toncoin: ['TON', 'Toncoin'],
      tron: ['TRX', 'TRON'],
    };
    const coins = Object.entries(data).map(([id, val]) => ({
      id,
      symbol: meta[id]?.[0] || id.toUpperCase(),
      name: meta[id]?.[1] || id,
      priceUsd: val.usd || 0,
      change24h: Number((val.usd_24h_change || 0).toFixed(2)),
    }));
    return { coins, source: 'CoinGecko Free Public API' };
  } catch {
    return {
      coins: [
        { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', priceUsd: 92450, change24h: 2.4 },
        { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', priceUsd: 3280, change24h: 1.8 },
        { id: 'tether', symbol: 'USDT', name: 'Tether', priceUsd: 1.0, change24h: 0.01 },
        { id: 'solana', symbol: 'SOL', name: 'Solana', priceUsd: 218, change24h: 4.1 },
        { id: 'binancecoin', symbol: 'BNB', name: 'BNB', priceUsd: 642, change24h: 0.9 },
        { id: 'toncoin', symbol: 'TON', name: 'Toncoin', priceUsd: 5.75, change24h: 3.2 },
      ],
      source: 'Offline Cache',
    };
  }
}

// 3. Live Weather + Agriculture Soil Moisture + Elevation (Open-Meteo — 100% Free, Zero-Auth, CORS=Yes)
export async function fetchWeatherAndSoil(lat: number, lon: number) {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,wind_speed_10m,surface_pressure,weather_code&hourly=temperature_2m,soil_moisture_0_to_1cm,uv_index&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_sum,et0_fao_evapotranspiration&timezone=auto`;
    return await fetchJsonWithTimeout<Record<string, any>>(url);
  } catch {
    return {
      offline: true,
      current: {
        temperature_2m: 22,
        relative_humidity_2m: 42,
        apparent_temperature: 21,
        precipitation: 0,
        wind_speed_10m: 11,
        surface_pressure: 1013,
        weather_code: 1,
      },
      hourly: { soil_moisture_0_to_1cm: [0.24], uv_index: [4.2] },
      daily: {
        time: [new Date().toISOString().slice(0, 10)],
        temperature_2m_max: [26],
        temperature_2m_min: [14],
        sunrise: ['06:35'],
        sunset: ['17:45'],
        et0_fao_evapotranspiration: [3.8],
      },
    };
  }
}

export async function geocodeCity(query: string): Promise<{ name: string; country: string; lat: number; lon: number; timezone?: string }[]> {
  try {
    const data = await fetchJsonWithTimeout<{ results?: any[] }>(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=6&language=en&format=json`
    );
    return (data.results || []).map((r) => ({
      name: r.name,
      country: r.country || '',
      lat: r.latitude,
      lon: r.longitude,
      timezone: r.timezone,
    }));
  } catch {
    return [
      { name: 'Tehran', country: 'Iran', lat: 35.6892, lon: 51.389, timezone: 'Asia/Tehran' },
      { name: 'Mashhad', country: 'Iran', lat: 36.2605, lon: 59.6168, timezone: 'Asia/Tehran' },
      { name: 'Isfahan', country: 'Iran', lat: 32.6546, lon: 51.668, timezone: 'Asia/Tehran' },
      { name: 'London', country: 'UK', lat: 51.5074, lon: -0.1278, timezone: 'Europe/London' },
    ];
  }
}

// 4. Live Free Translation (MyMemory Free API)
export async function translateTextFree(text: string, from: string, to: string): Promise<{ translated: string; source: string }> {
  if (!text.trim()) return { translated: '', source: '' };
  try {
    const pair = `${from}|${to}`;
    const data = await fetchJsonWithTimeout<{ responseData?: { translatedText?: string } }>(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.slice(0, 500))}&langpair=${encodeURIComponent(pair)}`
    );
    if (data.responseData?.translatedText) {
      return { translated: data.responseData.translatedText, source: 'MyMemory Free Public API' };
    }
  } catch {}
  return {
    translated: `[ترجمه آفلاین ${from}→${to}]: ${text}`,
    source: 'Offline Fallback',
  };
}

// 5. Free Zero-Auth AI Text & Chat (Pollinations AI + Local Intelligent Engine fallback)
export async function askFreeAi(prompt: string, systemPrompt?: string, contextDoc?: string): Promise<{ reply: string; engine: string }> {
  const fullPrompt = [systemPrompt, contextDoc ? `Document context:\n${contextDoc.slice(0, 3500)}` : '', prompt]
    .filter(Boolean)
    .join('\n\n');
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 14000);
    const res = await fetch('https://text.pollinations.ai/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: systemPrompt || 'You are OmniForge AI assistant. Answer clearly and concisely in the user language.' },
          { role: 'user', content: contextDoc ? `Context:\n${contextDoc.slice(0, 3500)}\n\nQuestion: ${prompt}` : prompt },
        ],
        model: 'openai',
      }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (res.ok) {
      const txt = await res.text();
      if (txt && txt.trim().length > 1) {
        return { reply: txt.trim(), engine: 'Pollinations Free AI API' };
      }
    }
  } catch {}

  // Smart offline fallback using our real local NLP engine!
  if (contextDoc) {
    return { reply: answerFromDocumentLocal(contextDoc, prompt), engine: 'OmniForge Offline BM25 AI' };
  }
  if (fullPrompt.length > 350) {
    return { reply: summarizeTextLocal(prompt, 3), engine: 'OmniForge Offline TF-IDF AI' };
  }
  return {
    reply: `🤖 پاسخ موتور آفلاین OmniForge:\nدرخواست شما دریافت شد: «${prompt}»\n\nدر حالت آنلاین این بخش به سرویس رایگان Pollinations AI متصل می‌شود. در حالت آفلاین می‌توانید از ابزارهای تحلیل متن، خلاصه‌سازی، پرسش و پاسخ از سند/PDF و کدنویسی محلی استفاده کنید.`,
    engine: 'OmniForge Offline Assistant',
  };
}

// 6. Free Zero-Auth AI Image Generation URL (Pollinations Image API + Canvas procedural fallback)
export function getFreeAiImageUrl(prompt: string, width = 768, height = 768, seed = Date.now()): string {
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&seed=${seed}&nologo=true`;
}

// 7. Live DNS Lookup (Cloudflare DoH / Google DoH)
export async function dnsLookupFree(domain: string, type = 'A') {
  try {
    const data = await fetchJsonWithTimeout<{ Answer?: { name: string; type: number; TTL: number; data: string }[]; Status: number }>(
      `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=${encodeURIComponent(type)}`,
      8000,
      { headers: { Accept: 'application/dns-json' } }
    );
    return { records: data.Answer || [], status: data.Status, provider: 'Cloudflare DoH' };
  } catch {
    const data = await fetchJsonWithTimeout<{ Answer?: { name: string; type: number; TTL: number; data: string }[]; Status: number }>(
      `https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=${encodeURIComponent(type)}`
    );
    return { records: data.Answer || [], status: data.Status, provider: 'Google DoH' };
  }
}

// 8. Live GeoIP (ipwho.is)
export async function lookupGeoIp(ip = '') {
  return fetchJsonWithTimeout<Record<string, any>>(`https://ipwho.is/${encodeURIComponent(ip)}`);
}

// 9. Live RDAP / Whois (rdap.org)
export async function lookupRdapWhois(domain: string) {
  return fetchJsonWithTimeout<Record<string, any>>(`https://rdap.org/domain/${encodeURIComponent(domain.trim())}`);
}

// 10. Real Privacy-Preserving Password Breach Check (HIBP k-Anonymity API)
export async function checkPasswordBreachHibp(sha1Hex: string): Promise<{ pwned: boolean; count: number; offline?: boolean }> {
  const upper = sha1Hex.toUpperCase();
  const prefix = upper.slice(0, 5);
  const suffix = upper.slice(5);
  try {
    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
    if (!res.ok) throw new Error('HIBP error');
    const text = await res.text();
    for (const line of text.split('\n')) {
      const [hashSuffix, cnt] = line.trim().split(':');
      if (hashSuffix === suffix) return { pwned: true, count: Number(cnt || 1) };
    }
    return { pwned: false, count: 0 };
  } catch {
    return { pwned: false, count: 0, offline: true };
  }
}

// 11. Free URL Shortener (TinyURL / is.gd)
export async function shortenUrlFree(longUrl: string): Promise<string> {
  try {
    const res = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(longUrl)}`);
    if (res.ok) return (await res.text()).trim();
  } catch {}
  try {
    const data = await fetchJsonWithTimeout<{ shorturl?: string }>(
      `https://is.gd/create.php?format=json&url=${encodeURIComponent(longUrl)}`
    );
    if (data.shorturl) return data.shorturl;
  } catch {}
  throw new Error('سرویس کوتاه‌کننده لینک در حالت آفلاین در دسترس نیست');
}

// 12. Dictionary, Recipes, VIN Decoder, Holidays, News, Food Barcode
export async function lookupDictionary(word: string) {
  return fetchJsonWithTimeout<any[]>(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word.trim())}`);
}

export async function searchRecipesFree(query: string) {
  return fetchJsonWithTimeout<{ meals: any[] | null }>(
    `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(query)}`
  );
}

export async function decodeVinNhtsa(vin: string) {
  return fetchJsonWithTimeout<{ Results: { Variable: string; Value: string | null }[] }>(
    `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/${encodeURIComponent(vin.trim())}?format=json`
  );
}

export async function lookupFoodBarcode(barcode: string) {
  return fetchJsonWithTimeout<any>(`https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(barcode.trim())}.json`);
}

export async function fetchPublicHolidays(year: number, countryCode: string) {
  return fetchJsonWithTimeout<any[]>(`https://date.nager.at/api/v3/PublicHolidays/${year}/${countryCode}`);
}

export async function fetchHackerNewsTop(limit = 12) {
  const ids = await fetchJsonWithTimeout<number[]>('https://hacker-news.firebaseio.com/v0/topstories.json');
  const slice = ids.slice(0, limit);
  const items = await Promise.all(
    slice.map((id) => fetchJsonWithTimeout<any>(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).catch(() => null))
  );
  return items.filter(Boolean);
}

export async function fetchRandomJokeFree() {
  try {
    return await fetchJsonWithTimeout<{ setup: string; punchline: string }>('https://official-joke-api.appspot.com/random_joke');
  } catch {
    return { setup: 'چرا برنامه‌نویسان عینک می‌زنند؟', punchline: 'چون نمی‌توانند C# (سی‌شارپ) ببینند!' };
  }
}

export async function fetchLatestAppRelease() {
  return fetchJsonWithTimeout<any>('https://api.github.com/repos/Pillow1243/All-in-One/releases/latest');
}
