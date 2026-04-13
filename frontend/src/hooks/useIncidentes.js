import { useState, useCallback } from 'react';
import { incidentesService } from '../services/api';

// =============================================
// Hook para manejar los incidentes
// Úsalo en cualquier componente que necesite datos
// =============================================
export const useIncidentes = () => {
  const [incidentes, setIncidentes] = useState([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);

  const fetchIncidentes = useCallback(async (filtros = {}) => {
    setLoading(true);
    setError(null);
    try {
      const data = await incidentesService.getAll(filtros);
      setIncidentes(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const generarReporte = useCallback(async (filtros) => {
    setLoading(true);
    setError(null);
    try {
      const data = await incidentesService.generar(filtros);
      return data;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { incidentes, loading, error, fetchIncidentes, generarReporte };
};