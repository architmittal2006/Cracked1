import { afterEach, describe, expect, it, vi } from 'vitest';

const { configureCloudinary, uploadStream } = vi.hoisted(() => ({
  configureCloudinary: vi.fn(),
  uploadStream: vi.fn(),
}));

vi.mock('cloudinary', () => ({
  v2: {
    config: configureCloudinary,
    uploader: { upload_stream: uploadStream },
  },
}));

import { uploadImageBuffer } from './cloudinary.js';

afterEach(() => {
  delete process.env.CLOUDINARY_CLOUD_NAME;
  delete process.env.CLOUDINARY_API_KEY;
  delete process.env.CLOUDINARY_API_SECRET;
  vi.clearAllMocks();
});

describe('Cloudinary image uploads', () => {
  it('configures credentials at upload time and returns the hosted image', async () => {
    process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
    process.env.CLOUDINARY_API_KEY = 'test-key';
    process.env.CLOUDINARY_API_SECRET = 'test-secret';

    uploadStream.mockImplementation((_options, callback) => ({
      end: (buffer: Buffer) => {
        expect(buffer).toEqual(Buffer.from('test image'));
        callback(null, {
          secure_url: 'https://images.example.test/photo.png',
          public_id: 'avatars/photo',
        });
      },
    }));

    await expect(uploadImageBuffer(Buffer.from('test image'), 'avatars')).resolves.toEqual({
      url: 'https://images.example.test/photo.png',
      publicId: 'avatars/photo',
    });

    expect(configureCloudinary).toHaveBeenCalledWith({
      cloud_name: 'test-cloud',
      api_key: 'test-key',
      api_secret: 'test-secret',
      secure: true,
    });
    expect(uploadStream).toHaveBeenCalledWith(
      { folder: 'avatars', resource_type: 'image' },
      expect.any(Function),
    );
  });

  it('rejects uploads when credentials are missing without calling Cloudinary', async () => {
    await expect(uploadImageBuffer(Buffer.from('test image'))).rejects.toThrow(
      'Cloudinary environment variables are missing',
    );
    expect(uploadStream).not.toHaveBeenCalled();
  });
});
