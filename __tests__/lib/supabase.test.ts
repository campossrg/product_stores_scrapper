/**
 * Tests for lib/supabase.ts
 * 
 * Functionality covered:
 * - upsertProduct(): Inserts new product and returns it with generated fields
 * - upsertProduct(): Updates existing product on conflict (name + store_name)
 * - upsertProduct(): Returns null and logs error on database failure
 * - insertPriceHistory(): Inserts price record for a given product
 * - insertPriceHistory(): Handles database errors gracefully
 * - getProducts(): Returns array of products ordered by updated_at desc
 * - getProducts(): Returns empty array on error
 * - getProductHistory(): Returns price history ordered by scraped_at asc
 * - getProductHistory(): Returns empty array on error
 * - getProductsWithHistory(): Returns products enriched with price history arrays
 * - getProductsWithHistory(): Calculates price_change and price_change_percent from latest two entries
 * - getProductsWithHistory(): Returns null change fields when fewer than 2 history entries exist
 * - getProductsWithHistory(): Returns empty array on error
 */

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn().mockReturnValue({
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
  }),
}))

import {
  upsertProduct,
  insertPriceHistory,
  getProducts,
  getProductHistory,
  getProductsWithHistory,
} from '@/lib/supabase'

// Access the mock client after import
const supabase = require('@supabase/supabase-js')
const mockSupabaseClient = supabase.createClient()

describe('upsertProduct', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('inserts new product and returns it with generated fields', async () => {
    const mockProduct = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Organic Carrots',
      category: 'Root Vegetables',
      price: 2.49,
      currency: '$',
      unit: 'bunch',
      image_url: null,
      source_url: 'https://example.com/carrots',
      store_name: 'Demo Store',
      in_stock: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    }

    mockSupabaseClient.single.mockResolvedValue({ data: mockProduct, error: null })

    const result = await upsertProduct({
      name: 'Organic Carrots',
      category: 'Root Vegetables',
      price: 2.49,
      currency: '$',
      unit: 'bunch',
      image_url: null,
      source_url: 'https://example.com/carrots',
      store_name: 'Demo Store',
      in_stock: true,
    })

    expect(result).toEqual(mockProduct)
    expect(mockSupabaseClient.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Organic Carrots' }),
      expect.objectContaining({ onConflict: 'name,store_name' })
    )
  })

  it('returns null when database returns an error', async () => {
    mockSupabaseClient.single.mockResolvedValue({ data: null, error: { message: 'DB Error' } })

    const result = await upsertProduct({
      name: 'Fail Product',
      category: 'Test',
      price: 1.00,
      currency: '$',
      unit: 'each',
      image_url: null,
      source_url: 'https://example.com',
      store_name: 'Test Store',
      in_stock: true,
    })

    expect(result).toBeNull()
  })
})

describe('insertPriceHistory', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('inserts price history record successfully', async () => {
    mockSupabaseClient.insert.mockResolvedValue({ error: null })

    await insertPriceHistory('123', 2.49, '$', true)

    expect(mockSupabaseClient.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        product_id: '123',
        price: 2.49,
        currency: '$',
        in_stock: true,
      })
    )
  })

  it('handles database error without throwing', async () => {
    mockSupabaseClient.insert.mockResolvedValue({ error: { message: 'Insert failed' } })

    await expect(
      insertPriceHistory('123', 2.49, '$', true)
    ).resolves.not.toThrow()
  })
})

describe('getProducts', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns products ordered by updated_at desc', async () => {
    const mockProducts = [
      { id: '1', name: 'Carrots', updated_at: '2024-01-02T00:00:00Z' },
      { id: '2', name: 'Tomatoes', updated_at: '2024-01-01T00:00:00Z' },
    ]

    mockSupabaseClient.order.mockResolvedValue({ data: mockProducts, error: null })

    const result = await getProducts()

    expect(result).toHaveLength(2)
    expect(mockSupabaseClient.order).toHaveBeenCalledWith('updated_at', { ascending: false })
  })

  it('returns empty array on error', async () => {
    mockSupabaseClient.order.mockResolvedValue({ data: null, error: { message: 'DB Error' } })

    const result = await getProducts()
    expect(result).toEqual([])
  })
})

