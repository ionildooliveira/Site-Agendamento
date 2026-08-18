import { useState, useEffect, useRef } from 'react';
import { galleryAPI } from '../../services/api';
import { toast } from 'react-hot-toast';
import { FaImage, FaTrash, FaPlus, FaSpinner, FaUpload } from 'react-icons/fa';

// Obtém a URL base da API e ajusta para acessar a raiz do servidor para as imagens
const getApiBaseUrl = () => {
  const url = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
  return url.replace('/api', '');
};

const BASE_URL = getApiBaseUrl();

export default function AdminGallery() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    file: null
  });

  const [previewUrl, setPreviewUrl] = useState(null);

  const loadImages = async () => {
    try {
      setLoading(true);
      const data = await galleryAPI.getAll();
      setImages(data || []);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao carregar a galeria');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadImages();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('A imagem deve ter no máximo 5MB');
        return;
      }
      setFormData({ ...formData, file });
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!formData.file) {
      toast.error('Por favor, selecione uma imagem');
      return;
    }

    try {
      setUploading(true);
      const data = new FormData();
      data.append('image', formData.file);
      if (formData.title) data.append('title', formData.title);
      if (formData.description) data.append('description', formData.description);

      await galleryAPI.create(data);
      toast.success('Imagem enviada com sucesso!');
      
      // Reset form
      setFormData({ title: '', description: '', file: null });
      setPreviewUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      
      loadImages();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao fazer upload da imagem');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir esta foto?')) return;
    try {
      setLoading(true);
      await galleryAPI.delete(id);
      toast.success('Foto excluída com sucesso');
      loadImages();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao excluir a foto');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 font-sans text-[#4A323D]">
      <div>
        <h1 className="text-2xl font-bold text-[#4A323D] flex items-center gap-2">
          <FaImage className="text-[#D47FA6]" /> Galeria de Trabalhos
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Adicione fotos dos seus melhores trabalhos para encantar seus clientes.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário de Upload */}
        <div className="lg:col-span-1">
          <form onSubmit={handleUpload} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 space-y-4">
            <h2 className="text-base font-bold text-[#4A323D] border-b border-gray-100 pb-2">
              Adicionar Nova Foto
            </h2>

            <div>
              <label className="block text-xs font-bold text-[#4A323D] mb-1">Selecione a Imagem *</label>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/jpeg, image/png, image/webp"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                  previewUrl ? 'border-[#D47FA6] bg-[#FDF2F7]' : 'border-gray-300 hover:border-[#D47FA6] bg-gray-50'
                }`}
              >
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="h-full object-contain p-1 rounded-xl" />
                ) : (
                  <div className="flex flex-col items-center text-gray-400">
                    <FaUpload className="text-2xl mb-2" />
                    <span className="text-xs font-medium">Clique para selecionar</span>
                    <span className="text-[10px]">JPG, PNG, WEBP (Máx 5MB)</span>
                  </div>
                )}
              </label>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#4A323D] mb-1">Título (Opcional)</label>
              <input
                type="text"
                placeholder="Ex: Mechas Blond"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:border-[#D47FA6]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#4A323D] mb-1">Descrição (Opcional)</label>
              <textarea
                placeholder="Pequena descrição sobre o procedimento..."
                rows="3"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:border-[#D47FA6] resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={uploading || !formData.file}
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-white font-semibold text-sm shadow transition ${
                uploading || !formData.file
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-[#D47FA6] to-[#E8A5C8] hover:shadow-md'
              }`}
            >
              {uploading ? <FaSpinner className="animate-spin" /> : <FaPlus />}
              <span>{uploading ? 'Enviando...' : 'Adicionar à Galeria'}</span>
            </button>
          </form>
        </div>

        {/* Grid de Imagens */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 min-h-[400px]">
            <h2 className="text-base font-bold text-[#4A323D] border-b border-gray-100 pb-2 mb-4 flex justify-between items-center">
              <span>Suas Fotos</span>
              <span className="text-xs bg-[#FDF2F7] text-[#D47FA6] px-2 py-1 rounded-full font-semibold">
                {images.length} foto(s)
              </span>
            </h2>

            {loading ? (
              <div className="flex justify-center items-center h-48">
                <FaSpinner className="animate-spin text-3xl text-[#D47FA6]" />
              </div>
            ) : images.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                <FaImage className="text-4xl mb-2 text-gray-300" />
                <p className="text-sm">Nenhuma foto na galeria ainda.</p>
                <p className="text-xs">Use o formulário ao lado para adicionar a primeira.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {images.map((img) => (
                  <div key={img.id} className="relative group rounded-xl overflow-hidden shadow-sm border border-gray-200 aspect-square">
                    <img 
                      src={`${BASE_URL}${img.image_url}`} 
                      alt={img.title || 'Foto da Galeria'} 
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                      {img.title && <h3 className="text-white text-xs font-bold truncate">{img.title}</h3>}
                      
                      <button
                        onClick={() => handleDelete(img.id)}
                        className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg shadow-md transition-colors"
                        title="Excluir"
                      >
                        <FaTrash className="text-xs" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
