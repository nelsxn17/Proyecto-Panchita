import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';

const NARANJA   = [188, 90, 26];
const NARANJA_L = [253, 245, 238];   // Fondo suave naranja
const DARK      = [38, 25, 21];
const MUTED     = [110, 94, 88];
const BLANCO    = [255, 255, 255];
const BORDE     = [230, 222, 215];
const VERDE     = [22, 101, 52];
const VERDE_L   = [220, 252, 231];
const AMARILLO  = [133, 77, 14];
const AMARILLO_L= [254, 249, 195];
const AZUL      = [3, 105, 161];
const AZUL_L    = [224, 242, 254];

function setFill(doc, rgb) { doc.setFillColor(rgb[0], rgb[1], rgb[2]); }
function setDraw(doc, rgb) { doc.setDrawColor(rgb[0], rgb[1], rgb[2]); }
function setTxt(doc, rgb)  { doc.setTextColor(rgb[0], rgb[1], rgb[2]); }

function fila(doc, label, valor, y, ancho = 160) {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  setTxt(doc, MUTED);
  doc.text(label, 25, y);

  doc.setFont('helvetica', 'bold');
  setTxt(doc, DARK);
  doc.text(String(valor), 25 + ancho - doc.getTextWidth(String(valor)), y);

  setDraw(doc, BORDE);
  doc.setLineWidth(0.2);
  doc.line(25, y + 2.5, 25 + ancho, y + 2.5);
}

function badge(doc, texto, x, y, colFondo, colTexto) {
  const pad = 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  const w = doc.getTextWidth(texto) + pad * 2;
  setFill(doc, colFondo);
  setDraw(doc, colFondo);
  doc.roundedRect(x, y - 5, w, 7, 2, 2, 'FD');
  setTxt(doc, colTexto);
  doc.text(texto, x + pad, y);
}

function labelEstado(estadoPago) {
  const e = (estadoPago || '').toLowerCase();
  if (e === 'pagado' || e === 'aprobado')
    return { texto: 'PAGO CONFIRMADO', fondo: VERDE_L, texto_color: VERDE };
  if (e === 'pendiente_verificacion')
    return { texto: 'EN VERIFICACIÓN', fondo: AZUL_L, texto_color: AZUL };
  return { texto: 'PAGO EN CAJA', fondo: AMARILLO_L, texto_color: AMARILLO };
}

function metodoPagoLabel(m) {
  const map = {
    efectivo: 'Efectivo en restaurante',
    tarjeta: 'Tarjeta de crédito / débito',
    'yape/plin': 'Yape / Plin',
  };
  return map[(m || '').toLowerCase()] || m;
}

