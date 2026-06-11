import React, { useState, useEffect, useRef } from 'react';
import './GestionDelivery.css';

// ── DATOS MOCK ──────────────────────────────────────────────────────────────
const REPARTIDORES_MOCK = [
  { id: 1, nombre: 'Jhon Quispe',   telefono: '999 111 222', activo: true },
  { id: 2, nombre: 'Pedro Salas',   telefono: '988 333 444', activo: true },
  { id: 3, nombre: 'Marco Villena', telefono: '977 555 666', activo: false },
];

const ZONAS_MOCK = [
  { id: 1, nombre: 'Miraflores',    costo: 5,  tiempo: 25 },
  { id: 2, nombre: 'San Borja',     costo: 6,  tiempo: 30 },
  { id: 3, nombre: 'Barranco',      costo: 5,  tiempo: 20 },
  { id: 4, nombre: 'Surco',         costo: 8,  tiempo: 40 },
  { id: 5, nombre: 'Lima Centro',   costo: 7,  tiempo: 35 },
  { id: 6, nombre: 'Pueblo Libre',  costo: 6,  tiempo: 28 },
  { id: 7, nombre: 'Jesús María',   costo: 6,  tiempo: 25 },
  { id: 8, nombre: 'Cercado',       costo: 7,  tiempo: 30 },
];

