import React, { useState, useEffect, useCallback } from 'react';
import './MapaSalon.css';

// ─── Helpers ────────────────────────────────────────────────────────────────
const ESTADOS = {
  LIBRE:     { label: 'Libre',     clase: 'mesa-libre',     icono: '○' },
  OCUPADA:   { label: 'Ocupada',   clase: 'mesa-ocupada',   icono: '●' },
  RESERVADA: { label: 'Reservada', clase: 'mesa-reservada', icono: '◑' },
  BLOQUEADA: { label: 'Bloqueada', clase: 'mesa-bloqueada', icono: '✕' },
};

const normalizarEstado = (estado) => {
  if (!estado) return 'LIBRE';
  const e = estado.toUpperCase();
  if (e === 'OCUPADA' || e === 'OCUPADO') return 'OCUPADA';
  if (e === 'RESERVADA' || e === 'RESERVADO') return 'RESERVADA';
  if (e === 'BLOQUEADA' || e === 'BLOQUEADO') return 'BLOQUEADA';
  return 'LIBRE';
};

const minutosOcupada = (fechaOcupacion) => {
  if (!fechaOcupacion) return null;
  const diff = Date.now() - new Date(fechaOcupacion).getTime();
  return Math.floor(diff / 60000);
};

// ─── Componente principal ────────────────────────────────────────────────────

