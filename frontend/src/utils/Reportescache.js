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

const HISTORIAL_KEY = 'incidentes_visitados';
const MAX_HISTORIAL = 50;

export const guardarEnHistorial = (incidente) => {
  try {
    const previos = JSON.parse(localStorage.getItem(HISTORIAL_KEY) || '[]');
    const filtrados = previos.filter((i) => i.id_conv_eleven !== incidente.id_conv_eleven);
    const actualizados = [
      { ...incidente, visitadoEn: new Date().toISOString() },
      ...filtrados,
    ].slice(0, MAX_HISTORIAL);
    localStorage.setItem(HISTORIAL_KEY, JSON.stringify(actualizados));
  } catch {
    // noop
  }
};

export const obtenerHistorial = () => {
  try {
    return JSON.parse(localStorage.getItem(HISTORIAL_KEY) || '[]');
  } catch {
    return [];
  }
};

export const eliminarDelHistorial = (id_conv_eleven) => {
  const actualizados = obtenerHistorial().filter((i) => i.id_conv_eleven !== id_conv_eleven);
  localStorage.setItem(HISTORIAL_KEY, JSON.stringify(actualizados));
  return actualizados;
};

export const limpiarHistorial = () => {
  localStorage.removeItem(HISTORIAL_KEY);
};
