import React, { useState, useEffect, useCallback } from 'react';
import './MapaSalon.css';

const ESTADOS = {
  disponible: { label: 'Disponible', clase: 'mesa-libre',     icono: '○' },
  ocupada:    { label: 'Ocupada',    clase: 'mesa-ocupada',   icono: '●' },
  reservada:  { label: 'Reservada',  clase: 'mesa-reservada', icono: '◑' },
  bloqueada:  { label: 'Bloqueada',  clase: 'mesa-bloqueada', icono: '✕' },
};

const normalizarEstado = (estado) => {
  if (!estado) return 'disponible';
  const e = estado.toLowerCase();
  if (e === 'libre') return 'disponible'; 
  return ESTADOS[e] ? e : 'disponible';
};

const minutosOcupada = (fechaOcupacion) => {
  if (!fechaOcupacion) return null;
  return Math.floor((Date.now() - new Date(fechaOcupacion).getTime()) / 60000);
};

const normalizarSala = (nombre) => {
  if (!nombre) return '';
  return nombre.toString().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .trim();
};

// ─── Componente principal ────────────────────────────────────────────────────
export default function MapaSalon({ onAlerta }) {
  const [mesas, setMesas]           = useState([]);
  const [cargando, setCargando]     = useState(true);
  const [mesaActiva, setMesaActiva] = useState(null);
  const [filtro, setFiltro]         = useState('TODAS');
  const [salaActiva, setSalaActiva] = useState('todas'); 

    // Cambia el split('T') agregándole el [0] al final
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [hora, setHora]   = useState(new Date().toTimeString().split(':').slice(0, 2).join(':'));


  const cargarMesas = useCallback(() => {
    setCargando(true);
    fetch(`http://localhost:8080/api/mesas/disponibilidad?fecha=${fecha}&hora=${hora}`)
      .then(r => {
        if (!r.ok) throw new Error('Error de conexión');
        return r.json();
      })
      .then(data => { 
        setMesas(Array.isArray(data) ? data : []); 
        setCargando(false); 
      })
      .catch((err) => {
        console.error("Error al refrescar plano administrador:", err);
        setCargando(false);
      });
  }, [fecha, hora]);

  useEffect(() => { cargarMesas(); }, [cargarMesas]);

  // Auto-refresh automático cada 60 segundos
  useEffect(() => {
    const interval = setInterval(cargarMesas, 60000);
    return () => clearInterval(interval);
  }, [cargarMesas]);

  // Sincroniza la información del modal si las mesas cambian en segundo plano
  useEffect(() => {
    if (mesaActiva) {
      const mesaActualizada = mesas.find(m => m.id === mesaActiva.id);
      if (mesaActualizada) setMesaActiva(mesaActualizada);
    }
  }, [mesas]);

  // ── Filtrado ──────────────────────────────────────────────────────────────
  const mesasFiltradas = mesas.filter(m => {
    const matchEstado = filtro === 'TODAS' || normalizarEstado(m.estado) === filtro.toLowerCase();
    const salaKey     = normalizarSala(m.salaNombre || '');
    
    const esPrincipal = salaKey === 'principal' || salaKey === 'sala principal' || m.salaId === 1;
    const esTerraza   = salaKey === 'terraza' || m.salaId === 2;

    let matchSala = false;
    if (salaActiva === 'todas') matchSala = true;
    else if (salaActiva === 'principal' && esPrincipal) matchSala = true;
    else if (salaActiva === 'terraza' && esTerraza) matchSala = true;

    return matchEstado && matchSala;
  });

  const mesasPorSala = {
    principal: mesasFiltradas.filter(m => normalizarSala(m.salaNombre) === 'principal' || normalizarSala(m.salaNombre) === 'sala principal' || m.salaId === 1),
    terraza:   mesasFiltradas.filter(m => normalizarSala(m.salaNombre) === 'terraza' || m.salaId === 2),
    otras:     mesasFiltradas.filter(m => {
      const s = normalizarSala(m.salaNombre || '');
      return s !== 'principal' && s !== 'sala principal' && s !== 'terraza' && m.salaId !== 1 && m.salaId !== 2;
    }),
  };

  // 🌟 CORREGIDO: Conteos mapeados exactamente en minúsculas
  const conteo = {
    disponible: mesas.filter(m => normalizarEstado(m.estado) === 'disponible').length,
    ocupada:    mesas.filter(m => normalizarEstado(m.estado) === 'ocupada').length,
    reservada:  mesas.filter(m => normalizarEstado(m.estado) === 'reservada').length,
    bloqueada:  mesas.filter(m => normalizarEstado(m.estado) === 'bloqueada').length,
  };

  // ── Marcar "Asistió" desde Reservas → Pone mesa en OCUPADA ───────────────
  const marcarMesaOcupada = (mesaId) => {
    fetch(`http://localhost:8080/api/mesas/${mesaId}/estado`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: 'ocupada' }),
    }).then(() => cargarMesas()).catch(console.error);
  };

  // 🌟 NUEVA ACCIÓN: Petición PUT para finalizar la reserva y liberar la mesa en la BD
  const liberarMesaManual = (reservaId) => {
    if (!reservaId) {
      alert("No se encontró ningún ID de reserva asociado a esta mesa.");
      return;
    }
    fetch(`http://localhost:8080/api/reservas/${reservaId}/finalizar`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }
    })
    .then(res => {
      if (!res.ok) throw new Error("No se pudo conectar con el endpoint de finalización.");
      alert("¡Mesa liberada correctamente! La reserva pasó a estado 'finalizada'.");
      setMesaActiva(null); // Cierra el modal automáticamente
      cargarMesas();       // Vuelve a pintar el mapa con la mesa en verde
    })
    .catch(err => {
      console.error(err);
      alert("Error al intentar liberar la mesa.");
    });
  };

  return (
    <div className="mapa-salon-container">

      {/* ── Header ── */}
      <div className="mapa-header">
        <div>
          <h1 className="mapa-titulo">Mapa del Salón</h1>
          <p className="mapa-subtitulo">Vista en tiempo real · {mesas.length} mesas en total</p>
        </div>
        <div className="mapa-filtros-tiempo">
          <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className="input-tiempo" />
          <input type="time" value={hora}  onChange={e => setHora(e.target.value)}  className="input-tiempo" />
        </div>
        <button className="btn-refresh-mapa" onClick={cargarMesas} title="Actualizar mapa">
          ↻ Actualizar
        </button>
      </div>

      {/* ── Tabs de sala ── */}
      <div className="sala-tabs">
        {[
          { key: 'todas',     label: '🏢 Todas las salas', count: mesas.length },
          { key: 'principal', label: '🏠 Sala Principal',  count: mesas.filter(m => normalizarSala(m.salaNombre || '') === 'principal').length },
          { key: 'terraza',   label: '☀️ Terraza',         count: mesas.filter(m => normalizarSala(m.salaNombre || '') === 'terraza').length },
        ].map(({ key, label, count }) => (
          <button
            key={key}
            className={`sala-tab ${salaActiva === key ? 'sala-tab-activa' : ''}`}
            onClick={() => setSalaActiva(key)}
          >
            {label} <span className="sala-tab-count">{count}</span>
          </button>
        ))}
      </div>

      {/* ── Filtros de estado ── */}
      <div className="mapa-filtros">
        {[
          { key: 'TODAS',     label: 'Todas',      count: mesas.length },
          { key: 'LIBRE',     label: 'Libres',     count: conteo.LIBRE },
          { key: 'OCUPADA',   label: 'Ocupadas',   count: conteo.OCUPADA },
          { key: 'RESERVADA', label: 'Reservadas', count: conteo.RESERVADA },
          { key: 'BLOQUEADA', label: 'Bloqueadas', count: conteo.BLOQUEADA },
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
      ) : salaActiva === 'todas' ? (
        // Vista todas: separadas por sección
        <>
          {mesasPorSala.principal.length > 0 && (
            <SeccionSala
              titulo="🏠 Sala Principal"
              colorClass="sala-principal"
              mesas={mesasPorSala.principal}
              onSeleccionar={setMesaActiva}
            />
          )}
          {mesasPorSala.terraza.length > 0 && (
            <SeccionSala
              titulo="☀️ Terraza"
              colorClass="sala-terraza"
              mesas={mesasPorSala.terraza}
              onSeleccionar={setMesaActiva}
            />
          )}
          {mesasPorSala.otras.length > 0 && (
            <SeccionSala
              titulo="📍 Otras"
              colorClass=""
              mesas={mesasPorSala.otras}
              onSeleccionar={setMesaActiva}
            />
          )}
        </>
      ) : (
        // Vista filtrada por sala
        <div className="mesas-grid">
          {mesasFiltradas.length === 0
            ? <p className="mapa-vacio">No hay mesas con ese filtro.</p>
            : mesasFiltradas.map(mesa => (
                <TarjetaMesa key={mesa.id} mesa={mesa} onSeleccionar={setMesaActiva} />
              ))
          }
        </div>
      )}

      {/* ── Modal de detalle ── */}
      {mesaActiva && (
        <ModalMesa
          mesa={mesaActiva}
          onCerrar={() => setMesaActiva(null)}
          onActualizar={cargarMesas}
          onMarcarOcupada={marcarMesaOcupada}
          onLiberarReserva={liberarMesaManual}
        />
      )}
    </div>
  );
}

