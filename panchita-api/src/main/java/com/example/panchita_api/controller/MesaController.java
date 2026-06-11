package com.example.panchita_api.controller;

import com.example.panchita_api.model.Mesa;
import com.example.panchita_api.model.Reserva;
import com.example.panchita_api.repository.MesaRepository;
import com.example.panchita_api.repository.ReservaRepository;
import com.example.panchita_api.repository.SalaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/mesas")
@CrossOrigin(origins = "http://localhost:5173")
public class MesaController {

    @Autowired
    private MesaRepository mesaRepository;

    @Autowired
    private SalaRepository salaRepository;

    @Autowired
    private ReservaRepository reservaRepository;

    // ─── GET /api/mesas/disponibilidad ───────────────────────────────────────
    // Devuelve mesas con estado calculado + nombre de sala incluido
    @GetMapping("/disponibilidad")
    public ResponseEntity<?> obtenerDisponibilidad(
            @RequestParam("fecha") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha,
            @RequestParam("hora")  @DateTimeFormat(iso = DateTimeFormat.ISO.TIME)  LocalTime hora) {

        try {
            List<Mesa> todasLasMesas      = mesaRepository.findAll();
            List<Reserva> reservasDelDia  = reservaRepository.findByFecha(fecha);

            List<Map<String, Object>> resultado = todasLasMesas.stream().map(mesa -> {

    // 1. Corregido: Validar la reserva considerando el día Y un rango de horas (Ej: 2 horas de duración)
    Optional<Reserva> reservaEncontrada = reservasDelDia.stream()
        .filter(r -> r.getMesa() != null
                  && r.getMesa().getId().equals(mesa.getId())
                  && !r.getEstadoReserva().equalsIgnoreCase("cancelada"))
        .filter(r -> {
            if (r.getHora() == null) return false;
            LocalTime horaReservaExistente = r.getHora();
            // Una mesa se bloquea si la nueva reserva choca dentro del rango de 2 horas previas o posteriores
            return !hora.isBefore(horaReservaExistente.minusHours(2)) 
                && !hora.isAfter(horaReservaExistente.plusHours(2));
        })
        .findFirst();

              String estadoCalculado;
    if (reservaEncontrada.isPresent()) {
        Reserva r = reservaEncontrada.get();
        String est = r.getEstadoReserva().toLowerCase();
        if (est.equals("asistió") || est.equals("asistio")) {
            estadoCalculado = "ocupada";
        } else {
            estadoCalculado = "reservada";
        }
    } else {
        estadoCalculado = mesa.getEstado() != null ? mesa.getEstado() : "disponible";
    }

    // 2. Corregido: Extraer el ID real de la sala desde la base de datos relacional
    Integer salaId = null;
    String salaNombre = null;
    if (mesa.getSala() != null) {
        salaId = mesa.getSala().getId(); // Extraemos el ID numérico (1 o 2)
        salaNombre = mesa.getSala().getNombre();
    }

                 // Armar el mapa de respuesta enriquecido para React
    Map<String, Object> item = new LinkedHashMap<>();
    item.put("id",         mesa.getId());
    item.put("numero",     mesa.getNumero());
    item.put("capacidad",  mesa.getCapacidad());
    item.put("estado",     estadoCalculado);
    item.put("ubicacion",  mesa.getUbicacion());
    
    // CAMPOS CRUCIALES PARA EL FILTRO DEL FRONTEND:
    item.put("salaId",     salaId);     // <-- ¡Esto soluciona que desaparezcan las mesas!
    item.put("salaNombre", salaNombre); 

    if (reservaEncontrada.isPresent()) {
        Reserva r = reservaEncontrada.get();
        String nombreCliente = (r.getUsuario() != null) ? r.getUsuario().getNombre() : null;
        item.put("clienteReserva", nombreCliente);
        item.put("horaReserva",    r.getHora() != null ? r.getHora().toString() : null);
        item.put("codigoReserva",  r.getCodigoReserva());
        item.put("reservaId",      r.getId());
    }

    return item;

}).collect(Collectors.toList());

            return ResponseEntity.ok(resultado);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Error: " + e.getMessage());
        }
    }

@PutMapping("/{id}/estado")
@Transactional
public ResponseEntity<?> cambiarEstado(@PathVariable Integer id, @RequestBody Map<String, String> body) {
    return mesaRepository.findById(id).map(mesa -> {
        String nuevoEstado = body.get("estado");
        
        // 1. Validar contra los valores permitidos del ENUM
        List<String> permitidos = Arrays.asList("disponible", "ocupada", "reservada", "bloqueada");
        
        if (nuevoEstado == null || !permitidos.contains(nuevoEstado.toLowerCase())) {
            return ResponseEntity.badRequest().body("Estado inválido. Valores permitidos: " + permitidos);
        }

        // 2. Actualizar
        mesa.setEstado(nuevoEstado.toLowerCase());
        mesaRepository.save(mesa);
        
        return ResponseEntity.ok("Actualizado correctamente");
    }).orElse(ResponseEntity.notFound().build());
}

    // ─── GET /api/mesas ──────────────────────────────────────────────────────
    @GetMapping
    public ResponseEntity<List<Mesa>> obtenerMesas() {
        List<Mesa> mesas = mesaRepository.findAll();
        mesas.forEach(mesa -> {
            if (mesa.getSala() != null) mesa.getSala().getNombre();
        });
        return ResponseEntity.ok(mesas);
    }

    // ─── POST /api/mesas ─────────────────────────────────────────────────────
    @PostMapping
    public ResponseEntity<?> crearMesa(@RequestBody Mesa mesa) {
        if (mesa.getEstado() == null) mesa.setEstado("disponible");
        return ResponseEntity.ok(mesaRepository.save(mesa));
    }
}