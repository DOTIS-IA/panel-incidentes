import { useState } from 'react';
import './DateRangePicker.css';

// =============================================
// SELECTOR DE RANGO DE FECHAS
// Props:
//   - fechaInicio: string 'YYYY-MM-DD'
//   - fechaFin: string 'YYYY-MM-DD'
//   - onChangeFechaInicio: fn(fecha)
//   - onChangeFechaFin: fn(fecha)
// =============================================
const DIAS  = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MESES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const getDiasDelMes = (year, month) => {
  const primerDia = new Date(year, month, 1).getDay();
  const ajuste    = primerDia === 0 ? 6 : primerDia - 1;
  const totalDias = new Date(year, month + 1, 0).getDate();
  return { ajuste, totalDias };
};

const DateRangePicker = ({ fechaInicio, fechaFin, onChangeFechaInicio, onChangeFechaFin }) => {
  const hoy = new Date();
  const [viewYear, setViewYear]   = useState(hoy.getFullYear());
  const [viewMonth, setViewMonth] = useState(hoy.getMonth());

  const { ajuste, totalDias } = getDiasDelMes(viewYear, viewMonth);

  const formatDisplay = (f) => {
    if (!f) return '--/--/----';
    const [y, m, d] = f.split('-');
    return `${m}/${d}/${y}`;
  };

  const handleDayClick = (day) => {
    const fecha = `${viewYear}-${String(viewMonth + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    if (!fechaInicio || (fechaInicio && fechaFin)) {
      onChangeFechaInicio?.(fecha);
      onChangeFechaFin?.(null);
    } else {
      if (fecha < fechaInicio) {
        onChangeFechaFin?.(fechaInicio);
        onChangeFechaInicio?.(fecha);
      } else {
        onChangeFechaFin?.(fecha);
      }
    }
  };

  const isInRange = (day) => {
    if (!fechaInicio || !fechaFin) return false;
    const f = `${viewYear}-${String(viewMonth + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    return f > fechaInicio && f < fechaFin;
  };

  const isSelected = (day) => {
    const f = `${viewYear}-${String(viewMonth + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    return f === fechaInicio || f === fechaFin;
  };

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  return (
    <div className="datepicker">
      <div className="datepicker-range">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <rect x="1" y="2" width="12" height="11" rx="2" stroke="#6C63FF" strokeWidth="1.5" fill="none"/>
          <path d="M1 6H13" stroke="#6C63FF" strokeWidth="1.5"/>
          <path d="M4 1V3M10 1V3" stroke="#6C63FF" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <span>{formatDisplay(fechaInicio)} – {formatDisplay(fechaFin)}</span>
      </div>

      <div className="datepicker-nav">
        <button onClick={prevMonth} className="nav-btn">&#8249;</button>
        <span>{MESES[viewMonth]} {viewYear}</span>
        <button onClick={nextMonth} className="nav-btn">&#8250;</button>
      </div>

      <div className="datepicker-grid">
        {DIAS.map(d => <span key={d} className="day-label">{d}</span>)}
        {Array.from({ length: ajuste }).map((_, i) => <span key={`e-${i}`} />)}
        {Array.from({ length: totalDias }, (_, i) => i + 1).map(day => (
          <button
            key={day}
            className={`day-btn ${isSelected(day) ? 'selected' : ''} ${isInRange(day) ? 'in-range' : ''}`}
            onClick={() => handleDayClick(day)}
          >
            {day}
          </button>
        ))}
      </div>
    </div>
  );
};

export default DateRangePicker;