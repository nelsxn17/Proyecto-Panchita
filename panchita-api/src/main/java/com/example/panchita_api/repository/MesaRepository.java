package com.example.panchita_api.repository;

import com.example.panchita_api.model.Mesa;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface MesaRepository extends JpaRepository<Mesa, Integer> {

// En MesaRepository.java
// Esto busca cualquier reserva que caiga en la fecha solicitada
@Query("SELECT r.mesa.id FROM Reserva r WHERE r.fecha = :fecha")
List<Integer> findIdsMesasReservadasEnFecha(@Param("fecha") LocalDate fecha);
}