// ─── Sección de sala ─────────────────────────────────────────────────────────
function SeccionSala({ titulo, colorClass, mesas, onSeleccionar }) {
  const libres    = mesas.filter(m => normalizarEstado(m.estado) === 'LIBRE').length;
  const ocupadas  = mesas.filter(m => normalizarEstado(m.estado) === 'OCUPADA').length;
  const reservadas = mesas.filter(m => normalizarEstado(m.estado) === 'RESERVADA').length;

  return (
    <div className={`seccion-sala ${colorClass}`}>
      <div className="seccion-sala-header">
        <h2 className="seccion-sala-titulo">{titulo}</h2>
        <div className="seccion-sala-stats">
          <span className="stat-mini stat-libre">🟢 {libres} libres</span>
          <span className="stat-mini stat-ocupada">🔴 {ocupadas} ocupadas</span>
          <span className="stat-mini stat-reservada">🟡 {reservadas} reservadas</span>
        </div>
      </div>
      <div className="mesas-grid">
        {mesas.map(mesa => (
          <TarjetaMesa key={mesa.id} mesa={mesa} onSeleccionar={onSeleccionar} />
        ))}
      </div>
    </div>
  );
}

// ─── Tarjeta de mesa ─────────────────────────────────────────────────────────
function TarjetaMesa({ mesa, onSeleccionar }) {
  const estadoKey = normalizarEstado(mesa.estado);
  const cfg = ESTADOS[estadoKey] || ESTADOS.disponible;
  const mins      = minutosOcupada(mesa.fechaOcupacion);
  const urgente   = estadoKey === 'OCUPADA' && mins !== null && mins >= 90;

  return (
    <button
      className={`mesa-card ${cfg.clase} ${urgente ? 'mesa-urgente' : ''}`}
      onClick={() => onSeleccionar(mesa)}
      title={`Mesa ${mesa.numero} — ${cfg.label}`}
    >
      <span className="mesa-icono">{cfg.icono}</span>
      <span className="mesa-numero">Mesa {mesa.numero}</span>
      <span className="mesa-capacidad">{mesa.capacidad ? `${mesa.capacidad} personas` : ''}</span>
      {mesa.ubicacion && <span className="mesa-ubicacion">{mesa.ubicacion}</span>}
      <span className={`mesa-estado-label estado-${estadoKey.toLowerCase()}`}>{cfg.label}</span>
      {estadoKey === 'RESERVADA' && mesa.horaReserva && (
        <span className="mesa-reserva-hora">⏰ {mesa.horaReserva}</span>
      )}
      {estadoKey === 'RESERVADA' && mesa.clienteReserva && (
        <span className="mesa-reserva-cliente">👤 {mesa.clienteReserva}</span>
      )}
      {urgente && <span className="mesa-alerta-badge">+{mins}min</span>}
    </button>
  );
}