export default function MapaSalon({ onAlerta }) {
  const [mesas, setMesas]         = useState([]);
  const [cargando, setCargando]   = useState(true);
  const [mesaActiva, setMesaActiva] = useState(null); // mesa seleccionada para modal
  const [filtro, setFiltro]       = useState('TODAS');

const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
const [hora, setHora] = useState(new Date().toTimeString().split(':').slice(0, 2).join(':'));

const cargarMesas = useCallback(() => {
    // 2. Apunta a tu endpoint /disponibilidad y pasa los parámetros
    fetch(`http://localhost:8080/api/mesas/disponibilidad?fecha=${fecha}&hora=${hora}`)
      .then((r) => r.json())
      .then((data) => {
        setMesas(Array.isArray(data) ? data : []);
        setCargando(false);
      })
      .catch(() => setCargando(false));
  }, [fecha, hora, onAlerta]); // 3. IMPORTANTE: agrega fecha y hora como dependencias

  useEffect(() => {
    cargarMesas();
  }, [cargarMesas]); // Se recargará automáticamente al cambiar fecha u hora

  const mesasFiltradas = filtro === 'TODAS'
    ? mesas
    : mesas.filter((m) => normalizarEstado(m.estado) === filtro);

  const conteo = {
    LIBRE:     mesas.filter((m) => normalizarEstado(m.estado) === 'LIBRE').length,
    OCUPADA:   mesas.filter((m) => normalizarEstado(m.estado) === 'OCUPADA').length,
    RESERVADA: mesas.filter((m) => normalizarEstado(m.estado) === 'RESERVADA').length,
    BLOQUEADA: mesas.filter((m) => normalizarEstado(m.estado) === 'BLOQUEADA').length,
  };

  return (
    <div className="mapa-salon-container">
      {/* ── Header ── */}
     <div className="mapa-header">
  <div>
    <h1 className="mapa-titulo">Mapa del Salón</h1>
    <p className="mapa-subtitulo">
      Vista en tiempo real · {mesas.length} mesas en total
    </p>
  </div>

  {/* ── Nuevos selectores de tiempo ── */}
  <div className="mapa-filtros-tiempo">
    <input 
      type="date" 
      value={fecha} 
      onChange={(e) => setFecha(e.target.value)} 
      className="input-tiempo"
    />
    <input 
      type="time" 
      value={hora} 
      onChange={(e) => setHora(e.target.value)} 
      className="input-tiempo"
    />
  </div>

  <button className="btn-refresh-mapa" onClick={cargarMesas} title="Actualizar mapa">
    ↻ Actualizar
  </button>
</div>

      {/* ── Leyenda / filtros ── */}
      <div className="mapa-filtros">
        {[
          { key: 'TODAS',     label: 'Todas',     count: mesas.length },
          { key: 'LIBRE',     label: 'Libres',    count: conteo.LIBRE },
          { key: 'OCUPADA',   label: 'Ocupadas',  count: conteo.OCUPADA },
          { key: 'RESERVADA', label: 'Reservadas',count: conteo.RESERVADA },
          { key: 'BLOQUEADA', label: 'Bloqueadas',count: conteo.BLOQUEADA },
        ].map(({ key, label, count }) => (
          <button
            key={key}
            className={`filtro-btn filtro-${key.toLowerCase()} ${filtro === key ? 'activo' : ''}`}
            onClick={() => setFiltro(key)}
          >
            <span className="filtro-dot" />
            {label}
            <span className="filtro-count">{count}</span>
          </button>
        ))}
      </div>

      {/* ── Grid de mesas ── */}
      {cargando ? (
        <div className="mapa-cargando">Cargando mapa del salón...</div>
      ) : mesas.length === 0 ? (
        <div className="mapa-vacio">No se encontraron mesas registradas.</div>
      ) : (
        <div className="mesas-grid">
          {mesasFiltradas.map((mesa) => {
            const estadoKey = normalizarEstado(mesa.estado);
            const cfg       = ESTADOS[estadoKey];
            const mins      = minutosOcupada(mesa.fechaOcupacion);
            const urgente   = estadoKey === 'OCUPADA' && mins !== null && mins >= 90;

            return (
              <button
                key={mesa.id}
                className={`mesa-card ${cfg.clase} ${urgente ? 'mesa-urgente' : ''}`}
                onClick={() => setMesaActiva(mesa)}
                title={`Mesa ${mesa.numero} — ${cfg.label}`}
              >
                <span className="mesa-icono">{cfg.icono}</span>
                <span className="mesa-numero">Mesa {mesa.numero}</span>
                <span className="mesa-capacidad">
                  {mesa.capacidad ? `${mesa.capacidad} personas` : ''}
                </span>
                <span className={`mesa-estado-label estado-${estadoKey.toLowerCase()}`}>
                  {cfg.label}
                </span>
                {urgente && (
                  <span className="mesa-alerta-badge">+{mins}min</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Modal de detalle ── */}
      {mesaActiva && (
        <ModalMesa
          mesa={mesaActiva}
          onCerrar={() => setMesaActiva(null)}
          onActualizar={cargarMesas}
        />
      )}
    </div>
  );
}

// ─── Modal de detalle ────────────────────────────────────────────────────────

function ModalMesa({ mesa, onCerrar, onActualizar }) {
  const estadoKey = normalizarEstado(mesa.estado);
  const cfg       = ESTADOS[estadoKey];
  const mins      = minutosOcupada(mesa.fechaOcupacion);

  const cambiarEstado = (nuevoEstado) => {
    fetch(`http://localhost:8080/api/mesas/${mesa.id}/estado`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: nuevoEstado }),
    })
      .then((r) => { if (!r.ok) throw new Error(); })
      .then(() => { onActualizar(); onCerrar(); })
      .catch(() => alert('No se pudo cambiar el estado de la mesa.'));
  };

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="modal-detalle" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="modal-titulo">Mesa {mesa.numero}</h2>
            <span className={`modal-estado-badge estado-${estadoKey.toLowerCase()}`}>
              {cfg.icono} {cfg.label}
            </span>
          </div>
          <button className="modal-cerrar" onClick={onCerrar}>✕</button>
        </div>

        <div className="modal-body">
          <div className="modal-fila">
            <span className="modal-campo">Capacidad</span>
            <span className="modal-valor">{mesa.capacidad || '—'} personas</span>
          </div>
          <div className="modal-fila">
            <span className="modal-campo">Zona / Sala</span>
            <span className="modal-valor">{mesa.sala ? mesa.sala.nombre : (mesa.ubicacion || '—')}</span>
          </div>
          {estadoKey === 'OCUPADA' && (
            <>
              <div className="modal-fila">
                <span className="modal-campo">Tiempo ocupada</span>
                <span className={`modal-valor ${mins >= 90 ? 'valor-alerta' : ''}`}>
                  {mins !== null ? `${mins} minutos` : '—'}
                  {mins >= 90 && ' ⚠ Supera 90 min'}
                </span>
              </div>
              <div className="modal-fila">
                <span className="modal-campo">Mozo asignado</span>
                <span className="modal-valor">{mesa.mozo || mesa.empleado || '—'}</span>
              </div>
            </>
          )}
          {estadoKey === 'RESERVADA' && (
            <>
              <div className="modal-fila">
                <span className="modal-campo">Cliente</span>
                <span className="modal-valor">{mesa.clienteReserva || '—'}</span>
              </div>
              <div className="modal-fila">
                <span className="modal-campo">Hora de reserva</span>
                <span className="modal-valor">{mesa.horaReserva || '—'}</span>
              </div>
            </>
          )}
        </div>

        <div className="modal-acciones">
          <p className="modal-acciones-titulo">Cambiar estado:</p>
          <div className="modal-acciones-grid">
            {Object.entries(ESTADOS)
              .filter(([key]) => key !== estadoKey)
              .map(([key, val]) => (
                <button
                  key={key}
                  className={`btn-estado btn-estado-${key.toLowerCase()}`}
                  onClick={() => cambiarEstado(key)}
                >
                  {val.icono} {val.label}
                </button>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}