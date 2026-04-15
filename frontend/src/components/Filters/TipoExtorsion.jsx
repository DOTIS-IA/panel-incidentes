import './TipoExtorsion.css';

// =============================================
// SELECTOR TIPO DE EXTORSION
// Props:
//   - tipos: array de strings (puede venir del fetch)
//   - seleccionado: string
//   - onSelect: fn(tipo)
// =============================================

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

const TipoExtorsion = ({ tipos = TIPOS_DEFAULT, seleccionado, onSelect }) => {
  const opciones = Array.isArray(tipos) && tipos.length > 0 ? tipos : TIPOS_DEFAULT;

  return (
    <div className="tipo-extorsion">
      <label className="tipo-label">Tipo de extorsion</label>
      <div className="tipo-lista">
        {opciones.map((tipo) => (
          <button
            key={tipo}
            type="button"
            className={`tipo-btn ${seleccionado === tipo ? 'selected' : ''}`}
            onClick={() => onSelect?.(tipo === seleccionado ? null : tipo)}
            title={tipo}
          >
            {tipo}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TipoExtorsion;
