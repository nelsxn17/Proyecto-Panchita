import React, { useState, useEffect, useMemo } from 'react';
import './GestionMesas.css';
import { MesaPlano } from './MesaPlano';
import './MesaPlano.css';

export default function GestionMesas() {
  const [salas, setSalas] = useState([]);
  const [nuevaSala, setNuevaSala] = useState({ nombre: '', capacidadTotal: 50, descripcion: '' });
  const [mensajeSala, setMensajeSala] = useState({ texto: '', tipo: '' });

  const [mesasAdmin, setMesasAdmin] = useState([]);
  const [cargandoMesas, setCargandoMesas] = useState(false);
  const [nuevaMesa, setNuevaMesa] = useState({ salaId: '', numero: '', capacidad: 4, ubicacion: '' });
  const [mensajeMesa, setMensajeMesa] = useState({ texto: '', tipo: '' });
  const [guardandoMesa, setGuardandoMesa] = useState(false);

  // --- NUEVOS ESTADOS PARA FILTRO Y BÚSQUEDA ---
  const [filtroSalaId, setFiltroSalaId] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [mesaAEliminar, setMesaAEliminar] = useState(null); // { id, numero }

  const cargarInfraestructura = () => {
    fetch('http://localhost:8080/api/salas')
      .then(res => {
        if (!res.ok) throw new Error('Ruta no encontrada o error en servidor');
        return res.json();
      })
      .then(data => {
        const salasArreglo = Array.isArray(data) ? data : [];
        setSalas(salasArreglo);
        if (salasArreglo.length > 0) {
          setNuevaMesa(prev => ({ ...prev, salaId: salasArreglo[0].id }));
        }
      })
      .catch(err => {
        console.error("Error al recuperar las salas:", err);
        setSalas([]);
      });

    setCargandoMesas(true);
    fetch('http://localhost:8080/api/mesas')
      .then(res => res.json())
      .then(data => {
        setMesasAdmin(data);
        setCargandoMesas(false);
      })
      .catch(err => {
        console.error("Error al recuperar las mesas:", err);
        setCargandoMesas(false);
      });
  };

  useEffect(() => {
    cargarInfraestructura();
  }, []);

  // --- ESTADÍSTICAS EN VIVO ---
  const stats = useMemo(() => {
    const libres    = mesasAdmin.filter(m => m.estado === 'disponible').length;
    const ocupadas  = mesasAdmin.filter(m => m.estado === 'ocupada').length;
    const reservadas = mesasAdmin.filter(m => m.estado === 'reservada').length;
    const total = mesasAdmin.length;

    const capacidadOcupada = mesasAdmin
      .filter(m => m.estado === 'ocupada')
      .reduce((acc, m) => acc + (m.capacidad || 0), 0);
    const capacidadTotal = mesasAdmin.reduce((acc, m) => acc + (m.capacidad || 0), 0);

    return { libres, ocupadas, reservadas, total, capacidadOcupada, capacidadTotal };
  }, [mesasAdmin]);

  // --- MESAS FILTRADAS (por sala + búsqueda) ---
  const mesasFiltradas = useMemo(() => {
    return mesasAdmin.filter(m => {
      const coincideSala   = !filtroSalaId || String(m.salaId) === String(filtroSalaId);
      const coincideBusqueda = !busqueda || String(m.numero).toLowerCase().includes(busqueda.toLowerCase());
      return coincideSala && coincideBusqueda;
    });
  }, [mesasAdmin, filtroSalaId, busqueda]);

  const procesarRegistroSala = (e) => {
    e.preventDefault();
    if (!nuevaSala.nombre.trim()) {
      setMensajeSala({ texto: 'El nombre de la sala es obligatorio.', tipo: 'error' });
      return;
    }
    fetch('http://localhost:8080/api/salas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: nuevaSala.nombre,
        capacidadTotal: Number(nuevaSala.capacidadTotal),
        estado: 'activo',
        descripcion: nuevaSala.descripcion
      })
    })
    .then(res => {
      if (!res.ok) throw new Error('Error en el servidor');
      return res.json();
    })
    .then(data => {
      setMensajeSala({ texto: `Área "${data.nombre}" creada correctamente.`, tipo: 'exito' });
      setNuevaSala({ nombre: '', capacidadTotal: 50, descripcion: '' });
      cargarInfraestructura();
      setTimeout(() => setMensajeSala({ texto: '', tipo: '' }), 4000);
    })
    .catch(() => setMensajeSala({ texto: 'Error de comunicación al intentar crear la sala.', tipo: 'error' }));
  };

  const procesarRegistroMesa = (e) => {
    e.preventDefault();
    if (!nuevaMesa.numero.trim() || !nuevaMesa.salaId) {
      setMensajeMesa({ texto: 'Por favor, ingresa el identificador y selecciona una sala.', tipo: 'error' });
      return;
    }
    setGuardandoMesa(true);
    setMensajeMesa({ texto: '', tipo: '' });

    fetch('http://localhost:8080/api/mesas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        salaId: Number(nuevaMesa.salaId),
        numero: nuevaMesa.numero,
        capacidad: Number(nuevaMesa.capacidad),
        estado: 'disponible',
        ubicacion: nuevaMesa.ubicacion
      })
    })
    .then(res => {
      if (!res.ok) throw new Error('Fallo del servidor');
      return res.json();
    })
    .then(data => {
      setMensajeMesa({ texto: `Mesa ${data.numero} instalada con éxito.`, tipo: 'exito' });
      setNuevaMesa(prev => ({ ...prev, numero: '', ubicacion: '' }));
      setGuardandoMesa(false);
      cargarInfraestructura();
      setTimeout(() => setMensajeMesa({ texto: '', tipo: '' }), 4000);
    })
    .catch(() => {
      setMensajeMesa({ texto: 'Fallo al guardar la mesa. Verifica la base de datos.', tipo: 'error' });
      setGuardandoMesa(false);
    });
  };

  const alternarEstadoMesa = (mesaId, estadoActual) => {
    let siguienteEstado = 'disponible';
    if (estadoActual === 'disponible') siguienteEstado = 'ocupada';
    else if (estadoActual === 'ocupada') siguienteEstado = 'reservada';

    fetch(`http://localhost:8080/api/mesas/${mesaId}/estado`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: siguienteEstado })
    })
    .then(res => res.json())
    .then(() => cargarInfraestructura())
    .catch(err => console.error(err));
  };

  // --- NUEVA: ELIMINAR MESA ---
  const confirmarEliminacion = (mesa) => {
    setMesaAEliminar(mesa);
  };

  const ejecutarEliminacion = () => {
    if (!mesaAEliminar) return;
    fetch(`http://localhost:8080/api/mesas/${mesaAEliminar.id}`, { method: 'DELETE' })
      .then(res => {
        if (!res.ok) throw new Error('Error al eliminar');
        cargarInfraestructura();
        setMesaAEliminar(null);
      })
      .catch(err => {
        console.error(err);
        setMesaAEliminar(null);
      });
  };

  const porcentajeOcupado = stats.capacidadTotal > 0
    ? Math.round((stats.capacidadOcupada / stats.capacidadTotal) * 100)
    : 0;

  return (
    <div className="management-box-view">
      <div className="view-header">
        <h1>Infraestructura y Configuración del Local</h1>
        <p>Registra las áreas de tu restaurante y gestiona el estado operativo de las mesas desde una interfaz unificada.</p>
      </div>

      {/* FORMULARIO INLINE DE SALA */}
      <div className="sala-form-card">
        <h3>🏗️ Registrar nueva área / sala del restaurante</h3>
        <form onSubmit={procesarRegistroSala} className="sala-inline-form">
          {mensajeSala.texto && (
            <div className={`form-alert-message ${mensajeSala.tipo}`} style={{ gridColumn: '1 / -1' }}>
              {mensajeSala.texto}
            </div>
          )}
          <div className="fg">
            <label>Nombre de la sala / zona</label>
            <input
              type="text"
              value={nuevaSala.nombre}
              onChange={e => setNuevaSala({...nuevaSala, nombre: e.target.value})}
              placeholder="Ej: Salón Principal, Terraza, VIP"
            />
          </div>
          <div className="fg fg--narrow">
            <label>Capacidad total</label>
            <input
              type="number"
              value={nuevaSala.capacidadTotal}
              onChange={e => setNuevaSala({...nuevaSala, capacidadTotal: e.target.value})}
            />
          </div>
          <div className="fg fg--wide">
            <label>Descripción / características</label>
            <input
              type="text"
              value={nuevaSala.descripcion}
              onChange={e => setNuevaSala({...nuevaSala, descripcion: e.target.value})}
              placeholder="Ej: Zona familiar con aire acondicionado"
            />
          </div>
          <button type="submit" className="btn-submit-premium btn-inline">
            + Crear sala
          </button>
        </form>
      </div>

      {/* LAYOUT DOBLE */}
      <div className="dashboard-double-layout">

        {/* COLUMNA IZQUIERDA: MAPA */}
        <div className="analytics-main-box">
          <span className="section-label">Mapa operativo del salón</span>

          {/* ESTADÍSTICAS EN VIVO */}
          <div className="stats-summary">
            <div className="stat-item libres">
              <div className="stat-label">Libres</div>
              <div className="stat-value">{stats.libres}</div>
            </div>
            <div className="stat-item ocupadas">
              <div className="stat-label">Ocupadas</div>
              <div className="stat-value">{stats.ocupadas}</div>
            </div>
            <div className="stat-item reservadas">
              <div className="stat-label">Reservadas</div>
              <div className="stat-value">{stats.reservadas}</div>
            </div>
            <div className="stat-item total">
              <div className="stat-label">Total</div>
              <div className="stat-value">{stats.total}</div>
            </div>
          </div>

          {/* BARRA DE CAPACIDAD */}
          {stats.capacidadTotal > 0 && (
            <div className="capacidad-bar-wrap">
              <div className="capacidad-bar-header">
                <span>Capacidad ocupada</span>
                <span>{stats.capacidadOcupada} / {stats.capacidadTotal} comensales · {porcentajeOcupado}%</span>
              </div>
              <div className="capacidad-bar-track">
                <div
                  className="capacidad-bar-fill"
                  style={{ width: `${porcentajeOcupado}%` }}
                />
              </div>
            </div>
          )}

          {/* FILTRO POR SALA + BÚSQUEDA */}
          <div className="mapa-toolbar">
            <select
              value={filtroSalaId}
              onChange={e => setFiltroSalaId(e.target.value)}
              className="toolbar-select"
            >
              <option value="">Todas las salas</option>
              {salas.map(s => (
                <option key={s.id} value={s.id}>{s.nombre} (ID: {s.id})</option>
              ))}
            </select>
            <input
              type="text"
              className="toolbar-search"
              placeholder="Buscar por N° de mesa..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
            />
          </div>

          {/* LEYENDA */}
          <div className="mesas-leyenda">
            <div className="leyenda-item"><div className="leyenda-dot libre" />Libre</div>
            <div className="leyenda-item"><div className="leyenda-dot ocupada" />Ocupada</div>
            <div className="leyenda-item"><div className="leyenda-dot reservada" />Reservada</div>
            <span className="leyenda-hint">Clic para cambiar estado · hover para eliminar</span>
          </div>

          {/* GRID DE MESAS */}
          <div className="mesas-operativas-panel">
            {cargandoMesas ? (
              <div className="loading-text">Consultando distribución con el servidor...</div>
            ) : mesasFiltradas.length === 0 ? (
              <div className="empty-state-panel">
                {mesasAdmin.length === 0
                  ? 'No hay mobiliario registrado. Crea un área y luego añade tus mesas.'
                  : 'Ninguna mesa coincide con el filtro aplicado.'}
              </div>
            ) : (
              mesasFiltradas.map((mesa) => (
                <MesaPlano
                  key={mesa.id}
                  mesa={mesa}
                  onClick={alternarEstadoMesa}
                  onDelete={confirmarEliminacion}
                />
              ))
            )}
          </div>
        </div>

        {/* COLUMNA DERECHA: FORMULARIO */}
        <div className="form-container-premium">
          <span className="section-label">Instalar nueva mesa</span>
          <form onSubmit={procesarRegistroMesa} className="premium-admin-form">
            {mensajeMesa.texto && (
              <div className={`form-alert-message ${mensajeMesa.tipo}`}>
                {mensajeMesa.texto}
              </div>
            )}

            <div className="form-group-row">
              <label>Seleccionar área de destino</label>
              <select
                value={nuevaMesa.salaId}
                onChange={e => setNuevaMesa({...nuevaMesa, salaId: e.target.value})}
              >
                {salas.length === 0 ? (
                  <option value="">⚠️ Registra primero una sala</option>
                ) : (
                  salas.map(s => (
                    <option key={s.id} value={s.id}>{s.nombre} (ID: {s.id})</option>
                  ))
                )}
              </select>
            </div>

            <div className="form-group-row">
              <label>Código o número de mesa</label>
              <input
                type="text"
                value={nuevaMesa.numero}
                onChange={e => setNuevaMesa({...nuevaMesa, numero: e.target.value})}
                placeholder="Ej: 02"
                maxLength={10}
              />
            </div>

            <div className="form-group-row">
              <label>Capacidad máxima de comensales</label>
              <select
                value={nuevaMesa.capacidad}
                onChange={e => setNuevaMesa({...nuevaMesa, capacidad: Number(e.target.value)})}
              >
                <option value={2}>2 Personas (Mesa Pequeña)</option>
                <option value={4}>4 Personas (Mesa Mediana)</option>
                <option value={6}>6 Personas (Mesa Familiar)</option>
              </select>
            </div>

            <div className="form-group-row">
              <label>Ubicación específica (Opcional)</label>
              <input
                type="text"
                value={nuevaMesa.ubicacion}
                onChange={e => setNuevaMesa({...nuevaMesa, ubicacion: e.target.value})}
                placeholder="Ej: Junto a la ventana principal"
              />
            </div>

            <button
              type="submit"
              className="btn-submit-premium"
              disabled={guardandoMesa || salas.length === 0}
            >
              {guardandoMesa ? 'Guardando...' : '+ Dar de alta mesa'}
            </button>
          </form>
        </div>
      </div>

      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
      {mesaAEliminar && (
        <div className="modal-overlay" onClick={() => setMesaAEliminar(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h4>Eliminar mesa {mesaAEliminar.numero}</h4>
            <p>Esta acción no se puede deshacer. ¿Confirmas que deseas eliminar esta mesa del sistema?</p>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setMesaAEliminar(null)}>Cancelar</button>
              <button className="btn-danger" onClick={ejecutarEliminacion}>Sí, eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}