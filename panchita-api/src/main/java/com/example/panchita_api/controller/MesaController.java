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

    
    @GetMapping("/disponibilidad")
    public ResponseEntity<?> obtenerDisponibilidad(
            @RequestParam("fecha") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha,
            @RequestParam("hora")  @DateTimeFormat(iso = DateTimeFormat.ISO.TIME)  LocalTime hora) {

        try {
            List<Mesa> todasLasMesas      = mesaRepository.findAll();
            List<Reserva> reservasDelDia  = reservaRepository.findByFecha(fecha);

            List<Map<String, Object>> resultado = todasLasMesas.stream().map(mesa -> {

                // 1. Filtrado dinámico relacional considerando la duración por capacidad e ignorando finalizadas
                Optional<Reserva> reservaEncontrada = reservasDelDia.stream()
                    .filter(r -> r.getMesa() != null
                              && r.getMesa().getId().equals(mesa.getId())
                              && !r.getEstadoReserva().equalsIgnoreCase("cancelada")
                              && !r.getEstadoReserva().equalsIgnoreCase("finalizada")) // 🌟 Ignora las liberadas
                    .filter(r -> {
                        if (r.getHora() == null) return false;
                        LocalTime horaReservaExistente = r.getHora();
                        
                        int minutosDuracionComida = 90; 
                        if (mesa.getCapacidad() == 4) minutosDuracionComida = 105;
                        else if (mesa.getCapacidad() >= 6) minutosDuracionComida = 120;

                        return !hora.isBefore(horaReservaExistente.minusMinutes(30)) 
                            && !hora.isAfter(horaReservaExistente.plusMinutes(minutosDuracionComida));
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
                    estadoCalculado = mesa.getEstado() != null ? mesa.getEstado().toLowerCase() : "disponible";
                }

                // 2. Extraer el ID real de la sala desde la base de datos relacional
                Integer salaId = null;
                String salaNombre = null;
                if (mesa.getSala() != null) {
                    salaId = mesa.getSala().getId(); 
                    salaNombre = mesa.getSala().getNombre();
                }

                // Armar el mapa de respuesta enriquecido garantizando la consistencia de tipos
                Map<String, Object> item = new LinkedHashMap<>();
                item.put("id",         mesa.getId());
                item.put("numero",     mesa.getNumero());
                item.put("capacidad",  mesa.getCapacidad());
                item.put("estado",     estadoCalculado);
                item.put("ubicacion",  mesa.getUbicacion());
                item.put("salaId",     salaId);
                item.put("salaNombre", salaNombre); 

                // INYECCIÓN ASEGURADA: Mapeamos los datos de la reserva directo para que React los reciba
                if (reservaEncontrada.isPresent()) {
                    Reserva r = reservaEncontrada.get();
                    String nombreCliente = (r.getUsuario() != null) ? r.getUsuario().getNombre() : "Cliente";
                    item.put("reservaId",      r.getId()); // 🌟 ID Crucial para tu frontend
                    item.put("clienteReserva", nombreCliente);
                    item.put("horaReserva",    r.getHora() != null ? r.getHora().toString() : null);
                    item.put("codigoReserva",  r.getCodigoReserva());
                } else {
                    item.put("reservaId",      null);
                    item.put("clienteReserva", null);
                    item.put("horaReserva",    null);
                    item.put("codigoReserva",  null);
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
            
            // Validar contra los valores permitidos del ENUM
            List<String> permitidos = Arrays.asList("disponible", "ocupada", "reservada", "bloqueada");
            
            if (nuevoEstado == null || !permitidos.contains(nuevoEstado.toLowerCase())) {
                return ResponseEntity.badRequest().body("Estado inválido. Valores permitidos: " + permitidos);
            }

            // Actualizar
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

    // Agrega este método a tu MesaController.java existente

// 🗑️ DELETE: Eliminar una mesa por ID
@DeleteMapping("/{id}")
public ResponseEntity<?> eliminarMesa(@PathVariable Integer id) {
    try {
        if (!mesaRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        mesaRepository.deleteById(id);
        return ResponseEntity.ok().body("Mesa eliminada correctamente.");
    } catch (Exception e) {
        return ResponseEntity.internalServerError().body("Error al eliminar la mesa: " + e.getMessage());
    }
}
}

