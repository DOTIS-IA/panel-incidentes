import './TimePicker.css';

const HOURS = Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, index) => String(index).padStart(2, '0'));

const toDisplayHour = (hour24) => {
  const numeric = Number(hour24);
  if (Number.isNaN(numeric)) return '12';
  return String(numeric % 12 || 12).padStart(2, '0');
};

const getPeriod = (hour24) => (Number(hour24) >= 12 ? 'PM' : 'AM');

const to24Hour = (hour12, period) => {
  const safeHour = Math.min(12, Math.max(1, Number(hour12) || 12));
  if (period === 'AM') {
    return String(safeHour === 12 ? 0 : safeHour).padStart(2, '0');
  }
  return String(safeHour === 12 ? 12 : safeHour + 12).padStart(2, '0');
};

const PickerColumn = ({ label, options, selectedValue, onSelect }) => (
  <div className="time-box">
    <div className="time-wheel" role="listbox" aria-label={label}>
      {options.map((option) => (
        <button
          key={option}
          type="button"
          className={`time-wheel-option ${selectedValue === option ? 'is-active' : ''}`}
          onClick={() => onSelect(option)}
        >
          {option}
        </button>
      ))}
    </div>
    <span className="time-box-label">{label}</span>
  </div>
);

const TimePicker = ({ hora = '09', minutos = '00', onChangeHora, onChangeMinutos }) => {
  const displayHour = toDisplayHour(hora);
  const period = getPeriod(hora);
  const selectedTimeLabel = `${displayHour}:${String(minutos).padStart(2, '0')} ${period}`;

  return (
    <div className="timepicker-card">
      <div className="timepicker-shell">
        <PickerColumn
          label="Hora"
          options={HOURS}
          selectedValue={displayHour}
          onSelect={(nextHour) => onChangeHora?.(to24Hour(nextHour, period))}
        />

        <div className="time-box-separator">:</div>

        <PickerColumn
          label="Minutos"
          options={MINUTES}
          selectedValue={String(minutos).padStart(2, '0')}
          onSelect={(nextMinute) => onChangeMinutos?.(nextMinute)}
        />

        <div className="time-period-toggle" role="group" aria-label="Periodo">
          {['AM', 'PM'].map((option) => (
            <button
              key={option}
              type="button"
              className={`time-period-btn ${period === option ? 'is-active' : ''}`}
              onClick={() => onChangeHora?.(to24Hour(displayHour, option))}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="timepicker-selected">
        <span className="timepicker-selected-label">Hora seleccionada:</span>
        <strong className="timepicker-selected-value">{selectedTimeLabel}</strong>
      </div>
    </div>
  );
};

export default TimePicker;
