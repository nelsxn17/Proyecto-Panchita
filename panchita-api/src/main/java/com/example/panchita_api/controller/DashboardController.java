package com.example.panchita_api.controller;

import com.example.panchita_api.dto.DashboardDTO;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "http://localhost:5173")
public class DashboardController {

    @PersistenceContext
    private EntityManager entityManager;

    @GetMapping("/dashboard-stats")
    @SuppressWarnings("unchecked")
    public ResponseEntity<?> getDashboardStats() {
        try {
            LocalDate hoy   = LocalDate.now();
            LocalDate ayer  = hoy.minusDays(1);
            LocalDateTime inicioHoy   = hoy.atStartOfDay();
            LocalDateTime finHoy      = hoy.atTime(LocalTime.MAX);
            LocalDateTime inicioAyer  = ayer.atStartOfDay();
            LocalDateTime finAyer     = ayer.atTime(LocalTime.MAX);

            // 1. INGRESOS POR RESERVAS (hoy)
            Object resReservas = entityManager.createNativeQuery(
                    "SELECT COALESCE(SUM(precio), 0) FROM reservas WHERE fecha = :hoy AND estado_reserva != 'cancelada'")
                    .setParameter("hoy", hoy)
                    .getSingleResult();
            BigDecimal ingresosReservas = new BigDecimal(resReservas.toString());

            // 2. INGRESOS POR DELIVERY (hoy)
            Object resDelivery = entityManager.createNativeQuery(
                    "SELECT COALESCE(SUM(total), 0) FROM pedidos_delivery WHERE created_at BETWEEN :inicio AND :fin AND estado != 'Cancelado'")
                    .setParameter("inicio", inicioHoy)
                    .setParameter("fin", finHoy)
                    .getSingleResult();
            BigDecimal ingresosDelivery = new BigDecimal(resDelivery.toString());

            BigDecimal ingresosTotales = ingresosReservas.add(ingresosDelivery);

            // 3. ÓRDENES ACTIVAS
            Object resOrdenes = entityManager.createNativeQuery(
                    "SELECT COUNT(*) FROM pedidos_delivery WHERE estado NOT IN ('Entregado', 'Cancelado')")
                    .getSingleResult();
            long ordenesActivas = Long.parseLong(resOrdenes.toString());

            // 4. RESERVAS DE HOY
            Object resReservasHoy = entityManager.createNativeQuery(
                    "SELECT COUNT(*) FROM reservas WHERE fecha = :hoy AND estado_reserva != 'cancelada'")
                    .setParameter("hoy", hoy)
                    .getSingleResult();
            long reservasHoy = Long.parseLong(resReservasHoy.toString());

            // 5. TICKET PROMEDIO
            Object resTransacciones = entityManager.createNativeQuery(
                    "SELECT COUNT(*) FROM pedidos_delivery WHERE created_at BETWEEN :inicio AND :fin AND estado != 'Cancelado'")
                    .setParameter("inicio", inicioHoy)
                    .setParameter("fin", finHoy)
                    .getSingleResult();
            long totalTransacciones = reservasHoy + Long.parseLong(resTransacciones.toString());

            BigDecimal ticketPromedio = BigDecimal.ZERO;
            if (totalTransacciones > 0) {
                ticketPromedio = ingresosTotales.divide(BigDecimal.valueOf(totalTransacciones), 2, RoundingMode.HALF_UP);
            }

            // 6. FLUJO HORARIO
            int[] flujoHorarios = new int[24];
            List<Object[]> resultadosHoras = entityManager.createNativeQuery(
                    "SELECT HOUR(hora) AS hora_bloque, COUNT(*) AS cantidad " +
                    "FROM reservas WHERE fecha = :hoy AND estado_reserva != 'cancelada' " +
                    "GROUP BY HOUR(hora)")
                    .setParameter("hoy", hoy)
                    .getResultList();
            for (Object[] fila : resultadosHoras) {
                int horaIdx  = ((Number) fila[0]).intValue();
                int cantidad = ((Number) fila[1]).intValue();
                if (horaIdx >= 0 && horaIdx < 24) {
                    flujoHorarios[horaIdx] = cantidad;
                }
            }

            // 7. CAPACIDAD DEL SALÓN
            Object resMesasOcupadas = entityManager.createNativeQuery(
                    "SELECT COUNT(*) FROM mesas WHERE estado = 'OCUPADA' OR estado = 'Ocupado'")
                    .getSingleResult();
            long mesasOcupadas = Long.parseLong(resMesasOcupadas.toString());

            Object resMesasTotales = entityManager.createNativeQuery(
                    "SELECT COUNT(*) FROM mesas")
                    .getSingleResult();
            long mesasTotales = Long.parseLong(resMesasTotales.toString());

            // 8. INGRESOS DE AYER (comparativa)
            Object resReservasAyer = entityManager.createNativeQuery(
                    "SELECT COALESCE(SUM(precio), 0) FROM reservas WHERE fecha = :ayer AND estado_reserva != 'cancelada'")
                    .setParameter("ayer", ayer)
                    .getSingleResult();
            BigDecimal ingresosReservasAyer = new BigDecimal(resReservasAyer.toString());

            Object resDeliveryAyer = entityManager.createNativeQuery(
                    "SELECT COALESCE(SUM(total), 0) FROM pedidos_delivery WHERE created_at BETWEEN :inicio AND :fin AND estado != 'Cancelado'")
                    .setParameter("inicio", inicioAyer)
                    .setParameter("fin", finAyer)
                    .getSingleResult();
            BigDecimal ingresosDeliveryAyer = new BigDecimal(resDeliveryAyer.toString());

            BigDecimal ingresosDiaAnterior = ingresosReservasAyer.add(ingresosDeliveryAyer);

            // 9. RESERVAS DE AYER (comparativa)
            Object resReservasAyerCount = entityManager.createNativeQuery(
                    "SELECT COUNT(*) FROM reservas WHERE fecha = :ayer AND estado_reserva != 'cancelada'")
                    .setParameter("ayer", ayer)
                    .getSingleResult();
            long reservasAyer = Long.parseLong(resReservasAyerCount.toString());

            DashboardDTO stats = new DashboardDTO(
                ingresosTotales,
                ordenesActivas,
                reservasHoy,
                ticketPromedio,
                flujoHorarios,
                mesasOcupadas,
                mesasTotales,
                ingresosDiaAnterior,
                reservasAyer
            );

            return ResponseEntity.ok(stats);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error: " + e.getMessage());
        }
    }
}