import React, { useState } from 'react';
import './ModalPago.css'; 
import { QRCodeSVG } from 'qrcode.react';

export default function ModalPago({ isOpen, onClose, metodoPago, montoGarantia, onConfirmar }) {
  const [codigoOperacion, setCodigoOperacion] = useState('');
  
  const [tarjetaNumero, setTarjetaNumero] = useState('');
  const [tarjetaExpiracion, setTarjetaExpiracion] = useState('');
  const [tarjetaCvv, setTarjetaCvv] = useState('');

  const [procesando, setProcesando] = useState(false);

  if (!isOpen) return null;

  const manejarEnvioPago = (e) => {
    e.preventDefault();
    setProcesando(true);

    setTimeout(() => {
      setProcesando(false);

      let respuestaPago = {
        codigoOperacion: 'EFECTIVO-LOCAL',
        estadoPago: 'PENDIENTE'
      };

      if (metodoPago === 'yape_plin' || metodoPago === 'Yape/Plin') {
        respuestaPago = {
          codigoOperacion: codigoOperacion || 'YAPE-MOCK',
          estadoPago: 'PENDIENTE_VERIFICACION' // El admin lo aprueba en su panel
        };
      } else if (metodoPago === 'tarjeta' || metodoPago === 'Tarjeta') {
        respuestaPago = {
          codigoOperacion: 'TRANS-' + Math.floor(Math.random() * 900000 + 100000),
          estadoPago: 'APROBADO' // Pago automático aprobado
        };
      }

      onConfirmar(respuestaPago);
      setCodigoOperacion('');
      setTarjetaNumero('');
      setTarjetaExpiracion('');
      setTarjetaCvv('');
    }, 1500);
  };

  return (
    <div className="modal-pago-overlay">
      <div className="modal-pago-card animate-slide-down">
        
        <div className="modal-pago-header">
          <h3>🔒 Procesar Garantía de Reserva</h3>
          <button type="button" className="btn-cerrar-modal" onClick={onClose} disabled={procesando}>
            &times;
          </button>
        </div>

        <form onSubmit={manejarEnvioPago} className="modal-pago-body">
          
          <div className="alerta-monto-garntia">
            <span>Monto a garantizar:</span>
            <strong>S/ {montoGarantia.toFixed(2)}</strong>
          </div>

          {/* CASO 1: YAPE O PLIN */}
          {(metodoPago === 'yape_plin' || metodoPago === 'Yape/Plin') && (
            <div className="contenedor-metodo-especifico">
              <span className="badge-metodo badge-yape">Yape / Plin</span>
              <p className="instrucciones-pago">
                Escanea este QR para transferir tu garantía al <strong>987 654 321</strong>.
              </p>
      
              {/* 🔄 REEMPLAZADO POR GENERADOR NATIVO LOCAL */}
              <div className="qr-box" style={{ display: 'flex', justifyContent: 'center', margin: '15px 0' }}>
                <QRCodeSVG 
                  value="https://panchita.pe" 
                  size={200}
                  bgColor={"#ffffff"}
                  fgColor={"#000000"}
                  level={"L"}
                  includeMargin={true}
                />
              </div>

              <div className="grupo-input-modal">
                <label>Ingresa el Número de Operación:</label>
                <input 
                  type="text" 
                  placeholder="Ej: 485932" 
                  required 
                  value={codigoOperacion}
                  onChange={(e) => setCodigoOperacion(e.target.value)}
                  disabled={procesando}
                />
              </div>
            </div>
          )}

          {/* CASO 2: TARJETA DE CRÉDITO O DÉBITO */}
          {(metodoPago === 'tarjeta' || metodoPago === 'Tarjeta') && (
            <div className="contenedor-metodo-especifico">
              <span className="badge-metodo badge-tarjeta">Tarjeta de Crédito / Débito</span>
              <p className="instrucciones-pago">
                Introduce los datos de tu tarjeta de forma segura para procesar la transacción.
              </p>
              
              <div className="grupo-input-modal">
                <label>Número de Tarjeta:</label>
                <input 
                  type="text" 
                  placeholder="0000 0000 0000 0000" 
                  maxLength="16"
                  required 
                  value={tarjetaNumero}
                  onChange={(e) => setTarjetaNumero(e.target.value)}
                  disabled={procesando}
                />
              </div>

              <div className="fila-inputs-modal" style={{ display: 'flex', gap: '10px' }}>
                <div className="grupo-input-modal" style={{ flex: 1 }}>
                  <label>Expiración:</label>
                  <input 
                    type="text" 
                    placeholder="MM/AA" 
                    maxLength="5"
                    required 
                    value={tarjetaExpiracion}
                    onChange={(e) => setTarjetaExpiracion(e.target.value)}
                    disabled={procesando}
                  />
                </div>
                <div className="grupo-input-modal" style={{ flex: 1 }}>
                  <label>CVC / CVV:</label>
                  <input 
                    type="password" 
                    placeholder="123" 
                    maxLength="4"
                    required 
                    value={tarjetaCvv}
                    onChange={(e) => setTarjetaCvv(e.target.value)}
                    disabled={procesando}
                  />
                </div>
              </div>
            </div>
          )}

          {/* CASO 3: EFECTIVO */}
          {(metodoPago === 'efectivo' || metodoPago === 'Efectivo') && (
            <div className="contenedor-metodo-especifico caja-aviso-efectivo">
              <span className="badge-metodo badge-efectivo">Pago Presencial</span>
              <h4>⚠️ Política de Espera Obligatoria</h4>
              <p>
                No necesitas pagar ahora en la web. Abonarás los <strong>S/ {montoGarantia.toFixed(2)}</strong> directamente en la caja del restaurante cuando te presentes.
              </p>
              <div className="nota-advertencia-efectivo">
                <strong>Importante:</strong> Tu mesa asignada se reservará por un margen de <strong>15 minutos de tolerancia</strong> respecto a tu hora elegida. Pasado ese tiempo, el sistema liberará la mesa automáticamente de manera operativa.
              </div>
            </div>
          )}

          <div className="modal-pago-foot-actions">
            <button 
              type="button" 
              className="btn-modal-cancelar" 
              onClick={onClose} 
              disabled={procesando}
            >
              Regresar
            </button>
            <button 
              type="submit" 
              className="btn-modal-confirmar-final" 
              disabled={procesando}
            >
              {procesando ? 'Verificando...' : 'Completar Reservación'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
