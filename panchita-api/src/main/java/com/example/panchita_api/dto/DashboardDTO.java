package com.example.panchita_api.dto;

import java.math.BigDecimal;

public class DashboardDTO {
    private BigDecimal ingresosDia;
    private long ordenesActivas;
    private long reservasHoy;
    private BigDecimal ticketPromedio;
    private int[] flujoHorarios;
    private long mesasOcupadas;
    private long mesasTotales;
    // NUEVOS: para comparativa vs. ayer
    private BigDecimal ingresosDiaAnterior;
    private long reservasAyer;

    public DashboardDTO(BigDecimal ingresosDia, long ordenesActivas, long reservasHoy,
                        BigDecimal ticketPromedio, int[] flujoHorarios, long mesasOcupadas,
                        long mesasTotales, BigDecimal ingresosDiaAnterior, long reservasAyer) {
        this.ingresosDia          = ingresosDia          != null ? ingresosDia          : BigDecimal.ZERO;
        this.ordenesActivas       = ordenesActivas;
        this.reservasHoy          = reservasHoy;
        this.ticketPromedio       = ticketPromedio        != null ? ticketPromedio        : BigDecimal.ZERO;
        this.flujoHorarios        = flujoHorarios;
        this.mesasOcupadas        = mesasOcupadas;
        this.mesasTotales         = mesasTotales;
        this.ingresosDiaAnterior  = ingresosDiaAnterior  != null ? ingresosDiaAnterior  : BigDecimal.ZERO;
        this.reservasAyer         = reservasAyer;
    }

    // Getters y Setters existentes
    public BigDecimal getIngresosDia()                    { return ingresosDia; }
    public void setIngresosDia(BigDecimal ingresosDia)    { this.ingresosDia = ingresosDia; }

    public long getOrdenesActivas()                       { return ordenesActivas; }
    public void setOrdenesActivas(long ordenesActivas)    { this.ordenesActivas = ordenesActivas; }

    public long getReservasHoy()                          { return reservasHoy; }
    public void setReservasHoy(long reservasHoy)          { this.reservasHoy = reservasHoy; }

    public BigDecimal getTicketPromedio()                 { return ticketPromedio; }
    public void setTicketPromedio(BigDecimal ticketPromedio) { this.ticketPromedio = ticketPromedio; }

    public int[] getFlujoHorarios()                       { return flujoHorarios; }
    public void setFlujoHorarios(int[] flujoHorarios)     { this.flujoHorarios = flujoHorarios; }

    public long getMesasOcupadas()                        { return mesasOcupadas; }
    public void setMesasOcupadas(long mesasOcupadas)      { this.mesasOcupadas = mesasOcupadas; }

    public long getMesasTotales()                         { return mesasTotales; }
    public void setMesasTotales(long mesasTotales)        { this.mesasTotales = mesasTotales; }

    // Nuevos getters y setters para comparativa
    public BigDecimal getIngresosDiaAnterior()                           { return ingresosDiaAnterior; }
    public void setIngresosDiaAnterior(BigDecimal ingresosDiaAnterior)   { this.ingresosDiaAnterior = ingresosDiaAnterior; }

    public long getReservasAyer()                         { return reservasAyer; }
    public void setReservasAyer(long reservasAyer)        { this.reservasAyer = reservasAyer; }
}