import React, { useState, useEffect } from 'react';
import './GestionDelivery.css';

// ── DATOS MOCK (mientras no haya endpoint propio de delivery) ──
const PEDIDOS_MOCK = [
  { id: 1, cliente: 'Carlos Quispe',    telefono: '987 654 321', direccion: 'Av. Arequipa 1240, Miraflores',     items: [{ nombre: 'Cau Cau', qty: 2, precio: 38 }, { nombre: 'Chicha Morada', qty: 2, precio: 10 }], total: 96,  estado: 'Preparando',  metodoPago: 'Yape', hora: '12:15' },
  { id: 2, cliente: 'María Flores',     telefono: '912 345 678', direccion: 'Jr. Huancavelica 340, Lima Centro', items: [{ nombre: 'Lomo Saltado', qty: 1, precio: 52 }, { nombre: 'Inca Kola', qty: 1, precio: 8 }],      total: 60,  estado: 'En camino',   metodoPago: 'Efectivo', hora: '12:32' },
  { id: 3, cliente: 'José Ramírez',     telefono: '956 789 012', direccion: 'Calle Los Pinos 88, San Borja',     items: [{ nombre: 'Ají de Gallina', qty: 1, precio: 42 }],                                                 total: 42,  estado: 'Entregado',   metodoPago: 'Tarjeta', hora: '11:48' },
  { id: 4, cliente: 'Ana Castillo',     telefono: '934 210 876', direccion: 'Av. Brasil 3310, Pueblo Libre',     items: [{ nombre: 'Arroz con Leche', qty: 3, precio: 18 }, { nombre: 'Causa Limeña', qty: 2, precio: 28 }], total: 110, estado: 'Pendiente',    metodoPago: 'Yape', hora: '13:05' },
  { id: 5, cliente: 'Luis Mendoza',     telefono: '978 432 100', direccion: 'Urb. Santa Cruz 22, Jesús María',  items: [{ nombre: 'Tacu Tacu', qty: 2, precio: 45 }],                                                      total: 90,  estado: 'Cancelado',   metodoPago: 'Efectivo', hora: '11:20' },
  { id: 6, cliente: 'Rosa Huamán',      telefono: '901 567 234', direccion: 'Calle Palma 14, Barranco',          items: [{ nombre: 'Seco de Cordero', qty: 1, precio: 55 }, { nombre: 'Mazamorra', qty: 2, precio: 14 }],   total: 83,  estado: 'Preparando',  metodoPago: 'Tarjeta', hora: '13:18' },
  { id: 7, cliente: 'Diego Torres',     telefono: '945 678 321', direccion: 'Av. Javier Prado 4450, Surco',      items: [{ nombre: 'Ceviche Clásico', qty: 2, precio: 65 }],                                                total: 130, estado: 'En camino',   metodoPago: 'Yape', hora: '12:55' },
  { id: 8, cliente: 'Sofía Vargas',     telefono: '923 100 456', direccion: 'Jr. Carabaya 560, Cercado',         items: [{ nombre: 'Anticuchos', qty: 4, precio: 22 }],                                                     total: 88,  estado: 'Pendiente',   metodoPago: 'Efectivo', hora: '13:40' },
];

const ESTADO_CONFIG = {
  'Pendiente':   { color: '#d97706', bg: '#fef3c7', icon: '🕐', siguiente: 'Preparando' },
  'Preparando':  { color: '#2563eb', bg: '#dbeafe', icon: '👨‍🍳', siguiente: 'En camino' },
  'En camino':   { color: '#7c3aed', bg: '#ede9fe', icon: '🛵', siguiente: 'Entregado' },
  'Entregado':   { color: '#15803d', bg: '#dcfce7', icon: '✅', siguiente: null },
  'Cancelado':   { color: '#b91c1c', bg: '#fee2e2', icon: '✖', siguiente: null },
};

const METODO_CONFIG = {
  'Yape':     { color: '#a21caf', bg: '#fae8ff', icon: '💜' },
  'Efectivo': { color: '#92400e', bg: '#fef3c7', icon: '💵' },
  'Tarjeta':  { color: '#0369a1', bg: '#e0f2fe', icon: '💳' },
};