// ─── Modal de detalle ────────────────────────────────────────────────────────
function ModalMesa({ mesa, onCerrar, onActualizar, onMarcarOcupada }) {
  const estadoKey = normalizarEstado(mesa.estado);
  const cfg       = ESTADOS[estadoKey] || ESTADOS.LIBRE;
  const mins      = minutosOcupada(mesa.fechaOcupacion);
  const salaNombre = mesa.salaNombre || '—';
  console.log("Mesa recibida en modal:", mesa); 
  if (!mesa || !mesa.id) {
    console.error("¡CUIDADO! La mesa no tiene ID");
  }

  const cambiarEstado = (nuevoEstado) => {
    fetch(`http://localhost:8080/api/mesas/${mesa.id}/estado`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado }),
    })
    .then(r => {
        if (!r.ok) throw new Error('Error en el servidor');
        return r;
    })
    .then(() => {
        onActualizar(); // <--- ESTO ES CLAVE: Recarga el mapa
        onCerrar();     // Cierra el modal
    })
    .catch(err => console.error("Error al actualizar:", err));
};

  // Marcar asistió: reserva confirmada → mesa pasa a OCUPADA
  const confirmarAsistencia = () => {
    onMarcarOcupada(mesa.id);
    // También actualizar la reserva asociada si existe
    if (mesa.reservaId) {
      fetch(`http://localhost:8080/api/reservas/${mesa.reservaId}/estado`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: 'asistió' }),
      }).catch(console.error);
    }
    onCerrar();
  };

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="modal-detalle" onClick={e => e.stopPropagation()}>

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
            <span className="modal-campo">Sala</span>
            <span className="modal-valor modal-sala-badge">{salaNombre}</span>
          </div>
          <div className="modal-fila">
            <span className="modal-campo">Capacidad</span>
            <span className="modal-valor">{mesa.capacidad || '—'} personas</span>
          </div>
          {mesa.ubicacion && (
            <div className="modal-fila">
              <span className="modal-campo">Ubicación</span>
              <span className="modal-valor">{mesa.ubicacion}</span>
            </div>
          )}

          {/* Info cuando está OCUPADA */}
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

          {/* Info cuando está RESERVADA */}
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
              <div className="modal-fila">
                <span className="modal-campo">Código reserva</span>
                <span className="modal-valor">{mesa.codigoReserva || '—'}</span>
              </div>
              {/* Botón especial: cliente llegó */}
              <button className="btn-asistio" onClick={confirmarAsistencia}>
                ✅ Cliente llegó — marcar como Ocupada
              </button>
            </>
          )}
        </div>

              {/* Cambiar estado */}
        <div className="modal-acciones">
          <p className="modal-acciones-titulo">Cambiar estado:</p>
          <div className="modal-acciones-grid">
            {Object.entries(ESTADOS)
              // Filtramos para no mostrar el botón del estado en el que ya está la mesa
              .filter(([key]) => key !== estadoKey)
              .map(([key, val]) => (
                <button
                  key={key}
                  className={`btn-estado btn-estado-${key.toLowerCase()}`}
                  onClick={() => {
                    // 🌟 INTERCEPTAMOS SI EL BOTÓN PRESIONADO ES "DISPONIBLE" Y HAY RESERVA ACTIVA
                    if (key === 'disponible' && mesa.reservaId) {
                      
                      fetch(`http://localhost:8080/api/reservas/${mesa.reservaId}/finalizar`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' }
                      })
                      .then(async res => {
                        // 🛡️ Capturamos el error 500 y leemos qué dice el backend en texto plano
                        if (!res.ok) {
                          const textoError = await res.text();
                          throw new Error(textoError || "Error interno del servidor");
                        }
                        return res.text();
                      })
                      .then(() => {
                        alert("¡Mesa liberada con éxito! La reserva ha sido finalizada.");
                        onActualizar(); // Recarga el mapa dinámico en tiempo real
                        onCerrar();     // Cierra la ventana modal
                      })
                      .catch(err => {
                        console.error("Detalle del fallo:", err.message);
                        alert("No se pudo liberar: " + err.message);
                      });

                    } else {
                      // Flujo normal para el resto de estados (Ocupada, Bloqueada)
                      cambiarEstado(key);
                    }
                  }} 
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