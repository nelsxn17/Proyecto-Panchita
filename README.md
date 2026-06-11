# Proyecto La Panchita

Sistema integral de gestión de reservas de restaurante. Este proyecto sigue una arquitectura MVC (Modelo-Vista-Controlador) y aplica principios SOLID para asegurar la escalabilidad y mantenibilidad del software.

## Arquitectura del Proyecto
- **Backend:** Java con Spring Boot.
- **Frontend:** React.js 
- **Persistencia:** MySQL gestionado a través de Spring Data JPA.

## Estructura de Directorios
- `/panchita-api`: Lógica del servidor, controladores REST, modelos y repositorios.
- `/cliente-sistema y administrador`: Interfaz gráfica desarrollada en React.

## Funcionalidades Implementadas
- **Gestión de Reservas:** CRUD completo (Crear, Leer, Actualizar, Borrar).
- **Seguridad:** Configuración de CORS global centralizada para comunicación segura.
- **Filtros:** Búsqueda dinámica de reservas por código.
