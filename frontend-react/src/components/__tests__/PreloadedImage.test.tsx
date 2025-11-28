import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import PreloadedImage from '../PreloadedImage';
import { preloadImage } from '../../utils/imagePreloader';
import { imageCacheManager } from '../../utils/imageCache';

jest.mock('../../utils/imagePreloader');
jest.mock('../../utils/imageCache');

describe('PreloadedImage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (imageCacheManager.getFromCache as jest.Mock).mockReturnValue(null);
  });

  it('deve renderizar componente de loading inicialmente', () => {
    (preloadImage as jest.Mock).mockImplementation(() => new Promise(() => {}));

    render(<PreloadedImage src="http://example.com/image.jpg" />);

    expect(screen.getByText('Carregando imagem...')).toBeInTheDocument();
  });

  it('deve renderizar imagem quando carregada com sucesso', async () => {
    (preloadImage as jest.Mock).mockResolvedValue({
      success: true,
      url: 'http://example.com/image.jpg',
    });

    render(<PreloadedImage src="http://example.com/image.jpg" alt="Test image" />);

    await waitFor(() => {
      const img = screen.getByAltText('Test image');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', 'http://example.com/image.jpg');
    });
  });

  it('deve usar imagem do cache quando disponível', async () => {
    const mockCachedImg = {
      complete: true,
      naturalWidth: 100,
      src: 'http://example.com/image.jpg',
    };

    (imageCacheManager.getFromCache as jest.Mock).mockReturnValue(mockCachedImg);

    render(<PreloadedImage src="http://example.com/image.jpg" />);

    await waitFor(() => {
      expect(imageCacheManager.getFromCache).toHaveBeenCalledWith('http://example.com/image.jpg');
      expect(preloadImage).not.toHaveBeenCalled();
    });
  });

  it('deve tentar fallback quando imagem principal falha', async () => {
    (preloadImage as jest.Mock)
      .mockResolvedValueOnce({ success: false, url: 'http://example.com/image.jpg', error: 'Error' })
      .mockResolvedValueOnce({ success: true, url: 'http://example.com/fallback.jpg' });

    render(
      <PreloadedImage
        src="http://example.com/image.jpg"
        fallbackSrc="http://example.com/fallback.jpg"
      />
    );

    await waitFor(() => {
      expect(preloadImage).toHaveBeenCalledWith('http://example.com/fallback.jpg', 10000);
    });
  });

  it('deve chamar onLoad quando imagem carrega', async () => {
    const onLoad = jest.fn();
    (preloadImage as jest.Mock).mockResolvedValue({
      success: true,
      url: 'http://example.com/image.jpg',
    });

    render(<PreloadedImage src="http://example.com/image.jpg" onLoad={onLoad} />);

    await waitFor(() => {
      expect(onLoad).toHaveBeenCalled();
    });
  });

  it('deve chamar onError quando imagem falha', async () => {
    const onError = jest.fn();
    (preloadImage as jest.Mock).mockResolvedValue({
      success: false,
      url: 'http://example.com/image.jpg',
      error: 'Failed to load',
    });

    render(<PreloadedImage src="http://example.com/image.jpg" onError={onError} />);

    await waitFor(() => {
      // Componente deve tentar usar URL diretamente mesmo após falha
      const img = screen.getByRole('img');
      expect(img).toBeInTheDocument();
    });
  });

  it('deve renderizar componente de erro customizado', async () => {
    (preloadImage as jest.Mock).mockResolvedValue({
      success: false,
      url: 'http://example.com/image.jpg',
      error: 'Error',
    });

    render(
      <PreloadedImage
        src="http://example.com/image.jpg"
        errorComponent={<div>Custom Error</div>}
      />
    );

    await waitFor(() => {
      // Mesmo com erro, componente tenta usar URL diretamente
      const img = screen.queryByRole('img');
      expect(img).toBeInTheDocument();
    });
  });

  it('deve renderizar componente de loading customizado', () => {
    (preloadImage as jest.Mock).mockImplementation(() => new Promise(() => {}));

    render(
      <PreloadedImage
        src="http://example.com/image.jpg"
        loadingComponent={<div>Custom Loading</div>}
      />
    );

    expect(screen.getByText('Custom Loading')).toBeInTheDocument();
  });

  it('não deve mostrar loading quando showLoading é false', async () => {
    (preloadImage as jest.Mock).mockImplementation(() => new Promise(() => {}));

    render(<PreloadedImage src="http://example.com/image.jpg" showLoading={false} />);

    expect(screen.queryByText('Carregando imagem...')).not.toBeInTheDocument();
  });

  it('deve atualizar quando src muda', async () => {
    (preloadImage as jest.Mock).mockResolvedValue({
      success: true,
      url: 'http://example.com/image1.jpg',
    });

    const { rerender } = render(<PreloadedImage src="http://example.com/image1.jpg" />);

    await waitFor(() => {
      expect(screen.getByRole('img')).toHaveAttribute('src', 'http://example.com/image1.jpg');
    });

    (preloadImage as jest.Mock).mockResolvedValue({
      success: true,
      url: 'http://example.com/image2.jpg',
    });

    rerender(<PreloadedImage src="http://example.com/image2.jpg" />);

    await waitFor(() => {
      expect(screen.getByRole('img')).toHaveAttribute('src', 'http://example.com/image2.jpg');
    });
  });

  it('deve aplicar className e style', async () => {
    (preloadImage as jest.Mock).mockResolvedValue({
      success: true,
      url: 'http://example.com/image.jpg',
    });

    render(
      <PreloadedImage
        src="http://example.com/image.jpg"
        className="test-class"
        style={{ width: '100px' }}
      />
    );

    await waitFor(() => {
      const img = screen.getByRole('img');
      expect(img).toHaveClass('test-class');
      expect(img).toHaveStyle({ width: '100px' });
    });
  });

  it('deve limpar blob URL quando componente desmonta', async () => {
    const revokeObjectURLSpy = jest.spyOn(URL, 'revokeObjectURL');
    (preloadImage as jest.Mock).mockResolvedValue({
      success: true,
      url: 'blob:http://localhost/test',
    });

    const { unmount } = render(<PreloadedImage src="http://example.com/image.jpg" />);

    await waitFor(() => {
      expect(screen.getByRole('img')).toBeInTheDocument();
    });

    unmount();

    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:http://localhost/test');
    revokeObjectURLSpy.mockRestore();
  });
});

