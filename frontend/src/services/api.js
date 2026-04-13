const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const normalizeText = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const handleResponse = async (res) => {
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'Error desconocido' }));
    throw new Error(error.detail || `Error ${res.status}`);
  }
  return res.json();
};

const filterByDateRange = (items, fechaInicio, fechaFin) => {
  if (!fechaInicio && !fechaFin) return items;

  return items.filter((item) => {
    const sourceDate = String(item.event_ts || '').slice(0, 10);
    if (!sourceDate) return false;
    if (fechaInicio && sourceDate < fechaInicio) return false;
    if (fechaFin && sourceDate > fechaFin) return false;
    return true;
  });
};

const filterByHour = (items, hora) => {
  if (!hora) return items;
  return items.filter((item) => {
    const eventDate = item.event_ts ? new Date(item.event_ts) : null;
    if (!eventDate || Number.isNaN(eventDate.getTime())) return false;
    return String(eventDate.getHours()).padStart(2, '0') === hora;
  });
};

const filterByType = (items, tipoExtorsion) => {
  if (!tipoExtorsion) return items;
  const normalized = normalizeText(tipoExtorsion);
  return items.filter((item) => {
    const extortionName = normalizeText(item.extortion_name);
    const extortionId = String(item.id_extortion || '');
    return extortionName === normalized || extortionId === String(tipoExtorsion);
  });
};

export const incidentesService = {
  getAll: async (filtros = {}) => {
    const params = new URLSearchParams();

    if (filtros.fechaInicio) params.append('fecha', filtros.fechaInicio);
    if (filtros.id) params.append('id_conv', filtros.id);

    const query = params.toString();
    const res = await fetch(`${BASE_URL}/data${query ? `?${query}` : ''}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await handleResponse(res);
    return filterByType(
      filterByHour(filterByDateRange(data, filtros.fechaInicio, filtros.fechaFin), filtros.hora),
      filtros.tipoExtorsion,
    );
  },

  getById: async (id) => {
    const res = await fetch(`${BASE_URL}/data/${id}`);
    return handleResponse(res);
  },

  generar: async (filtros) => incidentesService.getAll(filtros),
};

export const archivosService = {
  getAll: async () => [],
};
