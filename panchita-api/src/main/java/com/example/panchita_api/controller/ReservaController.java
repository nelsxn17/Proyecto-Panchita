package com.example.panchita_api.controller;

import com.example.panchita_api.model.*;
import com.example.panchita_api.repository.*;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalTime;
import java.util.*;

@RestController
@RequestMapping("/api/reservas")
@CrossOrigin(origins = "http://localhost:5173")
public class ReservaController {

    private final UsuarioRepository usuarioRepository;
    private final MesaRepository mesaRepository;
    private final ReservaRepository reservaRepository;

    public ReservaController(UsuarioRepository usuarioRepository, 
                             MesaRepository mesaRepository, 
                             ReservaRepository reservaRepository) {
        this.usuarioRepository = usuarioRepository;
        this.mesaRepository = mesaRepository;
        this.reservaRepository = reservaRepository;
    }

    @Transactional
    @PostMapping
    public ResponseEntity<?> guardarReserva(@RequestBody Reserva reserva) {
        try {

            // 1. DEFINIR RANGO: Ejemplo, reserva de 1 hora
        LocalTime horaInicio = reserva.getHora();
        LocalTime horaFin = horaInicio.plusHours(1); // Ajusta esto según cuánto dura una reserva
            // 1. VALIDACIÓN DE DISPONIBILIDAD
            boolean yaExiste = reservaRepository.existsByMesaIdAndFechaAndHora(
                    reserva.getMesa().getId(), 
                    reserva.getFecha(), 
                    reserva.getHora()
            );

            if (yaExiste) {
                return ResponseEntity.badRequest().body("Error: La mesa ya se encuentra reservada en este horario.");
            }

            // 2. Normalización
            reserva.setEstadoPago((reserva.getEstadoPago() != null) ? reserva.getEstadoPago() : "pendiente");
            reserva.setEstadoReserva((reserva.getEstadoReserva() != null) ? reserva.getEstadoReserva() : "confirmada");
            
            if (reserva.getCodigoReserva() == null || reserva.getCodigoReserva().isEmpty()) {
                reserva.setCodigoReserva("RES-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
            }

            // 3. Validar Usuario y Mesa
            Usuario usuarioDb = usuarioRepository.findById(reserva.getUsuario().getId())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
            Mesa mesaDb = mesaRepository.findById(reserva.getMesa().getId())
                .orElseThrow(() -> new RuntimeException("Mesa no encontrada"));

            reserva.setUsuario(usuarioDb);
            reserva.setMesa(mesaDb);

            return ResponseEntity.ok(reservaRepository.save(reserva));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error al guardar: " + e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<?> obtenerTodasLasReservas() {
        return ResponseEntity.ok(reservaRepository.findAll(Sort.by(Sort.Direction.DESC, "id")));
    }

    @PutMapping("/{id}/estado")
    public ResponseEntity<?> actualizarEstado(@PathVariable Integer id, @RequestBody Map<String, String> body) {
        String nuevoEstado = body.get("estado");
        Reserva reserva = reservaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Reserva no encontrada"));
        
        if (List.of("pendiente", "pagado", "reembolsado").contains(nuevoEstado)) {
            reserva.setEstadoPago(nuevoEstado);
        } else if (List.of("confirmada", "asistió", "cancelada", "no_asistió", "finalizada").contains(nuevoEstado)) {
            reserva.setEstadoReserva(nuevoEstado);
        } else {
            return ResponseEntity.badRequest().body("Estado no válido para esta columna");
        }
        
        reservaRepository.save(reserva);
        return ResponseEntity.ok("Actualizado correctamente");
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> actualizarReservaCompleta(@PathVariable Integer id, @RequestBody Reserva reservaDetalles) {
        Reserva reservaDb = reservaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Reserva no encontrada con ID: " + id));

        reservaDb.setFecha(reservaDetalles.getFecha());
        reservaDb.setHora(reservaDetalles.getHora()); 
        
        reservaDb.setEstadoReserva(reservaDetalles.getEstadoReserva());
        reservaDb.setObservaciones(reservaDetalles.getObservaciones());
        reservaDb.setEstacionamiento(reservaDetalles.getEstacionamiento());

        
        if (reservaDetalles.getMesa() != null) {
            Mesa mesaDb = mesaRepository.findById(reservaDetalles.getMesa().getId())
                    .orElseThrow(() -> new RuntimeException("Mesa no encontrada"));
            reservaDb.setMesa(mesaDb);
        }

        reservaRepository.save(reservaDb);
        return ResponseEntity.ok(reservaDb);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminarReserva(@PathVariable Integer id) {
        if (!reservaRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        reservaRepository.deleteById(id);
        return ResponseEntity.ok("Reserva eliminada con éxito");
    }
        // 🌟 AGREGAR ESTO AL FINAL DE RESERVACONTROLLER.JAVA
        // 🌟 REEMPLAZA EL MÉTODO AL FINAL DE RESERVACONTROLLER.JAVA CON ESTO:
        // 🌟 REEMPLAZA EL MÉTODO AL FINAL DE RESERVACONTROLLER.JAVA CON ESTO:
    @Transactional
    @PutMapping("/{id}/finalizar")
    public ResponseEntity<?> finalizarReserva(@PathVariable Integer id) {
        try {
            // Validamos primero si el registro existe en la BD
            if (!reservaRepository.existsById(id)) {
                return ResponseEntity.badRequest().body("Error: No existe ninguna reserva con el ID " + id);
            }
            
            // Ejecutamos la actualización directa sobre la columna evitando problemas de cascada de Hibernate
            reservaRepository.actualizarEstadoReservaDirecto(id, "finalizada");
            
            // Retornamos un mensaje de éxito limpio
            return ResponseEntity.ok("Reserva finalizada exitosamente.");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Fallo en base de datos: " + e.getMessage());
        }
    }


}