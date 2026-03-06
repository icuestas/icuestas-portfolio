import { translations, type Lang, type TranslationKey } from './translations';

export { type Lang, type TranslationKey };

export const languages: Record<Lang, { label: string; flag: string }> = {
  en: { label: 'English', flag: '🇺🇸' },
  es: { label: 'Español', flag: '🇪🇸' },
};

export function getLangFromUrl(url: URL): Lang {
  const [, maybeLang] = url.pathname.split('/');
  if (maybeLang in languages) return maybeLang as Lang;
  return 'en';
}

/** Returns alternate-locale URL for a given pathname. */
export function getAlternateUrl(pathname: string, targetLang: Lang): string {
  // Strip existing locale prefix if present
  const withoutLocale = pathname.replace(/^\/(es)(\/|$)/, '/');
  if (targetLang === 'en') return withoutLocale || '/';
  return `/${targetLang}${withoutLocale === '/' ? '' : withoutLocale}`;
}

export function useTranslations(lang: Lang) {
  return function t(key: TranslationKey): string | string[] {
    const val = (translations[lang] as Record<string, string | string[]>)[key];
    if (val !== undefined) return val;
    // Fallback to English
    return (translations.en as Record<string, string | string[]>)[key] ?? key;
  };
}
