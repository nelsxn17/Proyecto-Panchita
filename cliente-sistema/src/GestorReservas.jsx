import { useEffect, useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import './GestorReservas.css';

// ─── Helpers ────────────────────────────────────────────────────────────────
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
               'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DIAS_CORTOS = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];

function getDiasDelMes(year, month) {
  const primer = new Date(year, month, 1).getDay();
  const total  = new Date(year, month + 1, 0).getDate();
  return { primer, total };
}

// ─── Componente principal ────────────────────────────────────────────────────
const GestorReservas = () => {
    const [reservas, setReservas]               = useState([]);
    const [reservaEditando, setReservaEditando] = useState(null);
    const [historialCliente, setHistorialCliente] = useState(null);
    const [drawerCliente, setDrawerCliente]     = useState(null);

    // Vistas
    const [vista, setVista] = useState('tabla'); // 'tabla' | 'calendario'

    // Filtros
    const [busqueda, setBusqueda]         = useState('');
    const [filtroEstado, setFiltroEstado] = useState('');
    const [filtroMesa, setFiltroMesa]     = useState('');
    const [filtroFecha, setFiltroFecha]   = useState('');

    // Orden
    const [orden, setOrden] = useState({ col: 'fecha', dir: 'asc' });

    // Columnas visibles
    const COLS_DISPONIBLES = ['Código','Cliente','Mesa','Fecha','Estado','Pago','Acción'];
    const [colsVisibles, setColsVisibles] = useState(new Set(COLS_DISPONIBLES));
    const [showColsMenu, setShowColsMenu] = useState(false);

    // Calendario
    const hoy = new Date();
    const [calYear, setCalYear]   = useState(hoy.getFullYear());
    const [calMonth, setCalMonth] = useState(hoy.getMonth());

    // ── Carga ────────────────────────────────────────────────────────────────
    const cargarReservas = () => {
        fetch('http://localhost:8080/api/reservas')
            .then(res => res.json())
            .then(data => setReservas(data))
            .catch(err => console.error('Error al cargar:', err));
    };
    useEffect(() => { cargarReservas(); }, []);

    // ── Stats (mini resumen) ─────────────────────────────────────────────────
    const stats = useMemo(() => {
        const total       = reservas.length;
        const confirmadas = reservas.filter(r => r.estadoReserva === 'confirmada').length;
        const pendPago    = reservas.filter(r => r.estadoPago === 'pendiente').length;
        // mesa más usada
        const conteo = {};
        reservas.forEach(r => {
            const m = r.mesa?.numero;
            if (m) conteo[m] = (conteo[m] || 0) + 1;
        });
        const mesaTop = Object.entries(conteo).sort((a,b) => b[1]-a[1])[0];
        return { total, confirmadas, pendPago, mesaTop: mesaTop ? `Mesa ${mesaTop[0]}` : '—' };
    }, [reservas]);

    // ── Filtrado + ordenamiento ──────────────────────────────────────────────
    const reservasFiltradas = useMemo(() => {
        let lista = reservas.filter(r => {
            const matchCodigo  = r.codigoReserva?.toLowerCase().includes(busqueda.toLowerCase());
            const matchCliente = r.usuario?.nombre?.toLowerCase().includes(busqueda.toLowerCase());
            const matchEstado  = !filtroEstado || r.estadoReserva === filtroEstado;
            const matchMesa    = !filtroMesa   || String(r.mesa?.numero) === filtroMesa;
            const matchFecha   = !filtroFecha  || r.fecha === filtroFecha;
            return (matchCodigo || matchCliente) && matchEstado && matchMesa && matchFecha;
        });

        lista = [...lista].sort((a, b) => {
            let va = a[orden.col] ?? '';
            let vb = b[orden.col] ?? '';
            if (orden.col === 'mesa') { va = a.mesa?.numero ?? ''; vb = b.mesa?.numero ?? ''; }
            if (orden.col === 'cliente') { va = a.usuario?.nombre ?? ''; vb = b.usuario?.nombre ?? ''; }
            if (va < vb) return orden.dir === 'asc' ? -1 : 1;
            if (va > vb) return orden.dir === 'asc' ?  1 : -1;
            return 0;
        });
        return lista;
    }, [reservas, busqueda, filtroEstado, filtroMesa, filtroFecha, orden]);

    const toggleOrden = (col) => {
        setOrden(prev => prev.col === col
            ? { col, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
            : { col, dir: 'asc' }
        );
    };

    const iconOrden = (col) => {
        if (orden.col !== col) return ' ↕';
        return orden.dir === 'asc' ? ' ↑' : ' ↓';
    };

    // ── Edición ──────────────────────────────────────────────────────────────
    const iniciarEdicion = (reserva) => {
        const fechaCombinada = `${reserva.fecha}T${reserva.hora.substring(0, 5)}`;
        setReservaEditando({
            ...reserva,
            fechaCompleta: fechaCombinada,
            mesaId: reserva.mesa?.id || ''
        });
    };

    const guardarEdicion = (e) => {
        e.preventDefault();
        const [fecha, hora] = reservaEditando.fechaCompleta.split('T');
        const datosActualizados = {
            fecha,
            hora: hora.length === 5 ? hora + ':00' : hora,
            estadoReserva: reservaEditando.estadoReserva,
            observaciones: reservaEditando.observaciones,
            mesa: { id: parseInt(reservaEditando.mesaId) }
        };
        fetch(`http://localhost:8080/api/reservas/${reservaEditando.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosActualizados)
        })
        .then(r => { if (!r.ok) throw new Error('Error en la actualización'); return r.json(); })
        .then(() => { setReservaEditando(null); cargarReservas(); })
        .catch(err => console.error('Error al guardar:', err));
    };

    // ── Estado de pago ───────────────────────────────────────────────────────
    const cambiarEstado = (id, nuevoEstado) => {
        fetch(`http://localhost:8080/api/reservas/${id}/estado`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado: nuevoEstado })
        }).then(() => cargarReservas());
    };

    // ── Eliminar ─────────────────────────────────────────────────────────────
    const eliminarReserva = (id) => {
        if (!window.confirm('¿Estás seguro de que deseas eliminar esta reserva?')) return;
        fetch(`http://localhost:8080/api/reservas/${id}`, { method: 'DELETE' })
            .then(r => { if (r.ok) cargarReservas(); else alert('Error al eliminar la reserva'); })
            .catch(err => console.error('Error:', err));
    };

    // ── Historial cliente ────────────────────────────────────────────────────
    const verHistorial = (reserva) => {
        const usuarioId = reserva.usuario?.id;
        if (!usuarioId) return;
        fetch(`http://localhost:8080/api/reservas?usuarioId=${usuarioId}`)
            .then(res => res.json())
            .then(data => {
                setHistorialCliente(data);
                setDrawerCliente(reserva.usuario?.nombre);
            })
            .catch(() => {
                // fallback: filtrar localmente si el backend no soporta el query
                const local = reservas.filter(r => r.usuario?.id === usuarioId);
                setHistorialCliente(local);
                setDrawerCliente(reserva.usuario?.nombre);
            });
    };

    // ── Exportar Excel ───────────────────────────────────────────────────────
    const exportarExcel = () => {
        const datos = reservasFiltradas.map(r => ({
            Código:        r.codigoReserva,
            Cliente:       r.usuario?.nombre ?? '',
            Mesa:          r.mesa?.numero ?? '',
            Fecha:         r.fecha,
            Hora:          r.hora,
            'Est. Reserva': r.estadoReserva,
            'Est. Pago':   r.estadoPago,
            Observaciones: r.observaciones ?? ''
        }));
        const ws = XLSX.utils.json_to_sheet(datos);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Reservas');
        XLSX.writeFile(wb, 'reservas_panchita.xlsx');
    };

    // ── Columnas configurables ────────────────────────────────────────────────
    const toggleCol = (col) => {
        setColsVisibles(prev => {
            const next = new Set(prev);
            next.has(col) ? next.delete(col) : next.add(col);
            return next;
        });
    };

    // ── Calendario ───────────────────────────────────────────────────────────
    const { primer, total } = getDiasDelMes(calYear, calMonth);
    const reservasPorDia = useMemo(() => {
        const map = {};
        reservas.forEach(r => {
            if (!r.fecha) return;
            const [y, m, d] = r.fecha.split('-').map(Number);
            if (y === calYear && m - 1 === calMonth) {
                if (!map[d]) map[d] = [];
                map[d].push(r);
            }
        });
        return map;
    }, [reservas, calYear, calMonth]);

    const celdas = [];
    for (let i = 0; i < primer; i++) celdas.push(null);
    for (let d = 1; d <= total; d++) celdas.push(d);

    // ─────────────────────────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="gestor-reservas-wrapper">
            <h2 className="gestor-titulo">Gestión de Reservas — La Panchita</h2>

            {/* ── STATS ── */}
            <div className="stats-grid">
                <div className="stat-card">
                    <span className="stat-label">Total reservas</span>
                    <span className="stat-valor">{stats.total}</span>
                </div>
                <div className="stat-card">
                    <span className="stat-label">Confirmadas</span>
                    <span className="stat-valor stat-ok">
                        {stats.confirmadas}
                        <small> ({stats.total ? Math.round(stats.confirmadas / stats.total * 100) : 0}%)</small>
                    </span>
                </div>
                <div className="stat-card">
                    <span className="stat-label">Pago pendiente</span>
                    <span className="stat-valor stat-warn">{stats.pendPago}</span>
                </div>
                <div className="stat-card">
                    <span className="stat-label">Mesa más solicitada</span>
                    <span className="stat-valor">{stats.mesaTop}</span>
                </div>
            </div>

            {/* ── BARRA DE HERRAMIENTAS ── */}
            <div className="toolbar">
                <div className="toolbar-izq">
                    <input
                        type="text"
                        placeholder="Buscar por código o cliente..."
                        className="input-filtro"
                        value={busqueda}
                        onChange={e => setBusqueda(e.target.value)}
                    />
                    <select className="input-filtro" value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
                        <option value="">Todos los estados</option>
                        <option value="confirmada">Confirmada</option>
                        <option value="cancelada">Cancelada</option>
                        <option value="asistió">Asistió</option>
                    </select>
                    <input
                        type="number"
                        placeholder="Mesa #"
                        className="input-filtro input-mesa"
                        value={filtroMesa}
                        onChange={e => setFiltroMesa(e.target.value)}
                    />
                    <input
                        type="date"
                        className="input-filtro"
                        value={filtroFecha}
                        onChange={e => setFiltroFecha(e.target.value)}
                    />
                </div>
                <div className="toolbar-der">
                    {/* Toggle vista */}
                    <div className="toggle-vista">
                        <button
                            className={`btn-vista ${vista === 'tabla' ? 'activo' : ''}`}
                            onClick={() => setVista('tabla')}
                            title="Vista tabla"
                        >☰ Tabla</button>
                        <button
                            className={`btn-vista ${vista === 'calendario' ? 'activo' : ''}`}
                            onClick={() => setVista('calendario')}
                            title="Vista calendario"
                        >📅 Calendario</button>
                    </div>

                    {/* Columnas */}
                    <div className="cols-menu-wrap">
                        <button className="btn-accion" onClick={() => setShowColsMenu(v => !v)}>
                            ⚙ Columnas
                        </button>
                        {showColsMenu && (
                            <div className="cols-dropdown">
                                {COLS_DISPONIBLES.map(col => (
                                    <label key={col} className="cols-item">
                                        <input
                                            type="checkbox"
                                            checked={colsVisibles.has(col)}
                                            onChange={() => toggleCol(col)}
                                        />
                                        {col}
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Exportar */}
                    <button className="btn-exportar" onClick={exportarExcel}>
                        ⬇ Exportar Excel
                    </button>
                </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════ */}
            {/* VISTA TABLA                                                    */}
            {/* ══════════════════════════════════════════════════════════════ */}
            {vista === 'tabla' && (
                <table className="tabla-reservas-panchita">
                    <thead>
                        <tr>
                            {colsVisibles.has('Código')  && <th onClick={() => toggleOrden('codigoReserva')} className="th-sortable">Código{iconOrden('codigoReserva')}</th>}
                            {colsVisibles.has('Cliente') && <th onClick={() => toggleOrden('cliente')} className="th-sortable">Cliente{iconOrden('cliente')}</th>}
                            {colsVisibles.has('Mesa')    && <th onClick={() => toggleOrden('mesa')} className="th-sortable">Mesa{iconOrden('mesa')}</th>}
                            {colsVisibles.has('Fecha')   && <th onClick={() => toggleOrden('fecha')} className="th-sortable">Fecha{iconOrden('fecha')}</th>}
                            {colsVisibles.has('Estado')  && <th>Estado</th>}
                            {colsVisibles.has('Pago')    && <th>Pago</th>}
                            {colsVisibles.has('Acción')  && <th>Acción</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {reservasFiltradas.length === 0 && (
                            <tr><td colSpan={colsVisibles.size} className="td-vacio">Sin resultados para los filtros aplicados.</td></tr>
                        )}
                        {reservasFiltradas.map(r => (
                            <tr key={r.id}>
                                {colsVisibles.has('Código')  && <td>{r.codigoReserva}</td>}
                                {colsVisibles.has('Cliente') && (
                                    <td>
                                        <button className="btn-cliente" onClick={() => verHistorial(r)}>
                                            {r.usuario?.nombre}
                                        </button>
                                    </td>
                                )}
                                {colsVisibles.has('Mesa')    && <td>{r.mesa?.numero ?? 'N/A'}</td>}
                                {colsVisibles.has('Fecha')   && <td>{r.fecha}</td>}
                                {colsVisibles.has('Estado')  && (
                                    <td><span className={`badge badge-${r.estadoReserva?.toLowerCase()}`}>{r.estadoReserva}</span></td>
                                )}
                                {colsVisibles.has('Pago') && (
                                    <td>
                                        {r.estadoPago === 'pendiente'
                                            ? <button className="btn-pago" onClick={() => cambiarEstado(r.id, 'pagado')}>💰 Pagar</button>
                                            : <span className="badge badge-pagado">{r.estadoPago}</span>
                                        }
                                    </td>
                                )}
                                {colsVisibles.has('Acción') && (
                                    <td className="td-acciones">
                                        <button className="btn-accion" onClick={() => iniciarEdicion(r)}>✏️ Editar</button>
                                        <button className="btn-accion btn-eliminar" onClick={() => eliminarReserva(r.id)}>🗑️ Eliminar</button>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {/* ══════════════════════════════════════════════════════════════ */}
            {/* VISTA CALENDARIO                                               */}
            {/* ══════════════════════════════════════════════════════════════ */}
            {vista === 'calendario' && (
                <div className="calendario-wrap">
                    <div className="cal-header">
                        <button className="btn-accion" onClick={() => {
                            if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
                            else setCalMonth(m => m - 1);
                        }}>← Anterior</button>
                        <h3 className="cal-titulo">{MESES[calMonth]} {calYear}</h3>
                        <button className="btn-accion" onClick={() => {
                            if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
                            else setCalMonth(m => m + 1);
                        }}>Siguiente →</button>
                    </div>

                    <div className="cal-grid">
                        {DIAS_CORTOS.map(d => (
                            <div key={d} className="cal-dia-nombre">{d}</div>
                        ))}
                        {celdas.map((dia, i) => {
                            if (!dia) return <div key={`v-${i}`} className="cal-celda cal-vacia" />;
                            const rsv = reservasPorDia[dia] || [];
                            const esHoy = dia === hoy.getDate() && calMonth === hoy.getMonth() && calYear === hoy.getFullYear();
                            return (
                                <div key={dia} className={`cal-celda ${esHoy ? 'cal-hoy' : ''}`}>
                                    <span className="cal-num">{dia}</span>
                                    {rsv.slice(0, 3).map(r => (
                                        <div key={r.id} className={`cal-evento badge-${r.estadoReserva?.toLowerCase()}`} title={`${r.codigoReserva} — ${r.usuario?.nombre}`}>
                                            {r.hora?.substring(0,5)} {r.usuario?.nombre?.split(' ')[0]}
                                        </div>
                                    ))}
                                    {rsv.length > 3 && <div className="cal-mas">+{rsv.length - 3} más</div>}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════ */}
            {/* MODAL EDICIÓN                                                  */}
            {/* ══════════════════════════════════════════════════════════════ */}
            {reservaEditando && (
                <div className="modal-overlay">
                    <form className="modal-contenido" onSubmit={guardarEdicion}>
                        <h3>Editar Reserva: {reservaEditando.codigoReserva}</h3>
                        <label>Fecha y Hora:</label>
                        <input type="datetime-local" value={reservaEditando.fechaCompleta}
                            onChange={e => setReservaEditando({...reservaEditando, fechaCompleta: e.target.value})} />
                        <label>Mesa ID:</label>
                        <input type="number" value={reservaEditando.mesaId || ''}
                            onChange={e => setReservaEditando({...reservaEditando, mesaId: e.target.value})} />
                        <label>Estado Reserva:</label>
                        <select value={reservaEditando.estadoReserva}
                            onChange={e => setReservaEditando({...reservaEditando, estadoReserva: e.target.value})}>
                            <option value="confirmada">Confirmada</option>
                            <option value="cancelada">Cancelada</option>
                            <option value="asistió">Asistió</option>
                        </select>
                        <label>Observaciones:</label>
                        <textarea value={reservaEditando.observaciones || ''}
                            onChange={e => setReservaEditando({...reservaEditando, observaciones: e.target.value})} />
                        <div className="modal-botones">
                            <button type="submit" className="btn-pago">Guardar Cambios</button>
                            <button type="button" className="btn-accion" onClick={() => setReservaEditando(null)}>Cancelar</button>
                        </div>
                    </form>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════ */}
            {/* DRAWER HISTORIAL CLIENTE                                       */}
            {/* ══════════════════════════════════════════════════════════════ */}
            {drawerCliente && (
                <div className="drawer-overlay" onClick={() => setDrawerCliente(null)}>
                    <div className="drawer-contenido" onClick={e => e.stopPropagation()}>
                        <div className="drawer-header">
                            <h3>Historial de {drawerCliente}</h3>
                            <button className="btn-cerrar-drawer" onClick={() => setDrawerCliente(null)}>✕</button>
                        </div>
                        <div className="drawer-body">
                            {historialCliente?.length === 0 && <p style={{color:'#64748b'}}>Sin reservas anteriores.</p>}
                            {historialCliente?.map(r => (
                                <div key={r.id} className="historial-item">
                                    <div className="historial-codigo">{r.codigoReserva}</div>
                                    <div className="historial-meta">
                                        {r.fecha} · Mesa {r.mesa?.numero ?? 'N/A'}
                                    </div>
                                    <span className={`badge badge-${r.estadoReserva?.toLowerCase()}`}>{r.estadoReserva}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GestorReservas;