export default function GestionDelivery() {
  const [pedidos, setPedidos] = useState(PEDIDOS_MOCK);
  const [filtroEstado, setFiltroEstado] = useState('Todos');
  const [pedidoDetalle, setPedidoDetalle] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [mostrarFormNuevo, setMostrarFormNuevo] = useState(false);
  const [nuevoItem, setNuevoItem] = useState({ nombre: '', qty: 1, precio: '' });
  const [nuevoPedido, setNuevoPedido] = useState({
    cliente: '', telefono: '', direccion: '', metodoPago: 'Efectivo', items: []
  });

  // Métricas dinámicas
  const metricas = {
    total:      pedidos.length,
    pendiente:  pedidos.filter(p => p.estado === 'Pendiente').length,
    preparando: pedidos.filter(p => p.estado === 'Preparando').length,
    enCamino:   pedidos.filter(p => p.estado === 'En camino').length,
    entregado:  pedidos.filter(p => p.estado === 'Entregado').length,
    ingresos:   pedidos.filter(p => p.estado !== 'Cancelado').reduce((s, p) => s + p.total, 0),
  };

  const pedidosFiltrados = pedidos.filter(p => {
    const matchEstado  = filtroEstado === 'Todos' || p.estado === filtroEstado;
    const matchBusqueda = p.cliente.toLowerCase().includes(busqueda.toLowerCase()) ||
                          String(p.id).includes(busqueda);
    return matchEstado && matchBusqueda;
  });

  const avanzarEstado = (id) => {
    setPedidos(prev => prev.map(p => {
      if (p.id !== id) return p;
      const siguiente = ESTADO_CONFIG[p.estado]?.siguiente;
      return siguiente ? { ...p, estado: siguiente } : p;
    }));
    if (pedidoDetalle?.id === id) {
      const siguiente = ESTADO_CONFIG[pedidoDetalle.estado]?.siguiente;
      if (siguiente) setPedidoDetalle(d => ({ ...d, estado: siguiente }));
    }
  };

  const cancelarPedido = (id) => {
    setPedidos(prev => prev.map(p => p.id === id ? { ...p, estado: 'Cancelado' } : p));
    if (pedidoDetalle?.id === id) setPedidoDetalle(d => ({ ...d, estado: 'Cancelado' }));
  };

  const agregarItemNuevo = () => {
    if (!nuevoItem.nombre || !nuevoItem.precio) return;
    setNuevoPedido(p => ({ ...p, items: [...p.items, { ...nuevoItem, precio: Number(nuevoItem.precio) }] }));
    setNuevoItem({ nombre: '', qty: 1, precio: '' });
  };

  const confirmarNuevoPedido = () => {
    if (!nuevoPedido.cliente || !nuevoPedido.direccion || nuevoPedido.items.length === 0) return;
    const total = nuevoPedido.items.reduce((s, i) => s + i.precio * i.qty, 0);
    const ahora = new Date();
    const hora  = `${ahora.getHours()}:${String(ahora.getMinutes()).padStart(2, '0')}`;
    setPedidos(prev => [{
      ...nuevoPedido,
      id: prev.length + 1,
      total,
      estado: 'Pendiente',
      hora,
    }, ...prev]);
    setNuevoPedido({ cliente: '', telefono: '', direccion: '', metodoPago: 'Efectivo', items: [] });
    setMostrarFormNuevo(false);
  };

  return (
    <div className="delivery-wrapper">

      {/* ── CABECERA ── */}
      <div className="delivery-header">
        <div className="delivery-header__left">
          <span className="delivery-eyebrow">OPERACIONES EN TIEMPO REAL</span>
          <h1 className="delivery-title">Gestión de Delivery</h1>
          <p className="delivery-subtitle">Monitorea y actualiza los pedidos a domicilio del día</p>
        </div>
        <button className="btn-nuevo-pedido" onClick={() => setMostrarFormNuevo(true)}>
          + Nuevo Pedido
        </button>
      </div>

      {/* ── TIRA DE MÉTRICAS ── */}
      <div className="delivery-metrics">
        <div className="metric-tile">
          <span className="metric-tile__value">{metricas.pendiente}</span>
          <span className="metric-tile__label">Pendientes</span>
          <span className="metric-tile__bar" style={{ width: `${(metricas.pendiente / metricas.total) * 100}%`, background: '#d97706' }} />
        </div>
        <div className="metric-tile">
          <span className="metric-tile__value">{metricas.preparando}</span>
          <span className="metric-tile__label">Preparando</span>
          <span className="metric-tile__bar" style={{ width: `${(metricas.preparando / metricas.total) * 100}%`, background: '#2563eb' }} />
        </div>
        <div className="metric-tile">
          <span className="metric-tile__value">{metricas.enCamino}</span>
          <span className="metric-tile__label">En camino</span>
          <span className="metric-tile__bar" style={{ width: `${(metricas.enCamino / metricas.total) * 100}%`, background: '#7c3aed' }} />
        </div>
        <div className="metric-tile">
          <span className="metric-tile__value">{metricas.entregado}</span>
          <span className="metric-tile__label">Entregados</span>
          <span className="metric-tile__bar" style={{ width: `${(metricas.entregado / metricas.total) * 100}%`, background: '#15803d' }} />
        </div>
        <div className="metric-tile metric-tile--ingresos">
          <span className="metric-tile__value">S/ {metricas.ingresos.toFixed(2)}</span>
          <span className="metric-tile__label">Ingresos del día</span>
          <span className="metric-tile__bar" style={{ width: '100%', background: '#bc5a1a' }} />
        </div>
      </div>

      {/* ── BARRA DE FILTROS ── */}
      <div className="delivery-filters">
        <div className="filter-tabs">
          {['Todos', 'Pendiente', 'Preparando', 'En camino', 'Entregado', 'Cancelado'].map(f => (
            <button
              key={f}
              className={`filter-tab ${filtroEstado === f ? 'filter-tab--active' : ''}`}
              onClick={() => setFiltroEstado(f)}
            >
              {f !== 'Todos' && <span>{ESTADO_CONFIG[f]?.icon} </span>}
              {f}
              {f !== 'Todos' && (
                <span className="filter-tab__count">
                  {pedidos.filter(p => p.estado === f).length}
                </span>
              )}
            </button>
          ))}
        </div>
        <input
          className="delivery-search"
          placeholder="Buscar por cliente o N° pedido…"
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
        />
      </div>

      {/* ── GRID DE TARJETAS ── */}
      <div className="delivery-grid">
        {pedidosFiltrados.length === 0 ? (
          <div className="delivery-empty">
            <p>🛵 No hay pedidos con este filtro</p>
          </div>
        ) : (
          pedidosFiltrados.map(pedido => {
            const cfg    = ESTADO_CONFIG[pedido.estado] || {};
            const cfgPago = METODO_CONFIG[pedido.metodoPago] || {};
            return (
              <div
                key={pedido.id}
                className={`pedido-card pedido-card--${pedido.estado.toLowerCase().replace(' ', '-')}`}
                onClick={() => setPedidoDetalle(pedido)}
              >
                {/* Franja de color del estado */}
                <div className="pedido-card__stripe" style={{ background: cfg.color }} />

                <div className="pedido-card__body">
                  <div className="pedido-card__top">
                    <span className="pedido-card__id">#{String(pedido.id).padStart(3, '0')}</span>
                    <span className="pedido-card__hora">{pedido.hora}</span>
                  </div>

                  <h4 className="pedido-card__cliente">{pedido.cliente}</h4>
                  <p className="pedido-card__dir">📍 {pedido.direccion}</p>

                  <div className="pedido-card__tags">
                    <span className="estado-badge" style={{ color: cfg.color, background: cfg.bg }}>
                      {cfg.icon} {pedido.estado}
                    </span>
                    <span className="pago-badge" style={{ color: cfgPago.color, background: cfgPago.bg }}>
                      {cfgPago.icon} {pedido.metodoPago}
                    </span>
                  </div>

                  <div className="pedido-card__footer">
                    <span className="pedido-card__items">{pedido.items.length} ítem{pedido.items.length !== 1 ? 's' : ''}</span>
                    <span className="pedido-card__total">S/ {pedido.total.toFixed(2)}</span>
                  </div>

                  {/* Acciones rápidas */}
                  {cfg.siguiente && (
                    <button
                      className="btn-avanzar"
                      onClick={e => { e.stopPropagation(); avanzarEstado(pedido.id); }}
                    >
                      {ESTADO_CONFIG[cfg.siguiente]?.icon} Marcar como {cfg.siguiente}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── MODAL DETALLE ── */}
      {pedidoDetalle && (
        <div className="modal-overlay" onClick={() => setPedidoDetalle(null)}>
          <div className="modal-detalle" onClick={e => e.stopPropagation()}>
            <div className="modal-detalle__header">
              <div>
                <span className="modal-detalle__eyebrow">Pedido #{String(pedidoDetalle.id).padStart(3, '0')} · {pedidoDetalle.hora}</span>
                <h3 className="modal-detalle__nombre">{pedidoDetalle.cliente}</h3>
              </div>
              <button className="modal-close" onClick={() => setPedidoDetalle(null)}>✕</button>
            </div>

            {/* Timeline de estado */}
            <div className="estado-timeline">
              {['Pendiente', 'Preparando', 'En camino', 'Entregado'].map((e, i) => {
                const estados = ['Pendiente', 'Preparando', 'En camino', 'Entregado'];
                const actual  = estados.indexOf(pedidoDetalle.estado);
                const esActual = pedidoDetalle.estado === e;
                const esPasado = actual > i;
                return (
                  <React.Fragment key={e}>
                    <div className={`timeline-step ${esActual ? 'timeline-step--active' : ''} ${esPasado ? 'timeline-step--done' : ''}`}>
                      <div className="timeline-dot">{ESTADO_CONFIG[e].icon}</div>
                      <span className="timeline-label">{e}</span>
                    </div>
                    {i < 3 && <div className={`timeline-line ${esPasado || esActual ? 'timeline-line--done' : ''}`} />}
                  </React.Fragment>
                );
              })}
            </div>

            <div className="modal-detalle__grid">
              <div className="modal-info-block">
                <span className="modal-info-label">Dirección</span>
                <span className="modal-info-val">📍 {pedidoDetalle.direccion}</span>
              </div>
              <div className="modal-info-block">
                <span className="modal-info-label">Teléfono</span>
                <span className="modal-info-val">📞 {pedidoDetalle.telefono}</span>
              </div>
              <div className="modal-info-block">
                <span className="modal-info-label">Método de pago</span>
                <span className="modal-info-val">
                  {METODO_CONFIG[pedidoDetalle.metodoPago]?.icon} {pedidoDetalle.metodoPago}
                </span>
              </div>
            </div>

            <div className="modal-items-tabla">
              <div className="modal-items-head">
                <span>Plato</span><span>Cant.</span><span>Subtotal</span>
              </div>
              {pedidoDetalle.items.map((item, i) => (
                <div key={i} className="modal-items-row">
                  <span>{item.nombre}</span>
                  <span>×{item.qty}</span>
                  <span>S/ {(item.precio * item.qty).toFixed(2)}</span>
                </div>
              ))}
              <div className="modal-items-total">
                <span>Total</span>
                <span>S/ {pedidoDetalle.total.toFixed(2)}</span>
              </div>
            </div>

            <div className="modal-detalle__actions">
              {ESTADO_CONFIG[pedidoDetalle.estado]?.siguiente && (
                <button className="btn-avanzar btn-avanzar--lg" onClick={() => avanzarEstado(pedidoDetalle.id)}>
                  {ESTADO_CONFIG[ESTADO_CONFIG[pedidoDetalle.estado].siguiente]?.icon}&nbsp;
                  Marcar como {ESTADO_CONFIG[pedidoDetalle.estado].siguiente}
                </button>
              )}
              {pedidoDetalle.estado !== 'Cancelado' && pedidoDetalle.estado !== 'Entregado' && (
                <button className="btn-cancelar" onClick={() => cancelarPedido(pedidoDetalle.id)}>
                  Cancelar pedido
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL NUEVO PEDIDO ── */}
      {mostrarFormNuevo && (
        <div className="modal-overlay" onClick={() => setMostrarFormNuevo(false)}>
          <div className="modal-nuevo" onClick={e => e.stopPropagation()}>
            <div className="modal-detalle__header">
              <h3 className="modal-detalle__nombre">Registrar Nuevo Pedido</h3>
              <button className="modal-close" onClick={() => setMostrarFormNuevo(false)}>✕</button>
            </div>

            <div className="nuevo-form-grid">
              <div className="form-field">
                <label>Nombre del cliente</label>
                <input placeholder="Ej: Carlos Quispe" value={nuevoPedido.cliente}
                  onChange={e => setNuevoPedido(p => ({...p, cliente: e.target.value}))} />
              </div>
              <div className="form-field">
                <label>Teléfono</label>
                <input placeholder="9XX XXX XXX" value={nuevoPedido.telefono}
                  onChange={e => setNuevoPedido(p => ({...p, telefono: e.target.value}))} />
              </div>
              <div className="form-field form-field--full">
                <label>Dirección de entrega</label>
                <input placeholder="Av. / Jr. / Urb. ..." value={nuevoPedido.direccion}
                  onChange={e => setNuevoPedido(p => ({...p, direccion: e.target.value}))} />
              </div>
              <div className="form-field">
                <label>Método de pago</label>
                <select value={nuevoPedido.metodoPago}
                  onChange={e => setNuevoPedido(p => ({...p, metodoPago: e.target.value}))}>
                  <option>Efectivo</option>
                  <option>Yape</option>
                  <option>Tarjeta</option>
                </select>
              </div>
            </div>

            <div className="nuevo-items-section">
              <p className="nuevo-items-title">Ítems del pedido</p>
              <div className="nuevo-item-row">
                <input placeholder="Nombre del plato" value={nuevoItem.nombre}
                  onChange={e => setNuevoItem(i => ({...i, nombre: e.target.value}))} />
                <input type="number" min="1" placeholder="Cant." value={nuevoItem.qty}
                  onChange={e => setNuevoItem(i => ({...i, qty: Number(e.target.value)}))} style={{width: 70}} />
                <input type="number" placeholder="Precio unit." value={nuevoItem.precio}
                  onChange={e => setNuevoItem(i => ({...i, precio: e.target.value}))} style={{width: 110}} />
                <button className="btn-add-item" onClick={agregarItemNuevo}>+</button>
              </div>
              {nuevoPedido.items.length > 0 && (
                <div className="nuevo-items-lista">
                  {nuevoPedido.items.map((it, i) => (
                    <div key={i} className="nuevo-item-preview">
                      <span>{it.nombre}</span>
                      <span>×{it.qty}</span>
                      <span>S/ {(it.precio * it.qty).toFixed(2)}</span>
                      <button onClick={() => setNuevoPedido(p => ({...p, items: p.items.filter((_, j) => j !== i)}))}>✕</button>
                    </div>
                  ))}
                  <div className="nuevo-items-total">
                    Total: <strong>S/ {nuevoPedido.items.reduce((s, i) => s + i.precio * i.qty, 0).toFixed(2)}</strong>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-detalle__actions">
              <button className="btn-avanzar btn-avanzar--lg" onClick={confirmarNuevoPedido}
                disabled={!nuevoPedido.cliente || !nuevoPedido.direccion || nuevoPedido.items.length === 0}>
                🛵 Confirmar Pedido
              </button>
              <button className="btn-cancelar" onClick={() => setMostrarFormNuevo(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}