export async function generarVoucherPDF(datos) {
  const doc = new jsPDF({ unit: 'mm', format: 'a5', orientation: 'portrait' });

  const PW = doc.internal.pageSize.getWidth();   // 148 mm
  const PH = doc.internal.pageSize.getHeight();  // 210 mm
 
  setFill(doc, BLANCO);
  doc.rect(0, 0, PW, PH, 'F');

  setFill(doc, DARK);
  doc.rect(0, 0, PW, 32, 'F');

  // Marca Panchita
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  setTxt(doc, [245, 200, 66]);
  doc.text('Panchita', PW / 2, 14, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  setTxt(doc, [165, 135, 115]);
  doc.text('GESTIÓN CENTRAL · RESTAURANTE', PW / 2, 20, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  setTxt(doc, [245, 200, 66]);
  doc.text('VOUCHER DE RESERVA', PW / 2, 28, { align: 'center' });

  // ── CÓDIGO RESERVA ────────────────────────
  setFill(doc, NARANJA_L);
  setDraw(doc, NARANJA);
  doc.setLineWidth(0.5);
  doc.roundedRect(15, 37, PW - 30, 18, 4, 4, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  setTxt(doc, NARANJA);
  doc.text('CÓDIGO DE RESERVA', PW / 2, 44, { align: 'center' });

  doc.setFont('courier', 'bold');
  doc.setFontSize(18);
  setTxt(doc, DARK);
  doc.text(datos.codigoReserva || 'PAN-XXXX', PW / 2, 52, { align: 'center' });

  // ── BADGE ESTADO ──────────────────────────
  const est = labelEstado(datos.estadoPago);
  const bTexto = est.texto;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  const bW = doc.getTextWidth(bTexto) + 10;
  badge(doc, bTexto, PW / 2 - bW / 2, 64, est.fondo, est.texto_color);

  // ── SEPARADOR ─────────────────────────────
  setDraw(doc, BORDE);
  doc.setLineWidth(0.3);
  doc.line(15, 70, PW - 15, 70);

  // ── DATOS DE RESERVA ─────────────────────
  const filaX = 25;
  const anchoTabla = PW - 50;
  let y = 80;
  const gap = 10;

  // Nombre del cliente
  const nombreCliente = datos.usuarioNombre || datos.usuario?.nombre || datos.clienteNombre || '—';
  fila(doc, 'Cliente', nombreCliente, y, anchoTabla); y += gap;

  // Mesa
  const numMesa = datos.mesa?.numero || datos.mesaNumero || datos.mesa?.id || '—';
  fila(doc, 'Mesa asignada', `N° ${numMesa}`, y, anchoTabla); y += gap;

  // Sala
  if (datos.salaNombre || datos.sala?.nombre) {
    fila(doc, 'Sala / Área', datos.salaNombre || datos.sala.nombre, y, anchoTabla); y += gap;
  }

  // Fecha
  fila(doc, 'Fecha', datos.fecha || '—', y, anchoTabla); y += gap;

  // Hora
  const horaDisplay = (datos.hora || '—').substring(0, 5);
  fila(doc, 'Hora', horaDisplay, y, anchoTabla); y += gap;

  // Comensales
  fila(doc, 'Comensales', `${datos.capacidad} persona${datos.capacidad !== 1 ? 's' : ''}`, y, anchoTabla); y += gap;

  // Estacionamiento
  if (datos.estacionamiento !== undefined) {
    fila(doc, 'Estacionamiento', datos.estacionamiento ? 'Sí, separado' : 'No requerido', y, anchoTabla);
    y += gap;
  }

  // Método de pago
  fila(doc, 'Método de pago', metodoPagoLabel(datos.metodoPago), y, anchoTabla); y += gap;

  // ── PRECIO TOTAL ──────────────────────────
  y += 3;
  setFill(doc, NARANJA_L);
  setDraw(doc, [230, 222, 215]);
  doc.setLineWidth(0.3);
  doc.roundedRect(15, y - 6, PW - 30, 14, 3, 3, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  setTxt(doc, MUTED);
  doc.text('Garantía pagada', filaX, y + 1);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  setTxt(doc, NARANJA);
  const precioStr = `S/ ${Number(datos.precio || 0).toFixed(2)}`;
  doc.text(precioStr, PW - 15 - doc.getTextWidth(precioStr), y + 2);

  y += 18;

  // ── QR ────────────────────────────────────
  const qrPayload = JSON.stringify({
    codigo: datos.codigoReserva,
    mesa: numMesa,
    fecha: datos.fecha,
    hora: horaDisplay,
    estado: datos.estadoPago,
  });

  try {
    const qrDataUrl = await QRCode.toDataURL(qrPayload, {
      width: 200,
      margin: 1,
      color: { dark: '#261915', light: '#ffffff' },
    });

    const qrSize = 36;
    const qrX = PW / 2 - qrSize / 2;

    // Fondo blanco para el QR
    setFill(doc, BLANCO);
    setDraw(doc, BORDE);
    doc.setLineWidth(0.4);
    doc.roundedRect(qrX - 4, y - 3, qrSize + 8, qrSize + 12, 3, 3, 'FD');

    doc.addImage(qrDataUrl, 'PNG', qrX, y, qrSize, qrSize);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    setTxt(doc, MUTED);
    doc.text('Muestra este QR al mozo para verificar tu reserva', PW / 2, y + qrSize + 6, { align: 'center' });

    y += qrSize + 18;
  } catch (_) {
    // Si QR falla, continúa sin él
    y += 8;
  }


  setFill(doc, DARK);
  doc.rect(0, PH - 16, PW, 16, 'F');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  setTxt(doc, [165, 135, 115]);
  doc.text('Panchita · Gestión Central  ·  Reservas sujetas a disponibilidad', PW / 2, PH - 9, { align: 'center' });
  doc.text(`Emitido: ${new Date().toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })}`, PW / 2, PH - 4, { align: 'center' });

  // ── DESCARGA ──────────────────────────────
  doc.save(`voucher-${datos.codigoReserva || 'reserva'}.pdf`);
}