describe('getProductHistory', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns price history ordered by scraped_at ascending', async () => {
    const mockHistory = [
      { id: 'h1', product_id: 'p1', price: 2.00, scraped_at: '2024-01-01T00:00:00Z' },
      { id: 'h2', product_id: 'p1', price: 2.50, scraped_at: '2024-01-02T00:00:00Z' },
    ]

    mockSupabaseClient.order.mockResolvedValue({ data: mockHistory, error: null })

    const result = await getProductHistory('p1')

    expect(result).toHaveLength(2)
    expect(mockSupabaseClient.order).toHaveBeenCalledWith('scraped_at', { ascending: true })
  })

  it('returns empty array on error', async () => {
    mockSupabaseClient.order.mockResolvedValue({ data: null, error: { message: 'DB Error' } })

    const result = await getProductHistory('p1')
    expect(result).toEqual([])
  })
})

describe('getProductsWithHistory', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns products with their price history arrays', async () => {
    const mockData = [
      {
        id: 'p1',
        name: 'Carrots',
        price: 2.50,
        currency: '$',
        category: 'Root',
        unit: 'bunch',
        image_url: null,
        source_url: 'https://example.com',
        store_name: 'Store',
        in_stock: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-03T00:00:00Z',
        price_history: [
          { id: 'h1', product_id: 'p1', price: 2.00, currency: '$', in_stock: true, scraped_at: '2024-01-01T00:00:00Z' },
          { id: 'h2', product_id: 'p1', price: 2.50, currency: '$', in_stock: true, scraped_at: '2024-01-02T00:00:00Z' },
        ],
      },
    ]

    mockSupabaseClient.order.mockResolvedValue({ data: mockData, error: null })

    const result = await getProductsWithHistory()

    expect(result).toHaveLength(1)
    expect(result[0].price_history).toHaveLength(2)
    expect(result[0].price_change).toBe(0.50)
    expect(result[0].price_change_percent).toBe(25)
  })

  it('returns null change fields when only one history entry exists', async () => {
    const mockData = [
      {
        id: 'p1',
        name: 'Carrots',
        price: 2.00,
        currency: '$',
        category: 'Root',
        unit: 'bunch',
        image_url: null,
        source_url: 'https://example.com',
        store_name: 'Store',
        in_stock: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        price_history: [
          { id: 'h1', product_id: 'p1', price: 2.00, currency: '$', in_stock: true, scraped_at: '2024-01-01T00:00:00Z' },
        ],
      },
    ]

    mockSupabaseClient.order.mockResolvedValue({ data: mockData, error: null })

    const result = await getProductsWithHistory()

    expect(result[0].price_change).toBeNull()
    expect(result[0].price_change_percent).toBeNull()
  })

  it('returns null change fields when no history exists', async () => {
    const mockData = [
      {
        id: 'p1',
        name: 'Carrots',
        price: 2.00,
        currency: '$',
        category: 'Root',
        unit: 'bunch',
        image_url: null,
        source_url: 'https://example.com',
        store_name: 'Store',
        in_stock: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        price_history: [],
      },
    ]

    mockSupabaseClient.order.mockResolvedValue({ data: mockData, error: null })

    const result = await getProductsWithHistory()

    expect(result[0].price_change).toBeNull()
    expect(result[0].price_change_percent).toBeNull()
  })

  it('returns empty array on error', async () => {
    mockSupabaseClient.order.mockResolvedValue({ data: null, error: { message: 'DB Error' } })

    const result = await getProductsWithHistory()
    expect(result).toEqual([])
  })
})
