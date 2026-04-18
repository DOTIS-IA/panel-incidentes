import './TipoExtorsion.css';

const TIPOS_DEFAULT = [
  'Extorsion presencial-exigencia de pago o bienes (Directa)',
  'Extorsion por secuestro virtual',
  'Extorsion telefonica-virtual-exigencia de pago o bienes (Indirecta)',
  'Extorsion escrita-otros medios exigencia de pago o bienes (Indirecta)',
  'Fraude-engano telefonico-virtual',
  'Denuncia de localizacion y operacion del probable extorsionador o grupo delictivo',
  'Extorsion por invasion-despojo de predio',
  'Extorsion por contenido sexual o intimo',
];

const normalizeLabel = (tipo) =>
  String(tipo || '')
    .replace(/Extorsi[oó]n/gi, 'Extorsion')
    .replace(/telef[oó]nica/gi, 'telefonica')
    .replace(/engañ[oa]/gi, 'engano')
    .replace(/localizaci[oó]n/gi, 'localizacion')
    .replace(/operaci[oó]n/gi, 'operacion')
    .replace(/invasi[oó]n/gi, 'invasion')
    .replace(/íntimo/gi, 'intimo')
    .replace(/í/gi, 'i')
    .replace(/á/gi, 'a')
    .replace(/é/gi, 'e')
    .replace(/ó/gi, 'o')
    .replace(/ú/gi, 'u')
    .replace(/ñ/gi, 'n');

const TipoExtorsion = ({ tipos = TIPOS_DEFAULT, seleccionado, onSelect }) => {
  const opciones = Array.isArray(tipos) && tipos.length > 0 ? tipos : TIPOS_DEFAULT;

  return (
    <section className="tipo-extorsion">
      <div className="tipo-header">
        <label className="tipo-label">Tipo de extorsion</label>
        <p className="tipo-helper">
          Selecciona una categoria para enfocar la consulta en un patron especifico.
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
