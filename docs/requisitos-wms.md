# Requisitos base del WMS

## Objetivo

Construir una plataforma web para gestionar recepcion, almacenamiento, picking, despacho y trazabilidad de inventario en una bodega.

## Roles

- `ADMIN`
- `SUPERVISOR`
- `BODEGUERO`

## Modulos incluidos

- Inventario
- Ubicaciones
- Recepcion
- Despacho
- Proveedores
- Alertas de stock
- Reportes
- Dashboard
- Usuarios y permisos
- Auditoria

## Requerimientos funcionales clave

### Inventario

- Registrar entradas por codigo de barras
- Consultar inventario por producto y ubicacion
- Registrar salidas con orden de despacho
- Hacer ajustes justificados
- Generar alertas de stock minimo

### Ubicaciones

- Configurar pasillos, racks y niveles
- Asignar productos a ubicaciones
- Visualizar ocupacion de bodega

### Recepcion y despacho

- Validar recepcion contra orden de compra
- Generar picking por ubicacion
- Registrar devoluciones

### Reportes y control

- Dashboard con KPIs
- Reportes por rango de fechas
- Ranking de rotacion
- Log de auditoria

## Requerimientos no funcionales

- Respuesta menor a `2s` para el `95%` de solicitudes con hasta `10,000` productos
- JWT con expiracion de `8h`
- bcrypt con `salt=12`
- Uptime minimo `99%`
- Soporte para `50` usuarios concurrentes
- Cobertura de pruebas del backend `>= 60%`

## Prioridad de construccion sugerida

### Fase 1 tecnica

- Autenticacion
- Usuarios
- Productos
- Categorias
- Bodega, secciones, racks y ubicaciones

### Fase 2 operativa

- Ordenes de compra
- Recepciones
- Inventario
- Movimientos

### Fase 3 operativa

- Ordenes de despacho
- Picking
- Alertas
- Reportes
