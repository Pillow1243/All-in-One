import { PublicApiEntry } from '../types';

// Extracted directly from https://github.com/public-apis/public-apis (Auth: No, HTTPS: Yes, CORS: Yes)
export const PUBLIC_APIS_DIRECTORY: PublicApiEntry[] = [
  {
    "name": "Open-Meteo Weather & Soil",
    "category": "Weather",
    "description": "Free weather, UV, elevation, and soil moisture forecasts with no API key",
    "url": "https://open-meteo.com/",
    "sampleEndpoint": "https://api.open-meteo.com/v1/forecast?latitude=35.6892&longitude=51.3890&current=temperature_2m,relative_humidity_2m,wind_speed_10m",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "Currency-api (fawazahmed0)",
    "category": "Currency Exchange",
    "description": "150+ fiat, crypto & gold exchange rates updated daily with zero rate limits",
    "url": "https://github.com/fawazahmed0/currency-api",
    "sampleEndpoint": "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "CoinGecko Public",
    "category": "Cryptocurrency",
    "description": "Live cryptocurrency prices and 24h market changes",
    "url": "https://www.coingecko.com/en/api",
    "sampleEndpoint": "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd&include_24hr_change=true",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "Pollinations Free AI",
    "category": "Machine Learning",
    "description": "Zero-auth AI text, chat, and image generation API",
    "url": "https://pollinations.ai/",
    "sampleEndpoint": "https://text.pollinations.ai/Hello%20from%20OmniForge",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "MyMemory Translation",
    "category": "Text Analysis",
    "description": "Free multilingual translation API supporting Persian, Arabic, English & 50+ languages",
    "url": "https://mymemory.translated.net/doc/spec.php",
    "sampleEndpoint": "https://api.mymemory.translated.net/get?q=Hello%20World&langpair=en|fa",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "Free Dictionary API",
    "category": "Dictionaries",
    "description": "Definitions, phonetics, audio pronunciations, and synonyms",
    "url": "https://dictionaryapi.dev/",
    "sampleEndpoint": "https://api.dictionaryapi.dev/api/v2/entries/en/technology",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "Cloudflare DNS-over-HTTPS",
    "category": "Development",
    "description": "Instant JSON DNS lookups (A, AAAA, MX, TXT, NS)",
    "url": "https://developers.cloudflare.com/1.1.1.1/encryption/dns-over-https/",
    "sampleEndpoint": "https://dns.google/resolve?name=github.com&type=A",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "IPWho.is GeoIP",
    "category": "Geocoding",
    "description": "IP geolocation, ISP, ASN, timezone, and country lookup",
    "url": "https://ipwho.is/",
    "sampleEndpoint": "https://ipwho.is/8.8.8.8",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "Have I Been Pwned k-Anonymity",
    "category": "Security",
    "description": "Privacy-preserving breached password range checker via SHA-1 prefix",
    "url": "https://haveibeenpwned.com/API/v3",
    "sampleEndpoint": "https://api.pwnedpasswords.com/range/5BAA6",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "TheMealDB",
    "category": "Food & Drink",
    "description": "Free worldwide recipes, ingredients, and cooking instructions",
    "url": "https://www.themealdb.com/api.php",
    "sampleEndpoint": "https://www.themealdb.com/api/json/v1/1/search.php?s=pasta",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "OpenFoodFacts",
    "category": "Food & Drink",
    "description": "Barcode food nutrition, calories, and ingredients database",
    "url": "https://world.openfoodfacts.org/data",
    "sampleEndpoint": "https://world.openfoodfacts.org/api/v0/product/3017620422003.json",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "NHTSA vPIC VIN Decoder",
    "category": "Vehicle",
    "description": "Official US NHTSA vehicle VIN decoder and makes catalog",
    "url": "https://vpic.nhtsa.dot.gov/api/",
    "sampleEndpoint": "https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/1HGCM82633A004352?format=json",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "REST Countries",
    "category": "Open Data",
    "description": "Complete countries database: flags, codes, currencies, languages, capitals",
    "url": "https://restcountries.com/",
    "sampleEndpoint": "https://restcountries.com/v3.1/name/iran",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "Open Library",
    "category": "Books",
    "description": "Search millions of books, authors, and ISBN metadata",
    "url": "https://openlibrary.org/developers/api",
    "sampleEndpoint": "https://openlibrary.org/search.json?q=clean+code&limit=5",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "Official Joke API",
    "category": "Entertainment",
    "description": "Random programming and general jokes JSON API",
    "url": "https://github.com/15Dkatz/official_joke_api",
    "sampleEndpoint": "https://official-joke-api.appspot.com/random_joke",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "Cat Facts",
    "category": "Animals",
    "description": "Random cat facts",
    "url": "https://catfact.ninja/",
    "auth": "No",
    "https": true,
    "cors": "Yes",
    "sampleEndpoint": "https://catfact.ninja/fact"
  },
  {
    "name": "Dog Facts",
    "category": "Animals",
    "description": "Random dog facts",
    "url": "https://dukengn.github.io/Dog-facts-API/",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "Dogs",
    "category": "Animals",
    "description": "Based on the Stanford Dogs Dataset",
    "url": "https://dog.ceo/dog-api/",
    "auth": "No",
    "https": true,
    "cors": "Yes",
    "sampleEndpoint": "https://dog.ceo/api/breeds/image/random"
  },
  {
    "name": "FishWatch",
    "category": "Animals",
    "description": "Information and pictures about individual fish species",
    "url": "https://www.fishwatch.gov/developers",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "AnimeFacts",
    "category": "Anime",
    "description": "Anime Facts (over 100+)",
    "url": "https://chandan-02.github.io/anime-facts-rest-api/",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "AnimeNewsNetwork",
    "category": "Anime",
    "description": "Anime industry news",
    "url": "https://www.animenewsnetwork.com/encyclopedia/api.php",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "Catboy",
    "category": "Anime",
    "description": "Neko images, funny GIFs & more",
    "url": "https://catboys.com/api",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "FillerLists",
    "category": "Anime",
    "description": "Filler, mixed and canon labels for every episode of 13 long anime (JSON and CSV)",
    "url": "https://fillerlists.com/data",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "ScanMalware",
    "category": "Anti-Malware",
    "description": "Scan URLs in a sandboxed browser and search past scans by domain, IP, ASN, JARM or favicon hash",
    "url": "https://scanmalware.com",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "URLhaus",
    "category": "Anti-Malware",
    "description": "Bulk queries and Download Malware Samples",
    "url": "https://urlhaus-api.abuse.ch/",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "3DTexel",
    "category": "Art & Design",
    "description": "Search free CC0 PBR materials, HDRIs, decals and 3D models for games",
    "url": "https://3dtexel.com/developers/#public-api",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "Art Institute of Chicago",
    "category": "Art & Design",
    "description": "Art",
    "url": "https://api.artic.edu/docs/",
    "auth": "No",
    "https": true,
    "cors": "Yes",
    "sampleEndpoint": "https://api.artic.edu/api/v1/artworks?limit=5"
  },
  {
    "name": "EmojiHub",
    "category": "Art & Design",
    "description": "Get emojis by categories and groups",
    "url": "https://github.com/cheatsnake/emojihub",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "Face Shape Guide Lookup",
    "category": "Art & Design",
    "description": "Read-only lookup for published face-shape guide records",
    "url": "https://myfaceshapechart.com/openapi.json",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "ClearTrace",
    "category": "Blockchain",
    "description": "Cross-frontend DEX attribution and execution quality data across Ethereum and L2s",
    "url": "https://cleartracedata.com/docs",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "Get Started with Web3",
    "category": "Blockchain",
    "description": "Bilingual Web3 lessons, glossary search and role-based learning paths",
    "url": "https://github.com/beihaili/Get-Started-with-Web3/blob/main/docs/api.md",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "HEY Research Lab",
    "category": "Blockchain",
    "description": "Builder activity for Robinhood Chain tokens and projects: who is shipping, each ship with its source",
    "url": "https://heyresearch.xyz/developers",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "MELEK",
    "category": "Blockchain",
    "description": "Graphene social blockchain (Steem family) with a keyless condenser_api JSON-RPC",
    "url": "https://witness.melek.salon/dev/melek",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "Bayan",
    "category": "Books",
    "description": "Arabic Islamic encyclopedia: hadith with grades and takhrij, Quran with tafsir, narrators",
    "url": "https://bayan.alwa7i.com/api",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "Bhagavad Gita telugu",
    "category": "Books",
    "description": "Bhagavad Gita API in telugu and odia languages",
    "url": "https://gita-api.vercel.app",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "Bible-api",
    "category": "Books",
    "description": "Free Bible API with multiple languages",
    "url": "https://bible-api.com/",
    "auth": "No",
    "https": true,
    "cors": "Yes",
    "sampleEndpoint": "https://bible-api.com/john%203:16"
  },
  {
    "name": "BookRank",
    "category": "Books",
    "description": "Book rankings from open reader ratings: books, series, reading orders and authors",
    "url": "https://openbookrank.com/en/open-data",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "KontragentPro",
    "category": "Business",
    "description": "Russian company data from state registers by INN or OGRN: profile, finances, timeline",
    "url": "https://kontragentpro.ru/api/v2/docs",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "Legal Sandbox Georgia",
    "category": "Business",
    "description": "Find verified legal specialists in Georgia from natural-language queries",
    "url": "https://legal.ge/api/openapi.json",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "Logoapi",
    "category": "Business",
    "description": "Free SVG company logos by domain, plus search by name. No signup",
    "url": "https://logoapi.sh/docs",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "Pick an Agency",
    "category": "Business",
    "description": "Search 47,000+ marketing agencies by service, location and rating",
    "url": "https://www.pickanagency.com/developers",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "caldays",
    "category": "Calendar",
    "description": "Public holidays for 195+ countries",
    "url": "https://caldays.com/api",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "CountdownsHQ",
    "category": "Calendar",
    "description": "Dates and timezone-correct countdowns for 150+ holidays and observances in 18 countries",
    "url": "https://countdownshq.com/developers",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "HolidayExplore",
    "category": "Calendar",
    "description": "Global public holidays and bank closures",
    "url": "https://holidayexplore.com/api-docs/",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "India Public Holidays",
    "category": "Calendar",
    "description": "Official Indian public holidays for the Central government and 36 states/UTs",
    "url": "https://calendar-api-web.vercel.app/docs",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "Deed",
    "category": "Cloud Storage & File Sharing",
    "description": "Publish an HTML file or folder to a permanent public URL with one PUT, no account",
    "url": "https://deed.page/docs",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "Pantry",
    "category": "Cloud Storage & File Sharing",
    "description": "Free JSON storage for small projects",
    "url": "https://getpantry.cloud/",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "0x",
    "category": "Cryptocurrency",
    "description": "API for querying token and pool stats across various liquidity pools",
    "url": "https://docs.0x.org/",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "Alpha (Mossland)",
    "category": "Cryptocurrency",
    "description": "Korean crypto channel stance + RAG Q&A + canonical entity/topic/event store",
    "url": "https://alpha.moss.land/developers",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "Bitcoin Halving",
    "category": "Cryptocurrency",
    "description": "Halving era, block reward, and schedule arithmetic for any Bitcoin block height",
    "url": "https://why21million.com/halving-api/",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "BitcoinYield",
    "category": "Cryptocurrency",
    "description": "Live yields on BTC, ETH and stablecoins across DeFi and CeFi, with an A-D risk grade per offer",
    "url": "https://bitcoinyield.co/docs",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "AllRatesToday",
    "category": "Currency Exchange",
    "description": "Official exchange rates published by 121 central banks and tax authorities, keyless latest table",
    "url": "https://allratestoday.com/central-bank-rates-api/",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "api-mint",
    "category": "Currency Exchange",
    "description": "Free utility APIs: timezone, forex rates, crypto prices, page metadata",
    "url": "https://api-mint.hoiwan.workers.dev",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "Currency-api",
    "category": "Currency Exchange",
    "description": "Free Currency Exchange Rates API with 150+ Currencies & No Rate Limits",
    "url": "https://github.com/fawazahmed0/currency-api#readme",
    "auth": "No",
    "https": true,
    "cors": "Yes",
    "sampleEndpoint": "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json"
  },
  {
    "name": "Daleelak",
    "category": "Currency Exchange",
    "description": "Egyptian bank and dealer exchange rates, gold and silver prices",
    "url": "https://getdaleelak.com/en/api",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "24 Pull Requests",
    "category": "Development",
    "description": "Project to promote open source collaboration during December",
    "url": "https://24pullrequests.com/api",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "Agent Nexus",
    "category": "Development",
    "description": "Continuously probed registry of APIs, MCP servers and CLIs callable by agents",
    "url": "https://agentnexus.app/llms.txt",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "AgentPay Domain Lookup",
    "category": "Development",
    "description": "DNS records, WHOIS/RDAP, IP ownership and domain reports for AI agents, paid per call via x402",
    "url": "https://agentpay-lookup.agentpay-apis.workers.dev",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "Agify.io",
    "category": "Development",
    "description": "Estimates the age from a first name",
    "url": "https://agify.io",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "High Valyrian Translators",
    "category": "Dictionaries",
    "description": "High Valyrian dictionary (400 words with IPA) and Dothraki phrases as free open JSON datasets",
    "url": "https://github.com/HVTranslators/high-valyrian-api",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "Random Lexicon",
    "category": "Dictionaries",
    "description": "Random words and definitions using optional filters",
    "url": "https://randomlexicon.com/api-reference",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "Wiktionary",
    "category": "Dictionaries",
    "description": "Collaborative dictionary data",
    "url": "https://en.wiktionary.org/w/api.php",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "WordSoHard",
    "category": "Dictionaries",
    "description": "Word definitions with Scrabble validity and tile score in one call, built for word games",
    "url": "https://wordsohard.com/api",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "AgentPay Doc Tools",
    "category": "Documents & Productivity",
    "description": "PDF to text, RSS/Atom/JSON feeds to JSON and sitemaps to URL lists, paid per call via x402",
    "url": "https://agentpay-tools.agentpay-apis.workers.dev",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "CleverUtils",
    "category": "Documents & Productivity",
    "description": "Convert files between 200+ formats, free with no API key",
    "url": "https://cleverutils.com/api",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "DocStruct",
    "category": "Documents & Productivity",
    "description": "AI extraction of invoices, receipts, bank statements & contracts into structured JSON/CSV",
    "url": "https://docstruct.pages.dev",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "KaijuConverter",
    "category": "Documents & Productivity",
    "description": "Convert 201+ file formats, OCR, PDF/A & exact KB compression",
    "url": "https://kaijuconverter.com/api-docs",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "AGPC Domain Check",
    "category": "Email",
    "description": "Check a domain's SPF, DKIM, DMARC and MX with a graded shareable report",
    "url": "https://guild.tradeuniquecapital.com/api",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "Disify",
    "category": "Email",
    "description": "Validate and detect disposable and temporary email addresses",
    "url": "https://www.disify.com/",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "Email Spam Tester",
    "category": "Email",
    "description": "Send a test message and get a spam score, 41 checks with RFC citations and a fix plan",
    "url": "https://email-spam-tester.com/api-docs/",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "Email Validator by LifeStep",
    "category": "Email",
    "description": "Validate email syntax and MX, detect disposable/role addresses, suggest typo fixes",
    "url": "https://email.lifestep.io",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "Bucketlist Dream of the Day",
    "category": "Entertainment",
    "description": "Daily travel and life-experience inspiration with canonical links and images",
    "url": "https://bucketlist.nl/samenwerken?lang=en#droom-van-de-dag",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "Corporate Buzz Words",
    "category": "Entertainment",
    "description": "REST API for Corporate Buzz Words",
    "url": "https://github.com/sameerkumar18/corporate-bs-generator-api",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "CosmyDay Astrology",
    "category": "Entertainment",
    "description": "Natal charts and sky events computed from Swiss Ephemeris",
    "url": "https://cosmyday.com/api-docs",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "Fun Fact",
    "category": "Entertainment",
    "description": "A simple HTTPS api that can randomly select and return a fact from the FFA database",
    "url": "https://api.aakhilv.me",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "Calendrier Tempo",
    "category": "Environment",
    "description": "French EDF Tempo tariff: today's and tomorrow's colour, kWh prices and 15-day colour forecasts",
    "url": "https://www.calendrier-tempo.fr/api-tempo",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "GridVigil",
    "category": "Environment",
    "description": "Pressure scores, demand, generation mix and alerts for the 10 major U.S. power grids",
    "url": "https://gridvigil.com/developers",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "kanari",
    "category": "Environment",
    "description": "Real-time worldwide wildfire detections, water bomber tracking and open fire archive",
    "url": "https://kanari.io/en/api",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "Open-Meteo",
    "category": "Environment",
    "description": "Free weather API for non-commercial use",
    "url": "https://open-meteo.com/",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "NeedATicket",
    "category": "Events",
    "description": "UK and US resale ticket prices from StubHub",
    "url": "https://needaticket.co.uk/developers",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "Things To Do",
    "category": "Events",
    "description": "Local events in plain words: concerts, pop-ups, markets, classes, gallery nights",
    "url": "https://thingstodoapi.com/docs/",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "Banking Access Index",
    "category": "Finance",
    "description": "Which US business banking providers accept founders by country of residence, with sources",
    "url": "https://www.globalsolo.global/data/banking-access-index",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "Brainy Prices",
    "category": "Finance",
    "description": "UAE living costs: KHDA fees, DLD rents, fuel, utilities, telecom and relocation, with dated sources",
    "url": "https://prices.brainy.ae/developers.html",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "CardBinCheck",
    "category": "Finance",
    "description": "Card BIN/IIN lookup: network, issuer, country and card type for the first 6-8 digits",
    "url": "https://cardbincheck.com/bin-lookup-api",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "contix",
    "category": "Finance",
    "description": "Spain: IBAN validation with bank and BIC, EU VAT number check (VIES), Modelo 303 VAT sums",
    "url": "https://contix.es/api/#herramientas",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "BaconMockup",
    "category": "Food & Drink",
    "description": "Resizable bacon placeholder images",
    "url": "https://baconmockup.com/",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "Daily Food Recalls",
    "category": "Food & Drink",
    "description": "U.S. FDA and USDA food recalls, merged and normalized, updated daily",
    "url": "https://dailyfoodrecalls.com/api/",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "ExactCup",
    "category": "Food & Drink",
    "description": "Cooking ingredient densities: grams per US cup, tablespoon, teaspoon and mL",
    "url": "https://exactcup.github.io/api/",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "FiberUp Fiber Database",
    "category": "Food & Drink",
    "description": "Dietary fiber per serving and per 100 g, split into soluble and insoluble, for ~200 common foods",
    "url": "https://fiberup.app/data/",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "AmiiboAPI",
    "category": "Games & Comics",
    "description": "Nintendo Amiibo Information",
    "url": "https://amiiboapi.com/",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "Astroworld",
    "category": "Games & Comics",
    "description": "Free Minecraft data: mobs, biomes, items, enchantments, structures, commands, versions, achievements, trades",
    "url": "https://api.astroworldmc.com",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "Autochess VNG",
    "category": "Games & Comics",
    "description": "Rest Api for Autochess VNG",
    "url": "https://github.com/didadadida93/autochess-vng-api",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "Barter.VG",
    "category": "Games & Comics",
    "description": "Provides information about Game, DLC, Bundles, Giveaways, Trading",
    "url": "https://github.com/bartervg/barter.vg/wiki",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "17NAS",
    "category": "Geocoding",
    "description": "Free IP geolocation API with IPv4/IPv6 detection, ASN and country info, no auth required",
    "url": "https://17nas.com",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "administrative-divisons-db",
    "category": "Geocoding",
    "description": "Get all administrative divisions of a country",
    "url": "https://github.com/kamikazechaser/administrative-divisions-db",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "bng2latlong",
    "category": "Geocoding",
    "description": "Convert British OSGB36 easting and northing (British National Grid) to WGS84 latitude and longitude",
    "url": "https://www.getthedata.com/bng2latlong",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "Country",
    "category": "Geocoding",
    "description": "Get your visitor's country from their IP",
    "url": "http://country.is/",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "Ayes and Noes",
    "category": "Government",
    "description": "UK House of Commons MPs, parties and recorded votes",
    "url": "https://ayesandnoes.co.uk/developers",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "Bidledger",
    "category": "Government",
    "description": "Every open public tender in the European Union, rebuilt daily from the official TED data",
    "url": "https://jaydemks.github.io/bidledger/api.html",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "Brazil",
    "category": "Government",
    "description": "Community driven API for Brazil Public Data",
    "url": "https://brasilapi.com.br/",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "City, Toronto Open Data",
    "category": "Government",
    "description": "Toronto (CA) City Open Data",
    "url": "https://open.toronto.ca/",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "BabyData",
    "category": "Health",
    "description": "UK pregnancy due date, ovulation and Statutory Maternity Pay calculators",
    "url": "https://babydata.co.uk/api/",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "CheckWaitingTimes",
    "category": "Health",
    "description": "NHS England waiting times by hospital and area: planned care, A&E with live waits, scans, ambulances",
    "url": "https://checkwaitingtimes.co.uk/developers",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "Covid-19",
    "category": "Health",
    "description": "Covid 19 spread, infection and recovery",
    "url": "https://covid19api.com/",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "Covid-19 Government Response",
    "category": "Health",
    "description": "Government measures tracker to fight against the Covid-19 pandemic",
    "url": "https://covidtracker.bsg.ox.ac.uk",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "AI Dev Jobs",
    "category": "Jobs",
    "description": "AI/ML engineering job aggregator with REST, RSS, and MCP endpoints",
    "url": "https://aidevboard.com/openapi.yaml",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "AI Trainer Work",
    "category": "Jobs",
    "description": "Open AI training jobs (RLHF, data annotation, expert evaluation) from 20+ platforms, with pay",
    "url": "https://aitrainer.work/open-data#api",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "Arbeitnow",
    "category": "Jobs",
    "description": "API for Job board aggregator in Europe / Remote",
    "url": "https://documenter.getpostman.com/view/18545278/UVJbJdKh",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "Artificial Intelligence Jobs",
    "category": "Jobs",
    "description": "Live AI/ML job listings from 260+ companies' own career pages, with salary, location, remote and seniority filters",
    "url": "https://artificialintelligencejobs.co/developers",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "AI Economics Tools",
    "category": "Machine Learning",
    "description": "Token cost, LLM energy, agent-hour and Proof-Adjusted Autonomy calculators by Michał Piszczek",
    "url": "https://piszczek.pl/tools/api",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "AI Rate Card",
    "category": "Machine Learning",
    "description": "Daily-checked AI model API prices from 120+ providers, price history and cost estimates",
    "url": "https://airatecard.com/docs",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "DreamThreads",
    "category": "Machine Learning",
    "description": "Parse dreams into structured entities, emotions, agency, threat, and outcomes",
    "url": "https://mydreamthreads.xyz/dream-interpretation-api",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "EXUDE-API",
    "category": "Machine Learning",
    "description": "Used for the primary ways for filtering the stopping, stemming words from the text data",
    "url": "http://uttesh.com/exude-api/",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "ListenBrainz",
    "category": "Music",
    "description": "Open music listening data: scrobble history, statistics and recommendations",
    "url": "https://listenbrainz.readthedocs.io/en/latest/users/api/index.html",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "Open Guitar Chords",
    "category": "Music",
    "description": "Free JSON data for guitar chords, scales and fretboard positions",
    "url": "https://openguitarchords.com/data",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "Radio Browser",
    "category": "Music",
    "description": "List of internet radio stations",
    "url": "https://api.radio-browser.info/",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "Florida Man",
    "category": "News",
    "description": "Static JSON dataset of 10,000+ Florida Man headlines by date",
    "url": "https://github.com/juliayxhuang/florida-man-api#readme",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "Graphs for Coronavirus",
    "category": "News",
    "description": "Each Country separately and Worldwide Graphs for Coronavirus. Daily updates",
    "url": "https://corona.dnsforfamily.com/api.txt",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "Noozra",
    "category": "News",
    "description": "Free news headlines from 200+ curated RSS sources",
    "url": "https://noozra.com/api",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "Spaceflight News",
    "category": "News",
    "description": "Spaceflight related news 🚀",
    "url": "https://spaceflightnewsapi.net",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "10ML Fragrance Index",
    "category": "Open Data",
    "description": "Perfume knowledge: notes, accords, families, similar scents, houses, guides. By 10ML",
    "url": "https://mcp.10ml.com/openapi.json",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "221",
    "category": "Open Data",
    "description": "Senegal reference data: public holidays, mobile operators, banks, communes, legal forms",
    "url": "https://221.orvlabs.com/documentation",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "49 Gallery Historical Data",
    "category": "Open Data",
    "description": "Normalized historical records and 25 daily-updated reference series",
    "url": "https://api.181649.com/docs",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "API Setu",
    "category": "Open Data",
    "description": "An Indian Government platform that provides a lot of APIS for KYC, business, education & employment",
    "url": "https://www.apisetu.gov.in/",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "Evil Insult Generator",
    "category": "Open Source Projects",
    "description": "Evil Insults",
    "url": "https://evilinsult.com/api",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "GitHub Contribution Chart Generator",
    "category": "Open Source Projects",
    "description": "Create an image of your GitHub contributions",
    "url": "https://github-contributions.vercel.app",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "GitHub ReadMe Stats",
    "category": "Open Source Projects",
    "description": "Add dynamically generated statistics to your GitHub profile ReadMe",
    "url": "https://github.com/anuraghazra/github-readme-stats",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "Metabase",
    "category": "Open Source Projects",
    "description": "An open source Business Intelligence server to share data and analytics inside your company",
    "url": "https://www.metabase.com/",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "Astro Agents",
    "category": "Personality",
    "description": "Deterministic Western and Vedic astrology: natal charts, transits, kundli, dashas, panchang",
    "url": "https://astro-agent.dev/llms.txt",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "Inspiration",
    "category": "Personality",
    "description": "Motivational and Inspirational quotes",
    "url": "https://inspiration.goprogram.ai/docs/",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "kanye.rest",
    "category": "Personality",
    "description": "REST API for random Kanye West quotes",
    "url": "https://kanye.rest",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "kimiquotes",
    "category": "Personality",
    "description": "Team radio and interview quotes by Finnish F1 legend Kimi Räikkönen",
    "url": "https://kimiquotes.herokuapp.com/doc",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "Phone Specification",
    "category": "Phone",
    "description": "Rest Api for Phone specifications",
    "url": "https://github.com/azharimm/phone-specs-api",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "CropDen",
    "category": "Photography",
    "description": "Image sizes, safe zones and upload limits for 14 social platforms and passport photos",
    "url": "https://github.com/geektao1024/social-media-image-sizes#json-over-http",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "Botlero",
    "category": "Science & Math",
    "description": "Sourced, quoted specs for humanoid robots",
    "url": "https://botlero.com/api/robots",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "Chempirical",
    "category": "Science & Math",
    "description": "Chemical compounds with physical data, reactions and substructure search",
    "url": "https://chempirical.com/api/",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "CycleCalcs",
    "category": "Science & Math",
    "description": "Interpreted astronomy: sun and moon times, moon phases, planets, eclipses, seasons",
    "url": "https://www.cyclecalcs.com/api.html",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "DataCite",
    "category": "Science & Math",
    "description": "Search and retrieve DOI metadata for research datasets and publications",
    "url": "https://support.datacite.org/docs/rest-api",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "Classify",
    "category": "Security",
    "description": "Encrypting & decrypting text messages",
    "url": "https://classify-web.herokuapp.com/#/api",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "CSR.plus",
    "category": "Security",
    "description": "Generate certificate signing requests and private keys without OpenSSL",
    "url": "https://csr.plus/docs/api",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "dead-drop",
    "category": "Security",
    "description": "Ephemeral zero-knowledge encrypted data sharing",
    "url": "https://api.dead-drop.xyz/api/v1/docs",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "DefenceLevel Index",
    "category": "Security",
    "description": "Daily cyber threat level (DEFCON 5 to 1) with open method, history in JSON/CSV and a badge",
    "url": "https://defencelevel.com/index/api",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "ARC",
    "category": "Shopping",
    "description": "Open data on whether AI shopping agents can reach checkout at specific online stores",
    "url": "https://www.arcreport.ai/developers",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "BirkinBagStock",
    "category": "Shopping",
    "description": "Independent Hermès resale index: inventory, market prices, auction calendar and results",
    "url": "https://birkinbagstock.com/.well-known/openapi.json",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "Marketplace Fee Data",
    "category": "Shopping",
    "description": "Seller fee schedules for 21 e-commerce marketplaces and payment processors as JSON",
    "url": "https://www.sellerscalc.com/data",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "Nuvinty",
    "category": "Shopping",
    "description": "UK luxury list prices, price history, increases and partner pre-owned asking prices",
    "url": "https://nuvinty.com/api-docs",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "4chan",
    "category": "Social",
    "description": "Simple image-based bulletin board dedicated to a variety of topics",
    "url": "https://github.com/4chan/4chan-API",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "Bluesky",
    "category": "Social",
    "description": "Decentralized social networking via the AT protocol",
    "url": "https://docs.bsky.app/",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "disdex",
    "category": "Social",
    "description": "Search public Discord servers by name, language, guild tag and size, with member history",
    "url": "https://disdex.io/api",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "Doge-Meme",
    "category": "Social",
    "description": "Top meme posts from r/dogecoin which include 'Meme' flair",
    "url": "https://api.doge-meme.lol/docs",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "Ball Ranks",
    "category": "Sports & Fitness",
    "description": "NFL and NBA fantasy rankings and player projections",
    "url": "https://ballranks.com/developers",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "balldontlie",
    "category": "Sports & Fitness",
    "description": "Balldontlie provides access to stats data from the NBA",
    "url": "https://www.balldontlie.io",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "Bet Better",
    "category": "Sports & Fitness",
    "description": "Sports model win probabilities and fair odds across 13 leagues",
    "url": "https://betbetter.world/api/",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "Clutch",
    "category": "Sports & Fitness",
    "description": "Pregame NBA win probabilities for every game, graded after the final, as JSON and CSV",
    "url": "https://clutchledger.com/data/",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "AddressMock",
    "category": "Test Data",
    "description": "Random US, Hong Kong and Cape Verde addresses with matched city, state and ZIP",
    "url": "https://addressmock.com/api",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "DummyJSON",
    "category": "Test Data",
    "description": "Fake REST API with products, users, posts, comments, todos and more",
    "url": "https://dummyjson.com/",
    "auth": "No",
    "https": true,
    "cors": "Yes",
    "sampleEndpoint": "https://dummyjson.com/products?limit=5"
  },
  {
    "name": "FakerAPI",
    "category": "Test Data",
    "description": "APIs collection to get fake data",
    "url": "https://fakerapi.it/en",
    "auth": "No",
    "https": true,
    "cors": "Yes",
    "sampleEndpoint": "https://fakerapi.it/api/v2/persons?_quantity=3"
  },
  {
    "name": "flaky",
    "category": "Test Data",
    "description": "Fake REST API with chaos controls: force any status code, add latency, or a failure rate",
    "url": "https://flakyapi.dev",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "AirportMiles",
    "category": "Transportation",
    "description": "Airport codes, distances, routes and passenger numbers as static JSON files",
    "url": "https://airportmiles.com/api",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "Apimetro",
    "category": "Transportation",
    "description": "Geospatial data for Mexico City public transport system (Metro, Metrobús, Cablebús, RTP, etc.)",
    "url": "https://apimetro.dev/swagger/index.html",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "ArcNautical",
    "category": "Transportation",
    "description": "Screen any ship by IMO for OFAC/EU/UN/UK sanctions, ownership opacity and a vetting grade",
    "url": "https://arcnautical.com/developers/",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "Aviation Safety Data",
    "category": "Transportation",
    "description": "164,068 aircraft accident narratives from 128 official investigation authorities, plus FAA data",
    "url": "https://himaxym.com/developers",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "1pt",
    "category": "URL Shorteners",
    "description": "A simple URL shortener",
    "url": "https://github.com/1pt-co/api/blob/main/README.md",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "CleanURI",
    "category": "URL Shorteners",
    "description": "URL shortener service",
    "url": "https://cleanuri.com/docs",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "GoTiny",
    "category": "URL Shorteners",
    "description": "A lightweight URL shortener, focused on ease-of-use for the developer and end-user",
    "url": "https://github.com/robvanbakel/gotiny-api",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "Shrtcode",
    "category": "URL Shorteners",
    "description": "URl Shortener with multiple Domains",
    "url": "https://shrtco.de/docs",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "Bike Reliability",
    "category": "Vehicle",
    "description": "UK motorcycle reliability ranked by first-time MOT pass rates",
    "url": "https://bikereliability.co.uk/developers",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "BoltPatternHQ",
    "category": "Vehicle",
    "description": "Vehicle wheel fitment, bolt pattern (PCD), offset, and center bore specifications",
    "url": "https://boltpatternhq.com/mcp/",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "NHTSA Edge VIN Decoder",
    "category": "Vehicle",
    "description": "Decode US VINs offline from the NHTSA vPIC dataset, served from edge locations",
    "url": "https://data.ai-kit.net",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "ProblemsByVin",
    "category": "Vehicle",
    "description": "Owner complaints, recalls and failure-mileage statistics by vehicle make, model and year",
    "url": "https://problemsbyvin.com/data/",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "Bob's Burgers",
    "category": "Video",
    "description": "Bob's Burgers API",
    "url": "https://bobs-burgers-api-ui.herokuapp.com",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "Dune",
    "category": "Video",
    "description": "A simple API which provides you with book, character, movie and quotes JSON data",
    "url": "https://github.com/ywalia01/dune-api",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "Final Space",
    "category": "Video",
    "description": "Final Space API",
    "url": "https://finalspaceapi.com/docs/",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "Galaxy Movies",
    "category": "Video",
    "description": "Daily arrivals and departures per US streaming service",
    "url": "https://galaxymovies.app/api/streaming-changes?provider=netflix",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "FMI Open Data",
    "category": "Weather",
    "description": "Finnish weather, sea, climate and radar observations via open WFS",
    "url": "https://en.ilmatieteenlaitos.fi/open-data",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "Hail History",
    "category": "Weather",
    "description": "Radar-detected hail history for any US address from NOAA NEXRAD Level-III hail detections, by year",
    "url": "https://hail-history-noaa.netlify.app/api-docs.html",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "NASA POWER",
    "category": "Weather",
    "description": "Global solar and weather data for energy and agriculture",
    "url": "https://power.larc.nasa.gov/docs/",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  },
  {
    "name": "Open-Meteo Ensemble",
    "category": "Weather",
    "description": "Weather ensemble forecasts from multiple models",
    "url": "https://open-meteo.com/en/docs/ensemble-api",
    "auth": "No",
    "https": true,
    "cors": "Yes"
  }
];
