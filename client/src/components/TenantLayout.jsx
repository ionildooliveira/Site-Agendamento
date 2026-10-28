import { useEffect, useState } from 'react';
import { Outlet, useParams, useNavigate } from 'react-router-dom';
import { companiesAPI, setTenantId } from '../services/api';
import { syncSalonSettings, getSalonSettings } from '../services/salonSettings';
import { getNicheData } from '../constants/niches';
import toast from 'react-hot-toast';
import BlockedCompany from '../pages/BlockedCompany';

export default function TenantLayout() {
  const { companySlug } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isExpired, setIsExpired] = useState(false);

  const applyNicheStyles = (settings, companyName) => {
    const nicheKey = settings?.niche || 
      (/barbearia|barber/i.test(companyName || settings?.name || '') ? 'barbearia' : 
       /estetica|spa|clinica/i.test(companyName || settings?.name || '') ? 'estetica' : 
       /esmalte|unha|nail/i.test(companyName || settings?.name || '') ? 'esmalteria' : 'salao');
    const nicheData = getNicheData(nicheKey);
    const theme = nicheData?.theme;
    if (theme) {
      const root = document.documentElement;
      root.style.setProperty('--theme-primary', theme.primaryColor);
      root.style.setProperty('--theme-primary-dark', theme.primaryDark);
      root.style.setProperty('--theme-primary-light', theme.primaryLight);
      root.style.setProperty('--theme-gradient', `linear-gradient(135deg, ${theme.primaryColor} 0%, ${theme.primaryDark} 100%)`);
      root.style.setProperty('--theme-shadow', `${theme.primaryColor}35`);
    }
  };

  useEffect(() => {
    async function fetchTenant() {
      try {
        setLoading(true);
        const company = await companiesAPI.getBySlug(companySlug);
        setTenantId(company.id, companySlug);
        
        const settings = await syncSalonSettings();
        applyNicheStyles(settings || getSalonSettings(), company.name);
        
        document.title = company.name;
      } catch (error) {
        console.error('Error fetching tenant:', error);
        if (error.response?.status === 403 || error.response?.data?.blocked) {
          setIsBlocked(true);
          if (error.response?.data?.expired) {
            setIsExpired(true);
          }
        } else {
          toast.error('Empresa não encontrada.');
          navigate('/');
        }
      } finally {
        setLoading(false);
      }
    }

    if (companySlug) {
      fetchTenant();
    } else {
      setLoading(false);
    }

    const handleSettingsUpdated = () => {
      applyNicheStyles(getSalonSettings());
    };
    window.addEventListener('salonSettingsUpdated', handleSettingsUpdated);
    return () => {
      window.removeEventListener('salonSettingsUpdated', handleSettingsUpdated);
    };
  }, [companySlug, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isBlocked) {
    return <BlockedCompany isExpired={isExpired} companySlug={companySlug} />;
  }

  return <Outlet />;
}
