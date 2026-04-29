import { useState } from 'react';
import './DateRangePicker.css';

const DIAS = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const getDiasDelMes = (year, month) => {
  const primerDia = new Date(year, month, 1).getDay();
  const ajuste = primerDia === 0 ? 6 : primerDia - 1;
  const totalDias = new Date(year, month + 1, 0).getDate();
  return { ajuste, totalDias };
};

const formatDisplay = (fecha) => {
  if (!fecha) return '--/--/----';
  const [year, month, day] = fecha.split('-');
  return `${month}/${day}/${year}`;
};

const formatSummary = (fecha) => {
  if (!fecha) return 'Sin seleccionar';

  const [year, month, day] = fecha.split('-').map(Number);
  const parsed = new Date(year, month - 1, day);

  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(parsed);
};

const getRangeDays = (fechaInicio, fechaFin) => {
  if (!fechaInicio || !fechaFin) return null;

  const inicio = new Date(`${fechaInicio}T00:00:00`);
  const fin = new Date(`${fechaFin}T00:00:00`);
  const diff = Math.round((fin - inicio) / 86400000);

  return diff + 1;
};

const DateRangePicker = ({ fechaInicio, fechaFin, onChangeFechaInicio, onChangeFechaFin }) => {
  const hoy = new Date();
  const [viewYear, setViewYear] = useState(hoy.getFullYear());
  const [viewMonth, setViewMonth] = useState(hoy.getMonth());

  const { ajuste, totalDias } = getDiasDelMes(viewYear, viewMonth);
  const rangeDays = getRangeDays(fechaInicio, fechaFin);

  const hoyStr = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;

  const handleHoy = () => {
    if (fechaInicio === hoyStr && fechaFin === hoyStr) {
      onChangeFechaInicio?.(null);
      onChangeFechaFin?.(null);
    } else {
      setViewYear(hoy.getFullYear());
      setViewMonth(hoy.getMonth());
      onChangeFechaInicio?.(hoyStr);
      onChangeFechaFin?.(hoyStr);
    }
  };

  const handleDayClick = (day) => {
    const fecha = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    if (fecha === fechaInicio || fecha === fechaFin) {
      onChangeFechaInicio?.(null);
      onChangeFechaFin?.(null);
      return;
    }

    if (!fechaInicio || (fechaInicio && fechaFin)) {
      onChangeFechaInicio?.(fecha);
      onChangeFechaFin?.(null);
      return;
    }

    if (fecha < fechaInicio) {
      onChangeFechaFin?.(fechaInicio);
      onChangeFechaInicio?.(fecha);
      return;
    }

    onChangeFechaFin?.(fecha);
  };

  const isInRange = (day) => {
    if (!fechaInicio || !fechaFin) return false;
    const fecha = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return fecha > fechaInicio && fecha < fechaFin;
  };

  const isSelected = (day) => {
    const fecha = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return fecha === fechaInicio || fecha === fechaFin;
  };

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((year) => year - 1);
      return;
    }

    setViewMonth((month) => month - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((year) => year + 1);
      return;
    }

    setViewMonth((month) => month + 1);
  };

  return (
    <div className="datepicker">
      <div className="datepicker-range">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <rect x="1" y="2" width="12" height="11" rx="2" stroke="#6C63FF" strokeWidth="1.5" fill="none" />
          <path d="M1 6H13" stroke="#6C63FF" strokeWidth="1.5" />
          <path d="M4 1V3M10 1V3" stroke="#6C63FF" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <span>{formatDisplay(fechaInicio)} - {formatDisplay(fechaFin)}</span>
      </div>

      <div className="datepicker-nav">
        <button onClick={prevMonth} className="nav-btn">&#8249;</button>
        <span>{MESES[viewMonth]} {viewYear}</span>
        <button onClick={nextMonth} className="nav-btn">&#8250;</button>
      </div>

      <div className="datepicker-shortcuts">
        <button
          type="button"
          className={`date-shortcut-btn ${fechaInicio === hoyStr && fechaFin === hoyStr ? 'is-active' : ''}`}
          onClick={handleHoy}
        >
          Hoy
        </button>
      </div>

      <div className="datepicker-grid">
        {DIAS.map((dia) => <span key={dia} className="day-label">{dia}</span>)}
        {Array.from({ length: ajuste }).map((_, index) => <span key={`empty-${index}`} />)}
        {Array.from({ length: totalDias }, (_, index) => index + 1).map((day) => (
          <button
            key={day}
            className={`day-btn ${isSelected(day) ? 'selected' : ''} ${isInRange(day) ? 'in-range' : ''}`}
            onClick={() => handleDayClick(day)}
          >
            {day}
          </button>
        ))}
      </div>

      <div className="datepicker-summary">
        <div className="datepicker-summary-copy">
          <span className="datepicker-summary-label">Rango seleccionado</span>
          <strong className="datepicker-summary-value">
            {formatSummary(fechaInicio)} - {formatSummary(fechaFin)}
          </strong>
        </div>

        <div className={`datepicker-duration ${rangeDays ? '' : 'is-pending'}`}>
          {rangeDays ? `${rangeDays} dia(s)` : 'Selecciona dos fechas'}
        </div>
      </div>
    </div>
  );
};

export default DateRangePicker;
