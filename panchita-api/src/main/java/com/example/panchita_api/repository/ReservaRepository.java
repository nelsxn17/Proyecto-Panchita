package com.example.panchita_api.repository;

import com.example.panchita_api.model.Reserva;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public interface ReservaRepository extends JpaRepository<Reserva, Integer> {
    
    // Agrega esta línea para que el repositorio sepa cómo buscar por fecha
    List<Reserva> findByFecha(LocalDate fecha);
    boolean existsByMesaIdAndFechaAndHora(Integer mesaId, LocalDate fecha, LocalTime hora);
    
}