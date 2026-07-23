import { useState, useEffect } from 'react';
import { FaWhatsapp } from 'react-icons/fa';
import { getSalonSettings } from '../services/salonSettings';

export default function FloatingWhatsAppButton() {
  const [salon, setSalon] = useState(getSalonSettings());
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const updateSalon = () => {
      setSalon(getSalonSettings());
    };
    window.addEventListener('salonSettingsUpdated', updateSalon);
    return () => window.removeEventListener('salonSettingsUpdated', updateSalon);
  }, []);

  const cleanPhone = (salon.whatsapp || '5511999998888').replace(/\D/g, '');
  const message = encodeURIComponent(`Olá! Gostaria de falar com o ${salon.name}.`);
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${message}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="fixed bottom-6 right-6 z-50 flex items-center bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-full shadow-2xl p-3.5 transition-all duration-300 ease-in-out group focus:outline-none focus:ring-4 focus:ring-green-300"
      title="Falar no WhatsApp"
    >
      <FaWhatsapp className="text-3xl shrink-0 drop-shadow-sm" />
      <span
        className={`overflow-hidden whitespace-nowrap font-medium text-sm transition-all duration-300 ease-in-out ${
          hovered ? 'max-w-xs opacity-100 ml-2 mr-1' : 'max-w-0 opacity-0 ml-0 mr-0'
        }`}
      >
        Falar no WhatsApp
      </span>
    </a>
  );
}
