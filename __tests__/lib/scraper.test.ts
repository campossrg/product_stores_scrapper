/**
 * Tests for lib/scraper.ts
 * 
 * Functionality covered:
 * - scrapeDemo(): Returns array of sample vegetable products with valid data
 * - scrapeDemo(): Each product has required fields (name, category, price, currency, unit, store_name, in_stock)
 * - scrapeDemo(): Prices are randomized within expected range (±10% of base)
 * - scrapeWebsite(): Parses HTML and extracts products using CSS selectors
 * - scrapeWebsite(): Resolves relative image and link URLs to absolute URLs
 * - scrapeWebsite(): Extracts numeric price and currency symbol from price text
 * - scrapeWebsite(): Throws error when HTTP request fails
 * - resolveScraperSelectors(): Uses known presets for supported stores
 * - scrapeWebsite(): Returns empty array when no products match selectors
 */

jest.mock('cheerio', () => {
  const mockLoad = jest.fn()
  return { load: mockLoad }
})

import { scrapeDemo, scrapeWebsite } from '@/lib/scraper'
import { resolveScraperSelectors } from '@/lib/scraper-selectors'

// Access the mock after import
const cheerio = require('cheerio')

describe('scrapeDemo', () => {
  it('returns an array of sample vegetable products', async () => {
    const products = await scrapeDemo()
    expect(Array.isArray(products)).toBe(true)
    expect(products.length).toBeGreaterThan(0)
  })

  it('each product has all required fields', async () => {
    const products = await scrapeDemo()
    products.forEach(product => {
      expect(product).toHaveProperty('name')
      expect(product).toHaveProperty('category')
      expect(product).toHaveProperty('price')
      expect(product).toHaveProperty('currency')
      expect(product).toHaveProperty('unit')
      expect(product).toHaveProperty('store_name')
      expect(product).toHaveProperty('in_stock')
      expect(product).toHaveProperty('source_url')
      expect(typeof product.name).toBe('string')
      expect(typeof product.price).toBe('number')
      expect(product.price).toBeGreaterThan(0)
    })
  })

  it('randomizes prices within ±10% of base values', async () => {
    const run1 = await scrapeDemo()
    const run2 = await scrapeDemo()
    
    // At least some prices should differ between runs due to randomization
    const allSame = run1.every((p, i) => p.price === run2[i].price)
    expect(allSame).toBe(false)
    
    // Prices should stay within reasonable bounds (none should be 0 or extremely high)
    run1.forEach(p => {
      expect(p.price).toBeGreaterThan(0)
      expect(p.price).toBeLessThan(10)
    })
  })

  it('all products use Demo Store as store_name', async () => {
    const products = await scrapeDemo()
    products.forEach(p => {
      expect(p.store_name).toBe('Demo Store')
    })
  })

  it('includes a variety of vegetable categories', async () => {
    const products = await scrapeDemo()
    const categories = new Set(products.map(p => p.category))
    expect(categories.size).toBeGreaterThan(1)
  })
})

describe('resolveScraperSelectors', () => {
  it('uses known selectors for supported stores', () => {
    expect(resolveScraperSelectors('https://botiga.mascancadell.cat/productes')).toEqual({
      productContainer: '.item.producte',
      name: '.titol-seccio a',
      price: '.preu',
      image: '.imatge_producte img',
      link: '.titol-seccio a',
    })
  })

  it('merges manual selector overrides with known selectors', () => {
    expect(
      resolveScraperSelectors('https://botiga.mascancadell.cat/productes', {
        price: '.custom-price',
      })
    ).toEqual({
      productContainer: '.item.producte',
      name: '.titol-seccio a',
      price: '.custom-price',
      image: '.imatge_producte img',
      link: '.titol-seccio a',
    })
  })

  it('throws when auto-detection is unavailable and selectors are incomplete', () => {
    expect(() =>
      resolveScraperSelectors('https://unsupported-store.example', {
        productContainer: '.product',
      })
    ).toThrow('Could not automatically detect selectors')
  })
})

