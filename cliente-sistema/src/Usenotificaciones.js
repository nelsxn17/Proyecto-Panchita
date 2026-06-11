import { useState, useEffect, useRef, useCallback } from 'react';

export function useNotificaciones(metricas) {
  const [notificaciones, setNotificaciones] = useState([]);
  const reservasConocidas   = useRef(new Set());
  const mesasAlertadas      = useRef(new Set());   // evita repetir alerta de la misma mesa
  const ingresosBajoAlertado = useRef(false);

  

  const agregarNotificacion = useCallback((notif) => {
    const id = Date.now() + Math.random();
    setNotificaciones((prev) => [{ ...notif, id }, ...prev].slice(0, 10)); // máximo 10
    // Auto-eliminar después de 6 segundos
    setTimeout(() => {
      setNotificaciones((prev) => prev.filter((n) => n.id !== id));
    }, 6000);
  }, []);

  // ─── Llamada externa desde MapaSalon (mesas +90 min) ────────────────────

  const recibirAlertaMesa = useCallback((alerta) => {
    if (mesasAlertadas.current.has(alerta.mesaId)) return;
    mesasAlertadas.current.add(alerta.mesaId);
    agregarNotificacion({
      tipo: 'mesa',
      titulo: '⏱ Mesa ocupada por mucho tiempo',
      mensaje: alerta.mensaje,
    });
    // Limpiar la marca cada 10 min para que vuelva a alertar si sigue
    setTimeout(() => mesasAlertadas.current.delete(alerta.mesaId), 10 * 60 * 1000);
  }, [agregarNotificacion]);

  // ─── Polling de nuevas reservas ──────────────────────────────────────────

  useEffect(() => {
    const chequearReservas = () => {
      // CÓDIGO CORRECTO
fetch('http://localhost:8080/api/reservas') // Ya no lleva /proximas
        .then((r) => r.json())
        .then((data) => {
          if (!Array.isArray(data)) return;
          data.forEach((r) => {
            const key = `${r.id}-${r.estado}`;
            if (!reservasConocidas.current.has(key)) {
              // Primera carga: solo poblar el set, no disparar notificación
              if (reservasConocidas.current.size === 0 && data.length > 1) {
                data.forEach((x) => reservasConocidas.current.add(`${x.id}-${x.estado}`));
                return;
              }
              reservasConocidas.current.add(key);
              // Solo notificar si ya teníamos datos previos (no en la primera carga)
              if (reservasConocidas.current.size > data.length) {
                agregarNotificacion({
                  tipo: 'reserva',
                  titulo: '📅 Nueva reserva recibida',
                  mensaje: `${r.nombreCliente || r.nombre || 'Cliente'} — ${r.hora || ''} · ${r.cantidadPersonas || r.personas || '?'} personas`,
                });
              }
            }
          });
          // Poblar en primera carga real
          if (reservasConocidas.current.size === 0) {
            data.forEach((x) => reservasConocidas.current.add(`${x.id}-${x.estado}`));
          }
        })
        .catch(() => {});
    };

    chequearReservas();
    const id = setInterval(chequearReservas, 20000);
    return () => clearInterval(id);
  }, [agregarNotificacion]);

  // ─── Chequeo de ingresos vs. promedio semanal ────────────────────────────

  useEffect(() => {
    if (!metricas) return;

    const chequearIngresos = () => {
      fetch('http://localhost:8080/api/admin/promedio-ingresos-semana')
        .then((r) => r.json())
        .then((data) => {
          const promedio = parseFloat(data.promedioSemanal) || 0;
          const hoy      = parseFloat(metricas.ingresosDia) || 0;

          // Alertar si los ingresos de hoy están más del 20% por debajo del promedio
          const umbral = promedio * 0.8;
          if (promedio > 0 && hoy < umbral && !ingresosBajoAlertado.current) {
            ingresosBajoAlertado.current = true;
            agregarNotificacion({
              tipo: 'ingresos',
              titulo: '📉 Ingresos por debajo del promedio',
              mensaje: `Hoy: S/ ${hoy.toFixed(2)} — Promedio semana: S/ ${promedio.toFixed(2)}`,
            });
          }
          // Resetear si ya superaron el umbral
          if (hoy >= umbral) {
            ingresosBajoAlertado.current = false;
          }
        })
        .catch(() => {});
    };

    chequearIngresos();
    const id = setInterval(chequearIngresos, 5 * 60 * 1000); // cada 5 min
    return () => clearInterval(id);
  }, [metricas, agregarNotificacion]);

  // ─── Eliminar manualmente ────────────────────────────────────────────────

  const cerrarNotificacion = useCallback((id) => {
    setNotificaciones((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return { notificaciones, cerrarNotificacion, recibirAlertaMesa };
}