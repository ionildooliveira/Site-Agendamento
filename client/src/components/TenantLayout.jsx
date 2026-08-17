import { useEffect, useState } from 'react';
import { Outlet, useParams, useNavigate } from 'react-router-dom';
import { companiesAPI, setTenantId } from '../services/api';
import { syncSalonSettings } from '../services/salonSettings';
import toast from 'react-hot-toast';
import BlockedCompany from '../pages/BlockedCompany';

export default function TenantLayout() {
  const { companySlug } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isBlocked, setIsBlocked] = useState(false);

  useEffect(() => {
    async function fetchTenant() {
      try {
        setLoading(true);
        const company = await companiesAPI.getBySlug(companySlug);
        setTenantId(company.id, companySlug);
        
        await syncSalonSettings();
        
        // Temporarily store company name or data if needed
        document.title = company.name;
      } catch (error) {
        console.error('Error fetching tenant:', error);
        if (error.response?.status === 403 || error.response?.data?.blocked) {
          setIsBlocked(true);
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
  }, [companySlug, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isBlocked) {
    return <BlockedCompany />;
  }

  return <Outlet />;
}
