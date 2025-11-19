// Transform stream para comprimir imagens durante o upload
// Usado no multer-s3 para comprimir antes de salvar no S3

const sharp = require('sharp');

// Função que retorna um transform stream para comprimir imagens
const getImageCompressTransform = () => {
  return sharp()
    .resize(1920, 1920, {
      fit: 'inside',
      withoutEnlargement: true
    })
    .jpeg({
      quality: 75,
      mozjpeg: true,
      progressive: true
    });
};

module.exports = getImageCompressTransform;

