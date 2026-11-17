export const APP_VERSION = '2.0.0';
export const APP_NAME = 'OmniForge Pro';

export interface ReleaseNote {
  version: string;
  codename: string;
  date: string;
  highlights: { title: string; detail: string }[];
}

export const CHANGELOG: ReleaseNote[] = [
  {
    version: '2.0.0',
    codename: 'Forge',
    date: '2026-11-17',
    highlights: [
      {
        title: '۳۱ دسته‌بندی و ۱٬۰۲۰+ ابزار',
        detail: 'دسته تازه «ابزارهای هوشمند ۲.۰» با ۲۴ ابزار کامل: عدد به حروف فارسی، اسلاگ، JSON↔CSV و مقایسه ساختاری، Cron، UUID/ULID/NanoID، تاریخ جلالی، کارت/شبا/کد ملی، قیمت واحد، سن دقیق، درصد، کنتراست WCAG، QR، Base64، CSV و Markdown.',
      },
      {
        title: 'جستجوی همه‌جا با Ctrl/⌘ + K',
        detail: 'پالت فرمان با جستجوی فازی، حرکت با کیبورد و دسترسی مستقیم به آخرین ابزارها — دیگر لازم نیست بین ۳۰ دسته بگردید.',
      },
      {
        title: 'رابط کاربری بازطراحی‌شده',
        detail: 'سیستم طراحی تازه با عمق، شیشه واقعی، انیمیشن‌های ملایم، حالت روشن/تاریک/OLED دقیق‌تر و احترام کامل به تنظیم کاهش حرکت.',
      },
      {
        title: 'اشتراک‌گذاری و لینک مستقیم ابزار',
        detail: 'هر ابزار آدرس اختصاصی خودش را دارد (#/tool/…) و با Share Sheet اندروید قابل ارسال است.',
      },
      {
        title: 'آیکون و هویت بصری تازه',
        detail: 'نشان جدید «حلقه آهنگری» با هندسه دقیق و برداری؛ نام ثبت‌شده روی گوشی به‌صورت رسمی OmniForge Pro است.',
      },
      {
        title: 'سریع‌تر و سبک‌تر',
        detail: 'بارگذاری موتورها به‌صورت تنبل، کش آفلاین PWA بازنوسی‌شده و بهینه‌سازی چیدمان موبایل با ناحیه امن.',
      },
    ],
  },
];
