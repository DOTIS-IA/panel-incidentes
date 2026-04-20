const CACHE_KEY = 'reportes_guardados';

export const guardarReporteEnCache = (filtros, resultados) => {
  try {
    const previos = JSON.parse(localStorage.getItem(CACHE_KEY) || '[]');
    const nuevo = {
      id: Date.now(),
      generadoEn: new Date().toISOString(),
      filtros,
      resultados,
      total: resultados.length,
    };
    const actualizados = [nuevo, ...previos].slice(0, 20);
    localStorage.setItem(CACHE_KEY, JSON.stringify(actualizados));
  } catch {
    // silencioso
  }
};

export const obtenerReportes = () => {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || '[]');
  } catch {
    return [];
  }
};

export const eliminarReporte = (id) => {
  const actualizados = obtenerReportes().filter((r) => r.id !== id);
  localStorage.setItem(CACHE_KEY, JSON.stringify(actualizados));
  return actualizados;
};

export const limpiarReportes = () => {
  localStorage.removeItem(CACHE_KEY);
};