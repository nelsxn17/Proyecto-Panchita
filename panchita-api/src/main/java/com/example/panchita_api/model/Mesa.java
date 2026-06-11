package com.example.panchita_api.model;

import javax.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties; // Importante para evitar errores

@Entity
@Table(name = "mesas")
public class Mesa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id; // 👈 Cambiado de Long a Integer para tu INT de MySQL

    @Column(name = "sala_id", nullable = false)
    private Integer salaId; // 👈 Cambiado de Long a Integer

    // --- AGREGA ESTO AQUÍ ---
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sala_id", insertable = false, updatable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Sala sala;

    @ManyToOne
@JoinColumn(name = "reserva_id") // Asegúrate que la mesa tenga esta columna
private Reserva reserva;

    @Column(nullable = false, length = 10)
    private String numero;

    @Column(nullable = false)
    private Integer capacidad;

    @Column(length = 20)
    private String estado = "disponible";

    @Column(length = 50)
    private String ubicacion;

    // Constructor vacío exigido por JPA
    public Mesa() {}

    public Sala getSala() {
        return sala;
    }

    // Getters y Setters Actualizados
    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public Integer getSalaId() { return salaId; }
    public void setSalaId(Integer salaId) { this.salaId = salaId; }

    public String getNumero() { return numero; }
    public void setNumero(String numero) { this.numero = numero; }

    public Integer getCapacidad() { return capacidad; }
    public void setCapacidad(Integer capacidad) { this.capacidad = capacidad; }

    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }

    public String getUbicacion() { return ubicacion; } // 👈 Corregido el nombre del método (getUlocation -> getUbicacion)
    public void setUbicacion(String ubicacion) { this.ubicacion = ubicacion; }
}