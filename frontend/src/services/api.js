export const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const FALLBACK_TIPOS_EXTORSION = [
  'Extorsión presencial-exigencia de pago o bienes (Directa)',
  'Extorsión por secuestro virtual',
  'Extorsión telefónica-virtual-exigencia de pago o bienes (Indirecta)',
  'Extorsión escrita-otros medios exigencia de pago o bienes (Indirecta)',
  'Fraude-engaño telefónico-virtual',
  'Denuncia de localización y operación del probable extorsionador o grupo delictivo',
  'Extorsión por invasión-despojo de predio',
  'Extorsión por contenido sexual o íntimo',
];

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
  // Validación de seguridad para cuando el token expira o es inválido
  if (res.status === 401) {
    console.warn("Token caducado o inválido. Redirigiendo al login...");
    
    // Limpiamos todo rastro de sesión vieja
    window.localStorage.removeItem('token');
    window.localStorage.removeItem('access_token');
    window.localStorage.removeItem('authToken');
    window.localStorage.removeItem('role');
    
    window.sessionStorage.removeItem('token');
    window.sessionStorage.removeItem('access_token');

    // Mandamos al usuario a la pantalla de login
    window.location.href = '/login';
    
    // Detenemos la ejecución
    throw new Error('Sesión expirada');
  }

  // Manejo de otros errores
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
      // Búsqueda por ID exacto — ignorar todos los demás filtros
      params.append('id_conv', filtros.id);
    } else {
      if (filtros.fechaInicio) params.append('fecha_inicio', filtros.fechaInicio);
      if (filtros.fechaFin) params.append('fecha_fin', filtros.fechaFin);
      if (filtros.hora) params.append('hora', filtros.hora);
      if (filtros.minutos) params.append('minutos', filtros.minutos);
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
      const tipos = Array.isArray(data) ? data.map((item) => item.name).filter(Boolean) : [];
      return tipos.length > 0 ? tipos : FALLBACK_TIPOS_EXTORSION;
    } catch {
      return FALLBACK_TIPOS_EXTORSION;
    }
  },

  generar: async (filtros) => incidentesService.getAll(filtros),
};

export const archivosService = {
  getAll: async () => [],
};