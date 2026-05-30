-- CreateEnum
CREATE TYPE "RolUsuario" AS ENUM ('ADMIN', 'SUPERVISOR', 'BODEGUERO');

-- CreateEnum
CREATE TYPE "TipoMovimiento" AS ENUM ('ENTRADA', 'SALIDA', 'AJUSTE', 'TRANSFERENCIA');

-- CreateEnum
CREATE TYPE "EstadoOrdenCompra" AS ENUM ('PENDIENTE', 'PARCIAL', 'COMPLETA');

-- CreateEnum
CREATE TYPE "EstadoOrdenDespacho" AS ENUM ('PENDIENTE', 'EN_PICKING', 'DESPACHADA');

-- CreateTable
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

-- CreateTable
CREATE TABLE "configuraciones_rol" (
    "id" UUID NOT NULL,
    "rol" "RolUsuario" NOT NULL,
    "descripcion" TEXT NOT NULL,
    "permisos" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "configuraciones_rol_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias" (
    "id" UUID NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
CREATE TABLE "bodegas" (
    "id" UUID NOT NULL,
    "nombre" TEXT NOT NULL,
    "direccion" TEXT,
    "activa" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "bodegas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "secciones" (
    "id" UUID NOT NULL,
    "nombre" TEXT NOT NULL,
    "bodega_id" UUID NOT NULL,

    CONSTRAINT "secciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "racks" (
    "id" UUID NOT NULL,
    "codigo" TEXT NOT NULL,
    "seccion_id" UUID NOT NULL,
    "capacidad" INTEGER NOT NULL,

    CONSTRAINT "racks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ubicaciones" (
    "id" UUID NOT NULL,
    "codigo" TEXT NOT NULL,
    "rack_id" UUID NOT NULL,
    "nivel" INTEGER NOT NULL,
    "capacidad_max" DECIMAL(10,2) NOT NULL,
    "ocupada" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ubicaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventarios" (
    "id" UUID NOT NULL,
    "producto_id" UUID NOT NULL,
    "ubicacion_id" UUID NOT NULL,
    "cantidad" DECIMAL(10,2) NOT NULL,
    "fecha_act" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
CREATE TABLE "proveedores" (
    "id" UUID NOT NULL,
    "nombre" TEXT NOT NULL,
    "contacto" TEXT,
    "telefono" TEXT,
    "email" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "proveedores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" UUID NOT NULL,
    "codigo" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT,
    "telefono" TEXT,
    "direccion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ordenes_compra" (
    "id" UUID NOT NULL,
    "numero" TEXT NOT NULL,
    "proveedor_id" UUID NOT NULL,
    "estado" "EstadoOrdenCompra" NOT NULL,
    "fecha_emision" DATE NOT NULL,
    "usuario_id" UUID NOT NULL,

    CONSTRAINT "ordenes_compra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "detalles_orden_compra" (
    "id" UUID NOT NULL,
    "orden_compra_id" UUID NOT NULL,
    "producto_id" UUID NOT NULL,
    "cantidad" DECIMAL(10,2) NOT NULL,
    "precio_unitario" DECIMAL(10,2),

    CONSTRAINT "detalles_orden_compra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recepciones" (
    "id" UUID NOT NULL,
    "orden_compra_id" UUID NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuario_id" UUID NOT NULL,
    "observaciones" TEXT,

    CONSTRAINT "recepciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "detalles_recepcion" (
    "id" UUID NOT NULL,
    "recepcion_id" UUID NOT NULL,
    "producto_id" UUID NOT NULL,
    "cantidad_esperada" DECIMAL(10,2) NOT NULL,
    "cantidad_recibida" DECIMAL(10,2) NOT NULL,
    "ubicacion_id" UUID NOT NULL,

    CONSTRAINT "detalles_recepcion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ordenes_despacho" (
    "id" UUID NOT NULL,
    "numero" TEXT NOT NULL,
    "cliente" TEXT NOT NULL,
    "cliente_id" UUID,
    "estado" "EstadoOrdenDespacho" NOT NULL,
    "fecha_requerida" DATE NOT NULL,
    "usuario_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ordenes_despacho_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "detalles_despacho" (
    "id" UUID NOT NULL,
    "orden_despacho_id" UUID NOT NULL,
    "producto_id" UUID NOT NULL,
    "cantidad" DECIMAL(10,2) NOT NULL,
    "ubicacion_id" UUID NOT NULL,
    "recogido" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "detalles_despacho_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "devoluciones_despacho" (
    "id" UUID NOT NULL,
    "orden_despacho_id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "motivo" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "devoluciones_despacho_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "detalles_devolucion_despacho" (
    "id" UUID NOT NULL,
    "devolucion_id" UUID NOT NULL,
    "detalle_despacho_id" UUID NOT NULL,
    "cantidad" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "detalles_devolucion_despacho_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auditorias" (
    "id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "accion" TEXT NOT NULL,
    "ip_origen" TEXT,
    "metadata" JSONB,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auditorias_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "configuraciones_rol_rol_key" ON "configuraciones_rol"("rol");

-- CreateIndex
CREATE UNIQUE INDEX "categorias_nombre_key" ON "categorias"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "productos_codigo_barras_key" ON "productos"("codigo_barras");

-- CreateIndex
CREATE UNIQUE INDEX "racks_codigo_key" ON "racks"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "ubicaciones_codigo_key" ON "ubicaciones"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "inventarios_producto_id_ubicacion_id_key" ON "inventarios"("producto_id", "ubicacion_id");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_codigo_key" ON "clientes"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "ordenes_compra_numero_key" ON "ordenes_compra"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "ordenes_despacho_numero_key" ON "ordenes_despacho"("numero");

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "productos_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "secciones" ADD CONSTRAINT "secciones_bodega_id_fkey" FOREIGN KEY ("bodega_id") REFERENCES "bodegas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "racks" ADD CONSTRAINT "racks_seccion_id_fkey" FOREIGN KEY ("seccion_id") REFERENCES "secciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ubicaciones" ADD CONSTRAINT "ubicaciones_rack_id_fkey" FOREIGN KEY ("rack_id") REFERENCES "racks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventarios" ADD CONSTRAINT "inventarios_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventarios" ADD CONSTRAINT "inventarios_ubicacion_id_fkey" FOREIGN KEY ("ubicacion_id") REFERENCES "ubicaciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes_compra" ADD CONSTRAINT "ordenes_compra_proveedor_id_fkey" FOREIGN KEY ("proveedor_id") REFERENCES "proveedores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes_compra" ADD CONSTRAINT "ordenes_compra_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalles_orden_compra" ADD CONSTRAINT "detalles_orden_compra_orden_compra_id_fkey" FOREIGN KEY ("orden_compra_id") REFERENCES "ordenes_compra"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalles_orden_compra" ADD CONSTRAINT "detalles_orden_compra_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recepciones" ADD CONSTRAINT "recepciones_orden_compra_id_fkey" FOREIGN KEY ("orden_compra_id") REFERENCES "ordenes_compra"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recepciones" ADD CONSTRAINT "recepciones_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalles_recepcion" ADD CONSTRAINT "detalles_recepcion_recepcion_id_fkey" FOREIGN KEY ("recepcion_id") REFERENCES "recepciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalles_recepcion" ADD CONSTRAINT "detalles_recepcion_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalles_recepcion" ADD CONSTRAINT "detalles_recepcion_ubicacion_id_fkey" FOREIGN KEY ("ubicacion_id") REFERENCES "ubicaciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes_despacho" ADD CONSTRAINT "ordenes_despacho_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes_despacho" ADD CONSTRAINT "ordenes_despacho_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalles_despacho" ADD CONSTRAINT "detalles_despacho_orden_despacho_id_fkey" FOREIGN KEY ("orden_despacho_id") REFERENCES "ordenes_despacho"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalles_despacho" ADD CONSTRAINT "detalles_despacho_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalles_despacho" ADD CONSTRAINT "detalles_despacho_ubicacion_id_fkey" FOREIGN KEY ("ubicacion_id") REFERENCES "ubicaciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devoluciones_despacho" ADD CONSTRAINT "devoluciones_despacho_orden_despacho_id_fkey" FOREIGN KEY ("orden_despacho_id") REFERENCES "ordenes_despacho"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devoluciones_despacho" ADD CONSTRAINT "devoluciones_despacho_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalles_devolucion_despacho" ADD CONSTRAINT "detalles_devolucion_despacho_devolucion_id_fkey" FOREIGN KEY ("devolucion_id") REFERENCES "devoluciones_despacho"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalles_devolucion_despacho" ADD CONSTRAINT "detalles_devolucion_despacho_detalle_despacho_id_fkey" FOREIGN KEY ("detalle_despacho_id") REFERENCES "detalles_despacho"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auditorias" ADD CONSTRAINT "auditorias_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

