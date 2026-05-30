-- WMS - script de base de datos PostgreSQL
-- Ejecutar conectado a una base de datos vacia, por ejemplo: wms_db
-- Ejemplo:
--   createdb wms_db
--   psql -d wms_db -f docs/sql/wms_db.sql

BEGIN;

CREATE TYPE "RolUsuario" AS ENUM ('ADMIN', 'SUPERVISOR', 'BODEGUERO');
CREATE TYPE "TipoMovimiento" AS ENUM ('ENTRADA', 'SALIDA', 'AJUSTE', 'TRANSFERENCIA');
CREATE TYPE "EstadoOrdenCompra" AS ENUM ('PENDIENTE', 'PARCIAL', 'COMPLETA');
CREATE TYPE "EstadoOrdenDespacho" AS ENUM ('PENDIENTE', 'EN_PICKING', 'DESPACHADA');

CREATE TABLE "usuarios" (
  "id" UUID NOT NULL,
  "nombre" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "password_hash" TEXT NOT NULL,
  "rol" "RolUsuario" NOT NULL,
  "activo" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "categorias" (
  "id" UUID NOT NULL,
  "nombre" TEXT NOT NULL,
  "descripcion" TEXT,
  CONSTRAINT "categorias_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "productos" (
  "id" UUID NOT NULL,
  "codigo_barras" TEXT NOT NULL,
  "nombre" TEXT NOT NULL,
  "descripcion" TEXT,
  "categoria_id" UUID,
  "unidad_medida" TEXT NOT NULL,
  "stock_minimo" INTEGER NOT NULL DEFAULT 0,
  "stock_maximo" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "productos_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "bodegas" (
  "id" UUID NOT NULL,
  "nombre" TEXT NOT NULL,
  "direccion" TEXT,
  "activa" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "bodegas_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "secciones" (
  "id" UUID NOT NULL,
  "nombre" TEXT NOT NULL,
  "bodega_id" UUID NOT NULL,
  CONSTRAINT "secciones_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "racks" (
  "id" UUID NOT NULL,
  "codigo" TEXT NOT NULL,
  "seccion_id" UUID NOT NULL,
  "capacidad" INTEGER NOT NULL,
  CONSTRAINT "racks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ubicaciones" (
  "id" UUID NOT NULL,
  "codigo" TEXT NOT NULL,
  "rack_id" UUID NOT NULL,
  "nivel" INTEGER NOT NULL,
  "capacidad_max" DECIMAL(10,2) NOT NULL,
  "ocupada" BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "ubicaciones_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "inventarios" (
  "id" UUID NOT NULL,
  "producto_id" UUID NOT NULL,
  "ubicacion_id" UUID NOT NULL,
  "cantidad" DECIMAL(10,2) NOT NULL,
  "fecha_act" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "inventarios_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "movimientos_inventario" (
  "id" UUID NOT NULL,
  "tipo" "TipoMovimiento" NOT NULL,
  "producto_id" UUID NOT NULL,
  "cantidad" DECIMAL(10,2) NOT NULL,
  "usuario_id" UUID NOT NULL,
  "referencia" TEXT,
  "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "movimientos_inventario_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "proveedores" (
  "id" UUID NOT NULL,
  "nombre" TEXT NOT NULL,
  "contacto" TEXT,
  "telefono" TEXT,
  "email" TEXT,
  "activo" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "proveedores_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ordenes_compra" (
  "id" UUID NOT NULL,
  "numero" TEXT NOT NULL,
  "proveedor_id" UUID NOT NULL,
  "estado" "EstadoOrdenCompra" NOT NULL,
  "fecha_emision" DATE NOT NULL,
  "usuario_id" UUID NOT NULL,
  CONSTRAINT "ordenes_compra_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "detalles_orden_compra" (
  "id" UUID NOT NULL,
  "orden_compra_id" UUID NOT NULL,
  "producto_id" UUID NOT NULL,
  "cantidad" DECIMAL(10,2) NOT NULL,
  "precio_unitario" DECIMAL(10,2),
  CONSTRAINT "detalles_orden_compra_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "recepciones" (
  "id" UUID NOT NULL,
  "orden_compra_id" UUID NOT NULL,
  "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "usuario_id" UUID NOT NULL,
  "observaciones" TEXT,
  CONSTRAINT "recepciones_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "detalles_recepcion" (
  "id" UUID NOT NULL,
  "recepcion_id" UUID NOT NULL,
  "producto_id" UUID NOT NULL,
  "cantidad_esperada" DECIMAL(10,2) NOT NULL,
  "cantidad_recibida" DECIMAL(10,2) NOT NULL,
  "ubicacion_id" UUID NOT NULL,
  CONSTRAINT "detalles_recepcion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ordenes_despacho" (
  "id" UUID NOT NULL,
  "numero" TEXT NOT NULL,
  "cliente" TEXT NOT NULL,
  "estado" "EstadoOrdenDespacho" NOT NULL,
  "fecha_requerida" DATE NOT NULL,
  "usuario_id" UUID NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ordenes_despacho_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "detalles_despacho" (
  "id" UUID NOT NULL,
  "orden_despacho_id" UUID NOT NULL,
  "producto_id" UUID NOT NULL,
  "cantidad" DECIMAL(10,2) NOT NULL,
  "ubicacion_id" UUID NOT NULL,
  "recogido" BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "detalles_despacho_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "auditorias" (
  "id" UUID NOT NULL,
  "usuario_id" UUID NOT NULL,
  "accion" TEXT NOT NULL,
  "ip_origen" TEXT,
  "metadata" JSONB,
  "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "auditorias_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");
CREATE UNIQUE INDEX "categorias_nombre_key" ON "categorias"("nombre");
CREATE UNIQUE INDEX "productos_codigo_barras_key" ON "productos"("codigo_barras");
CREATE UNIQUE INDEX "racks_codigo_key" ON "racks"("codigo");
CREATE UNIQUE INDEX "ubicaciones_codigo_key" ON "ubicaciones"("codigo");
CREATE UNIQUE INDEX "inventarios_producto_id_ubicacion_id_key" ON "inventarios"("producto_id", "ubicacion_id");
CREATE UNIQUE INDEX "ordenes_compra_numero_key" ON "ordenes_compra"("numero");
CREATE UNIQUE INDEX "ordenes_despacho_numero_key" ON "ordenes_despacho"("numero");

ALTER TABLE "productos" ADD CONSTRAINT "productos_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "secciones" ADD CONSTRAINT "secciones_bodega_id_fkey" FOREIGN KEY ("bodega_id") REFERENCES "bodegas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "racks" ADD CONSTRAINT "racks_seccion_id_fkey" FOREIGN KEY ("seccion_id") REFERENCES "secciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ubicaciones" ADD CONSTRAINT "ubicaciones_rack_id_fkey" FOREIGN KEY ("rack_id") REFERENCES "racks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "inventarios" ADD CONSTRAINT "inventarios_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "inventarios" ADD CONSTRAINT "inventarios_ubicacion_id_fkey" FOREIGN KEY ("ubicacion_id") REFERENCES "ubicaciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ordenes_compra" ADD CONSTRAINT "ordenes_compra_proveedor_id_fkey" FOREIGN KEY ("proveedor_id") REFERENCES "proveedores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ordenes_compra" ADD CONSTRAINT "ordenes_compra_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "detalles_orden_compra" ADD CONSTRAINT "detalles_orden_compra_orden_compra_id_fkey" FOREIGN KEY ("orden_compra_id") REFERENCES "ordenes_compra"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "detalles_orden_compra" ADD CONSTRAINT "detalles_orden_compra_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "recepciones" ADD CONSTRAINT "recepciones_orden_compra_id_fkey" FOREIGN KEY ("orden_compra_id") REFERENCES "ordenes_compra"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "recepciones" ADD CONSTRAINT "recepciones_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "detalles_recepcion" ADD CONSTRAINT "detalles_recepcion_recepcion_id_fkey" FOREIGN KEY ("recepcion_id") REFERENCES "recepciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "detalles_recepcion" ADD CONSTRAINT "detalles_recepcion_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "detalles_recepcion" ADD CONSTRAINT "detalles_recepcion_ubicacion_id_fkey" FOREIGN KEY ("ubicacion_id") REFERENCES "ubicaciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ordenes_despacho" ADD CONSTRAINT "ordenes_despacho_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "detalles_despacho" ADD CONSTRAINT "detalles_despacho_orden_despacho_id_fkey" FOREIGN KEY ("orden_despacho_id") REFERENCES "ordenes_despacho"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "detalles_despacho" ADD CONSTRAINT "detalles_despacho_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "detalles_despacho" ADD CONSTRAINT "detalles_despacho_ubicacion_id_fkey" FOREIGN KEY ("ubicacion_id") REFERENCES "ubicaciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "auditorias" ADD CONSTRAINT "auditorias_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Datos iniciales equivalentes al seed de Prisma
INSERT INTO "usuarios" ("id", "nombre", "email", "password_hash", "rol", "activo") VALUES
  ('11111111-1111-1111-1111-111111111111', 'Administrador WMS', 'admin@wms.local', '$2b$12$ZlmXHLOTR0QjjsQKn2qDCO2LuVfB3nu7Rem09INwXo2EShlKqTQXq', 'ADMIN', true),
  ('22222222-2222-2222-2222-222222222222', 'Supervisor Logistico', 'supervisor@wms.local', '$2b$12$1Scne85x8q5Q4r0WxU0/C.vn3HcW6sQZec6TKr.HtZGKEkND033sq', 'SUPERVISOR', true),
  ('33333333-3333-3333-3333-333333333333', 'Bodeguero Operativo', 'bodeguero@wms.local', '$2b$12$QCWJ69w.284LxogjhHNC1OJGL8Dj53jb2YdrhmcLPSbV7JGi1C6Ve', 'BODEGUERO', true);

INSERT INTO "categorias" ("id", "nombre", "descripcion") VALUES
  ('44444444-4444-4444-4444-444444444444', 'Bebidas', 'Productos embotellados y enlatados'),
  ('55555555-5555-5555-5555-555555555555', 'Snacks', 'Alimentos empacados de alta rotacion');

INSERT INTO "productos" ("id", "codigo_barras", "nombre", "descripcion", "categoria_id", "unidad_medida", "stock_minimo", "stock_maximo") VALUES
  ('66666666-6666-6666-6666-666666666666', '750100000001', 'Agua Purificada 600ml', NULL, '44444444-4444-4444-4444-444444444444', 'UND', 20, 200),
  ('77777777-7777-7777-7777-777777777777', '750100000002', 'Galleta Integral', NULL, '55555555-5555-5555-5555-555555555555', 'UND', 10, 120);

INSERT INTO "bodegas" ("id", "nombre", "direccion", "activa") VALUES
  ('4cf9a8c9-90bd-4210-8d45-2ef8fdbe96b0', 'Bodega Central', 'Zona 12, Guatemala', true);

INSERT INTO "secciones" ("id", "nombre", "bodega_id") VALUES
  ('ea515548-0a96-41e9-80de-54f9245b50d8', 'Sector A', '4cf9a8c9-90bd-4210-8d45-2ef8fdbe96b0');

INSERT INTO "racks" ("id", "codigo", "seccion_id", "capacidad") VALUES
  ('88888888-8888-8888-8888-888888888888', 'A-01', 'ea515548-0a96-41e9-80de-54f9245b50d8', 3);

INSERT INTO "ubicaciones" ("id", "codigo", "rack_id", "nivel", "capacidad_max", "ocupada") VALUES
  ('99999999-9999-9999-9999-999999999999', 'A-01-N1', '88888888-8888-8888-8888-888888888888', 1, 120.00, true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'A-01-N2', '88888888-8888-8888-8888-888888888888', 2, 90.00, true);

INSERT INTO "inventarios" ("id", "producto_id", "ubicacion_id", "cantidad") VALUES
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '66666666-6666-6666-6666-666666666666', '99999999-9999-9999-9999-999999999999', 55.00),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '77777777-7777-7777-7777-777777777777', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 18.00);

INSERT INTO "proveedores" ("id", "nombre", "contacto", "telefono", "email", "activo") VALUES
  ('c395b9e7-48a8-456d-a7ad-8f54af8de2cb', 'Distribuidora Central', 'Carlos Perez', '5555-0101', 'compras@distribuidoracentral.gt', true);

INSERT INTO "ordenes_compra" ("id", "numero", "proveedor_id", "estado", "fecha_emision", "usuario_id") VALUES
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'OC-0001', 'c395b9e7-48a8-456d-a7ad-8f54af8de2cb', 'COMPLETA', '2026-05-08', '22222222-2222-2222-2222-222222222222');

INSERT INTO "detalles_orden_compra" ("id", "orden_compra_id", "producto_id", "cantidad", "precio_unitario") VALUES
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '66666666-6666-6666-6666-666666666666', 40.00, 3.50),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '77777777-7777-7777-7777-777777777777', 25.00, 2.25);

INSERT INTO "ordenes_despacho" ("id", "numero", "cliente", "estado", "fecha_requerida", "usuario_id") VALUES
  ('12121212-1212-1212-1212-121212121212', 'OD-0001', 'Cliente Mayorista Uno', 'EN_PICKING', '2026-05-10', '22222222-2222-2222-2222-222222222222');

INSERT INTO "detalles_despacho" ("id", "orden_despacho_id", "producto_id", "cantidad", "ubicacion_id", "recogido") VALUES
  ('13131313-1313-1313-1313-131313131313', '12121212-1212-1212-1212-121212121212', '66666666-6666-6666-6666-666666666666', 10.00, '99999999-9999-9999-9999-999999999999', false);

INSERT INTO "movimientos_inventario" ("id", "tipo", "producto_id", "cantidad", "usuario_id", "referencia") VALUES
  ('14141414-1414-1414-1414-141414141414', 'ENTRADA', '66666666-6666-6666-6666-666666666666', 55.00, '11111111-1111-1111-1111-111111111111', 'SEED-INIT'),
  ('15151515-1515-1515-1515-151515151515', 'ENTRADA', '77777777-7777-7777-7777-777777777777', 18.00, '33333333-3333-3333-3333-333333333333', 'SEED-INIT');

COMMIT;
