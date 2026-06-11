package com.example.panchita_api.repository;

import com.example.panchita_api.model.Reserva;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public interface ReservaRepository extends JpaRepository<Reserva, Integer> {
    
    List<Reserva> findByFecha(LocalDate fecha);
    boolean existsByMesaIdAndFechaAndHora(Integer mesaId, LocalDate fecha, LocalTime hora);
    
    // 🌟 NUEVO MÉTODO: Actualiza únicamente la columna del estado sin tocar las relaciones de la mesa ni el usuario
    @Modifying
    @Query("UPDATE Reserva r SET r.estadoReserva = :estado WHERE r.id = :id")
    void actualizarEstadoReservaDirecto(@Param("id") Integer id, @Param("estado") String estado);
}
