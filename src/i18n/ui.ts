export const languages = { de: 'Deutsch', ar: 'العربية' } as const;
export type Lang = keyof typeof languages;
export const defaultLang: Lang = 'de';

export const dir = (lang: Lang) => (lang === 'ar' ? 'rtl' : 'ltr');

/** Prefix a German path with the locale (German has no prefix). */
export function localizePath(path: string, lang: Lang): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  if (lang === defaultLang) return clean;
  return clean === '/' ? `/${lang}` : `/${lang}${clean}`;
}

/** Strip any locale prefix, returning the German path. */
export function basePath(pathname: string): string {
  const stripped = pathname.replace(/^\/ar(?=\/|$)/, '');
  return stripped === '' ? '/' : stripped.replace(/\.html$/, '');
}

export function getLangFromUrl(url: URL): Lang {
  return url.pathname === '/ar' || url.pathname.startsWith('/ar/') ? 'ar' : 'de';
}

/** Pick the localized field of a content entry, falling back to German. */
export function pick<T extends Record<string, unknown>>(entry: T, field: string, lang: Lang): string {
  const v = entry[`${field}_${lang}`] ?? entry[`${field}${lang === 'ar' ? 'Ar' : 'De'}`];
  const fallback = entry[`${field}_de`] ?? entry[`${field}De`] ?? entry[field];
  return (typeof v === 'string' && v.trim() ? v : (fallback as string)) ?? '';
}

export const nav = [
  { href: '/neue-moschee', key: 'nav.project' },
  { href: '/gebetszeiten', key: 'nav.prayer' },
  { href: '/programm', key: 'nav.program' },
  { href: '/mediathek', key: 'nav.media' },
  { href: '/aktuelles', key: 'nav.news' },
  { href: '/ueber-uns', key: 'nav.about' },
  { href: '/besuch', key: 'nav.visit' },
] as const;

const de = {
  'site.tagline': 'Kultur- und Begegnungsstätte in Hannover',
  'nav.home': 'Startseite',
  'nav.project': 'Neue Moschee',
  'nav.prayer': 'Gebetszeiten',
  'nav.program': 'Programm',
  'nav.media': 'Mediathek',
  'nav.live': 'Live',
  'nav.news': 'Aktuelles',
  'nav.about': 'Über uns',
  'nav.visit': 'Besuch',
  'nav.contact': 'Kontakt',
  'nav.donate': 'Jetzt spenden',
  'nav.menu': 'Menü',
  'nav.close': 'Schließen',
  'nav.skip': 'Zum Inhalt springen',
  'lang.switch': 'العربية',
  'lang.switchLabel': 'Seite auf Arabisch anzeigen',

  'prayer.fajr': 'Fadschr',
  'prayer.sunrise': 'Sonnenaufgang',
  'prayer.dhuhr': 'Dhuhr',
  'prayer.asr': 'Asr',
  'prayer.maghrib': 'Maghrib',
  'prayer.isha': 'Ischa',
  'prayer.jumuah': 'Freitagsgebet',
  'prayer.adhan': 'Adhan',
  'prayer.iqama': 'Iqama',
  'prayer.today': 'Gebetszeiten heute',
  'prayer.next': 'Nächstes Gebet',
  'prayer.in': 'in',
  'prayer.all': 'Alle Gebetszeiten',
  'prayer.provisional': 'Vorläufige Zeiten – der offizielle Gebetskalender für dieses Jahr folgt.',

  'campaign.raised': 'gesammelt',
  'campaign.of': 'von',
  'campaign.goal': 'Ziel',
  'campaign.deadline': 'Spendenfrist',
  'campaign.asOf': 'Stand',
  'campaign.donors': 'Spender',
  'campaign.sqm': 'm² gesichert',
  'campaign.daysLeft': 'Tage verbleibend',
  'campaign.cta': 'Jetzt spenden',
  'campaign.learn': 'Zum Projekt',

  'common.readMore': 'Weiterlesen',
  'common.all': 'Alle anzeigen',
  'common.copy': 'Kopieren',
  'common.copied': 'Kopiert',
  'common.share': 'Teilen',
  'common.after': 'nach',
  'common.language': 'Sprache',
  'common.lang.de': 'Deutsch',
  'common.lang.ar': 'Arabisch',
  'common.lang.de-ar': 'Deutsch & Arabisch',

  'weekday.0': 'Sonntag',
  'weekday.1': 'Montag',
  'weekday.2': 'Dienstag',
  'weekday.3': 'Mittwoch',
  'weekday.4': 'Donnerstag',
  'weekday.5': 'Freitag',
  'weekday.6': 'Samstag',

  'footer.about': 'Seit 1999 ein Ort des Gebets, des Lernens und der Begegnung im Herzen von Hannover-Vahrenwald.',
  'footer.visit': 'Besuchen Sie uns',
  'footer.contact': 'Kontakt',
  'footer.bank': 'Spendenkonto',
  'footer.links': 'Seiten',
  'footer.legal': 'Rechtliches',
  'footer.imprint': 'Impressum',
  'footer.privacy': 'Datenschutz',
  'footer.transparency': 'Transparenz',
  'footer.open': 'Täglich geöffnet zu den Gebetszeiten',

  'video.load': 'Video laden',
  'video.consent': 'Beim Abspielen werden Daten an YouTube (Google) übertragen.',
  'video.always': 'YouTube-Videos immer laden',
  'video.watchOn': 'Auf YouTube ansehen',
} as const;

