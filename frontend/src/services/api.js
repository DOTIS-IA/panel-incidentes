export const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8003';

const FALLBACK_TIPOS_EXTORSION = [
  'Extorsion presencial-exigencia de pago o bienes (Directa)',
  'Extorsion por secuestro virtual',
  'Extorsion telefonica-virtual-exigencia de pago o bienes (Indirecta)',
  'Extorsion escrita-otros medios exigencia de pago o bienes (Indirecta)',
  'Fraude-engano telefonico-virtual',
  'Denuncia de localizacion y operacion del probable extorsionador o grupo delictivo',
  'Extorsion por invasion-despojo de predio',
  'Extorsion por contenido sexual o intimo',
];

const normalizeExtortionLabel = (value) =>
  String(value || '')
    .replace(/Extorsi\?n/gi, 'Extorsion')
    .replace(/Extorsi[oó]n/gi, 'Extorsion')
    .replace(/telef\?nica/gi, 'telefonica')
    .replace(/telef[oó]nica/gi, 'telefonica')
    .replace(/engañ[oa]/gi, 'engano')
    .replace(/localizaci[oó]n/gi, 'localizacion')
    .replace(/operaci[oó]n/gi, 'operacion')
    .replace(/invasi[oó]n/gi, 'invasion')
    .replace(/íntimo/gi, 'intimo')
    .replace(/[áàäâ]/gi, 'a')
    .replace(/[éèëê]/gi, 'e')
    .replace(/[íìïî]/gi, 'i')
    .replace(/[óòöô]/gi, 'o')
    .replace(/[úùüû]/gi, 'u')
    .replace(/ñ/gi, 'n');

const getToken = () => {
  if (typeof window === 'undefined') return null;

  const candidates = [
    window.localStorage.getItem('access_token'),
    window.localStorage.getItem('token'),
    window.localStorage.getItem('authToken'),
    window.sessionStorage.getItem('access_token'),
    window.sessionStorage.getItem('token'),
    window.sessionStorage.getItem('authToken'),
  ];

  return candidates.find((value) => value && String(value).trim()) || null;
};

const buildHeaders = (extraHeaders = {}) => {
  const token = getToken();

  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extraHeaders,
  };
};

const handleResponse = async (res) => {
  if (res.status === 401) {
    window.localStorage.removeItem('token');
    window.localStorage.removeItem('access_token');
    window.localStorage.removeItem('authToken');
    window.localStorage.removeItem('role');
    window.sessionStorage.removeItem('token');
    window.sessionStorage.removeItem('access_token');
    window.location.href = '/login';
    throw new Error('Sesion expirada');
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'Error desconocido' }));
    throw new Error(error.detail || `Error ${res.status}`);
  }

  return res.json();
};

export const incidentesService = {
  getAll: async (filtros = {}) => {
    const params = new URLSearchParams();

    if (filtros.id) {
      params.append('id_conv', filtros.id);
    } else {
      if (filtros.fechaInicio) params.append('fecha_inicio', filtros.fechaInicio);
      if (filtros.fechaFin) params.append('fecha_fin', filtros.fechaFin);
      if (filtros.horaInicio) params.append('hora_inicio', filtros.horaInicio);
      if (filtros.minutosInicio) params.append('minutos_inicio', filtros.minutosInicio);
      if (filtros.horaFin) params.append('hora_fin', filtros.horaFin);
      if (filtros.minutosFin) params.append('minutos_fin', filtros.minutosFin);
      if (filtros.tipoExtorsion) params.append('tipo_extorsion', filtros.tipoExtorsion);
    }

    const query = params.toString();
    const res = await fetch(`${BASE_URL}/data${query ? `?${query}` : ''}`, {
      method: 'GET',
      headers: buildHeaders(),
    });

    return handleResponse(res);
  },

  getById: async (id) => {
    const res = await fetch(`${BASE_URL}/data/${id}`, {
      headers: buildHeaders(),
    });
    return handleResponse(res);
  },

  getTiposExtorsion: async () => {
    try {
      const res = await fetch(`${BASE_URL}/extortion-types`, {
        headers: buildHeaders(),
      });
      const data = await handleResponse(res);
      const tipos = Array.isArray(data)
        ? data.map((item) => normalizeExtortionLabel(item.name)).filter(Boolean)
        : [];
      const catalogoInvalido = tipos.length < FALLBACK_TIPOS_EXTORSION.length || tipos.some((tipo) => tipo.includes('?'));
      return catalogoInvalido ? FALLBACK_TIPOS_EXTORSION : tipos;
    } catch {
      return FALLBACK_TIPOS_EXTORSION;
    }
  },

  generar: async (filtros) => incidentesService.getAll(filtros),
};

export const archivosService = {
  getAll: async () => [],
};
