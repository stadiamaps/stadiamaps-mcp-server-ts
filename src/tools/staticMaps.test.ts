import { describe, it, expect, vi } from 'vitest'
import {
  staticMapCentered,
  staticMapWithMarker,
  staticRouteMap,
  type StaticMapCenteredParams,
  type StaticMapWithMarkerParams,
  type StaticRouteMapParams,
  DEFAULT_STYLE
} from './staticMaps.js'

// Mock the config to avoid needing real API keys in tests
vi.mock('../config.js', () => ({
  API_KEY: 'test-api-key'
}))

// Mock fetch globally for Node.js environment
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('Static Maps Tools', () => {
  const setupSuccessfulMock = () => {
    vi.clearAllMocks()

    // Default successful fetch mock
    const mockPngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
    const mockPngBuffer = Buffer.from(mockPngBase64, 'base64')

    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      arrayBuffer: () => Promise.resolve(mockPngBuffer.buffer)
    } as Response)
  }

  describe('staticMapCentered', () => {
    it('should generate a centered static map', async () => {
      setupSuccessfulMock()

      const params: StaticMapCenteredParams = {
        lat: 37.7749,
        lon: -122.4194,
        zoom: 12,
        size: '400x400'
      }

      const result = await staticMapCentered(params)

      expect(result).toBeDefined()
      expect(result.content).toBeDefined()
      expect(result.content[0]).toHaveProperty('type', 'image')
      expect(result.content[0]).toHaveProperty('data')
      expect(result.content[0]).toHaveProperty('mimeType', 'image/png')
    })
  })

  describe('staticMapWithMarker', () => {
    it('should generate a static map with a marker', async () => {
      const params: StaticMapWithMarkerParams = {
        lat: 37.7749,
        lon: -122.4194,
        zoom: 12,
        size: '400x400',
        label: 'A',
        color: 'red'
      }

      const result = await staticMapWithMarker(params)

      expect(result).toBeDefined()
      expect(result.content).toBeDefined()
      expect(result.content[0]).toHaveProperty('type', 'image')
      expect(result.content[0]).toHaveProperty('data')
      expect(result.content[0]).toHaveProperty('mimeType', 'image/png')
    })
  })

  describe('staticRouteMap', () => {
    it('should generate a static map with a route', async () => {
      const params: StaticRouteMapParams = {
        encodedPolyline: 'u{~vFvyys@fS]',
        size: '400x400',
        strokeColor: 'blue',
        strokeWidth: 5
      }

      const result = await staticRouteMap(params)

      expect(result).toBeDefined()
      expect(result.content).toBeDefined()
      expect(result.content[0]).toHaveProperty('type', 'image')
      expect(result.content[0]).toHaveProperty('data')
      expect(result.content[0]).toHaveProperty('mimeType', 'image/png')
    })
  })
})
