import React, { useState, useEffect } from 'react';
import './AdminDashboard.css';
import GestionMesas from './GestionMesas'; 
import GestorReservas from './GestorReservas';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import GestionDelivery from './Gestiondelibery';


export default function AdminDashboard({ usuarioLogueado, onLogout }) { 
  const [seccionActiva, setSeccionActiva] = useState('panel'); 
  const [cargando, setCargando] = useState(true); 
  const [error, setError] = useState(null); 
  const [metricas, setMetricas] = useState({
    ingresosDia: 0,
    ordenesActivas: 0,
    reservasHoy: 0,
    ticketPromedio: 0,
    flujoHorarios: Array(24).fill(0),
    mesasOcupadas: 0, // 👈 Nuevo estado inicial
    mesasTotales: 0   // 👈 Nuevo estado inicial
  });

  const cargarDatosDashboard = () => {
    fetch('http://localhost:8080/api/admin/dashboard-stats')
      .then((res) => {
        if (!res.ok) throw new Error('Error al cargar métricas');
        return res.json();
      })
      .then((data) => {
        setMetricas({
          ingresosDia: data.ingresosDia || 0,
          ordenesActivas: data.ordenesActivas || 0,
          reservasHoy: data.reservasHoy || 0,
          ticketPromedio: data.ticketPromedio || 0,
          flujoHorarios: data.flujoHorarios || Array(24).fill(0),
          mesasOcupadas: data.mesasOcupadas || 0, // 👈 Sincronizado con tu backend
          mesasTotales: data.mesasTotales || 0    // 👈 Sincronizado con tu backend
        });
        setError(null);
        setCargando(false);
      })
      .catch((err) => {
        console.error("Error métricas:", err);
        setError("No se pudieron cargar las métricas.");
        setCargando(false);
      });
  };

  useEffect(() => {
    if (seccionActiva === 'panel') {
      cargarDatosDashboard(); 
      const intervalo = setInterval(cargarDatosDashboard, 30000); 
      return () => clearInterval(intervalo); 
    }
  }, [seccionActiva]);

  const nombreAdmin = usuarioLogueado?.nombre || 'Administrador';

  const formatearMoneda = (valor) => {
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(valor || 0);
  };

  // Filtrado de horas comerciales (12pm a 11pm)
  const datosGrafica = metricas.flujoHorarios
    .map((cantidad, hora) => ({ hora, cantidad }))
    .filter(d => d.hora >= 12 && d.hora <= 23);

  return (
    <div className="admin-dashboard-container">
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

        <button className="btn-logout-sidebar" onClick={onLogout}>
          ⭕ Cerrar Sesión
        </button>
      </aside>

      <main className="admin-main-content">
        <div className="dashboard-view-fade">

          {seccionActiva === 'panel' && (
            <>
              <div className="view-header">
                <h1>Panel General Ejecutivo</h1>
                <p>Métricas operativas y control financiero en tiempo real | Chef: <span className="highlight-text">{nombreAdmin}</span></p>
              </div>
              
              {cargando ? (
                <div className="loading-sketches">Cargando métricas en vivo...</div>
              ) : (
                <div className="metrics-row-grid">         
                  <div className="metric-card-premium">
                    <div className="metric-header">
                      <span>Ingresos del Día</span>
                      <span className="trend-positive">▲ En vivo</span>
                    </div>
                    <h2>{formatearMoneda(metricas.ingresosDia)}</h2>
                    <p>Facturación total acumulada hoy</p>
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

              {/* Layout inferior distribuido en 2 columnas equilibradas */}
              <div className="dashboard-double-layout">       
                <div className="analytics-main-box">
                  <h3>Flujo de Reservas por Horarios</h3>
                  <div style={{ width: '100%' }}>
                    <ResponsiveContainer width="100%" height={300} minHeight={300}>
                      <BarChart data={datosGrafica}>
                        <XAxis 
                          dataKey="hora" 
                          tickFormatter={(hora) => hora > 12 ? `${hora - 12} pm` : `${hora} am`} 
                        />
                        <YAxis />
                        <Tooltip labelFormatter={(hora) => `${hora}:00`} />
                        <Bar dataKey="cantidad" fill="#e67e22" radius={[4, 4, 0, 0]}>
                          {datosGrafica.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={entry.hora === new Date().getHours() ? '#d35400' : '#e67e22'} 
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* NUEVO PANEL: CAPACIDAD COMPARTIDA CON EL GRÁFICO */}
                <div className="live-feed-box">
                  <h3>Capacidad del Salón</h3>
                  <div className="salon-capacity-container" style={{ padding: '10px 0' }}>
                    <div style={{ display: 'flex', justifyConten: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                      <span style={{ fontSize: '0.9rem', color: '#705e52', fontWeight: 600 }}>Mesas ocupadas actualmente:</span>
                      <strong style={{ fontSize: '1.2rem', color: '#1a0f0a', marginLeft: 'auto' }}>
                        {metricas.mesasOcupadas} / {metricas.mesasTotales}
                      </strong>
                    </div>

                    {/* Barra de Progreso Dinámica */}
                    <div style={{ 
                      width: '100%', 
                      height: '16px', 
                      backgroundColor: '#f1ece7', 
                      borderRadius: '8px', 
                      overflow: 'hidden',
                      marginBottom: '20px'
                    }}>
                      <div style={{ 
                        width: `${metricas.mesasTotales > 0 ? (metricas.mesasOcupadas / metricas.mesasTotales) * 100 : 0}%`, 
                        height: '100%', 
                        backgroundColor: '#bc5a1a', 
                        transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
                      }} />
                    </div>

                    {/* Leyendas informativas rápidas */}
                    <div style={{ display: 'flex', gap: '20px', fontSize: '0.85rem' }}>
                      <div>🟢 <span style={{ color: '#64748b' }}>Libres:</span> <strong>{Math.max(0, metricas.mesasTotales - metricas.mesasOcupadas)}</strong></div>
                      <div>🔴 <span style={{ color: '#64748b' }}>Ocupadas:</span> <strong>{metricas.mesasOcupadas}</strong></div>
                    </div>
                  </div>
                </div>

              </div>
            </>
          )}

          {seccionActiva === 'salas' && <GestionMesas />}
          {seccionActiva === 'reservas' && <GestorReservas />}
          {seccionActiva === 'delivery' && <GestionDelivery />}

        </div>
      </main>
    </div>
  );
}
