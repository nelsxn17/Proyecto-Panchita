import React, { useState, useEffect, useCallback } from 'react';
import './GestionEstacionamiento.css';

const ESTADOS = {
  LIBRE:    { label: 'Libre',    clase: 'espacio-libre',    icono: '🅿️' },
  OCUPADO:  { label: 'Ocupado',  clase: 'espacio-ocupado',  icono: '🚗' },
};

const minutosOcupado = (fechaEntrada) => {
  if (!fechaEntrada) return null;
  const diff = Date.now() - new Date(fechaEntrada).getTime();
  return Math.floor(diff / 60000);
};

const TOTAL_ESPACIOS = 20;

export default function GestionEstacionamiento() {
  const [espacios, setEspacios]           = useState([]);
  const [reservas, setReservas]           = useState([]);
  const [filtro, setFiltro]               = useState('TODOS');
  const [espacioActivo, setEspacioActivo] = useState(null);
  const [modalRegistro, setModalRegistro] = useState(null);
  const [cargando, setCargando]           = useState(true);

  // Inicializar espacios
  const inicializarEspacios = useCallback((reservasData) => {
    const espaciosOcupados = reservasData
      .filter(r => r.estacionamiento === 1 || r.estacionamiento === true)
      .map(r => ({
        reservaId: r.id,
        codigoReserva: r.codigoReserva,
        cliente: r.usuario?.nombre || 'Cliente',
        fechaEntrada: r.updatedAt || r.createdAt,
      }));

    const nuevosEspacios = Array.from({ length: TOTAL_ESPACIOS }, (_, i) => {
      const ocupado = espaciosOcupados[i];
      return {
        id: i + 1,
        numero: i + 1,
        estado: ocupado ? 'OCUPADO' : 'LIBRE',
        reservaId: ocupado?.reservaId || null,
        codigoReserva: ocupado?.codigoReserva || null,
        cliente: ocupado?.cliente || null,
        fechaEntrada: ocupado?.fechaEntrada || null,
      };
    });

    setEspacios(nuevosEspacios);
    setCargando(false);
  }, []);

  const cargarReservas = useCallback(() => {
    setCargando(true);
    fetch('http://localhost:8080/api/reservas')
      .then(r => r.json())
      .then(data => {
        setReservas(Array.isArray(data) ? data : []);
        inicializarEspacios(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        setReservas([]);
        inicializarEspacios([]);
      });
  }, [inicializarEspacios]);

  useEffect(() => { cargarReservas(); }, [cargarReservas]);

  const conteo = {
    LIBRE:   espacios.filter(e => e.estado === 'LIBRE').length,
    OCUPADO: espacios.filter(e => e.estado === 'OCUPADO').length,
  };

  const espaciosFiltrados = filtro === 'TODOS'
    ? espacios
    : espacios.filter(e => e.estado === filtro);

  // Registrar entrada — marca estacionamiento=1 en la reserva
  const registrarEntrada = (espacioId, reserva) => {
    fetch(`http://localhost:8080/api/reservas/${reserva.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...reserva, estacionamiento: 1 }),
    })
      .then(() => {
        setEspacios(prev => prev.map(e =>
          e.id === espacioId
            ? { ...e, estado: 'OCUPADO', reservaId: reserva.id, codigoReserva: reserva.codigoReserva, cliente: reserva.usuario?.nombre || 'Cliente', fechaEntrada: new Date().toISOString() }
            : e
        ));
        setModalRegistro(null);
      })
      .catch(() => alert('No se pudo registrar la entrada.'));
  };

  // Registrar salida — marca estacionamiento=0
  const registrarSalida = (espacio) => {
    fetch(`http://localhost:8080/api/reservas/${espacio.reservaId}`)
      .then(r => r.json())
      .then(reserva => {
        return fetch(`http://localhost:8080/api/reservas/${espacio.reservaId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...reserva, estacionamiento: 0 }),
        });
      })
      .then(() => {
        setEspacios(prev => prev.map(e =>
          e.id === espacio.id
            ? { ...e, estado: 'LIBRE', reservaId: null, codigoReserva: null, cliente: null, fechaEntrada: null }
            : e
        ));
        setEspacioActivo(null);
      })
      .catch(() => alert('No se pudo registrar la salida.'));
  };

  // Reservas disponibles (sin estacionamiento aún)
  const reservasDisponibles = reservas.filter(r => !r.estacionamiento || r.estacionamiento === 0);

  return (
    <div className="estacionamiento-container">
      <div className="estacionamiento-header">
        <div>
          <h1 className="estacionamiento-titulo">🚗 Estacionamiento</h1>
          <p className="estacionamiento-subtitulo">
            Vista en tiempo real · {TOTAL_ESPACIOS} espacios en total
          </p>
        </div>
        <button className="btn-refresh" onClick={cargarReservas}>↻ Actualizar</button>
      </div>

      {/* Resumen */}
      <div className="estacionamiento-resumen">
        <div className="resumen-card resumen-libre">
          <span className="resumen-icono">🟢</span>
          <span className="resumen-numero">{conteo.LIBRE}</span>
          <span className="resumen-label">Libres</span>
        </div>
        <div className="resumen-card resumen-ocupado">
          <span className="resumen-icono">🔴</span>
          <span className="resumen-numero">{conteo.OCUPADO}</span>
          <span className="resumen-label">Ocupados</span>
        </div>
      </div>

      {/* Filtros */}
      <div className="estacionamiento-filtros">
        {[
          { key: 'TODOS',   label: 'Todos',    count: espacios.length },
          { key: 'LIBRE',   label: 'Libres',   count: conteo.LIBRE },
          { key: 'OCUPADO', label: 'Ocupados', count: conteo.OCUPADO },
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

      {/* Mapa */}
      {cargando ? (
        <div className="estacionamiento-cargando">Cargando espacios...</div>
      ) : (
        <div className="espacios-grid">
          {espaciosFiltrados.map((espacio) => {
            const cfg  = ESTADOS[espacio.estado];
            const mins = minutosOcupado(espacio.fechaEntrada);
            const urgente = espacio.estado === 'OCUPADO' && mins !== null && mins >= 120;

            return (
              <button
                key={espacio.id}
                className={`espacio-card ${cfg.clase} ${urgente ? 'espacio-urgente' : ''}`}
                onClick={() => espacio.estado === 'LIBRE' ? setModalRegistro(espacio) : setEspacioActivo(espacio)}
              >
                <span className="espacio-icono">{cfg.icono}</span>
                <span className="espacio-numero">#{espacio.numero}</span>
                {espacio.codigoReserva && (
                  <span className="espacio-codigo">{espacio.codigoReserva}</span>
                )}
                {espacio.cliente && (
                  <span className="espacio-cliente">{espacio.cliente}</span>
                )}
                <span className={`espacio-estado-label estado-${espacio.estado.toLowerCase()}`}>
                  {cfg.label}
                </span>
                {mins !== null && (
                  <span className={`espacio-tiempo ${urgente ? 'tiempo-urgente' : ''}`}>
                    {mins}min {urgente ? '⚠' : ''}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Modal detalle */}
      {espacioActivo && (
        <ModalDetalle
          espacio={espacioActivo}
          onCerrar={() => setEspacioActivo(null)}
          onSalida={registrarSalida}
        />
      )}

      {/* Modal entrada */}
      {modalRegistro && (
        <ModalEntrada
          espacio={modalRegistro}
          reservas={reservasDisponibles}
          onCerrar={() => setModalRegistro(null)}
          onConfirmar={registrarEntrada}
        />
      )}
    </div>
  );
}

function ModalDetalle({ espacio, onCerrar, onSalida }) {
  const mins = minutosOcupado(espacio.fechaEntrada);

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="modal-detalle" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="modal-titulo">Espacio #{espacio.numero}</h2>
            <span className="modal-estado-badge estado-ocupado">🚗 Ocupado</span>
          </div>
          <button className="modal-cerrar" onClick={onCerrar}>✕</button>
        </div>
        <div className="modal-body">
          {espacio.codigoReserva && (
            <div className="modal-fila">
              <span className="modal-campo">Código Reserva</span>
              <span className="modal-valor">{espacio.codigoReserva}</span>
            </div>
          )}
          {espacio.cliente && (
            <div className="modal-fila">
              <span className="modal-campo">Cliente</span>
              <span className="modal-valor">{espacio.cliente}</span>
            </div>
          )}
          {espacio.fechaEntrada && (
            <div className="modal-fila">
              <span className="modal-campo">Hora entrada</span>
              <span className="modal-valor">
                {new Date(espacio.fechaEntrada).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          )}
          {mins !== null && (
            <div className="modal-fila">
              <span className="modal-campo">Tiempo</span>
              <span className={`modal-valor ${mins >= 120 ? 'valor-alerta' : ''}`}>
                {mins} minutos {mins >= 120 ? '⚠ Supera 2h' : ''}
              </span>
            </div>
          )}
        </div>
        <div className="modal-acciones">
          <button className="btn-salida" onClick={() => onSalida(espacio)}>
            🚗 Registrar Salida
          </button>
        </div>
      </div>
    </div>
  );
}

function ModalEntrada({ espacio, reservas, onCerrar, onConfirmar }) {
  const [busqueda, setBusqueda]           = useState('');
  const [reservaSeleccionada, setReserva] = useState(null);

  const reservasFiltradas = reservas.filter(r =>
    r.codigoReserva?.toLowerCase().includes(busqueda.toLowerCase()) ||
    r.usuario?.nombre?.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="modal-detalle" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="modal-titulo">Espacio #{espacio.numero}</h2>
            <span className="modal-estado-badge estado-libre">🟢 Libre</span>
          </div>
          <button className="modal-cerrar" onClick={onCerrar}>✕</button>
        </div>
        <div className="modal-body">
          <p className="modal-subtitulo">Busca la reserva del cliente</p>
          <div className="modal-campo-input">
            <label>Código de reserva o nombre</label>
            <input
              type="text"
              placeholder="Ej: RES-001 o Juan Pérez"
              value={busqueda}
              onChange={e => { setBusqueda(e.target.value); setReserva(null); }}
              className="input-campo"
            />
          </div>

          {/* Lista de reservas */}
          {busqueda && (
            <div className="reservas-lista">
              {reservasFiltradas.length === 0 ? (
                <p className="reservas-vacio">No se encontraron reservas</p>
              ) : (
                reservasFiltradas.map(r => (
                  <button
                    key={r.id}
                    className={`reserva-item ${reservaSeleccionada?.id === r.id ? 'reserva-seleccionada' : ''}`}
                    onClick={() => setReserva(r)}
                  >
                    <span className="reserva-codigo">{r.codigoReserva}</span>
                    <span className="reserva-cliente">{r.usuario?.nombre || 'Sin nombre'}</span>
                    <span className="reserva-hora">{r.hora} — {r.fecha}</span>
                  </button>
                ))
              )}
            </div>
          )}

          {reservaSeleccionada && (
            <div className="reserva-confirmada">
              ✅ Reserva seleccionada: <strong>{reservaSeleccionada.codigoReserva}</strong> — {reservaSeleccionada.usuario?.nombre}
            </div>
          )}

          <div className="modal-fila">
            <span className="modal-campo">Hora entrada</span>
            <span className="modal-valor">
              {new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
        <div className="modal-acciones">
          <button className="btn-cancelar" onClick={onCerrar}>Cancelar</button>
          <button
            className="btn-entrada"
            onClick={() => reservaSeleccionada ? onConfirmar(espacio.id, reservaSeleccionada) : alert('Selecciona una reserva')}
          >
            ✅ Confirmar Entrada
          </button>
        </div>
      </div>
    </div>
  );
}
