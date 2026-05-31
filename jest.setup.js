import '@testing-library/jest-dom'

// Mock fetch globally for API tests
global.fetch = jest.fn()

// Mock ResizeObserver for Recharts
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Polyfill Request for Next.js App Router API tests
if (!global.Request) {
  global.Request = class Request {
    constructor(input, init = {}) {
      if (typeof input === 'string') {
        this.url = input
      } else if (input instanceof URL) {
        this.url = input.href
      } else {
        this.url = String(input)
      }
      this.method = init.method || 'GET'
      this.headers = new Map()
      this.body = init.body || null
      if (init.headers) {
        Object.entries(init.headers).forEach(([k, v]) => this.headers.set(k, v))
      }
    }
    async json() {
      return JSON.parse(this.body)
    }
    async text() {
      return String(this.body)
    }
    async blob() {
      return new Blob([this.body])
    }
    async arrayBuffer() {
      const encoder = new TextEncoder()
      return encoder.encode(this.body).buffer
    }
    async formData() {
      return new FormData()
    }
  }
}

if (!global.URL) {
  global.URL = require('url').URL
}

if (!global.Response) {
  global.Response = class Response {
    constructor(body, init = {}) {
      this.body = body
      this.status = init.status || 200
      this.statusText = init.statusText || 'OK'
      this.headers = new Map()
      this.ok = this.status >= 200 && this.status < 300
      if (init.headers) {
        Object.entries(init.headers).forEach(([k, v]) => this.headers.set(k, v))
      }
    }
    async json() {
      return JSON.parse(this.body)
    }
    async text() {
      return String(this.body)
    }
    static json(data, init = {}) {
      const body = JSON.stringify(data)
      const headers = { 'Content-Type': 'application/json', ...(init.headers || {}) }
      return new Response(body, { ...init, headers })
    }
  }
}

// Suppress console.error for expected errors in tests
const originalConsoleError = console.error
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return
    }
    originalConsoleError.apply(console, args)
  }
})

afterAll(() => {
  console.error = originalConsoleError
})
