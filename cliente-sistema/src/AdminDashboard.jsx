import React, { useState, useEffect, useCallback } from 'react';
import './AdminDashboard.css';
import GestionMesas from './GestionMesas';
import GestorReservas from './GestorReservas';
import MapaSalon from './MapaSalon.jsx';                       // ← NUEVO
import { useNotificaciones } from './Usenotificaciones.js';  // ← NUEVO
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import GestionDelivery from './Gestiondelibery';


export default function AdminDashboard({ usuarioLogueado, onLogout }) {
  const [seccionActiva, setSeccionActiva]   = useState('panel');
  const [cargando, setCargando]             = useState(true);
  const [error, setError]                   = useState(null);
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null);
  const [tiempoDesde, setTiempoDesde]       = useState('');
  const [proximasReservas, setProximasReservas] = useState([]);

  const [metricas, setMetricas] = useState({
    ingresosDia:         0,
    ordenesActivas:      0,
    reservasHoy:         0,
    ticketPromedio:      0,
    flujoHorarios:       Array(24).fill(0),
    mesasOcupadas:       0,
    mesasTotales:        0,
    ingresosDiaAnterior: 0,
    reservasAyer:        0,
  });

  // ── Sistema de notificaciones push ────────────────────────────────────────
  const { notificaciones, cerrarNotificacion, recibirAlertaMesa } =
    useNotificaciones(metricas);

  // ─── Helpers ────────────────────────────────────────────────────────────────

  const formatearMoneda = (valor) =>
    new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(valor || 0);

  const calcularTendencia = (hoy, ayer) => {
    const h = parseFloat(hoy)  || 0;
    const a = parseFloat(ayer) || 0;
    if (a === 0 && h === 0) return { texto: '— sin datos', positivo: null };
    if (a === 0)             return { texto: '▲ nuevo',    positivo: true  };
    const pct = (((h - a) / a) * 100).toFixed(1);
    const positivo = h >= a;
    return { texto: `${positivo ? '▲' : '▼'} ${Math.abs(pct)}% vs ayer`, positivo };
  };

  // ─── Reloj "actualizado hace Xs" ──────────────────────────────────────────

  useEffect(() => {
    if (!ultimaActualizacion) return;
    const tick = () => {
      const seg = Math.floor((Date.now() - ultimaActualizacion) / 1000);
      if (seg < 60)        setTiempoDesde(`hace ${seg}s`);
      else if (seg < 3600) setTiempoDesde(`hace ${Math.floor(seg / 60)}min`);
      else                 setTiempoDesde(`hace ${Math.floor(seg / 3600)}h`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [ultimaActualizacion]);

  // ─── Carga de métricas ────────────────────────────────────────────────────

const cargarDatosDashboard = useCallback(() => {
  // CAMBIA ESTO DE VUELTA A LA RUTA DEL DASHBOARD
  fetch('http://localhost:8080/api/admin/dashboard-stats') 
    .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
    .then((data) => {
      console.log("Datos recibidos del servidor:", data);
      setMetricas({
        ingresosDia:         data.ingresosDia         || 0,
        ordenesActivas:      data.ordenesActivas      || 0,
        reservasHoy:         data.reservasHoy         || 0,
        ticketPromedio:      data.ticketPromedio      || 0,
        flujoHorarios:       data.flujoHorarios       || Array(24).fill(0),
        mesasOcupadas:       data.mesasOcupadas       || 0,
        mesasTotales:        data.mesasTotales        || 0,
        ingresosDiaAnterior: data.ingresosDiaAnterior || 0,
        reservasAyer:        data.reservasAyer        || 0,
      });
      setUltimaActualizacion(Date.now());
      setError(null);
      setCargando(false);
    })
    .catch((err) => {
      console.error('Error métricas:', err);
      setError('No se pudieron cargar las métricas.');
      setCargando(false);
    });
}, []);

  // ─── Carga de próximas reservas ───────────────────────────────────────────

  const cargarProximasReservas = useCallback(() => {
    fetch('http://localhost:8080/api/reservas') 
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((data) => setProximasReservas(Array.isArray(data) ? data.slice(0, 5) : []))
      .catch(() => setProximasReservas([]));
  }, []);

  useEffect(() => {
    if (seccionActiva === 'panel') {
      cargarDatosDashboard();
      cargarProximasReservas();
      const id = setInterval(() => {
        cargarDatosDashboard();
        cargarProximasReservas();
      }, 30000);
      return () => clearInterval(id);
    }
  }, [seccionActiva, cargarDatosDashboard, cargarProximasReservas]);

  // ─── Datos gráfica ────────────────────────────────────────────────────────

  const datosGrafica = metricas.flujoHorarios
    .map((cantidad, hora) => ({ hora, cantidad }))
    .filter((d) => d.hora >= 12 && d.hora <= 23);

  const pctOcupacion = metricas.mesasTotales > 0
    ? (metricas.mesasOcupadas / metricas.mesasTotales) * 100
    : 0;

  const colorBarraOcupacion =
    pctOcupacion >= 90 ? '#d32f2f' :
    pctOcupacion >= 70 ? '#e65100' :
    '#bc5a1a';

  const tendenciaIngresos = calcularTendencia(metricas.ingresosDia, metricas.ingresosDiaAnterior);
  const tendenciaReservas = calcularTendencia(metricas.reservasHoy, metricas.reservasAyer);
  const nombreAdmin = usuarioLogueado?.nombre || 'Administrador';

  return (
    <div className="admin-dashboard-container">

      {/* ── TOASTS DE NOTIFICACIONES PUSH (siempre visibles en cualquier sección) ── */}
      <div className="notif-stack" aria-live="polite">
        {notificaciones.map((n) => (
          <div key={n.id} className={`notif-toast notif-${n.tipo}`}>
            <div className="notif-contenido">
              <strong className="notif-titulo">{n.titulo}</strong>
              <span className="notif-mensaje">{n.mensaje}</span>
            </div>
            <button
              className="notif-cerrar"
              onClick={() => cerrarNotificacion(n.id)}
              aria-label="Cerrar notificación"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* ── SIDEBAR ── */}
      <aside className="admin-sidebar">
        <div className="sidebar-brand-box">
          <div className="restaurant-logo-icon">⚜️</div>
          <h2>Panchita</h2>
          <span>Gestión Central</span>
        </div>

        <nav className="sidebar-menu">
          <button
            className={`menu-item ${seccionActiva === 'panel' ? 'active' : ''}`}
            onClick={() => setSeccionActiva('panel')}
          >
            🖥️ Panel General
          </button>
          <button
            className={`menu-item ${seccionActiva === 'reservas' ? 'active' : ''}`}
            onClick={() => setSeccionActiva('reservas')}
          >
            📅 Gestión Reservas
          </button>
          <button
            className={`menu-item ${seccionActiva === 'salon' ? 'active' : ''}`}
            onClick={() => setSeccionActiva('salon')}
          >
            🗺️ Mapa del Salón
          </button>
          <button
            className={`menu-item ${seccionActiva === 'salas' ? 'active' : ''}`}
            onClick={() => setSeccionActiva('salas')}
          >
            🚪 Abrir Salas
          </button>
              <button 
            className={`menu-item ${seccionActiva === 'delivery' ? 'active' : ''}`}
            onClick={() => setSeccionActiva('delivery')}
          >
            🛵 Delivery
          </button>
          <button className="menu-item disabled-tab">📋 Historial</button>
          <button className="menu-item disabled-tab">🚗 Estacionamiento</button>
          <button className="menu-item disabled-tab">🍳 Platos / Carta</button>
          <button className="menu-item disabled-tab">📊 Reportes</button>
        </nav>

        {notificaciones.length > 0 && (
          <div className="sidebar-notif-badge">
            🔔 {notificaciones.length} alerta{notificaciones.length > 1 ? 's' : ''} activa{notificaciones.length > 1 ? 's' : ''}
          </div>
        )}

        <button className="btn-logout-sidebar" onClick={onLogout}>
          ⭕ Cerrar Sesión
        </button>
      </aside>

      {/* ── CONTENIDO PRINCIPAL ── */}
      <main className="admin-main-content">
        <div className="dashboard-view-fade">

          {/* ══ PANEL GENERAL ══ */}
          {seccionActiva === 'panel' && (
            <>
              <div className="view-header">
                <div className="view-header-top">
                  <div>
                    <h1>Panel General Ejecutivo</h1>
                    <p>
                      Métricas operativas y control financiero en tiempo real |
                      Chef: <span className="highlight-text">{nombreAdmin}</span>
                    </p>
                  </div>
                  <div className="ultima-actualizacion">
                    <span className="dot-live" />
                    {ultimaActualizacion ? `Actualizado ${tiempoDesde}` : 'Cargando...'}
                    <button className="btn-refresh" onClick={cargarDatosDashboard} title="Actualizar ahora">
                      ↻
                    </button>
                  </div>
                </div>
              </div>

              {cargando ? (
                <div className="loading-sketches">Cargando métricas en vivo...</div>
              ) : (
                <div className="metrics-row-grid">
                  <div className="metric-card-premium">
                    <div className="metric-header">
                      <span>Ingresos del Día</span>
                      <span className="badge-live">En Vivo</span>
                    </div>
                    <h2>{formatearMoneda(metricas.ingresosDia)}</h2>
                    <p>Facturación total acumulada hoy</p>
                    <span className={`tendencia ${tendenciaIngresos.positivo === true ? 'tend-pos' : tendenciaIngresos.positivo === false ? 'tend-neg' : 'tend-neutral'}`}>
                      {tendenciaIngresos.texto}
                    </span>
                  </div>

                  <div className="metric-card-premium">
                    <div className="metric-header">
                      <span>Órdenes Activas</span>
                      <span className="badge-live">En Vivo</span>
                    </div>
                    <h2>{String(metricas.ordenesActivas ?? 0).padStart(2, '0')}</h2>
                    <p>Comandas en proceso actual</p>
                  </div>

                  <div className="metric-card-premium">
                    <div className="metric-header">
                      <span>Mesas Reservadas</span>
                      <span className="trend-neutral">Hoy</span>
                    </div>
                    <h2>{metricas.reservasHoy}</h2>
                    <p>Cupos agendados para turnos</p>
                    <span className={`tendencia ${tendenciaReservas.positivo === true ? 'tend-pos' : tendenciaReservas.positivo === false ? 'tend-neg' : 'tend-neutral'}`}>
                      {tendenciaReservas.texto}
                    </span>
                  </div>

                  <div className="metric-card-premium">
                    <div className="metric-header">
                      <span>Ticket Promedio</span>
                      <span className="trend-positive">▲ Consumo</span>
                    </div>
                    <h2>{formatearMoneda(metricas.ticketPromedio)}</h2>
                    <p>Gasto estimado por comensal</p>
                  </div>
                </div>
              )}

              <div className="dashboard-double-layout">
                <div className="analytics-main-box">
                  <h3>Flujo de Reservas por Horarios</h3>
                  <ResponsiveContainer width="100%" height={300} minHeight={300}>
                    <BarChart data={datosGrafica}>
                      <XAxis dataKey="hora" tickFormatter={(h) => h > 12 ? `${h - 12}pm` : `${h}am`} />
                      <YAxis />
                      <Tooltip labelFormatter={(h) => `${h}:00`} />
                      <Bar dataKey="cantidad" fill="#e67e22" radius={[4, 4, 0, 0]}>
                        {datosGrafica.map((entry, i) => (
                          <Cell key={`cell-${i}`} fill={entry.hora === new Date().getHours() ? '#d35400' : '#e67e22'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="live-feed-box">
                  <h3>Capacidad del Salón</h3>
                  <div className="salon-capacity-container">
                    <div className="capacity-row">
                      <span className="capacity-label">Mesas ocupadas ahora:</span>
                      <strong className="capacity-count">{metricas.mesasOcupadas} / {metricas.mesasTotales}</strong>
                    </div>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: `${pctOcupacion}%`, backgroundColor: colorBarraOcupacion }} />
                    </div>
                    {pctOcupacion >= 90 && (
                      <div className="alerta-capacidad">🔴 Salón al límite — considerar lista de espera</div>
                    )}
                    <div className="capacity-legend">
                      <div>🟢 <span>Libres:</span> <strong>{Math.max(0, metricas.mesasTotales - metricas.mesasOcupadas)}</strong></div>
                      <div>🔴 <span>Ocupadas:</span> <strong>{metricas.mesasOcupadas}</strong></div>
                    </div>
                  </div>

                  <h3 style={{ marginTop: '22px' }}>Próximas Reservas</h3>
                  {proximasReservas.length === 0 ? (
                    <p className="reservas-vacias">Sin reservas pendientes hoy</p>
                  ) : (
                    <div className="proximas-lista">
                      {proximasReservas.map((r, i) => (
                        <div key={i} className="proxima-item">
                          <div className="proxima-hora">{r.hora}</div>
                          <div className="proxima-info">
                            <span className="proxima-nombre">{r.nombreCliente || r.nombre || 'Reserva'}</span>
                            <span className="proxima-personas">👥 {r.cantidadPersonas || r.personas || '—'} personas</span>
                          </div>
                          <div className={`proxima-badge ${r.estado === 'confirmada' ? 'badge-confirmada' : 'badge-pendiente'}`}>
                            {r.estado === 'confirmada' ? 'Confirmada' : 'Pendiente'}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* ══ MAPA DEL SALÓN ══ */}
          {seccionActiva === 'salon' && (
            <MapaSalon onAlerta={recibirAlertaMesa} />
          )}

          {seccionActiva === 'salas'    && <GestionMesas />}
          {seccionActiva === 'reservas' && <GestorReservas />}
          {seccionActiva === 'delivery' && <GestionDelivery />}

        </div>
      </main>
    </div>
  );
}