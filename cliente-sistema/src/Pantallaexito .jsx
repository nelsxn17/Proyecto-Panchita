import React, { useEffect, useState } from 'react';
import './PantallaExito.css';
import { generarVoucherPDF } from './VoucherPDF';

export default function PantallaExito({ datos, onCerrar }) {
  const [visible, setVisible] = useState(false);
  const [generandoPDF, setGenerandoPDF] = useState(false);

  // Dispara la animación de entrada tras montar
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  const handleDescargar = async () => {
    setGenerandoPDF(true);
    try {
      await generarVoucherPDF(datos);
    } catch (err) {
      console.error('Error generando PDF:', err);
      alert('No se pudo generar el PDF. Intenta de nuevo.');
    } finally {
      setGenerandoPDF(false);
    }
  };

  const handleCerrar = () => {
    setVisible(false);
    setTimeout(onCerrar, 300); // Espera la animación de salida
  };

  const estadoPagoLabel = {
    pagado: { texto: 'Pago confirmado', clase: 'badge--verde' },
    pendiente: { texto: 'Pago en caja', clase: 'badge--amarillo' },
    pendiente_verificacion: { texto: 'Pago en verificación', clase: 'badge--azul' },
    aprobado: { texto: 'Pago aprobado', clase: 'badge--verde' },
  };

  const estadoInfo = estadoPagoLabel[datos.estadoPago?.toLowerCase()] || { texto: datos.estadoPago, clase: 'badge--azul' };

  const metodoPagoLabel = {
    efectivo: 'Efectivo en restaurante',
    tarjeta: 'Tarjeta de crédito / débito',
    'yape/plin': 'Yape / Plin',
  };

  return (
    <div className={`exito-overlay ${visible ? 'exito-overlay--visible' : ''}`}>
      <div className={`exito-card ${visible ? 'exito-card--visible' : ''}`}>

        {/* ÍCONO ANIMADO */}
        <div className="exito-icono-wrap">
          <svg className="exito-circulo" viewBox="0 0 52 52">
            <circle className="exito-circulo__track" cx="26" cy="26" r="25" fill="none" />
            <circle className="exito-circulo__fill" cx="26" cy="26" r="25" fill="none" />
            <path className="exito-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
          </svg>
        </div>

        <h2 className="exito-titulo">¡Reserva confirmada!</h2>
        <p className="exito-subtitulo">
          Tu mesa ha sido asignada. Recibirás confirmación por WhatsApp.
        </p>

        {/* CÓDIGO DE RESERVA DESTACADO */}
        <div className="exito-codigo-wrap">
          <span className="exito-codigo-label">Código de reserva</span>
          <span className="exito-codigo">{datos.codigoReserva}</span>
        </div>

        {/* RESUMEN DE DATOS */}
        <div className="exito-resumen">
          <div className="exito-fila">
            <span className="exito-fila__label">Mesa</span>
            <span className="exito-fila__valor">N° {datos.mesa?.numero || datos.mesaNumero}</span>
          </div>
          <div className="exito-fila">
            <span className="exito-fila__label">Fecha</span>
            <span className="exito-fila__valor">{datos.fecha}</span>
          </div>
          <div className="exito-fila">
            <span className="exito-fila__label">Hora</span>
            <span className="exito-fila__valor">{datos.hora?.substring(0, 5)}</span>
          </div>
          <div className="exito-fila">
            <span className="exito-fila__label">Comensales</span>
            <span className="exito-fila__valor">{datos.capacidad} personas</span>
          </div>
          <div className="exito-fila">
            <span className="exito-fila__label">Método de pago</span>
            <span className="exito-fila__valor">
              {metodoPagoLabel[datos.metodoPago?.toLowerCase()] || datos.metodoPago}
            </span>
          </div>
          {/* ✅ NUEVO: Código de estacionamiento */}
{datos.estacionamiento === 1 && datos.codigoEstacionamiento && (
  <div className="exito-fila">
    <span className="exito-fila__label">🅿️ Código estacionamiento</span>
    <span className="exito-fila__valor" style={{ fontWeight: 'bold', color: '#b8860b' }}>
      {datos.codigoEstacionamiento}
    </span>
  </div>
)}
          <div className="exito-fila exito-fila--total">
            <span className="exito-fila__label">Garantía</span>
            <span className="exito-fila__valor exito-precio">S/ {Number(datos.precio).toFixed(2)}</span>
          </div>
        </div>

        {/* BADGE DE ESTADO */}
        <div className={`exito-badge ${estadoInfo.clase}`}>
          {estadoInfo.texto}
        </div>

        {/* ACCIONES */}
        <div className="exito-acciones">
          <button
            className="btn-descargar-voucher"
            onClick={handleDescargar}
            disabled={generandoPDF}
          >
            {generandoPDF
              ? 'Generando PDF...'
              : '⬇ Descargar voucher PDF'}
          </button>
          <button className="btn-exito-cerrar" onClick={handleCerrar}>
            Listo
          </button>
        </div>

        <p className="exito-nota">
          Llega 10 minutos antes de tu reserva. La mesa se libera tras 15 minutos de tolerancia.
        </p>
      </div>
    </div>
  );
}