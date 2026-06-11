import React, { useState, useEffect } from 'react'; // 👈 Añadido useEffect para la carga dinámica
import './FormularioReserva.css';
import ModalPago from './ModalPago'; 

import imgMesa2P from './assets/mesa.webp'; 
import imgMesa4P from './assets/mesita.png';
import imgMesa6P from './assets/mesa_larga_6p.jpg';

export default function FormularioReserva({ usuarioLogueado }) {
  const [salaSeleccionada, setSalaSeleccionada] = useState('salon-principal');
  const [mesaSeleccionada, setMesaSeleccionada] = useState(null);
  const [filtroCapacidad, setFiltroCapacidad] = useState('todos');
  const [enviando, setEnviando] = useState(false);
  const [mostrarModalPago, setMostrarModalPago] = useState(false);
  const [payloadTemporal, setPayloadTemporal] = useState(null);
  const [mesasBackend, setMesasBackend] = useState([]); 
  const [datosForm, setDatosForm] = useState({
    fecha: '',
    hora: '',
    capacidad: 2,
    metodoPago: 'Efectivo', 
    estacionamiento: 0
  });

useEffect(() => {
    let url = 'http://localhost:8080/api/mesas';
    if (datosForm.fecha && datosForm.hora) {
      const horaConSegundos = datosForm.hora.length === 5 ? datosForm.hora + ":00" : datosForm.hora;
      // Busca esta línea en tu useEffect y cámbiala a:
url = `http://localhost:8080/api/mesas/disponibilidad?fecha=${datosForm.fecha}&hora=${horaConSegundos}`;
    }

    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error('Error al conectar con la API de mesas');
        return res.json();
      })
      .then(data => {
        const mesasConEstilo = data.map(mesa => ({
          ...mesa,
          imagen: mesa.capacidad === 6 ? imgMesa6P : mesa.capacidad === 4 ? imgMesa4P : imgMesa2P,
          clase: mesa.capacidad === 6 ? "m6p" : mesa.capacidad === 4 ? "m4p" : "m2p"
        }));
        setMesasBackend(mesasConEstilo);
        if (mesaSeleccionada) {
          const mesaActualizada = mesasConEstilo.find(m => m.id === mesaSeleccionada.id);
          if (!mesaActualizada || (mesaActualizada.estado !== 'disponible' && mesaActualizada.estado !== 'ACTIVE')) {
            setMesaSeleccionada(null);
          }
        }
      })
      .catch(err => {
        console.error("Error al cargar el mapa dinámico de mesas:", err);
      });
  }, [datosForm.fecha, datosForm.hora]); 
  // 🌟 NUEVO: Filtrado dinámico emparejado con tu BD relacional
  const mesasFiltradas = mesasBackend.filter(mesa => {
    // Vinculamos tus nombres de sala frontend con los IDs autonuméricos de tu base de datos SQL
    const idSalaBD = salaSeleccionada === 'salon-principal' ? 1 : 2;
    
    // Validamos que la relación de la mesa pertenezca a la sala activa (mapeado de JPA)
    if (mesa.salaId !== idSalaBD && (!mesa.sala || mesa.sala.id !== idSalaBD)) {
      return false;
    }

    if (filtroCapacidad === 'todos') return true;
    return mesa.capacidad === Number(filtroCapacidad);
  });

  // El contador ahora opera de manera dinámica sobre los registros del servidor
  const disponibles = mesasFiltradas.filter(m => m.estado === 'disponible' || m.estado === 'ACTIVE').length;
  const precioFijo = 20.00;

  const manejarCambioInput = (e) => {
    const { name, value } = e.target;
    setDatosForm(prev => ({ 
      ...prev, 
      [name]: name === 'estacionamiento' || name === 'capacidad' ? Number(value) : value 
    }));
  };
  const seleccionarMesaVisual = (mesa) => {
    if (mesa.estado !== 'disponible') {
      alert("Esta mesa ya se encuentra ocupada o reservada por otro usuario.");
      return;
    }
    setMesaSeleccionada(mesa);
    
    if (datosForm.capacidad > mesa.capacidad) {
      setDatosForm(prev => ({ ...prev, capacidad: mesa.capacidad }));
    }
  };
  const cambiarSala = (sala) => {
    setSalaSeleccionada(sala);
    setMesaSeleccionada(null);
    setFiltroCapacidad('todos');
  };
  const generarCodigoReserva = () => {
    return 'PAN-' + Math.random().toString(36).substring(2, 6).toUpperCase();
  };
  const ejecutarPeticionBackend = (payload) => {
    setEnviando(true);

    fetch('http://localhost:8080/api/reservas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then(res => {
      // 🚨 SI EL ESTADO NO ES OK (Por ejemplo, un 400 Bad Request de mesa ocupada)
      if (!res.ok) {
        // Leemos el texto plano enviado por el ResponseEntity.badRequest().body(...)
        return res.text().then(text => { throw new Error(text); });
      }
      return res.json();
    })
    .then(data => {
      // Flujo de éxito normal
      alert(`¡Reserva confirmada con éxito! Código: ${data.codigoReserva || data.codigo_reserva || 'ÉXITO'}`);
      
      setMesasBackend(prev => prev.map(m => m.id === payload.mesa.id ? { ...m, estado: 'reservada' } : m));
      setMesaSeleccionada(null);
      setMostrarModalPago(false); // Cerramos el modal si estaba abierto
      setPayloadTemporal(null);    // Limpiamos el respaldo temporal
      setDatosForm({
        fecha: '',
        hora: '',
        capacidad: 2,
        metodoPago: 'Efectivo',
        estacionamiento: 0
      });
      setEnviando(false);
    })
    .catch(err => {
      console.warn("Validación de reserva ejecutada:", err.message);
      alert(err.message); 
      setEnviando(false);
    });
  };
