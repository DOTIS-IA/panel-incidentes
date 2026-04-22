const CACHE_KEY = 'reportes_guardados';
const MAX_REPORTES = 20;

export const guardarReporteEnCache = (filtros, resultados) => {
  try {
    const previos = JSON.parse(localStorage.getItem(CACHE_KEY) || '[]');
    const resultadosNormalizados = Array.isArray(resultados) ? resultados : [];
    const nuevo = {
      id: Date.now(),
      generadoEn: new Date().toISOString(),
      filtros: { ...filtros },
      resultados: resultadosNormalizados,
      total: resultadosNormalizados.length,
    };
    const actualizados = [nuevo, ...previos].slice(0, MAX_REPORTES);
    localStorage.setItem(CACHE_KEY, JSON.stringify(actualizados));
    return actualizados;
  } catch {
    return [];
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
  const actualizados = obtenerReportes().filter((reporte) => reporte.id !== id);
  localStorage.setItem(CACHE_KEY, JSON.stringify(actualizados));
  return actualizados;
};

export const limpiarReportes = () => {
  localStorage.removeItem(CACHE_KEY);
};
