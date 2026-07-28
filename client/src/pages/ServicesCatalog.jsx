import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { servicesAPI } from '../services/api';
import PublicNavbar from '../components/PublicNavbar';
import PublicFooter from '../components/PublicFooter';
import FloatingWhatsAppButton from '../components/FloatingWhatsAppButton';
import { FaClock, FaArrowRight, FaCut, FaSearch } from 'react-icons/fa';

export default function ServicesCatalog() {
  const navigate = useNavigate();
  const { companySlug } = useParams();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function loadServices() {
      try {
        setLoading(true);
        const data = await servicesAPI.getAll('active');
        setServices(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadServices();
  }, []);

  const categories = ['Todos', ...Array.from(new Set(services.map(s => s.category || 'Geral')))];

  const filteredServices = services.filter(svc => {
    const matchesCat = selectedCategory === 'Todos' || (svc.category || 'Geral') === selectedCategory;
    const matchesSearch = svc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (svc.description && svc.description.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  // Group services by category
  const grouped = filteredServices.reduce((acc, svc) => {
    const cat = svc.category || 'Geral';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(svc);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-[#FFF8FA] font-sans text-[#4A323D] flex flex-col">
      <PublicNavbar />

      {/* Header Banner */}
      <section className="pt-28 pb-14 bg-gradient-to-b from-[#FFF0F6] to-[#FFF8FA] border-b border-[#F5D8E3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#D47FA6] bg-white px-3.5 py-1.5 rounded-full shadow-sm">
            Nossos Tratamentos
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#4A323D] mt-3">
            Catálogo de Serviços
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto mt-3 text-base">
            Explore nossa cartela completa de serviços de beleza e estética. Selecione o serviço ideal para agendar o seu horário em menos de um minuto.
          </p>
        </div>
      </section>

      {/* Filter and Search Bar */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-[#F5D8E3]">
            {/* Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? 'bg-[#D47FA6] text-white shadow-md'
                      : 'bg-[#FFF8FA] text-[#6B4E5A] hover:bg-[#FDF2F7]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Search input */}
            <div className="relative w-full md:w-72">
              <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
              <input
                type="text"
                placeholder="Buscar serviço..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm rounded-full border border-gray-200 focus:outline-none focus:border-[#D47FA6] bg-gray-50/50"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Catalog List Grouped by Category */}
      <section className="flex-1 py-8 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {loading ? (
            <div className="space-y-6">
              {[1, 2].map((n) => (
                <div key={n} className="h-48 rounded-2xl bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : Object.keys(grouped).length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
              <FaCut className="text-4xl text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Nenhum serviço encontrado na busca.</p>
            </div>
          ) : (
            Object.entries(grouped).map(([category, svcs]) => (
              <div key={category} className="space-y-6">
                <div className="flex items-center gap-3 border-b border-[#F5D8E3] pb-3">
                  <div className="w-8 h-8 rounded-full bg-[#FDF2F7] flex items-center justify-center text-[#D47FA6] font-bold text-sm">
                    {category.charAt(0)}
                  </div>
                  <h2 className="text-2xl font-bold text-[#4A323D]">{category}</h2>
                  <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-0.5 rounded-full font-medium">
                    {svcs.length} {svcs.length === 1 ? 'serviço' : 'serviços'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {svcs.map((svc) => (
                    <div
                      key={svc.id}
                      className="bg-white rounded-2xl p-6 border border-[#F5D8E3]/60 hover:border-[#D47FA6] shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#FDF2F7] text-[#D47FA6]">
                            {svc.category || 'Geral'}
                          </span>
                          <span className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                            <FaClock className="text-[#D47FA6]" />
                            {svc.duration_minutes} min
                          </span>
                        </div>

                        <h3 className="text-lg font-bold text-[#4A323D] group-hover:text-[#D47FA6] transition-colors">
                          {svc.name}
                        </h3>
                        <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                          {svc.description || 'Serviço executado por profissionais especializados com produtos de alta performance.'}
                        </p>
                      </div>

                      <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                        <div>
                          <span className="text-xs text-gray-400 block">Investimento</span>
                          <span className="text-2xl font-extrabold text-[#6B4E5A]">
                            R$ {Number(svc.price).toFixed(2).replace('.', ',')}
                          </span>
                        </div>

                        <button
                          onClick={() => navigate(`/${companySlug}/agendar?serviceId=${svc.id}`)}
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#D47FA6] to-[#E8A5C8] text-white text-sm font-semibold shadow hover:shadow-md hover:scale-105 transition-all"
                        >
                          <span>Agendar Agora</span>
                          <FaArrowRight className="text-xs" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <FloatingWhatsAppButton />
      <PublicFooter />
    </div>
  );
}
