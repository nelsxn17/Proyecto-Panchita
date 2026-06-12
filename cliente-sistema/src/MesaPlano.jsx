import React from 'react';
import mesa1 from './assets/mesa.webp';

const IMAGEN_DEFAULT = mesa1;

export function MesaPlano({ mesa, onClick, onDelete, imagenUrl }) {
  const estado = mesa.estado === 'ocupada'   ? 'ocupada'
    : mesa.estado === 'reservada' ? 'reservada'
    : 'disponible';

  const textoEstado = estado === 'ocupada'   ? 'Ocupada'
    : estado === 'reservada' ? 'Reservada'
    : 'Libre';

  const src = imagenUrl || mesa.imagenUrl || IMAGEN_DEFAULT;

  const handleDelete = (e) => {
    e.stopPropagation(); // Evita disparar el onClick del estado
    if (onDelete) onDelete(mesa);
  };

  return (
    <div className="mesa-card-wrap">
      <button
        className={`mesa-card mesa-card--${estado}`}
        onClick={() => onClick && onClick(mesa.id, mesa.estado)}
        aria-label={`Mesa ${mesa.numero}, ${textoEstado}`}
        title={`Mesa ${mesa.numero} · ${mesa.capacidad} personas · ${textoEstado}`}
      >
        {/* IMAGEN */}
        <div className="mesa-card__img-wrap">
          <img
            src={src}
            alt={`Mesa ${mesa.numero}`}
            className="mesa-card__img"
            onError={(e) => { e.currentTarget.src = IMAGEN_DEFAULT; }}
          />
          <div className="mesa-card__overlay" />
        </div>

        {/* FOOTER */}
        <div className="mesa-card__footer">
          <div className="mesa-card__row-superior">
            <span className="mesa-card__numero">M-{mesa.numero}</span>
            <span className="mesa-card__capacidad">{mesa.capacidad} pers.</span>
          </div>
          <div className="mesa-card__row-inferior">
            <span className={`mesa-card__badge mesa-card__badge--${estado}`}>
              {textoEstado}
            </span>
          </div>
        </div>
      </button>

      {/* BOTÓN ELIMINAR — aparece en hover via CSS */}
      {onDelete && (
        <button
          className="mesa-delete-btn"
          onClick={handleDelete}
          aria-label={`Eliminar mesa ${mesa.numero}`}
          title="Eliminar mesa"
        >
          ✕
        </button>
      )}
    </div>
  );
}