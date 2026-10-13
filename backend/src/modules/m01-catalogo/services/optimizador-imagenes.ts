import sharp from 'sharp';
import { AppError } from '../../../core/middlewares/errorHandler';
import { OptimizadorImagenes, VersionesImagen } from '../interfaces/m01.interfaces';

// ==============================================================================
// M01 - OPTIMIZADOR DE IMÁGENES CON SHARP (RNF-CAT-07-01)
// Genera, a partir del original, una miniatura para listados y una versión
// optimizada para la ficha, ambas en WebP, respetando la orientación EXIF y sin
// agrandar imágenes pequeñas. El original se conserva intacto para el panel.
// ==============================================================================

const LADO_MINIATURA = 400;
const LADO_OPTIMIZADA = 1600;
const CALIDAD_MINIATURA = 75;
const CALIDAD_OPTIMIZADA = 82;

async function reducir(original: Buffer, lado: number, calidad: number): Promise<Buffer> {
  return sharp(original)
    .rotate()
    .resize({ width: lado, height: lado, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: calidad })
    .toBuffer();
}

export const optimizadorSharp: OptimizadorImagenes = {
  mimeVersiones: 'image/webp',

  async generarVersiones(original: Buffer): Promise<VersionesImagen> {
    try {
      const [miniatura, optimizada] = await Promise.all([
        reducir(original, LADO_MINIATURA, CALIDAD_MINIATURA),
        reducir(original, LADO_OPTIMIZADA, CALIDAD_OPTIMIZADA),
      ]);
      return { miniatura, optimizada };
    } catch {
      throw new AppError('El archivo no es una imagen válida o está dañado', 422, 'IMAGEN_INVALIDA');
    }
  },
};
