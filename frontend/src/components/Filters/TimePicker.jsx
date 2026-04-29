import './TimePicker.css';

const QUICK_RANGES = [
  { label: 'Todo el día', start: '00:00', end: '23:59' },
  { label: 'Mañana', start: '06:00', end: '11:59' },
  { label: 'Tarde', start: '12:00', end: '17:59' },
  { label: 'Noche', start: '18:00', end: '23:00' },
];

const toTimeValue = (hour24, minute) =>
  `${String(hour24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

const toTotalMinutes = (hour24, minute) => Number(hour24) * 60 + Number(minute);

const formatTimeLabel = (hour24, minute) => {
  const numericHour = Number(hour24);
  const period = numericHour >= 12 ? 'PM' : 'AM';
  const displayHour = String(numericHour % 12 || 12).padStart(2, '0');
  return `${displayHour}:${String(minute).padStart(2, '0')} ${period}`;
};

const formatDuration = (startTotalMinutes, endTotalMinutes) => {
  const diff = endTotalMinutes - startTotalMinutes;
  if (diff < 0) return 'Rango inválido';

  const hours = Math.floor(diff / 60);
  const minutes = diff % 60;

  if (hours && minutes) return `${hours} h ${minutes} min`;
  if (hours) return `${hours} h`;
  return `${minutes} min`;
};

const TimeField = ({ title, helper, value, onChange }) => (
  <section className="time-field-card">
    <div className="time-field-header">
      <span className="time-field-kicker">{title}</span>
      <strong className="time-field-value">{value}</strong>
    </div>

    <label className="time-input-shell">
      <span className="time-input-label">{helper}</span>
      <input
        className="time-native-input"
        type="time"
        step="300"
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
      />
    </label>
  </section>
);

const TimePicker = ({
  horaInicio = '09',
  minutosInicio = '00',
  horaFin = '14',
  minutosFin = '00',
  onChangeHoraInicio,
  onChangeMinutosInicio,
  onChangeHoraFin,
  onChangeMinutosFin,
}) => {
  const valorInicio = toTimeValue(horaInicio, minutosInicio);
  const valorFin = toTimeValue(horaFin, minutosFin);
  const inicioTotal = toTotalMinutes(horaInicio, minutosInicio);
  const finTotal = toTotalMinutes(horaFin, minutosFin);
  const rangoInvalido = finTotal < inicioTotal;

  const applyTime = (value, changeHour, changeMinute) => {
    const [nextHour = '00', nextMinute = '00'] = String(value || '').split(':');
    changeHour?.(nextHour);
    changeMinute?.(nextMinute);
  };

  const applyQuickRange = ({ start, end }) => {
    if (start === valorInicio && end === valorFin) {
      applyTime('09:00', onChangeHoraInicio, onChangeMinutosInicio);
      applyTime('14:00', onChangeHoraFin, onChangeMinutosFin);
    } else {
      applyTime(start, onChangeHoraInicio, onChangeMinutosInicio);
      applyTime(end, onChangeHoraFin, onChangeMinutosFin);
    }
  };

  return (
    <div className="timepicker-card timepicker-card-range">
      <div className="timepicker-quick-ranges" role="group" aria-label="Rangos sugeridos">
        {QUICK_RANGES.map((range) => {
          const isActive = range.start === valorInicio && range.end === valorFin;

          return (
            <button
              key={range.label}
              type="button"
              className={`time-quick-btn ${isActive ? 'is-active' : ''}`}
              onClick={() => applyQuickRange(range)}
            >
              {range.label}
            </button>
          );
        })}
      </div>

      <div className="time-range-grid">
        <TimeField
          title="Desde"
          helper="Hora inicial"
          value={valorInicio}
          onChange={(value) => applyTime(value, onChangeHoraInicio, onChangeMinutosInicio)}
        />

        <div className="time-range-arrow" aria-hidden="true">
          <span>→</span>
        </div>

        <TimeField
          title="Hasta"
          helper="Hora final"
          value={valorFin}
          onChange={(value) => applyTime(value, onChangeHoraFin, onChangeMinutosFin)}
        />
      </div>

      <div className="timepicker-summary">
        <div className="timepicker-selected">
          <span className="timepicker-selected-label">Rango seleccionado</span>
          <strong className="timepicker-selected-value">
            {formatTimeLabel(horaInicio, minutosInicio)} - {formatTimeLabel(horaFin, minutosFin)}
          </strong>
        </div>

        <div className={`timepicker-duration ${rangoInvalido ? 'is-invalid' : ''}`}>
          Duración: {formatDuration(inicioTotal, finTotal)}
        </div>
      </div>

      {rangoInvalido && (
        <p className="timepicker-warning">
          La hora final debe ser igual o posterior a la hora inicial.
        </p>
      )}
    </div>
  );
};

export default TimePicker;