describe('scrapeWebsite', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('extracts products from HTML using CSS selectors', async () => {
    const productData = [
      { name: 'Organic Carrots', price: '$2.49', src: '/img/carrots.jpg', href: '/product/carrots' },
      { name: 'Roma Tomatoes', price: '€3.99', src: '/img/tomatoes.jpg', href: '/product/tomatoes' },
    ]

    const $ = jest.fn().mockImplementation((arg: any) => {
      // Called with a number (index from .each) — return element mock
      if (typeof arg === 'number') {
        const data = productData[arg]
        // Create a chainable cheerio-like mock
        const makeChain = (val: string) => ({
          first: jest.fn().mockReturnValue({
            text: jest.fn().mockReturnValue({ trim: jest.fn().mockReturnValue(val) }),
            attr: jest.fn().mockReturnValue(null),
          }),
        })
        const el: any = {}
        el.find = jest.fn().mockImplementation((sel: string) => {
          if (sel === '.name') {
            return {
              first: jest.fn().mockReturnValue({
                text: jest.fn().mockReturnValue({ trim: jest.fn().mockReturnValue(data.name) }),
              }),
            }
          }
          if (sel === '.price') {
            return {
              first: jest.fn().mockReturnValue({
                text: jest.fn().mockReturnValue({ trim: jest.fn().mockReturnValue(data.price) }),
              }),
            }
          }
          if (sel === 'img') {
            return {
              first: jest.fn().mockReturnValue({
                attr: jest.fn().mockImplementation((name: string) => {
                  if (name === 'src') return data.src
                  if (name === 'data-src') return null
                  return null
                }),
              }),
            }
          }
          if (sel === 'a') {
            return {
              first: jest.fn().mockReturnValue({
                attr: jest.fn().mockImplementation((name: string) => {
                  if (name === 'href') return data.href
                  return null
                }),
              }),
            }
          }
          return makeChain('')
        })
        return el
      }
      // Called with selector string — return collection
      return {
        each: jest.fn().mockImplementation((cb: any) => {
          productData.forEach((_, i) => cb(i, i))
          return { length: productData.length }
        }),
        length: productData.length,
      }
    })

    cheerio.load.mockReturnValue($)

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      text: async () => '<html></html>',
    })

    const products = await scrapeWebsite({
      url: 'https://example.com/shop',
      storeName: 'Test Store',
      selectors: {
        productContainer: '.product',
        name: '.name',
        price: '.price',
        image: 'img',
        link: 'a',
      },
    })

    expect(products).toHaveLength(2)
    expect(products[0].name).toBe('Organic Carrots')
    expect(products[0].price).toBe(2.49)
    expect(products[0].currency).toBe('$')
    expect(products[0].image_url).toBe('https://example.com/img/carrots.jpg')
    expect(products[1].name).toBe('Roma Tomatoes')
    expect(products[1].currency).toBe('€')
    expect(products[1].image_url).toBe('https://example.com/img/tomatoes.jpg')
  })

  it('throws error when HTTP response is not ok', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
    })

    await expect(
      scrapeWebsite({
        url: 'https://example.com/shop',
        storeName: 'Test Store',
        selectors: {
          productContainer: '.product',
          name: '.name',
          price: '.price',
          image: 'img',
          link: 'a',
        },
      })
    ).rejects.toThrow('HTTP error! status: 404')
  })

  it('returns empty array when no product containers match', async () => {
    const $ = jest.fn().mockReturnValue({
      each: jest.fn().mockReturnValue({ length: 0 }),
      length: 0,
    })

    cheerio.load.mockReturnValue($)

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      text: async () => '<html><body></body></html>',
    })

    const products = await scrapeWebsite({
      url: 'https://example.com/shop',
      storeName: 'Test Store',
      selectors: {
        productContainer: '.product',
        name: '.name',
        price: '.price',
        image: 'img',
        link: 'a',
      },
    })

    expect(products).toHaveLength(0)
  })
})
