import { compressAndGetBase64 } from './utils';
import imageCompression from 'browser-image-compression';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('browser-image-compression', () => ({
  default: vi.fn(),
}));

describe('compressAndGetBase64', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should compress file and return base64 string on success', async () => {
    const mockFile = new File(['test'], 'test.png', { type: 'image/png' });
    const mockCompressedFile = new File(['compressed'], 'test.png', { type: 'image/png' });

    vi.mocked(imageCompression).mockResolvedValue(mockCompressedFile);

    const readAsDataURLMock = vi.fn();
    class MockFileReader {
      result = 'data:image/png;base64,compressed';
      onloadend: (() => void) | null = null;
      readAsDataURL(file: File) {
        readAsDataURLMock(file);
        setTimeout(() => {
          if (this.onloadend) this.onloadend();
        }, 0);
      }
    }
    const originalFileReader = global.FileReader;
    global.FileReader = MockFileReader as any;

    const result = await compressAndGetBase64(mockFile);

    expect(imageCompression).toHaveBeenCalledWith(mockFile, {
      maxSizeMB: 1,
      maxWidthOrHeight: 1024,
    });
    expect(readAsDataURLMock).toHaveBeenCalledWith(mockCompressedFile);
    expect(result).toBe('data:image/png;base64,compressed');

    global.FileReader = originalFileReader;
  });

  it('should reject when FileReader encounters an error', async () => {
    const mockFile = new File(['test'], 'test.png', { type: 'image/png' });
    const mockCompressedFile = new File(['compressed'], 'test.png', { type: 'image/png' });

    vi.mocked(imageCompression).mockResolvedValue(mockCompressedFile);

    const mockError = new Error('Specific file read error');

    class MockFileReader {
      error = mockError;
      onerror: (() => void) | null = null;
      readAsDataURL() {
        setTimeout(() => {
          if (this.onerror) this.onerror();
        }, 0);
      }
    }
    const originalFileReader = global.FileReader;
    global.FileReader = MockFileReader as any;

    await expect(compressAndGetBase64(mockFile)).rejects.toThrow('Specific file read error');

    global.FileReader = originalFileReader;
  });

  it('should reject with default error when FileReader error is null', async () => {
    const mockFile = new File(['test'], 'test.png', { type: 'image/png' });
    const mockCompressedFile = new File(['compressed'], 'test.png', { type: 'image/png' });

    vi.mocked(imageCompression).mockResolvedValue(mockCompressedFile);

    class MockFileReader {
      error = null;
      onerror: (() => void) | null = null;
      readAsDataURL() {
        setTimeout(() => {
          if (this.onerror) this.onerror();
        }, 0);
      }
    }
    const originalFileReader = global.FileReader;
    global.FileReader = MockFileReader as any;

    await expect(compressAndGetBase64(mockFile)).rejects.toThrow('Failed to read file');

    global.FileReader = originalFileReader;
  });
});
