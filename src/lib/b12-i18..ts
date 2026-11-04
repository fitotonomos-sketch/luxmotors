/**
 * Language support for multilingual sites.
 *
 * A site becomes multilingual by adding `src/i18n/locales.json`:
 *   { "defaultLocale": "en", "locales": { "en": { "lang": "en", "label": "English" },
 *                                         "de": { "lang": "de-DE", "label": "Deutsch" } } }
 * plus one `src/i18n/<locale>.json` dictionary per locale. The default locale is
 * served at `/`, every other locale under `/<locale>/` with the same page slugs.
 * Without locales.json every helper here describes a single-language site.
 *
 * Meant for frontmatter and server-rendered components. Importing it from a
 * client island ships every src/i18n/*.json dictionary to the browser and turns
 * a missing key from a build failure into a runtime error.
 */

export type LocaleInfo = { lang: string; label: string }
type LocalesConfig = { defaultLocale: string; locales: Record<string, LocaleInfo> }
// Not Record<string, string | Dictionary>: TypeScript rejects that as a circular alias (TS2456).
type Dictionary = { [key: string]: string | Dictionary }

// import.meta.glob rather than import: Vite inlines whichever of these files exist at build
// time, so a single-language site without src/i18n/ still builds.
const configModules = import.meta.glob<LocalesConfig>('../i18n/locales.json', { eager: true, import: 'default' })
const dictionaryModules = import.meta.glob<Dictionary>(['../i18n/*.json', '!../i18n/locales.json'], {
  eager: true,
  import: 'default',
})

const config: LocalesConfig | undefined = Object.values(configModules)[0]

export const locales: Record<string, LocaleInfo> = config?.locales ?? {}
export const isMultilingual = Object.keys(locales).length > 1
const firstLocale = Object.keys(locales)[0] ?? ''
export const defaultLocale = config?.defaultLocale ?? firstLocale

const pathOf = (url: URL | string) => (typeof url === 'string' ? url : url.pathname) || '/'

/** The locale a URL belongs to: its first path segment when that is a non-default locale. */
export function getLocale(url: URL | string): string {
  const first = pathOf(url).split('/')[1]
  return first && first !== defaultLocale && Object.hasOwn(locales, first) ? first : defaultLocale
}

/** The BCP 47 language tag (e.g., `de`, `de-CH`) that `<html lang>` and hreflang expect. */
export function htmlLang(locale: string): string {
  return locales[locale]?.lang ?? locale
}

/** Strips a non-default locale prefix, leaving the path shared by every language. */
export function unlocalizedPath(pathname: string): string {
  const locale = getLocale(pathname)
  if (locale === defaultLocale) return pathname
  return pathname.slice(locale.length + 1) || '/'
}

/** The same page in another locale, e.g. localizePath('/about/', 'de') → '/de/about/'. */
export function localizePath(pathname: string, locale: string): string {
  const base = unlocalizedPath(pathname)
  return locale === defaultLocale ? base : `/${locale}${base}`
}

/** Every language version of the current page, for the switcher and hreflang links. */
export function languageVersions(url: URL | string): { locale: string; lang: string; label: string; path: string }[] {
  const pathname = pathOf(url)
  return Object.entries(locales).map(([locale, info]) => ({
    locale,
    lang: info.lang,
    label: info.label,
    path: localizePath(pathname, locale),
  }))
}

function findTranslation(dictionary: Dictionary | undefined, key: string): string | undefined {
  const value = key.split('.').reduce<string | Dictionary | undefined>(
    (node, part) => (node && typeof node === 'object' ? node[part] : undefined),
    dictionary,
  )
  return typeof value === 'string' ? value : undefined
}

/**
 * A lookup into `src/i18n/<locale>.json` with dot-separated keys. A key missing
 * from one language falls back to the default language with a build warning, so
 * one gap never fails a whole build; a key missing everywhere throws.
 *
 *   const t = useTranslations(getLocale(Astro.url))
 *   <h1>{t('hero.title')}</h1>          // src/i18n/de.json: { "hero": { "title": "…" } }
 *   <title>{t('meta.title')}</title>
 */
export function useTranslations(locale: string): (key: string) => string {
  const dictionary = dictionaryModules[`../i18n/${locale}.json`]
  const fallback = dictionaryModules[`../i18n/${defaultLocale}.json`]
  if (!dictionary && !fallback) throw new Error(`Missing translation file src/i18n/${locale}.json`)
  return (key: string) => {
    const value = findTranslation(dictionary, key)
    if (value !== undefined) return value
    const fallbackValue = findTranslation(fallback, key)
    if (fallbackValue === undefined) throw new Error(`Missing translation "${key}" in src/i18n/${locale}.json`)
    console.warn(`[b12-i18n] Missing translation "${key}" in src/i18n/${locale}.json; using ${defaultLocale}`)
    return fallbackValue
  }
}
