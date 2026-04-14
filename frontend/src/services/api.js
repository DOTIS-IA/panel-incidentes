const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const handleResponse = async (res) => {
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'Error desconocido' }));
    throw new Error(error.detail || `Error ${res.status}`);
  }
  return res.json();
};

export const incidentesService = {
  getAll: async (filtros = {}) => {
    const params = new URLSearchParams();

    if (filtros.fechaInicio) params.append('fecha_inicio', filtros.fechaInicio);
    if (filtros.fechaFin) params.append('fecha_fin', filtros.fechaFin);
    if (filtros.hora) params.append('hora', filtros.hora);
    if (filtros.minutos) params.append('minutos', filtros.minutos);
    if (filtros.id) params.append('id_conv', filtros.id);
    if (filtros.tipoExtorsion) params.append('tipo_extorsion', filtros.tipoExtorsion);

    const query = params.toString();
    const res = await fetch(`${BASE_URL}/data${query ? `?${query}` : ''}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    return handleResponse(res);
  },

  getById: async (id) => {
    const res = await fetch(`${BASE_URL}/data/${id}`);
    return handleResponse(res);
  },

  getTiposExtorsion: async () => {
    const res = await fetch(`${BASE_URL}/extortion-types`);
    const data = await handleResponse(res);
    return Array.isArray(data) ? data.map((item) => item.name).filter(Boolean) : [];
  },

  generar: async (filtros) => incidentesService.getAll(filtros),
};

export const archivosService = {
  getAll: async () => [],
};