export type UIKey = keyof typeof de;

const ar: Record<UIKey, string> = {
  'site.tagline': 'مركز ثقافي وملتقى في هانوفر',
  'nav.home': 'الرئيسية',
  'nav.project': 'المسجد الجديد',
  'nav.prayer': 'مواقيت الصلاة',
  'nav.program': 'البرنامج',
  'nav.media': 'المكتبة المرئية',
  'nav.live': 'بث مباشر',
  'nav.news': 'الأخبار',
  'nav.about': 'من نحن',
  'nav.visit': 'زيارة المسجد',
  'nav.contact': 'تواصل معنا',
  'nav.donate': 'تبرّع الآن',
  'nav.menu': 'القائمة',
  'nav.close': 'إغلاق',
  'nav.skip': 'انتقل إلى المحتوى',
  'lang.switch': 'Deutsch',
  'lang.switchLabel': 'Seite auf Deutsch anzeigen',

  'prayer.fajr': 'الفجر',
  'prayer.sunrise': 'الشروق',
  'prayer.dhuhr': 'الظهر',
  'prayer.asr': 'العصر',
  'prayer.maghrib': 'المغرب',
  'prayer.isha': 'العشاء',
  'prayer.jumuah': 'صلاة الجمعة',
  'prayer.adhan': 'الأذان',
  'prayer.iqama': 'الإقامة',
  'prayer.today': 'مواقيت الصلاة اليوم',
  'prayer.next': 'الصلاة القادمة',
  'prayer.in': 'بعد',
  'prayer.all': 'جميع المواقيت',
  'prayer.provisional': 'مواقيت تقريبية – سيُنشر التقويم الرسمي لهذا العام قريباً.',

  'campaign.raised': 'تم جمعها',
  'campaign.of': 'من',
  'campaign.goal': 'الهدف',
  'campaign.deadline': 'آخر موعد للتبرع',
  'campaign.asOf': 'بتاريخ',
  'campaign.donors': 'متبرع',
  'campaign.sqm': 'م² تم تأمينها',
  'campaign.daysLeft': 'يوماً متبقياً',
  'campaign.cta': 'تبرّع الآن',
  'campaign.learn': 'تفاصيل المشروع',

  'common.readMore': 'اقرأ المزيد',
  'common.all': 'عرض الكل',
  'common.copy': 'نسخ',
  'common.copied': 'تم النسخ',
  'common.share': 'مشاركة',
  'common.after': 'بعد',
  'common.language': 'اللغة',
  'common.lang.de': 'الألمانية',
  'common.lang.ar': 'العربية',
  'common.lang.de-ar': 'الألمانية والعربية',

  'weekday.0': 'الأحد',
  'weekday.1': 'الاثنين',
  'weekday.2': 'الثلاثاء',
  'weekday.3': 'الأربعاء',
  'weekday.4': 'الخميس',
  'weekday.5': 'الجمعة',
  'weekday.6': 'السبت',

  'footer.about': 'منذ عام 1999 مكانٌ للصلاة والتعلّم واللقاء في قلب حي فارينفالد بهانوفر.',
  'footer.visit': 'زورونا',
  'footer.contact': 'تواصل معنا',
  'footer.bank': 'حساب التبرعات',
  'footer.links': 'الصفحات',
  'footer.legal': 'معلومات قانونية',
  'footer.imprint': 'بيانات النشر (Impressum)',
  'footer.privacy': 'حماية البيانات',
  'footer.transparency': 'الشفافية',
  'footer.open': 'مفتوح يومياً في أوقات الصلاة',

  'video.load': 'تشغيل الفيديو',
  'video.consent': 'عند التشغيل تُنقل بيانات إلى يوتيوب (Google).',
  'video.always': 'تشغيل فيديوهات يوتيوب دائماً',
  'video.watchOn': 'المشاهدة على يوتيوب',
};

const dictionaries: Record<Lang, Record<UIKey, string>> = { de, ar };

export function useTranslations(lang: Lang) {
  return (key: UIKey) => dictionaries[lang][key] ?? de[key];
}

/** Locale for Intl formatters. Arabic uses Latin digits for times/amounts for readability. */
export const intlLocale = (lang: Lang) => (lang === 'ar' ? 'ar-u-nu-latn' : 'de-DE');

/** Amounts always use German formatting (1.300.000 €), which the community reads in both languages. */
export function formatEuro(amount: number, opts: Intl.NumberFormatOptions = {}) {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
    ...opts,
  }).format(amount);
}

export function formatNumber(n: number) {
  return new Intl.NumberFormat('de-DE').format(n);
}

export function formatDate(date: Date | string, lang: Lang, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' }) {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(intlLocale(lang), { timeZone: 'Europe/Berlin', ...opts }).format(d);
}