const procesarEnvioReserva = (e) => {
    e.preventDefault();

    const usuarioActual = usuarioLogueado || JSON.parse(localStorage.getItem('usuarioLogueado'));
    
    if (!usuarioActual || !usuarioActual.id) {
        alert("Sesión no válida o expirada. Por favor, vuelve a iniciar sesión.");
        return; 
    }

    // 🛡️ SEGURO: Validar que realmente haya una mesa seleccionada en el estado de React
    if (!mesaSeleccionada || !mesaSeleccionada.id) {
        alert("Por favor, selecciona una mesa en el mapa antes de continuar.");
        return;
    }

    // Estructura limpia y tipada explícitamente para JPA
    const payloadReserva = {
        usuario: { id: Number(usuarioActual.id) }, 
        mesa: { id: Number(mesaSeleccionada.id) },
        fecha: datosForm.fecha,
        hora: datosForm.hora.length === 5 ? datosForm.hora + ":00" : datosForm.hora, 
        capacidad: Number(datosForm.capacidad),
        codigoReserva: generarCodigoReserva(),
        metodoPago: datosForm.metodoPago.toLowerCase().includes('efectivo') ? 'efectivo' : datosForm.metodoPago.toLowerCase(),
        estadoPago: datosForm.metodoPago.toLowerCase().includes('efectivo') ? 'pendiente' : 'pagado',    
        estadoReserva: "confirmada", 
        estacionamiento: Number(datosForm.estacionamiento),
        precio: Number(precioFijo)
    };

    // Control del flujo del Modal de Pago
    if (payloadReserva.metodoPago === 'efectivo') {
        ejecutarPeticionBackend(payloadReserva);
    } else {
        setPayloadTemporal(payloadReserva);
        setMostrarModalPago(true);
    }
};


  // 🌟 CALLBACK PARA EL MODAL DE PAGO EXITOSO
  const manejarPagoExitoso = () => {
    if (payloadTemporal) {
      ejecutarPeticionBackend(payloadTemporal);
    }
  };

  return (
    <div className="fondo-envolvente-premium"> 
    <div className="modulo-reservas-visual-container">
      
      {/* SECCIÓN DEL CROQUIS INTERACTIVO */}
      <div className="seccion-mapa-interactivo">
        <div className="encabezado-mapa">
          <h3>Plano Fotorealista del Salón</h3>
          <p>Selecciona la ubicación real donde deseas almorzar o cenar:</p>
          
          <div className="selector-salas-botones">
            <button 
              type="button" 
              className={`btn-sala ${salaSeleccionada === 'salon-principal' ? 'activo' : ''}`}
              onClick={() => cambiarSala('salon-principal')}
            >
              Salón Central ⚜️
            </button>
            <button 
              type="button" 
              className={`btn-sala ${salaSeleccionada === 'terraza-vip' ? 'activo' : ''}`}
              onClick={() => cambiarSala('terraza-vip')}
            >
              Terraza Exterior 🌿
            </button>
          </div>
        </div>

        {/* Píldoras de filtrado */}
        <div className="barra-filtros">
          <span className="filtros-label">Filtrar por capacidad:</span>
          {['todos', '2', '4', '6'].map(f => (
            <button
              key={f}
              type="button"
              className={`chip-filtro ${filtroCapacidad === f ? 'activo' : ''}`}
              onClick={() => setFiltroCapacidad(f)}
            >
              {f === 'todos' ? 'Todas' : `${f}P`}
            </button>
          ))}
          <span className="disponibles-count">{disponibles} disponibles</span>
        </div>

        <div className="contenedor-arquitectura-salon textura-piso">
          <div className="elemento-barra-licores">🍸 BARRA DE TRAGOS CRIOLLOS</div>
          
          <div className="grid-arquitectura-mesas-imagenes">
            {mesasFiltradas.map((mesa) => {
              const estaSeleccionada = mesaSeleccionada?.id === mesa.id;
              return (
                <div
                  key={mesa.id}
                  className={`contenedor-mesa-real ${mesa.clase} ${mesa.estado} ${estaSeleccionada ? 'seleccionada' : ''}`}
                  onClick={() => seleccionarMesaVisual(mesa)}
                >
                  <img src={mesa.imagen} alt={`Mesa ${mesa.numero}`} className="imagen-mueble-cenital" />
                  
                  <div className="etiqueta-mesa-flotante">
                    <span className="num-real">{mesa.numero}</span>
                    <span className="cap-real">{mesa.capacidad}P</span>
                  </div>

                  {mesa.estado === 'ocupada' && <div className="candado-ocupado">Ocupado</div>}
                </div>
              );
            })}
          </div>

          <div className="elemento-entrada-principal">🚪 ENTRADA PRINCIPAL</div>
        </div>

        <div className="leyenda-mapa-restaurante">
          <div className="leyenda-item"><span className="muestra disponible-img"></span> Disponible</div>
          <div className="leyenda-item"><span className="muestra ocupada-img"></span> Ocupada</div>
          <div className="leyenda-item"><span className="muestra elegida-img"></span> Seleccionada</div>
        </div>
      </div>

      <div className="seccion-formulario-detalles">
        <h3>Detalles de la Reserva</h3>
        <p>Completa los datos para agendar tu mesa de inmediato</p>

        <form onSubmit={procesarEnvioReserva} className="formulario-datos-reserva">
          
          <div className="caja-resumen-mesa-elegida">
            <span className="icono-resumen">🛎️</span>
            <div>
              <h4>Tu Selección:</h4>
              <p>
                {mesaSeleccionada 
                  ? `Mesa Real N° ${mesaSeleccionada.numero} — Máximo ${mesaSeleccionada.capacidad} comensales` 
                  : "Por favor, toca una mesa en el plano"}
              </p>
            </div>
          </div>

          <div className="input-reserva-premium">
            <label>Fecha de la Visita</label>
            <input 
              type="date" 
              name="fecha" 
              required 
              value={datosForm.fecha} 
              onChange={manejarCambioInput} 
              min={new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().split('T')[0]} 
            />
          </div>

          <div className="input-reserva-premium">
  <label htmlFor="hora">Hora de la reserva</label>
  <input
    type="time"
    name="hora"
    required
    value={datosForm.hora}
    onChange={manejarCambioInput}
    // Opcional: Esto limita la selección entre las 12:00 y las 23:59
    min="12:00"
    max="23:59"
    className="input-hora-estilo"
  />
</div>

          <div className="input-reserva-premium">
            <label>Cantidad de Acompañantes</label>
            <input 
              type="number" 
              name="capacidad" 
              min="1" 
              max={mesaSeleccionada ? mesaSeleccionada.capacidad : 10} 
              required 
              value={datosForm.capacidad} 
              onChange={manejarCambioInput} 
            />
          </div>

          <div className="input-reserva-premium">
            <label>¿Requiere espacio de Estacionamiento?</label>
            <select name="estacionamiento" value={datosForm.estacionamiento} onChange={manejarCambioInput}>
              <option value={0}>No requerido</option>
              <option value={1}>Sí, separar espacio</option>
            </select>
          </div>

          <div className="input-reserva-premium">
            <label>Método de Pago de Garantía</label>
            <select name="metodoPago" value={datosForm.metodoPago} onChange={manejarCambioInput}>
              <option value="Efectivo">Efectivo en restaurante</option>
              <option value="Tarjeta">Tarjeta de Crédito / Débito</option>
              <option value="Yape/Plin">Yape o Plin</option>
            </select>
          </div>

          <div className="resumen-precio">
            <div className="precio-fila precio-fila--total">
              <span>Total garantía</span>
              <span>S/ {precioFijo.toFixed(2)}</span>
            </div>
          </div>

          <button 
            type="submit" 
            className="btn-enviar-reserva-final" 
            disabled={!mesaSeleccionada || enviando}
          >
            {enviando ? "Procesando..." : "Confirmar Reservación ⚜️"}
          </button>
          <p className="nota-whatsapp">📲 Recibirás confirmación por WhatsApp</p>
        </form>
      </div>

    </div>
   {/* ── 💳 INTEGRACIÓN CONDICIONAL DEL MODAL DE PAGO ── */}
   {mostrarModalPago && (
    <ModalPago 
  isOpen={mostrarModalPago}           
  montoGarantia={precioFijo}         
  metodoPago={datosForm.metodoPago}   
  onClose={() => {
    setMostrarModalPago(false);
    setPayloadTemporal(null);
  }}
  onConfirmar={(respuestaPasarela) => {
    // 🛡️ Control de seguridad por si el estado asíncrono está vacío
    if (!payloadTemporal) {
      alert("Error: Los datos de la reserva no se cargaron correctamente. Inténtalo de nuevo.");
      setMostrarModalPago(false);
      return;
    }

    // Construimos el payload final asegurando la regeneración y consistencia de los datos
    const payloadFinal = {
      ...payloadTemporal,
      // Si la pasarela devolvió un código de transacción real (no los mocks), lo usamos
      codigoReserva: (respuestaPasarela.codigoOperacion && 
                      respuestaPasarela.codigoOperacion !== 'EFECTIVO-LOCAL' && 
                      respuestaPasarela.codigoOperacion !== 'YAPE-MOCK')
                     ? respuestaPasarela.codigoOperacion 
                     : generarCodigoReserva(), // 🔄 Regenera un código limpio si era un mock
      
      estadoPago: respuestaPasarela.estadoPago ? respuestaPasarela.estadoPago.toLowerCase() : 'pendiente'
    };
    
    // Enviamos el objeto completamente estructurado al backend sin campos corruptos
    ejecutarPeticionBackend(payloadFinal);
  }}
/>

   )}
    </div>
  );
}
