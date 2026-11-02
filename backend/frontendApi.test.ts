import { afterEach, describe, expect, it, vi } from 'vitest';

const apiOrigin = 'https://api.example.test';
const frontendOrigin = 'https://frontend.example.test';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('frontend image upload API', () => {
  it('posts the image to the configured API and returns its Cloudinary URL', async () => {
    const file = new File(['image bytes'], 'case.png', { type: 'image/png' });
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => ({
      ok: true,
      json: async () => ({
        success: true,
        url: 'https://images.example.test/case.png',
        publicId: 'caseforge/case',
      }),
    }) as Response);

    vi.stubEnv('VITE_API_URL', apiOrigin);
    vi.stubGlobal('window', { location: { origin: frontendOrigin } });
    vi.stubGlobal('fetch', fetchMock);
    const { uploadImage } = await import('../frontend/src/services/api.js');

    await expect(uploadImage(file)).resolves.toEqual({
      url: 'https://images.example.test/case.png',
      publicId: 'caseforge/case',
    });

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(`${apiOrigin}/api/upload/image`);
    expect(options?.credentials).toBe('include');
    expect(options?.method).toBe('POST');
    expect((options?.body as FormData).get('image')).toBe(file);
    expect(options?.headers).toBeUndefined();
  });
});
