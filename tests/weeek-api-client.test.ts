import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import { WeeekApiClient } from '../src/client/weeek-api-client.js'
import { WeeekApiError, WeeekTimeoutError } from '../src/errors.js'

describe('weeekApiClient', () => {
  const token = 'tok_test_12345'
  let fetchSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch')
  })

  afterEach(() => {
    fetchSpy.mockRestore()
  })

  function mockResponse(
    body: unknown,
    init: { status?: number } = {},
  ) {
    const status = init.status ?? 200
    return new Response(
      typeof body === 'string' ? body : JSON.stringify(body),
      {
        status,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  }

  describe('constructor', () => {
    it('throws when token is empty string', () => {
      expect(() => new WeeekApiClient('')).toThrow(/non-empty/)
    })

    it('throws when token is whitespace', () => {
      expect(() => new WeeekApiClient('   ')).toThrow(/non-empty/)
    })

    it('accepts a valid token', () => {
      expect(() => new WeeekApiClient(token)).not.toThrow()
    })
  })

  describe('get', () => {
    it('sends Bearer authorization header', async () => {
      fetchSpy.mockResolvedValueOnce(mockResponse({ ok: true }))
      const client = new WeeekApiClient(token)
      await client.get('/tm/projects')

      expect(fetchSpy).toHaveBeenCalledTimes(1)
      const call = fetchSpy.mock.calls[0]!
      const init = call[1] as RequestInit
      const headers = init.headers as Record<string, string>
      expect(headers.Authorization).toBe(`Bearer ${token}`)
      expect(headers.Accept).toBe('application/json')
    })

    it('returns parsed JSON on 200', async () => {
      fetchSpy.mockResolvedValueOnce(
        mockResponse({ projects: [{ id: 1 }] }),
      )
      const client = new WeeekApiClient(token)
      const res = await client.get<{
        projects: Array<{ id: number }>
      }>('/tm/projects')
      expect(res.projects[0]?.id).toBe(1)
    })

    it('serializes query params', async () => {
      fetchSpy.mockResolvedValueOnce(mockResponse({ tasks: [] }))
      const client = new WeeekApiClient(token)
      await client.get('/tm/tasks', {
        limit: 20,
        offset: 0,
        projectId: 'p1',
      })

      const url = fetchSpy.mock.calls[0]![0] as string
      expect(url).toContain('limit=20')
      expect(url).toContain('offset=0')
      expect(url).toContain('projectId=p1')
    })

    it('throws WeeekApiError with status 401 on 401 response', async () => {
      fetchSpy.mockResolvedValueOnce(
        mockResponse('unauthorized', { status: 401 }),
      )
      const client = new WeeekApiClient(token)
      await expect(client.get('/tm/projects')).rejects.toMatchObject({
        name: 'WeeekApiError',
        status: 401,
      })
    })

    it('throws WeeekApiError with status 404 on 404 response', async () => {
      fetchSpy.mockResolvedValueOnce(
        mockResponse('not found', { status: 404 }),
      )
      const client = new WeeekApiClient(token)
      await expect(client.get('/tm/tasks/999')).rejects.toMatchObject(
        {
          name: 'WeeekApiError',
          status: 404,
        },
      )
    })

    it('throws WeeekApiError with status 500 on 500 response', async () => {
      fetchSpy.mockResolvedValueOnce(
        mockResponse('server boom', { status: 500 }),
      )
      const client = new WeeekApiClient(token)
      await expect(client.get('/tm/projects')).rejects.toBeInstanceOf(
        WeeekApiError,
      )
    })

    it('throws WeeekApiError on invalid JSON body', async () => {
      fetchSpy.mockResolvedValueOnce(
        new Response('not-json-at-all', {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      const client = new WeeekApiClient(token)
      await expect(client.get('/tm/projects')).rejects.toBeInstanceOf(
        WeeekApiError,
      )
    })

    it('throws WeeekTimeoutError when fetch is aborted', async () => {
      fetchSpy.mockImplementationOnce((_url, init) => {
        return new Promise((_resolve, reject) => {
          const signal = (init as RequestInit).signal
          signal?.addEventListener('abort', () => {
            const err = new Error('aborted')
            err.name = 'AbortError'
            reject(err)
          })
        })
      })
      const client = new WeeekApiClient(token, { timeoutMs: 30 })
      await expect(client.get('/tm/projects')).rejects.toBeInstanceOf(
        WeeekTimeoutError,
      )
    })
  })

  describe('post', () => {
    it('sends Content-Type JSON and stringified body', async () => {
      fetchSpy.mockResolvedValueOnce(
        mockResponse({ task: { id: 1 } }),
      )
      const client = new WeeekApiClient(token)
      await client.post('/tm/tasks', {
        title: 'hello',
        projectId: 'p1',
      })

      const init = fetchSpy.mock.calls[0]![1] as RequestInit
      const headers = init.headers as Record<string, string>
      expect(headers['Content-Type']).toBe('application/json')
      expect(init.body).toBe(
        JSON.stringify({ title: 'hello', projectId: 'p1' }),
      )
      expect(init.method).toBe('POST')
    })
  })

  describe('baseUrl handling', () => {
    it('strips trailing slash from baseUrl', async () => {
      fetchSpy.mockResolvedValueOnce(mockResponse({}))
      const client = new WeeekApiClient(token, {
        baseUrl: 'https://example.com/v1/',
      })
      await client.get('/tm/projects')
      const url = fetchSpy.mock.calls[0]![0] as string
      expect(url).toBe('https://example.com/v1/tm/projects')
    })
  })
})
