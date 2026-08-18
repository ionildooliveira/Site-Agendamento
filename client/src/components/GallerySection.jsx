import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaExpandAlt } from 'react-icons/fa';
import { galleryAPI } from '../services/api';

const getApiBaseUrl = () => {
  const url = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
  return url.replace('/api', '');
};

const BASE_URL = getApiBaseUrl();
const getImageUrl = (url) => url.startsWith('http') ? url : `${BASE_URL}${url}`;

export default function GallerySection() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    async function fetchGallery() {
      try {
        const data = await galleryAPI.getAll();
        setImages(data || []);
      } catch (err) {
        console.error('Erro ao buscar galeria', err);
      } finally {
        setLoading(false);
      }
    }
    fetchGallery();
  }, []);

  if (loading) {
    return (
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(n => (
              <div key={n} className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (images.length === 0) return null;

  return (
    <section className="py-24 bg-gradient-to-b from-white to-[#FFF8FA] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.span 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xs font-semibold uppercase tracking-widest text-[#D47FA6] bg-[#FDF2F7] px-4 py-1.5 rounded-full inline-block mb-4"
          >
            Nosso Portfólio
          </motion.span>
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-5xl font-extrabold text-[#4A323D] mb-4"
          >
            Galeria de Trabalhos
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-gray-600 text-lg leading-relaxed max-w-2xl mx-auto"
          >
            Conheça a excelência dos nossos serviços e inspire-se com as transformações realizadas por nossas especialistas.
          </motion.p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {images.map((img, index) => (
            <motion.div
              key={img.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="relative group rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 cursor-pointer aspect-[4/5]"
              onClick={() => setSelectedImage(img)}
            >
              <img
                src={img.image_url.startsWith('http') ? img.image_url : `${BASE_URL}${img.image_url}`}
                alt={img.title || 'Galeria Studio Beauty'}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              
              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#4A323D]/90 via-[#4A323D]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                  <FaExpandAlt className="text-white/80 text-xl mb-3" />
                  {img.title && (
                    <h3 className="text-white font-bold text-xl mb-1">{img.title}</h3>
                  )}
                  {img.description && (
                    <p className="text-white/90 text-sm line-clamp-2">{img.description}</p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Lightbox / Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
            onClick={() => setSelectedImage(null)}
          >
            <button
              className="absolute top-6 right-6 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
              onClick={() => setSelectedImage(null)}
            >
              <FaTimes className="text-3xl" />
            </button>
            
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative max-w-5xl max-h-[85vh] w-full flex flex-col items-center"
              onClick={e => e.stopPropagation()}
            >
              <img
                src={getImageUrl(selectedImage.image_url)}
                alt={selectedImage.title || 'Foto Ampliada'}
                className="max-w-full max-h-[85vh] object-contain rounded-lg"
              />
              
              {(selectedImage.title || selectedImage.description) && (
                <div className="mt-6 text-center max-w-2xl bg-black/50 p-6 rounded-2xl backdrop-blur-md border border-white/10">
                  {selectedImage.title && (
                    <h3 className="text-2xl font-bold text-white mb-2">{selectedImage.title}</h3>
                  )}
                  {selectedImage.description && (
                    <p className="text-gray-300 leading-relaxed">{selectedImage.description}</p>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
