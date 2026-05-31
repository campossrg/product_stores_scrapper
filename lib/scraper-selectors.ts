import { ScraperSelectors } from './types';

const KNOWN_STORE_SELECTORS: Record<string, ScraperSelectors> = {
  'botiga.mascancadell.cat': {
    productContainer: '.item.producte',
    name: '.titol-seccio a',
    price: '.preu',
    image: '.imatge_producte img',
    link: '.titol-seccio a',
  },
};

function normalizeHostname(url: string): string {
  return new URL(url).hostname.replace(/^www\./, '').toLowerCase();
}

function hasRequiredSelectors(selectors?: Partial<ScraperSelectors>): selectors is ScraperSelectors {
  return Boolean(
    selectors?.productContainer &&
      selectors?.name &&
      selectors?.price &&
      selectors?.image &&
      selectors?.link
  );
}

export function getKnownStoreSelectors(url: string): ScraperSelectors | null {
  const hostname = normalizeHostname(url);
  return KNOWN_STORE_SELECTORS[hostname] || null;
}

export function resolveScraperSelectors(
  url: string,
  selectors?: Partial<ScraperSelectors>
): ScraperSelectors {
  const knownSelectors = getKnownStoreSelectors(url) || {};
  const mergedSelectors = {
    ...knownSelectors,
    ...(selectors || {}),
  } as Partial<ScraperSelectors>;

  if (hasRequiredSelectors(mergedSelectors)) {
    return mergedSelectors;
  }

  throw new Error(
    'Could not automatically detect selectors for this website. Try a supported store URL or use advanced selectors.'
  );
}
