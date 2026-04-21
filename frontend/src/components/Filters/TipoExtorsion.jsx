import './TipoExtorsion.css';

const TIPOS_DEFAULT = [
  'Extorsión presencial-exigencia de pago o bienes (Directa)',
  'Extorsión por secuestro virtual',
  'Extorsión telefónica-virtual-exigencia de pago o bienes (Indirecta)',
  'Extorsión escrita-otros medios exigencia de pago o bienes (Indirecta)',
  'Fraude-engaño telefónico-virtual',
  'Denuncia de localización y operación del probable extorsionador o grupo delictivo',
  'Extorsión por invasión-despojo de predio',
  'Extorsión por contenido sexual o íntimo',
];

const normalizeLabel = (tipo) =>
  String(tipo || '')
    .replace(/Extorsi\?n/gi, 'Extorsión')
    .replace(/Extorsion/gi, 'Extorsión')
    .replace(/telef\?nica/gi, 'telefónica')
    .replace(/telefonica/gi, 'telefónica')
    .replace(/engano/gi, 'engaño')
    .replace(/localizacion/gi, 'localización')
    .replace(/operacion/gi, 'operación')
    .replace(/invasion/gi, 'invasión')
    .replace(/intimo/gi, 'íntimo');

const TipoExtorsion = ({ tipos = TIPOS_DEFAULT, seleccionado, onSelect }) => {
  const opciones = Array.isArray(tipos) && tipos.length > 0 ? tipos : TIPOS_DEFAULT;

  return (
    <section className="tipo-extorsion">
      <div className="tipo-header">
        <label className="tipo-label">Tipo de extorsión</label>
        <p className="tipo-helper">
          Selecciona una categoría para enfocar la consulta en un patrón específico.
        </p>
      </div>

      <div className="tipo-lista">
        {opciones.map((tipo, index) => {
          const label = normalizeLabel(tipo);

          return (
            <button
              key={`${index}-${label}`}
              type="button"
              className={`tipo-btn ${seleccionado === tipo ? 'selected' : ''}`}
              onClick={() => onSelect?.(tipo === seleccionado ? null : tipo)}
              title={label}
            >
              <span className="tipo-index">{String(index + 1).padStart(2, '0')}</span>
              <span className="tipo-texto">{label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default TipoExtorsion;
