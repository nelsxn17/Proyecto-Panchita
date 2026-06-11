package com.example.panchita_api.controller;

import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "http://localhost:5173")
public class MapaSalonController {

    @PersistenceContext
    private EntityManager entityManager;

    @GetMapping("/mesas-detalle")
    @SuppressWarnings("unchecked")
    public ResponseEntity<?> getMesasDetalle() {
        try {
            List<Object[]> filas = entityManager.createNativeQuery(
                "SELECT m.id, m.numero, m.capacidad, m.estado, m.zona, " +
                "m.fecha_ocupacion, " +
                "CONCAT(e.nombre, ' ', COALESCE(e.apellido,'')) AS mozo " +
                "FROM mesas m " +
                "LEFT JOIN empleados e ON e.id = m.empleado_id " +
                "ORDER BY m.numero ASC"
            ).getResultList();

            List<Map<String, Object>> resultado = new ArrayList<>();
            for (Object[] fila : filas) {
                Map<String, Object> mesa = new LinkedHashMap<>();
                mesa.put("id",             fila[0]);
                mesa.put("numero",         fila[1]);
                mesa.put("capacidad",      fila[2]);
                mesa.put("estado",         fila[3]);
                mesa.put("zona",           fila[4]);
                mesa.put("fechaOcupacion", fila[5]);   // ISO datetime o null
                mesa.put("mozo",           fila[6]);
                resultado.add(mesa);
            }

            // Enriquecer mesas RESERVADAS con datos del cliente de la reserva
            enrichReservaData(resultado);

            return ResponseEntity.ok(resultado);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error al cargar mesas: " + e.getMessage());
        }
    }

    @SuppressWarnings("unchecked")
    private void enrichReservaData(List<Map<String, Object>> mesas) {
        LocalDate hoy = LocalDate.now();
        for (Map<String, Object> mesa : mesas) {
            String estado = mesa.get("estado") != null
                    ? mesa.get("estado").toString().toUpperCase() : "";
            if (estado.contains("RESERV")) {
                try {
                    List<Object[]> reserva = entityManager.createNativeQuery(
                        "SELECT r.nombre_cliente, r.hora " +
                        "FROM reservas r " +
                        "WHERE r.mesa_id = :mesaId AND r.fecha = :hoy " +
                        "  AND r.estado_reserva != 'cancelada' " +
                        "ORDER BY r.hora ASC LIMIT 1"
                    )
                    .setParameter("mesaId", mesa.get("id"))
                    .setParameter("hoy", hoy)
                    .getResultList();

                    if (!reserva.isEmpty()) {
                        Object[] row = reserva.get(0);
                        mesa.put("clienteReserva", row[0]);
                        mesa.put("horaReserva",    row[1] != null ? row[1].toString() : null);
                    }
                } catch (Exception ignored) {}
            }
        }
    }
    @GetMapping("/promedio-ingresos-semana")
    public ResponseEntity<?> getPromedioIngresosSemana() {
        try {
            LocalDate hoy        = LocalDate.now();
            LocalDate hace7Dias  = hoy.minusDays(7);
            LocalDate ayer       = hoy.minusDays(1);

            // Ingresos por reservas en los últimos 7 días
            Object resReservas = entityManager.createNativeQuery(
                "SELECT COALESCE(SUM(precio), 0) FROM reservas " +
                "WHERE fecha BETWEEN :desde AND :hasta AND estado_reserva != 'cancelada'"
            )
            .setParameter("desde", hace7Dias)
            .setParameter("hasta", ayer)
            .getSingleResult();

            // Ingresos por delivery en los últimos 7 días
            Object resDelivery = entityManager.createNativeQuery(
                "SELECT COALESCE(SUM(total), 0) FROM pedidos_delivery " +
                "WHERE created_at BETWEEN :inicio AND :fin AND estado != 'Cancelado'"
            )
            .setParameter("inicio", hace7Dias.atStartOfDay())
            .setParameter("fin",    ayer.atTime(LocalTime.MAX))
            .getSingleResult();

            BigDecimal totalSemana = new BigDecimal(resReservas.toString())
                    .add(new BigDecimal(resDelivery.toString()));

            BigDecimal promedio = totalSemana.divide(BigDecimal.valueOf(7), 2, RoundingMode.HALF_UP);

            Map<String, Object> respuesta = new HashMap<>();
            respuesta.put("promedioSemanal", promedio);
            respuesta.put("totalSemana",     totalSemana);
            respuesta.put("diasCalculados",  7);

            return ResponseEntity.ok(respuesta);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error al calcular promedio: " + e.getMessage());
        }
    }

@PutMapping("/mesas/{id}/estado")
    @Transactional // <--- ESTO ES LO QUE SOLUCIONA EL ERROR 500
    public ResponseEntity<?> cambiarEstadoMesa(@PathVariable Long id, @RequestBody Map<String, String> request) {
        try {
            String nuevoEstado = request.get("estado");
            
            if (nuevoEstado == null) return ResponseEntity.badRequest().body("Estado requerido");

            int actualizadas = entityManager.createNativeQuery(
                "UPDATE mesas SET estado = :estado WHERE id = :id"
            )
            .setParameter("estado", nuevoEstado.toUpperCase())
            .setParameter("id", id)
            .executeUpdate();

            return actualizadas > 0 
                ? ResponseEntity.ok("Actualizado") 
                : ResponseEntity.status(HttpStatus.NOT_FOUND).build();
                
        } catch (Exception e) {
            e.printStackTrace(); // Aquí verás el detalle si vuelve a fallar
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }
}