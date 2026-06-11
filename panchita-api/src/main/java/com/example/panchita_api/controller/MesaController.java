package com.example.panchita_api.controller;

import com.example.panchita_api.model.Mesa;
import com.example.panchita_api.model.Reserva;
import com.example.panchita_api.repository.MesaRepository;
import com.example.panchita_api.repository.ReservaRepository;
import com.example.panchita_api.repository.SalaRepository; // 1. Importa el repositorio
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
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
        @RequestParam("hora") @DateTimeFormat(iso = DateTimeFormat.ISO.TIME) LocalTime hora) {
    
    try {
        List<Mesa> todasLasMesas = mesaRepository.findAll();
        // Traemos todas las reservas de esa fecha
List<Reserva> reservasDelDia = reservaRepository.findByFecha(fecha);
        List<Mesa> mesasMapeadas = todasLasMesas.stream().map(mesa -> {
            // Lógica: La mesa está ocupada si hay una reserva en esa fecha y la hora coincide
            boolean estaOcupada = reservasDelDia.stream()
                .anyMatch(r -> r.getMesa().getId().equals(mesa.getId()) && r.getHora().equals(hora));
            
            mesa.setEstado(estaOcupada ? "ocupada" : "disponible");
            return mesa;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(mesasMapeadas);
    } catch (Exception e) {
        return ResponseEntity.internalServerError().body("Error: " + e.getMessage());
    }
}

    // 🚀 Obtener todas las mesas con información de Sala cargada
    @GetMapping
    public ResponseEntity<List<Mesa>> obtenerMesas() {
        List<Mesa> mesas = mesaRepository.findAll();
        
        // 3. Forzamos la carga de la relación para evitar errores de proxy
        mesas.forEach(mesa -> {
            if (mesa.getSala() != null) {
                mesa.getSala().getNombre(); 
            }
        });
        
        return ResponseEntity.ok(mesas);
    }

    // 🛠️ Crear nueva mesa
    @PostMapping
    public ResponseEntity<?> crearMesa(@RequestBody Mesa mesa) {
        if (mesa.getEstado() == null) mesa.setEstado("disponible");
        return ResponseEntity.ok(mesaRepository.save(mesa));
    }
}