const ahora = new Date();
const ts = (minBack) => {
  const d = new Date(ahora - minBack * 60000);
  return d.toISOString();
};
const hhmm = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}`;
};

const PEDIDOS_MOCK = [
  { id: 1, cliente: 'Carlos Quispe',  telefono: '987 654 321', sinCuenta: false, direccion: 'Av. Arequipa 1240', distrito: 'Miraflores',  notas: 'Tocar timbre dos veces', items: [{ nombre: 'Cau Cau', qty: 2, precio: 38 }, { nombre: 'Chicha Morada', qty: 2, precio: 10 }], subtotal: 96, costoEnvio: 5, descuento: 0, total: 101, estado: 'Preparando', metodoPago: 'Yape',     repartidorId: null, hora: '12:15', tsCreado: ts(55), tsPrepando: ts(48), tsEnCamino: null, tsEntregado: null, motivoCancelacion: null },
  { id: 2, cliente: 'María Flores',   telefono: '912 345 678', sinCuenta: false, direccion: 'Jr. Huancavelica 340', distrito: 'Lima Centro', notas: '',                          items: [{ nombre: 'Lomo Saltado', qty: 1, precio: 52 }, { nombre: 'Inca Kola', qty: 1, precio: 8 }], subtotal: 60, costoEnvio: 7, descuento: 0, total: 67, estado: 'En camino',  metodoPago: 'Efectivo', repartidorId: 1, hora: '12:32', tsCreado: ts(38), tsPrepando: ts(32), tsEnCamino: ts(15), tsEntregado: null, motivoCancelacion: null },
  { id: 3, cliente: 'José Ramírez',   telefono: '956 789 012', sinCuenta: false, direccion: 'Calle Los Pinos 88', distrito: 'San Borja',    notas: 'Sin cebolla',               items: [{ nombre: 'Ají de Gallina', qty: 1, precio: 42 }], subtotal: 42, costoEnvio: 6, descuento: 0, total: 48, estado: 'Entregado',  metodoPago: 'Tarjeta',  repartidorId: 2, hora: '11:48', tsCreado: ts(82), tsPrepando: ts(74), tsEnCamino: ts(55), tsEntregado: ts(30), motivoCancelacion: null },
  { id: 4, cliente: 'Ana Castillo',   telefono: '934 210 876', sinCuenta: false, direccion: 'Av. Brasil 3310',    distrito: 'Pueblo Libre', notas: 'Extra salsa',               items: [{ nombre: 'Arroz con Leche', qty: 3, precio: 18 }, { nombre: 'Causa Limeña', qty: 2, precio: 28 }], subtotal: 110, costoEnvio: 6, descuento: 10, total: 106, estado: 'Pendiente',  metodoPago: 'Yape',     repartidorId: null, hora: '13:05', tsCreado: ts(15), tsPrepando: null, tsEnCamino: null, tsEntregado: null, motivoCancelacion: null },
  { id: 5, cliente: 'Luis Mendoza',   telefono: '978 432 100', sinCuenta: false, direccion: 'Urb. Santa Cruz 22', distrito: 'Jesús María',  notas: '',                          items: [{ nombre: 'Tacu Tacu', qty: 2, precio: 45 }], subtotal: 90, costoEnvio: 6, descuento: 0, total: 96, estado: 'Cancelado',  metodoPago: 'Efectivo', repartidorId: null, hora: '11:20', tsCreado: ts(100), tsPrepando: null, tsEnCamino: null, tsEntregado: null, motivoCancelacion: 'Cliente no contestó' },
  { id: 6, cliente: 'Rosa Huamán',    telefono: '901 567 234', sinCuenta: false, direccion: 'Calle Palma 14',    distrito: 'Barranco',     notas: 'Subir al 3er piso',         items: [{ nombre: 'Seco de Cordero', qty: 1, precio: 55 }, { nombre: 'Mazamorra', qty: 2, precio: 14 }], subtotal: 83, costoEnvio: 5, descuento: 0, total: 88, estado: 'Preparando', metodoPago: 'Tarjeta',  repartidorId: null, hora: '13:18', tsCreado: ts(22), tsPrepando: ts(10), tsEnCamino: null, tsEntregado: null, motivoCancelacion: null },
  { id: 7, cliente: 'Diego Torres',   telefono: '945 678 321', sinCuenta: false, direccion: 'Av. Javier Prado 4450', distrito: 'Surco',   notas: '',                          items: [{ nombre: 'Ceviche Clásico', qty: 2, precio: 65 }], subtotal: 130, costoEnvio: 8, descuento: 0, total: 138, estado: 'En camino',  metodoPago: 'Yape',     repartidorId: 1, hora: '12:55', tsCreado: ts(45), tsPrepando: ts(38), tsEnCamino: ts(20), tsEntregado: null, motivoCancelacion: null },
  { id: 8, cliente: 'Sofía Vargas',   telefono: '923 100 456', sinCuenta: true,  direccion: 'Jr. Carabaya 560',  distrito: 'Cercado',      notas: 'Llamar al llegar',          items: [{ nombre: 'Anticuchos', qty: 4, precio: 22 }], subtotal: 88, costoEnvio: 7, descuento: 0, total: 95, estado: 'Pendiente',  metodoPago: 'Efectivo', repartidorId: null, hora: '13:40', tsCreado: ts(5),  tsPrepando: null, tsEnCamino: null, tsEntregado: null, motivoCancelacion: null },
];

// ── CONFIGURACIÓN ────────────────────────────────────────────────────────────
const ESTADO_CONFIG = {
  'Pendiente':  { color: '#d97706', bg: '#fef3c7', icon: '🕐', siguiente: 'Preparando' },
  'Preparando': { color: '#2563eb', bg: '#dbeafe', icon: '👨‍🍳', siguiente: 'En camino' },
  'En camino':  { color: '#7c3aed', bg: '#ede9fe', icon: '🛵', siguiente: 'Entregado' },
  'Entregado':  { color: '#15803d', bg: '#dcfce7', icon: '✅', siguiente: null },
  'Cancelado':  { color: '#b91c1c', bg: '#fee2e2', icon: '✖',  siguiente: null },
};
const METODO_CONFIG = {
  'Yape':     { color: '#a21caf', bg: '#fae8ff', icon: '💜' },
  'Efectivo': { color: '#92400e', bg: '#fef3c7', icon: '💵' },
  'Tarjeta':  { color: '#0369a1', bg: '#e0f2fe', icon: '💳' },
  'Plin':     { color: '#047857', bg: '#d1fae5', icon: '💚' },
};
const ESTADOS_ORDEN = ['Pendiente', 'Preparando', 'En camino', 'Entregado'];
const MOTIVOS_CANCELACION = [
  'Cliente no contestó',
  'Dirección incorrecta',
  'Pedido duplicado',
  'Fuera de zona',
  'Sin stock',
  'Otro',
];

// ── HELPERS ──────────────────────────────────────────────────────────────────
const minutosDesde = (iso) => {
  if (!iso) return null;
  return Math.floor((Date.now() - new Date(iso)) / 60000);
};
const formatMin = (min) => {
  if (min === null) return '—';
  if (min < 60) return `${min}m`;
  return `${Math.floor(min / 60)}h ${min % 60}m`;
};

// ── HOOK RELOJ ───────────────────────────────────────────────────────────────
function useNow(interval = 30000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), interval);
    return () => clearInterval(t);
  }, [interval]);
  return now;
}

// ════════════════════════════════════════════════════════════════════════════
export default function GestionDelivery() {
  const now = useNow();
  const [pedidos, setPedidos]               = useState(PEDIDOS_MOCK);
  const [repartidores]                      = useState(REPARTIDORES_MOCK);
  const [zonas]                             = useState(ZONAS_MOCK);
  const [filtroEstado, setFiltroEstado]     = useState('Todos');
  const [filtroDistrito, setFiltroDistrito] = useState('Todos');
  const [pedidoDetalle, setPedidoDetalle]   = useState(null);
  const [busqueda, setBusqueda]             = useState('');
  const [mostrarFormNuevo, setMostrarFormNuevo] = useState(false);
  const [mostrarReporte, setMostrarReporte] = useState(false);
  const [mostrarCancelModal, setMostrarCancelModal] = useState(null); // pedido id
  const [motivoSeleccionado, setMotivoSeleccionado] = useState('');
  const [motivoCustom, setMotivoCustom]     = useState('');
  const [tab, setTab]                       = useState('pedidos'); // 'pedidos' | 'repartidores' | 'zonas'

  // Nuevo pedido
  const [nuevoItem, setNuevoItem]           = useState({ nombre: '', qty: 1, precio: '' });
  const [nuevoPedido, setNuevoPedido]       = useState({
    cliente: '', telefono: '', sinCuenta: false,
    direccion: '', distrito: '', notas: '',
    metodoPago: 'Efectivo', items: [],
    descuento: 0,
  });

  // ── Métricas ──────────────────────────────────────────────────────────────
  const metricas = {
    total:      pedidos.length,
    pendiente:  pedidos.filter(p => p.estado === 'Pendiente').length,
    preparando: pedidos.filter(p => p.estado === 'Preparando').length,
    enCamino:   pedidos.filter(p => p.estado === 'En camino').length,
    entregado:  pedidos.filter(p => p.estado === 'Entregado').length,
    cancelado:  pedidos.filter(p => p.estado === 'Cancelado').length,
    ingresos:   pedidos.filter(p => p.estado !== 'Cancelado').reduce((s, p) => s + p.total, 0),
  };

  // ── Filtrado ──────────────────────────────────────────────────────────────
  const pedidosFiltrados = pedidos.filter(p => {
    const matchEstado   = filtroEstado === 'Todos' || p.estado === filtroEstado;
    const matchDistrito = filtroDistrito === 'Todos' || p.distrito === filtroDistrito;
    const matchBusqueda = p.cliente.toLowerCase().includes(busqueda.toLowerCase()) ||
                          String(p.id).includes(busqueda) ||
                          p.telefono.includes(busqueda);
    return matchEstado && matchDistrito && matchBusqueda;
  });

  const distritos = [...new Set(pedidos.map(p => p.distrito))].sort();

  // ── Acciones ──────────────────────────────────────────────────────────────
  const avanzarEstado = (id) => {
    setPedidos(prev => prev.map(p => {
      if (p.id !== id) return p;
      const siguiente = ESTADO_CONFIG[p.estado]?.siguiente;
      if (!siguiente) return p;
      const ahora = new Date().toISOString();
      return {
        ...p,
        estado: siguiente,
        tsPrepando:   siguiente === 'Preparando' ? ahora : p.tsPrepando,
        tsEnCamino:   siguiente === 'En camino'  ? ahora : p.tsEnCamino,
        tsEntregado:  siguiente === 'Entregado'  ? ahora : p.tsEntregado,
      };
    }));
    setPedidoDetalle(d => {
      if (!d || d.id !== id) return d;
      const siguiente = ESTADO_CONFIG[d.estado]?.siguiente;
      if (!siguiente) return d;
      const ahora = new Date().toISOString();
      return {
        ...d, estado: siguiente,
        tsPrepando:  siguiente === 'Preparando' ? ahora : d.tsPrepando,
        tsEnCamino:  siguiente === 'En camino'  ? ahora : d.tsEnCamino,
        tsEntregado: siguiente === 'Entregado'  ? ahora : d.tsEntregado,
      };
    });
  };

  const abrirCancelModal = (id, e) => {
    if (e) e.stopPropagation();
    setMotivoSeleccionado('');
    setMotivoCustom('');
    setMostrarCancelModal(id);
  };

  const confirmarCancelacion = () => {
    const motivo = motivoSeleccionado === 'Otro' ? motivoCustom : motivoSeleccionado;
    if (!motivo) return;
    setPedidos(prev => prev.map(p =>
      p.id === mostrarCancelModal ? { ...p, estado: 'Cancelado', motivoCancelacion: motivo } : p
    ));
    setPedidoDetalle(d => d?.id === mostrarCancelModal ? { ...d, estado: 'Cancelado', motivoCancelacion: motivo } : d);
    setMostrarCancelModal(null);
  };

  const asignarRepartidor = (pedidoId, repId) => {
    const rid = repId ? Number(repId) : null;
    setPedidos(prev => prev.map(p => p.id === pedidoId ? { ...p, repartidorId: rid } : p));
    setPedidoDetalle(d => d?.id === pedidoId ? { ...d, repartidorId: rid } : d);
  };

  // ── Nuevo pedido ──────────────────────────────────────────────────────────
  const agregarItemNuevo = () => {
    if (!nuevoItem.nombre || !nuevoItem.precio) return;
    setNuevoPedido(p => ({ ...p, items: [...p.items, { ...nuevoItem, precio: Number(nuevoItem.precio) }] }));
    setNuevoItem({ nombre: '', qty: 1, precio: '' });
  };

  const confirmarNuevoPedido = () => {
    if (!nuevoPedido.cliente || !nuevoPedido.direccion || nuevoPedido.items.length === 0) return;
    const subtotal  = nuevoPedido.items.reduce((s, i) => s + i.precio * i.qty, 0);
    const zona      = zonas.find(z => z.nombre === nuevoPedido.distrito);
    const costoEnvio = zona ? zona.costo : 0;
    const total     = subtotal + costoEnvio - Number(nuevoPedido.descuento || 0);
    const d         = new Date();
    const hora      = `${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}`;
    setPedidos(prev => [{
      ...nuevoPedido,
      id: Math.max(...prev.map(x => x.id)) + 1,
      subtotal, costoEnvio, total,
      estado: 'Pendiente',
      hora,
      tsCreado:    d.toISOString(),
      tsPrepando:  null, tsEnCamino: null, tsEntregado: null,
      repartidorId: null,
      motivoCancelacion: null,
    }, ...prev]);
    setNuevoPedido({ cliente: '', telefono: '', sinCuenta: false, direccion: '', distrito: '', notas: '', metodoPago: 'Efectivo', items: [], descuento: 0 });
    setMostrarFormNuevo(false);
  };

  // ── Reporte del día ───────────────────────────────────────────────────────
  const reporte = {
    totalPedidos:    pedidos.length,
    entregados:      pedidos.filter(p => p.estado === 'Entregado').length,
    cancelados:      pedidos.filter(p => p.estado === 'Cancelado').length,
    enProceso:       pedidos.filter(p => ['Pendiente','Preparando','En camino'].includes(p.estado)).length,
    ingresosBrutos:  pedidos.filter(p => p.estado !== 'Cancelado').reduce((s,p) => s + p.total, 0),
    ticketPromedio:  pedidos.filter(p => p.estado === 'Entregado').length > 0
      ? (pedidos.filter(p => p.estado === 'Entregado').reduce((s,p) => s + p.total, 0) /
         pedidos.filter(p => p.estado === 'Entregado').length)
      : 0,
    porMetodo: ['Yape','Efectivo','Tarjeta','Plin'].map(m => ({
      metodo: m,
      count: pedidos.filter(p => p.metodoPago === m && p.estado !== 'Cancelado').length,
      total: pedidos.filter(p => p.metodoPago === m && p.estado !== 'Cancelado').reduce((s,p)=>s+p.total,0),
    })).filter(x => x.count > 0),
    porDistrito: distritos.map(d => ({
      distrito: d,
      count: pedidos.filter(p => p.distrito === d && p.estado !== 'Cancelado').length,
      total: pedidos.filter(p => p.distrito === d && p.estado !== 'Cancelado').reduce((s,p)=>s+p.total,0),
    })).sort((a,b) => b.total - a.total),
    porRepartidor: repartidores.map(r => ({
      rep: r,
      count:     pedidos.filter(p => p.repartidorId === r.id && p.estado !== 'Cancelado').length,
      entregados: pedidos.filter(p => p.repartidorId === r.id && p.estado === 'Entregado').length,
    })),
  };

  // ── Historial de cliente (busca por teléfono) ─────────────────────────────
  const historialCliente = (tel) =>
    pedidos.filter(p => p.telefono === tel).sort((a,b) => new Date(b.tsCreado) - new Date(a.tsCreado));

  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="delivery-wrapper">

      {/* ── CABECERA ── */}
      <div className="delivery-header">
        <div className="delivery-header__left">
          <span className="delivery-eyebrow">OPERACIONES EN TIEMPO REAL</span>
          <h1 className="delivery-title">Gestión de Delivery</h1>
          <p className="delivery-subtitle">Monitorea y actualiza los pedidos a domicilio del día</p>
        </div>
        <div className="delivery-header__actions">
          <button className="btn-reporte" onClick={() => setMostrarReporte(true)}>📊 Reporte del día</button>
          <button className="btn-nuevo-pedido" onClick={() => setMostrarFormNuevo(true)}>+ Nuevo Pedido</button>
        </div>
      </div>

      {/* ── TABS ── */}
      <div className="delivery-tabs">
        {[['pedidos','🛵 Pedidos'],['repartidores','👤 Repartidores'],['zonas','📍 Zonas']].map(([k,l]) => (
          <button key={k} className={`dtab ${tab===k?'dtab--active':''}`} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      {/* ══════════════════ TAB: PEDIDOS ══════════════════ */}
      {tab === 'pedidos' && (<>

        {/* ── MÉTRICAS ── */}
        <div className="delivery-metrics">
          {[
            { label:'Pendientes',  val: metricas.pendiente,  color:'#d97706' },
            { label:'Preparando',  val: metricas.preparando, color:'#2563eb' },
            { label:'En camino',   val: metricas.enCamino,   color:'#7c3aed' },
            { label:'Entregados',  val: metricas.entregado,  color:'#15803d' },
          ].map(m => (
            <div key={m.label} className="metric-tile">
              <span className="metric-tile__value">{m.val}</span>
              <span className="metric-tile__label">{m.label}</span>
              <span className="metric-tile__bar" style={{ width:`${(m.val/metricas.total)*100}%`, background: m.color }} />
            </div>
          ))}
          <div className="metric-tile metric-tile--ingresos">
            <span className="metric-tile__value">S/ {metricas.ingresos.toFixed(2)}</span>
            <span className="metric-tile__label">Ingresos del día</span>
            <span className="metric-tile__bar" style={{ width:'100%', background:'#bc5a1a' }} />
          </div>
        </div>

        {/* ── FILTROS ── */}
        <div className="delivery-filters">
          <div className="filter-row">
            <div className="filter-tabs">
              {['Todos','Pendiente','Preparando','En camino','Entregado','Cancelado'].map(f => (
                <button key={f}
                  className={`filter-tab ${filtroEstado===f?'filter-tab--active':''}`}
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
          </div>
          <div className="filter-row filter-row--bottom">
            <select className="filter-select"
              value={filtroDistrito} onChange={e => setFiltroDistrito(e.target.value)}>
              <option value="Todos">Todos los distritos</option>
              {distritos.map(d => <option key={d}>{d}</option>)}
            </select>
            <input className="delivery-search"
              placeholder="Buscar por cliente, N° o teléfono…"
              value={busqueda} onChange={e => setBusqueda(e.target.value)} />
          </div>
        </div>

        {/* ── GRID ── */}
        <div className="delivery-grid">
          {pedidosFiltrados.length === 0 ? (
            <div className="delivery-empty"><p>🛵 No hay pedidos con este filtro</p></div>
          ) : pedidosFiltrados.map(pedido => {
            const cfg     = ESTADO_CONFIG[pedido.estado] || {};
            const cfgPago = METODO_CONFIG[pedido.metodoPago] || {};
            const rep     = repartidores.find(r => r.id === pedido.repartidorId);
            const minEnEstado = minutosDesde(
              pedido.estado === 'En camino' ? pedido.tsEnCamino :
              pedido.estado === 'Preparando' ? pedido.tsPrepando :
              pedido.estado === 'Pendiente' ? pedido.tsCreado : null
            );
            const alerta = minEnEstado !== null && (
              (pedido.estado === 'Pendiente'  && minEnEstado > 10) ||
              (pedido.estado === 'Preparando' && minEnEstado > 20) ||
              (pedido.estado === 'En camino'  && minEnEstado > 45)
            );

            return (
              <div key={pedido.id}
                className={`pedido-card pedido-card--${pedido.estado.toLowerCase().replace(' ','-')} ${alerta ? 'pedido-card--alerta' : ''}`}
                onClick={() => setPedidoDetalle(pedido)}
              >
                <div className="pedido-card__stripe" style={{ background: cfg.color }} />
                <div className="pedido-card__body">
                  <div className="pedido-card__top">
                    <span className="pedido-card__id">
                      #{String(pedido.id).padStart(3,'0')}
                      {pedido.sinCuenta && <span className="badge-sincuenta">Sin cuenta</span>}
                    </span>
                    <div className="pedido-card__top-right">
                      {alerta && <span className="alerta-dot" title="Tiempo excedido">⚠</span>}
                      <span className="pedido-card__hora">{pedido.hora}</span>
                    </div>
                  </div>

                  <h4 className="pedido-card__cliente">{pedido.cliente}</h4>
                  <p className="pedido-card__dir">📍 {pedido.direccion}, <strong>{pedido.distrito}</strong></p>
                  {pedido.notas && <p className="pedido-card__notas">💬 {pedido.notas}</p>}

                  <div className="pedido-card__tags">
                    <span className="estado-badge" style={{ color: cfg.color, background: cfg.bg }}>
                      {cfg.icon} {pedido.estado}
                    </span>
                    <span className="pago-badge" style={{ color: cfgPago.color, background: cfgPago.bg }}>
                      {cfgPago.icon} {pedido.metodoPago}
                    </span>
                  </div>

                  {minEnEstado !== null && pedido.estado !== 'Entregado' && pedido.estado !== 'Cancelado' && (
                    <div className={`tiempo-chip ${alerta ? 'tiempo-chip--alerta' : ''}`}>
                      ⏱ {formatMin(minEnEstado)} en {pedido.estado.toLowerCase()}
                    </div>
                  )}

                  {rep && (
                    <div className="rep-chip">🛵 {rep.nombre}</div>
                  )}

                  <div className="pedido-card__footer">
                    <span className="pedido-card__items">{pedido.items.length} ítem{pedido.items.length!==1?'s':''}</span>
                    <span className="pedido-card__total">S/ {pedido.total.toFixed(2)}</span>
                  </div>

                  {cfg.siguiente && (
                    <button className="btn-avanzar"
                      onClick={e => { e.stopPropagation(); avanzarEstado(pedido.id); }}>
                      {ESTADO_CONFIG[cfg.siguiente]?.icon} Marcar como {cfg.siguiente}
                    </button>
                  )}

                  {pedido.motivoCancelacion && (
                    <p className="motivo-cancelacion">Motivo: {pedido.motivoCancelacion}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </>)}

      {/* ══════════════════ TAB: REPARTIDORES ══════════════════ */}
      {tab === 'repartidores' && (
        <div className="tab-content">
          <div className="repartidores-grid">
            {repartidores.map(rep => {
              const asignados  = pedidos.filter(p => p.repartidorId === rep.id && ['En camino','Preparando'].includes(p.estado));
              const entregados = pedidos.filter(p => p.repartidorId === rep.id && p.estado === 'Entregado');
              return (
                <div key={rep.id} className={`rep-card ${!rep.activo ? 'rep-card--inactivo' : ''}`}>
                  <div className="rep-card__avatar">{rep.nombre.charAt(0)}</div>
                  <div className="rep-card__info">
                    <h4>{rep.nombre}</h4>
                    <p>📞 {rep.telefono}</p>
                    <span className={`rep-status ${rep.activo ? 'rep-status--activo' : ''}`}>
                      {rep.activo ? '● Activo' : '○ Inactivo'}
                    </span>
                  </div>
                  <div className="rep-card__stats">
                    <div className="rep-stat">
                      <span className="rep-stat__val">{asignados.length}</span>
                      <span className="rep-stat__lbl">En proceso</span>
                    </div>
                    <div className="rep-stat">
                      <span className="rep-stat__val">{entregados.length}</span>
                      <span className="rep-stat__lbl">Entregados</span>
                    </div>
                  </div>
                  {asignados.length > 0 && (
                    <div className="rep-pedidos-activos">
                      {asignados.map(p => (
                        <div key={p.id} className="rep-pedido-chip" onClick={() => { setTab('pedidos'); setPedidoDetalle(p); }}>
                          #{String(p.id).padStart(3,'0')} — {p.cliente}
                          <span style={{ color: ESTADO_CONFIG[p.estado].color }}> {ESTADO_CONFIG[p.estado].icon}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══════════════════ TAB: ZONAS ══════════════════ */}
      {tab === 'zonas' && (
        <div className="tab-content">
          <div className="zonas-tabla">
            <div className="zonas-head">
              <span>Distrito</span><span>Costo envío</span><span>Tiempo est.</span><span>Pedidos hoy</span><span>Ingresos</span>
            </div>
            {zonas.map(z => {
              const pedZ = pedidos.filter(p => p.distrito === z.nombre && p.estado !== 'Cancelado');
              return (
                <div key={z.id} className="zonas-row">
                  <span className="zonas-distrito">📍 {z.nombre}</span>
                  <span>S/ {z.costo.toFixed(2)}</span>
                  <span>~{z.tiempo} min</span>
                  <span>{pedZ.length}</span>
                  <span className="zonas-ingresos">S/ {pedZ.reduce((s,p)=>s+p.total,0).toFixed(2)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══════════════════ MODAL DETALLE ══════════════════ */}
      {pedidoDetalle && (
        <div className="modal-overlay" onClick={() => setPedidoDetalle(null)}>
          <div className="modal-detalle" onClick={e => e.stopPropagation()}>
            <div className="modal-detalle__header">
              <div>
                <span className="modal-detalle__eyebrow">
                  Pedido #{String(pedidoDetalle.id).padStart(3,'0')} · {pedidoDetalle.hora}
                  {pedidoDetalle.sinCuenta && <span className="badge-sincuenta" style={{marginLeft:8}}>Sin cuenta</span>}
                </span>
                <h3 className="modal-detalle__nombre">{pedidoDetalle.cliente}</h3>
              </div>
              <button className="modal-close" onClick={() => setPedidoDetalle(null)}>✕</button>
            </div>

            {/* Timeline */}
            <div className="estado-timeline">
              {ESTADOS_ORDEN.map((e, i) => {
                const actual   = ESTADOS_ORDEN.indexOf(pedidoDetalle.estado);
                const esActual = pedidoDetalle.estado === e;
                const esPasado = actual > i;
                return (
                  <React.Fragment key={e}>
                    <div className={`timeline-step ${esActual?'timeline-step--active':''} ${esPasado?'timeline-step--done':''}`}>
                      <div className="timeline-dot">{ESTADO_CONFIG[e].icon}</div>
                      <span className="timeline-label">{e}</span>
                    </div>
                    {i < 3 && <div className={`timeline-line ${(esPasado||esActual)?'timeline-line--done':''}`} />}
                  </React.Fragment>
                );
              })}
            </div>

            {/* Timestamps */}
            <div className="ts-row">
              {[
                ['Recibido',   pedidoDetalle.tsCreado],
                ['Preparando', pedidoDetalle.tsPrepando],
                ['En camino',  pedidoDetalle.tsEnCamino],
                ['Entregado',  pedidoDetalle.tsEntregado],
              ].map(([l, ts]) => (
                <div key={l} className={`ts-chip ${ts ? 'ts-chip--done' : ''}`}>
                  <span className="ts-chip__label">{l}</span>
                  <span className="ts-chip__val">{hhmm(ts) || '—'}</span>
                </div>
              ))}
            </div>

            {/* Info grid */}
            <div className="modal-detalle__grid">
              <div className="modal-info-block" style={{gridColumn:'1/-1'}}>
                <span className="modal-info-label">Dirección</span>
                <span className="modal-info-val">📍 {pedidoDetalle.direccion}, {pedidoDetalle.distrito}</span>
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
              {pedidoDetalle.notas && (
                <div className="modal-info-block" style={{gridColumn:'1/-1'}}>
                  <span className="modal-info-label">Notas del cliente</span>
                  <span className="modal-info-val">💬 {pedidoDetalle.notas}</span>
                </div>
              )}
              {pedidoDetalle.motivoCancelacion && (
                <div className="modal-info-block" style={{gridColumn:'1/-1'}}>
                  <span className="modal-info-label">Motivo de cancelación</span>
                  <span className="modal-info-val" style={{color:'#b91c1c'}}>✖ {pedidoDetalle.motivoCancelacion}</span>
                </div>
              )}
            </div>

            {/* Asignar repartidor */}
            {pedidoDetalle.estado !== 'Cancelado' && pedidoDetalle.estado !== 'Entregado' && (
              <div className="modal-rep-section">
                <span className="modal-info-label" style={{display:'block',marginBottom:6}}>Repartidor asignado</span>
                <select className="rep-select"
                  value={pedidoDetalle.repartidorId || ''}
                  onChange={e => asignarRepartidor(pedidoDetalle.id, e.target.value || null)}>
                  <option value="">— Sin asignar —</option>
                  {repartidores.filter(r => r.activo).map(r => (
                    <option key={r.id} value={r.id}>{r.nombre} · {r.telefono}</option>
                  ))}
                </select>
              </div>
            )}
            {pedidoDetalle.repartidorId && (pedidoDetalle.estado === 'En camino' || pedidoDetalle.estado === 'Entregado') && (
              <div className="modal-rep-section">
                <span className="modal-info-label" style={{display:'block',marginBottom:4}}>Repartidor</span>
                <span className="modal-info-val">
                  🛵 {repartidores.find(r=>r.id===pedidoDetalle.repartidorId)?.nombre}
                  &nbsp;·&nbsp;
                  {repartidores.find(r=>r.id===pedidoDetalle.repartidorId)?.telefono}
                </span>
              </div>
            )}

            {/* Tabla de ítems */}
            <div className="modal-items-tabla">
              <div className="modal-items-head"><span>Plato</span><span>Cant.</span><span>Subtotal</span></div>
              {pedidoDetalle.items.map((item, i) => (
                <div key={i} className="modal-items-row">
                  <span>{item.nombre}</span><span>×{item.qty}</span>
                  <span>S/ {(item.precio * item.qty).toFixed(2)}</span>
                </div>
              ))}
              <div className="modal-items-subtotales">
                <div className="modal-items-row" style={{color:'#705e52'}}>
                  <span>Subtotal</span><span></span><span>S/ {pedidoDetalle.subtotal.toFixed(2)}</span>
                </div>
                <div className="modal-items-row" style={{color:'#705e52'}}>
                  <span>Envío ({pedidoDetalle.distrito})</span><span></span><span>S/ {pedidoDetalle.costoEnvio.toFixed(2)}</span>
                </div>
                {pedidoDetalle.descuento > 0 && (
                  <div className="modal-items-row" style={{color:'#15803d'}}>
                    <span>Descuento</span><span></span><span>−S/ {pedidoDetalle.descuento.toFixed(2)}</span>
                  </div>
                )}
              </div>
              <div className="modal-items-total"><span>Total</span><span>S/ {pedidoDetalle.total.toFixed(2)}</span></div>
            </div>

            {/* Historial del cliente */}
            {(() => {
              const hist = historialCliente(pedidoDetalle.telefono).filter(p => p.id !== pedidoDetalle.id);
              if (hist.length === 0) return null;
              return (
                <div className="modal-historial">
                  <span className="modal-info-label" style={{display:'block',marginBottom:8}}>
                    Historial del cliente ({hist.length} pedido{hist.length!==1?'s':''} anteriores)
                  </span>
                  {hist.slice(0,3).map(p => (
                    <div key={p.id} className="historial-row">
                      <span>#{String(p.id).padStart(3,'0')} · {p.hora}</span>
                      <span>{p.items.length} ítem{p.items.length!==1?'s':''}</span>
                      <span className="estado-badge" style={{color: ESTADO_CONFIG[p.estado].color, background: ESTADO_CONFIG[p.estado].bg, fontSize:'0.65rem'}}>
                        {ESTADO_CONFIG[p.estado].icon} {p.estado}
                      </span>
                      <span style={{fontWeight:700,color:'#bc5a1a'}}>S/ {p.total.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* Acciones */}
            <div className="modal-detalle__actions">
              {ESTADO_CONFIG[pedidoDetalle.estado]?.siguiente && (
                <button className="btn-avanzar btn-avanzar--lg" onClick={() => avanzarEstado(pedidoDetalle.id)}>
                  {ESTADO_CONFIG[ESTADO_CONFIG[pedidoDetalle.estado].siguiente]?.icon}&nbsp;
                  Marcar como {ESTADO_CONFIG[pedidoDetalle.estado].siguiente}
                </button>
              )}
              {pedidoDetalle.estado !== 'Cancelado' && pedidoDetalle.estado !== 'Entregado' && (
                <button className="btn-cancelar" onClick={() => abrirCancelModal(pedidoDetalle.id)}>
                  Cancelar pedido
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════ MODAL CANCELACIÓN ══════════════════ */}
      {mostrarCancelModal && (
        <div className="modal-overlay" onClick={() => setMostrarCancelModal(null)}>
          <div className="modal-cancel" onClick={e => e.stopPropagation()}>
            <div className="modal-detalle__header">
              <h3 className="modal-detalle__nombre" style={{fontSize:'1.1rem'}}>¿Por qué se cancela?</h3>
              <button className="modal-close" onClick={() => setMostrarCancelModal(null)}>✕</button>
            </div>
            <div className="cancel-motivos">
              {MOTIVOS_CANCELACION.map(m => (
                <button key={m}
                  className={`cancel-opcion ${motivoSeleccionado===m?'cancel-opcion--active':''}`}
                  onClick={() => setMotivoSeleccionado(m)}>{m}</button>
              ))}
            </div>
            {motivoSeleccionado === 'Otro' && (
              <div style={{padding:'0 20px 12px'}}>
                <input className="delivery-search" style={{width:'100%',boxSizing:'border-box'}}
                  placeholder="Describe el motivo…"
                  value={motivoCustom} onChange={e => setMotivoCustom(e.target.value)} />
              </div>
            )}
            <div className="modal-detalle__actions">
              <button className="btn-avanzar btn-avanzar--lg"
                style={{background:'#b91c1c'}}
                disabled={!motivoSeleccionado || (motivoSeleccionado==='Otro' && !motivoCustom)}
                onClick={confirmarCancelacion}>
                Confirmar cancelación
              </button>
              <button className="btn-cancelar" onClick={() => setMostrarCancelModal(null)}>Volver</button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════ MODAL NUEVO PEDIDO ══════════════════ */}
      {mostrarFormNuevo && (
        <div className="modal-overlay" onClick={() => setMostrarFormNuevo(false)}>
          <div className="modal-nuevo" onClick={e => e.stopPropagation()}>
            <div className="modal-detalle__header">
              <h3 className="modal-detalle__nombre">Registrar Nuevo Pedido</h3>
              <button className="modal-close" onClick={() => setMostrarFormNuevo(false)}>✕</button>
            </div>
            <div className="nuevo-form-grid">
              <div className="form-field form-field--full">
                <label style={{display:'flex',alignItems:'center',gap:8}}>
                  <input type="checkbox" checked={nuevoPedido.sinCuenta}
                    onChange={e => setNuevoPedido(p => ({...p, sinCuenta: e.target.checked}))} />
                  Pedido por teléfono (sin cuenta registrada)
                </label>
              </div>
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
                <label>Distrito</label>
                <select value={nuevoPedido.distrito}
                  onChange={e => setNuevoPedido(p => ({...p, distrito: e.target.value}))}>
                  <option value="">— Seleccionar —</option>
                  {zonas.map(z => (
                    <option key={z.id} value={z.nombre}>{z.nombre} · S/ {z.costo} · ~{z.tiempo}min</option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label>Método de pago</label>
                <select value={nuevoPedido.metodoPago}
                  onChange={e => setNuevoPedido(p => ({...p, metodoPago: e.target.value}))}>
                  <option>Efectivo</option><option>Yape</option><option>Tarjeta</option><option>Plin</option>
                </select>
              </div>
              <div className="form-field form-field--full">
                <label>Notas del cliente (opcional)</label>
                <input placeholder="Sin cebolla, tocar timbre, piso 3…" value={nuevoPedido.notas}
                  onChange={e => setNuevoPedido(p => ({...p, notas: e.target.value}))} />
              </div>
              <div className="form-field">
                <label>Descuento (S/)</label>
                <input type="number" min="0" placeholder="0" value={nuevoPedido.descuento}
                  onChange={e => setNuevoPedido(p => ({...p, descuento: e.target.value}))} />
              </div>
            </div>

            <div className="nuevo-items-section">
              <p className="nuevo-items-title">Ítems del pedido</p>
              <div className="nuevo-item-row">
                <input placeholder="Nombre del plato" value={nuevoItem.nombre}
                  onChange={e => setNuevoItem(i => ({...i, nombre: e.target.value}))} />
                <input type="number" min="1" placeholder="Cant." value={nuevoItem.qty}
                  onChange={e => setNuevoItem(i => ({...i, qty: Number(e.target.value)}))} style={{width:70}} />
                <input type="number" placeholder="Precio unit." value={nuevoItem.precio}
                  onChange={e => setNuevoItem(i => ({...i, precio: e.target.value}))} style={{width:110}} />
                <button className="btn-add-item" onClick={agregarItemNuevo}>+</button>
              </div>
              {nuevoPedido.items.length > 0 && (
                <div className="nuevo-items-lista">
                  {nuevoPedido.items.map((it, i) => (
                    <div key={i} className="nuevo-item-preview">
                      <span>{it.nombre}</span><span>×{it.qty}</span>
                      <span>S/ {(it.precio * it.qty).toFixed(2)}</span>
                      <button onClick={() => setNuevoPedido(p => ({...p, items: p.items.filter((_,j)=>j!==i)}))}>✕</button>
                    </div>
                  ))}
                  <div className="nuevo-items-total">
                    {(() => {
                      const sub  = nuevoPedido.items.reduce((s,i) => s + i.precio * i.qty, 0);
                      const zona = zonas.find(z => z.nombre === nuevoPedido.distrito);
                      const env  = zona ? zona.costo : 0;
                      const desc = Number(nuevoPedido.descuento || 0);
                      return (
                        <>
                          <span>Subtotal: S/ {sub.toFixed(2)}</span>
                          {env > 0 && <span>+ Envío: S/ {env.toFixed(2)}</span>}
                          {desc > 0 && <span>− Desc: S/ {desc.toFixed(2)}</span>}
                          <strong>Total: S/ {(sub + env - desc).toFixed(2)}</strong>
                        </>
                      );
                    })()}
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

      {/* ══════════════════ MODAL REPORTE ══════════════════ */}
      {mostrarReporte && (
        <div className="modal-overlay" onClick={() => setMostrarReporte(false)}>
          <div className="modal-reporte" onClick={e => e.stopPropagation()}>
            <div className="modal-detalle__header">
              <div>
                <span className="delivery-eyebrow">HOY</span>
                <h3 className="modal-detalle__nombre">Reporte del día</h3>
              </div>
              <button className="modal-close" onClick={() => setMostrarReporte(false)}>✕</button>
            </div>

            {/* KPIs */}
            <div className="reporte-kpis">
              {[
                { label:'Total pedidos',   val: reporte.totalPedidos },
                { label:'Entregados',      val: reporte.entregados },
                { label:'Cancelados',      val: reporte.cancelados },
                { label:'En proceso',      val: reporte.enProceso },
              ].map(k => (
                <div key={k.label} className="reporte-kpi">
                  <span className="reporte-kpi__val">{k.val}</span>
                  <span className="reporte-kpi__lbl">{k.label}</span>
                </div>
              ))}
              <div className="reporte-kpi reporte-kpi--wide">
                <span className="reporte-kpi__val">S/ {reporte.ingresosBrutos.toFixed(2)}</span>
                <span className="reporte-kpi__lbl">Ingresos totales</span>
              </div>
              <div className="reporte-kpi reporte-kpi--wide">
                <span className="reporte-kpi__val">S/ {reporte.ticketPromedio.toFixed(2)}</span>
                <span className="reporte-kpi__lbl">Ticket promedio</span>
              </div>
            </div>

            <div className="reporte-cols">
              {/* Por método de pago */}
              <div className="reporte-bloque">
                <p className="reporte-bloque__title">Por método de pago</p>
                {reporte.porMetodo.map(m => (
                  <div key={m.metodo} className="reporte-fila">
                    <span>{METODO_CONFIG[m.metodo]?.icon} {m.metodo}</span>
                    <span className="reporte-fila__count">{m.count} pedidos</span>
                    <span className="reporte-fila__total">S/ {m.total.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Por distrito */}
              <div className="reporte-bloque">
                <p className="reporte-bloque__title">Por distrito</p>
                {reporte.porDistrito.map(d => (
                  <div key={d.distrito} className="reporte-fila">
                    <span>📍 {d.distrito}</span>
                    <span className="reporte-fila__count">{d.count} pedidos</span>
                    <span className="reporte-fila__total">S/ {d.total.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Por repartidor */}
            <div className="reporte-bloque" style={{margin:'0 24px 24px'}}>
              <p className="reporte-bloque__title">Por repartidor</p>
              {reporte.porRepartidor.map(({rep, count, entregados}) => (
                <div key={rep.id} className="reporte-fila">
                  <span>🛵 {rep.nombre}</span>
                  <span className="reporte-fila__count">{count} asignados</span>
                  <span className="reporte-fila__total">{entregados} entregados</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}