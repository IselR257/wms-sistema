--
-- PostgreSQL database dump
--

\restrict ih19W5HQvsO73Xfq3m8LayEbGreRiaurphWgcSxSbkk4PFb1OVQ0E7SgX8XrU88

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: EstadoOrdenCompra; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."EstadoOrdenCompra" AS ENUM (
    'PENDIENTE',
    'PARCIAL',
    'COMPLETA'
);


ALTER TYPE public."EstadoOrdenCompra" OWNER TO postgres;

--
-- Name: EstadoOrdenDespacho; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."EstadoOrdenDespacho" AS ENUM (
    'PENDIENTE',
    'EN_PICKING',
    'DESPACHADA'
);


ALTER TYPE public."EstadoOrdenDespacho" OWNER TO postgres;

--
-- Name: RolUsuario; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."RolUsuario" AS ENUM (
    'ADMIN',
    'SUPERVISOR',
    'BODEGUERO'
);


ALTER TYPE public."RolUsuario" OWNER TO postgres;

--
-- Name: TipoMovimiento; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."TipoMovimiento" AS ENUM (
    'ENTRADA',
    'SALIDA',
    'AJUSTE',
    'TRANSFERENCIA'
);


ALTER TYPE public."TipoMovimiento" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: auditorias; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.auditorias (
    id uuid NOT NULL,
    usuario_id uuid NOT NULL,
    accion text NOT NULL,
    ip_origen text,
    metadata jsonb,
    fecha timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.auditorias OWNER TO postgres;

--
-- Name: bodegas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bodegas (
    id uuid NOT NULL,
    nombre text NOT NULL,
    direccion text,
    activa boolean DEFAULT true NOT NULL
);


ALTER TABLE public.bodegas OWNER TO postgres;

--
-- Name: categorias; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.categorias (
    id uuid NOT NULL,
    nombre text NOT NULL,
    descripcion text
);


ALTER TABLE public.categorias OWNER TO postgres;

--
-- Name: clientes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.clientes (
    id uuid NOT NULL,
    nombre text NOT NULL,
    email text,
    telefono text,
    direccion text,
    activo boolean DEFAULT true NOT NULL,
    codigo integer NOT NULL
);


ALTER TABLE public.clientes OWNER TO postgres;

--
-- Name: clientes_codigo_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.clientes_codigo_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.clientes_codigo_seq OWNER TO postgres;

--
-- Name: clientes_codigo_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.clientes_codigo_seq OWNED BY public.clientes.codigo;


--
-- Name: configuraciones_rol; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.configuraciones_rol (
    id uuid NOT NULL,
    rol public."RolUsuario" NOT NULL,
    descripcion text NOT NULL,
    permisos text[],
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.configuraciones_rol OWNER TO postgres;

--
-- Name: detalles_despacho; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.detalles_despacho (
    id uuid NOT NULL,
    orden_despacho_id uuid NOT NULL,
    producto_id uuid NOT NULL,
    cantidad numeric(10,2) NOT NULL,
    ubicacion_id uuid NOT NULL,
    recogido boolean DEFAULT false NOT NULL
);


ALTER TABLE public.detalles_despacho OWNER TO postgres;

--
-- Name: detalles_devolucion_despacho; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.detalles_devolucion_despacho (
    id uuid NOT NULL,
    devolucion_id uuid NOT NULL,
    detalle_despacho_id uuid NOT NULL,
    cantidad numeric(10,2) NOT NULL
);


ALTER TABLE public.detalles_devolucion_despacho OWNER TO postgres;

--
-- Name: detalles_orden_compra; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.detalles_orden_compra (
    id uuid NOT NULL,
    orden_compra_id uuid NOT NULL,
    producto_id uuid NOT NULL,
    cantidad numeric(10,2) NOT NULL,
    precio_unitario numeric(10,2)
);


ALTER TABLE public.detalles_orden_compra OWNER TO postgres;

--
-- Name: detalles_recepcion; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.detalles_recepcion (
    id uuid NOT NULL,
    recepcion_id uuid NOT NULL,
    producto_id uuid NOT NULL,
    cantidad_esperada numeric(10,2) NOT NULL,
    cantidad_recibida numeric(10,2) NOT NULL,
    ubicacion_id uuid NOT NULL
);


ALTER TABLE public.detalles_recepcion OWNER TO postgres;

--
-- Name: devoluciones_despacho; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.devoluciones_despacho (
    id uuid NOT NULL,
    orden_despacho_id uuid NOT NULL,
    usuario_id uuid NOT NULL,
    motivo text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.devoluciones_despacho OWNER TO postgres;

--
-- Name: inventarios; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.inventarios (
    id uuid NOT NULL,
    producto_id uuid NOT NULL,
    ubicacion_id uuid NOT NULL,
    cantidad numeric(10,2) NOT NULL,
    fecha_act timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.inventarios OWNER TO postgres;

--
-- Name: movimientos_inventario; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.movimientos_inventario (
    id uuid NOT NULL,
    tipo public."TipoMovimiento" NOT NULL,
    producto_id uuid NOT NULL,
    cantidad numeric(10,2) NOT NULL,
    usuario_id uuid NOT NULL,
    referencia text,
    fecha timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.movimientos_inventario OWNER TO postgres;

--
-- Name: ordenes_compra; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ordenes_compra (
    id uuid NOT NULL,
    numero text NOT NULL,
    proveedor_id uuid NOT NULL,
    estado public."EstadoOrdenCompra" NOT NULL,
    fecha_emision date NOT NULL,
    usuario_id uuid NOT NULL
);


ALTER TABLE public.ordenes_compra OWNER TO postgres;

--
-- Name: ordenes_despacho; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ordenes_despacho (
    id uuid NOT NULL,
    numero text NOT NULL,
    cliente text NOT NULL,
    estado public."EstadoOrdenDespacho" NOT NULL,
    fecha_requerida date NOT NULL,
    usuario_id uuid NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    cliente_id uuid
);


ALTER TABLE public.ordenes_despacho OWNER TO postgres;

--
-- Name: productos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.productos (
    id uuid NOT NULL,
    codigo_barras text NOT NULL,
    nombre text NOT NULL,
    descripcion text,
    categoria_id uuid,
    unidad_medida text NOT NULL,
    stock_minimo integer DEFAULT 0 NOT NULL,
    stock_maximo integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.productos OWNER TO postgres;

--
-- Name: proveedores; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.proveedores (
    id uuid NOT NULL,
    nombre text NOT NULL,
    contacto text,
    telefono text,
    email text,
    activo boolean DEFAULT true NOT NULL
);


ALTER TABLE public.proveedores OWNER TO postgres;

--
-- Name: racks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.racks (
    id uuid NOT NULL,
    codigo text NOT NULL,
    seccion_id uuid NOT NULL,
    capacidad integer NOT NULL
);


ALTER TABLE public.racks OWNER TO postgres;

--
-- Name: recepciones; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.recepciones (
    id uuid NOT NULL,
    orden_compra_id uuid NOT NULL,
    fecha timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    usuario_id uuid NOT NULL,
    observaciones text
);


ALTER TABLE public.recepciones OWNER TO postgres;

--
-- Name: secciones; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.secciones (
    id uuid NOT NULL,
    nombre text NOT NULL,
    bodega_id uuid NOT NULL
);


ALTER TABLE public.secciones OWNER TO postgres;

--
-- Name: ubicaciones; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ubicaciones (
    id uuid NOT NULL,
    codigo text NOT NULL,
    rack_id uuid NOT NULL,
    nivel integer NOT NULL,
    capacidad_max numeric(10,2) NOT NULL,
    ocupada boolean DEFAULT false NOT NULL
);


ALTER TABLE public.ubicaciones OWNER TO postgres;

--
-- Name: usuarios; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.usuarios (
    id uuid NOT NULL,
    nombre text NOT NULL,
    email text NOT NULL,
    password_hash text NOT NULL,
    rol public."RolUsuario" NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.usuarios OWNER TO postgres;

--
-- Name: clientes codigo; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clientes ALTER COLUMN codigo SET DEFAULT nextval('public.clientes_codigo_seq'::regclass);


--
-- Data for Name: auditorias; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.auditorias (id, usuario_id, accion, ip_origen, metadata, fecha) VALUES ('feb98a51-7d98-4db1-83ae-bb38eab82674', '11111111-1111-1111-1111-111111111111', 'DESPACHO_FINALIZADO', '::1', '{"ordenDespachoId": "12121212-1212-1212-1212-121212121212"}', '2026-05-15 04:44:52.823');
INSERT INTO public.auditorias (id, usuario_id, accion, ip_origen, metadata, fecha) VALUES ('dad8eb5d-ee03-4bda-90ae-24b16b0ff19e', '11111111-1111-1111-1111-111111111111', 'DEVOLUCION_REGISTRADA', '::1', '{"items": [{"motivo": "Devolucion de prueba funcional", "producto": "Agua Purificada 600ml", "detalleId": "13131313-1313-1313-1313-131313131313", "ubicacion": "A-01-N1", "cantidadDevuelta": 1}], "numero": "OD-0001", "ordenDespachoId": "12121212-1212-1212-1212-121212121212"}', '2026-05-16 01:58:01.004');
INSERT INTO public.auditorias (id, usuario_id, accion, ip_origen, metadata, fecha) VALUES ('66f3cc28-2c70-4015-9aa4-43d5ca5f5c02', '11111111-1111-1111-1111-111111111111', 'ORDEN_COMPRA_CREADA', '::1', '{"numero": "OC-0099", "ordenCompraId": "7cbe2602-1d4d-40e8-98b5-3af75a0a125a"}', '2026-05-16 04:48:56.31');
INSERT INTO public.auditorias (id, usuario_id, accion, ip_origen, metadata, fecha) VALUES ('195e8711-e878-49c3-9e16-d51bc536d194', '11111111-1111-1111-1111-111111111111', 'ORDEN_COMPRA_CREADA', '::1', '{"numero": "C2223", "ordenCompraId": "366c97ca-3fc4-4f10-99f3-ea1c5eafbbb8"}', '2026-05-16 04:55:56.94');
INSERT INTO public.auditorias (id, usuario_id, accion, ip_origen, metadata, fecha) VALUES ('c8c2839b-6341-4e5d-886a-9534051a3f7e', '11111111-1111-1111-1111-111111111111', 'RECEPCION_REGISTRADA', '::1', '{"recepcionId": "36a39aae-f6b8-4b3d-aef5-ea8246f3808f", "ordenCompraId": "366c97ca-3fc4-4f10-99f3-ea1c5eafbbb8"}', '2026-05-16 04:57:39.853');
INSERT INTO public.auditorias (id, usuario_id, accion, ip_origen, metadata, fecha) VALUES ('93f738da-d11e-43b3-858b-0c99801d4b28', '11111111-1111-1111-1111-111111111111', 'ORDEN_DESPACHO_CREADA', '::1', '{"numero": "OD-0002", "ordenDespachoId": "c4cf9f3b-8bc3-4eca-8b13-dd5967a8854c"}', '2026-05-17 03:00:25.536');
INSERT INTO public.auditorias (id, usuario_id, accion, ip_origen, metadata, fecha) VALUES ('006e9be4-7d3f-4df8-9f07-dbf1100f4c15', '11111111-1111-1111-1111-111111111111', 'ORDEN_COMPRA_CREADA', '::1', '{"numero": "OC-0009", "ordenCompraId": "7926cb6c-826c-4bfd-bfe9-561781d40c15"}', '2026-05-17 03:01:21.071');
INSERT INTO public.auditorias (id, usuario_id, accion, ip_origen, metadata, fecha) VALUES ('0877add6-9101-42b5-a65b-72f3c4a0cc7e', '11111111-1111-1111-1111-111111111111', 'RECEPCION_REGISTRADA', '::1', '{"recepcionId": "5ffa8b6a-3f86-4117-bc90-ed50c5b13b82", "ordenCompraId": "7926cb6c-826c-4bfd-bfe9-561781d40c15"}', '2026-05-17 03:01:51.167');
INSERT INTO public.auditorias (id, usuario_id, accion, ip_origen, metadata, fecha) VALUES ('11b1bb5b-c62d-4ab5-a930-5a3eacd0a235', '11111111-1111-1111-1111-111111111111', 'RECEPCION_REGISTRADA', '::1', '{"recepcionId": "6e74e22a-091e-4f91-9875-c71ff9c76d7f", "ordenCompraId": "7cbe2602-1d4d-40e8-98b5-3af75a0a125a"}', '2026-05-17 03:15:24.879');
INSERT INTO public.auditorias (id, usuario_id, accion, ip_origen, metadata, fecha) VALUES ('c57a840f-a279-4dd2-a1c2-19ac984f750f', '11111111-1111-1111-1111-111111111111', 'DESPACHO_FINALIZADO', '::1', '{"ordenDespachoId": "c4cf9f3b-8bc3-4eca-8b13-dd5967a8854c"}', '2026-05-17 03:40:26.802');
INSERT INTO public.auditorias (id, usuario_id, accion, ip_origen, metadata, fecha) VALUES ('92df47d3-9646-40e5-b9ff-dcf6fe272793', '11111111-1111-1111-1111-111111111111', 'ORDEN_DESPACHO_CREADA', '::1', '{"numero": "OD-0004", "ordenDespachoId": "b54a7063-97a4-4e5a-b047-025bcfef01e4"}', '2026-05-17 04:09:41.778');
INSERT INTO public.auditorias (id, usuario_id, accion, ip_origen, metadata, fecha) VALUES ('937ec615-2a8c-48ff-83e9-9382ef66b6a3', '11111111-1111-1111-1111-111111111111', 'ORDEN_DESPACHO_CREADA', '::1', '{"numero": "OD-0005", "ordenDespachoId": "f3b7bfed-b0c3-4f40-91ac-4fbae59008d7"}', '2026-05-17 04:19:59.57');
INSERT INTO public.auditorias (id, usuario_id, accion, ip_origen, metadata, fecha) VALUES ('2b9ee93e-f02e-4590-9d37-ff456d7c948c', '11111111-1111-1111-1111-111111111111', 'PICKING_GENERADO', '::1', '{"ordenDespachoId": "b54a7063-97a4-4e5a-b047-025bcfef01e4"}', '2026-05-17 04:20:15.914');
INSERT INTO public.auditorias (id, usuario_id, accion, ip_origen, metadata, fecha) VALUES ('d1b12c21-1f77-4b18-af75-25de8fe7c0fe', '11111111-1111-1111-1111-111111111111', 'PICKING_GENERADO', '::1', '{"ordenDespachoId": "f3b7bfed-b0c3-4f40-91ac-4fbae59008d7"}', '2026-05-17 04:25:21.145');
INSERT INTO public.auditorias (id, usuario_id, accion, ip_origen, metadata, fecha) VALUES ('8b61bdda-36f3-4153-9f8b-cd3dc863ddc9', '11111111-1111-1111-1111-111111111111', 'ORDEN_COMPRA_CREADA', '::1', '{"numero": "OC-2225", "ordenCompraId": "0b95e0a2-1cfc-42b6-98e6-9e3a6fb18e89"}', '2026-05-17 04:27:56.849');
INSERT INTO public.auditorias (id, usuario_id, accion, ip_origen, metadata, fecha) VALUES ('bdf6b4fe-fb04-40ac-8ba5-205388376bf8', '11111111-1111-1111-1111-111111111111', 'RECEPCION_REGISTRADA', '::1', '{"recepcionId": "60b9a074-2914-4d0f-9135-8b36472979ed", "ordenCompraId": "0b95e0a2-1cfc-42b6-98e6-9e3a6fb18e89"}', '2026-05-17 04:28:23.212');
INSERT INTO public.auditorias (id, usuario_id, accion, ip_origen, metadata, fecha) VALUES ('e586ad2e-8f67-4355-8fd6-d10aa6aedf8d', '11111111-1111-1111-1111-111111111111', 'ORDEN_COMPRA_CREADA', '::1', '{"numero": "OC-2226", "ordenCompraId": "e51b71a8-d84b-41a0-bfb1-61bd7554d777"}', '2026-05-17 04:32:28.241');
INSERT INTO public.auditorias (id, usuario_id, accion, ip_origen, metadata, fecha) VALUES ('d8cac224-2d44-4566-a4c4-44b54683ac5f', '11111111-1111-1111-1111-111111111111', 'RECEPCION_REGISTRADA', '::1', '{"recepcionId": "9ab84733-5bff-42b1-8941-2b9ed48e49e9", "ordenCompraId": "e51b71a8-d84b-41a0-bfb1-61bd7554d777"}', '2026-05-17 04:35:08.777');
INSERT INTO public.auditorias (id, usuario_id, accion, ip_origen, metadata, fecha) VALUES ('faaf40cb-e5ae-4ef5-863a-f9de5c4094fb', '11111111-1111-1111-1111-111111111111', 'DESPACHO_FINALIZADO', '::1', '{"ordenDespachoId": "f3b7bfed-b0c3-4f40-91ac-4fbae59008d7"}', '2026-05-17 04:35:44.514');
INSERT INTO public.auditorias (id, usuario_id, accion, ip_origen, metadata, fecha) VALUES ('11b84c23-d979-46b9-8342-c3ce078dd305', '11111111-1111-1111-1111-111111111111', 'ORDEN_COMPRA_CREADA', '::1', '{"numero": "OC-2227", "ordenCompraId": "406afbc0-2524-42f5-b46f-0e7844512a0c"}', '2026-05-17 04:49:33.25');
INSERT INTO public.auditorias (id, usuario_id, accion, ip_origen, metadata, fecha) VALUES ('ed6bf5bc-be6d-42ee-bb05-098e10c88b15', '11111111-1111-1111-1111-111111111111', 'RECEPCION_REGISTRADA', '::1', '{"recepcionId": "a113c5c0-11fa-488a-b1e4-52f5b3f9405f", "ordenCompraId": "406afbc0-2524-42f5-b46f-0e7844512a0c"}', '2026-05-17 04:51:16.218');
INSERT INTO public.auditorias (id, usuario_id, accion, ip_origen, metadata, fecha) VALUES ('39802c27-6d67-43c6-9771-935e9cd2ad73', '11111111-1111-1111-1111-111111111111', 'ORDEN_DESPACHO_CREADA', '::1', '{"numero": "OD-0006", "ordenDespachoId": "eabab48d-3755-4dfa-a7a6-1ee1821d2b5a"}', '2026-05-17 04:55:53.47');
INSERT INTO public.auditorias (id, usuario_id, accion, ip_origen, metadata, fecha) VALUES ('6acaca5d-1e16-4086-93d0-d664701d4603', '11111111-1111-1111-1111-111111111111', 'CLIENTE_CREADO', '::1', '{"nombre": "HEIDY RODRIGUEZ", "clienteId": "3179278a-f79b-4919-a5c3-41025211486d"}', '2026-05-18 03:49:41.344');
INSERT INTO public.auditorias (id, usuario_id, accion, ip_origen, metadata, fecha) VALUES ('bbb81e38-9ad6-4d49-9bc8-4189012e503a', '11111111-1111-1111-1111-111111111111', 'ORDEN_DESPACHO_CREADA', '::1', '{"numero": "OD-0007", "ordenDespachoId": "d845c33f-7f90-4e50-8986-26a583630ddf"}', '2026-05-18 03:54:45.641');
INSERT INTO public.auditorias (id, usuario_id, accion, ip_origen, metadata, fecha) VALUES ('0a45a16a-41a3-4a82-8796-3883e9b68eba', '11111111-1111-1111-1111-111111111111', 'PICKING_GENERADO', '::1', '{"ordenDespachoId": "d845c33f-7f90-4e50-8986-26a583630ddf"}', '2026-05-18 04:02:21.748');
INSERT INTO public.auditorias (id, usuario_id, accion, ip_origen, metadata, fecha) VALUES ('d6951ce4-3dd4-43c3-ad4d-0e46f71ae1dc', '11111111-1111-1111-1111-111111111111', 'PICKING_GENERADO', '::1', '{"ordenDespachoId": "eabab48d-3755-4dfa-a7a6-1ee1821d2b5a"}', '2026-05-18 04:08:14.029');
INSERT INTO public.auditorias (id, usuario_id, accion, ip_origen, metadata, fecha) VALUES ('9380a86b-ddcc-4eca-ad85-195cbcc243ca', '11111111-1111-1111-1111-111111111111', 'DESPACHO_FINALIZADO', '::1', '{"ordenDespachoId": "d845c33f-7f90-4e50-8986-26a583630ddf"}', '2026-05-18 04:08:20.489');
INSERT INTO public.auditorias (id, usuario_id, accion, ip_origen, metadata, fecha) VALUES ('32cb6e92-15eb-4917-8773-10f692684d7d', '11111111-1111-1111-1111-111111111111', 'DEVOLUCION_REGISTRADA', '::1', '{"items": [{"motivo": "Devolución operativa registrada desde WMS", "producto": "Agua Purificada 600ml", "detalleId": "00282938-ef3a-485e-b30e-d192e32bac49", "ubicacion": "A-01-N1", "cantidadDevuelta": 1}], "numero": "OD-0007", "ordenDespachoId": "d845c33f-7f90-4e50-8986-26a583630ddf"}', '2026-05-18 04:09:35.11');
INSERT INTO public.auditorias (id, usuario_id, accion, ip_origen, metadata, fecha) VALUES ('a816d676-9e8e-4529-9c25-ca5f2da5e71a', '11111111-1111-1111-1111-111111111111', 'DEVOLUCION_REGISTRADA', '::1', '{"items": [{"motivo": "Devolución operativa registrada desde WMS", "producto": "Agua Purificada 600ml", "detalleId": "00282938-ef3a-485e-b30e-d192e32bac49", "ubicacion": "A-01-N1", "cantidadDevuelta": 2}], "numero": "OD-0007", "ordenDespachoId": "d845c33f-7f90-4e50-8986-26a583630ddf"}', '2026-05-18 04:09:57.705');
INSERT INTO public.auditorias (id, usuario_id, accion, ip_origen, metadata, fecha) VALUES ('1aac3acb-1110-47ce-92c6-14d3800283f1', '11111111-1111-1111-1111-111111111111', 'DEVOLUCION_REGISTRADA', '::1', '{"items": [{"motivo": "Devolución operativa registrada desde WMS", "producto": "Agua Purificada 600ml", "detalleId": "00282938-ef3a-485e-b30e-d192e32bac49", "ubicacion": "A-01-N1", "cantidadDevuelta": 1}], "motivo": "Devolución operativa registrada desde WMS", "numero": "OD-0007", "devolucionId": "b50982f3-17f0-4875-a3dc-bc547e417866", "ordenDespachoId": "d845c33f-7f90-4e50-8986-26a583630ddf"}', '2026-05-18 04:20:41.146');


--
-- Data for Name: bodegas; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.bodegas (id, nombre, direccion, activa) VALUES ('4cf9a8c9-90bd-4210-8d45-2ef8fdbe96b0', 'Bodega Central', 'Zona 12, Guatemala', true);


--
-- Data for Name: categorias; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.categorias (id, nombre, descripcion) VALUES ('44444444-4444-4444-4444-444444444444', 'Bebidas', 'Productos embotellados y enlatados');
INSERT INTO public.categorias (id, nombre, descripcion) VALUES ('55555555-5555-5555-5555-555555555555', 'Snacks', 'Alimentos empacados de alta rotacion');
INSERT INTO public.categorias (id, nombre, descripcion) VALUES ('d78d9a3e-ea91-4c53-ad62-db6a5149a5aa', 'Abarrotes', 'Abarrotes');


--
-- Data for Name: clientes; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.clientes (id, nombre, email, telefono, direccion, activo, codigo) VALUES ('0d9d3f13-4f96-44ef-b7c3-7e91ddf17ce1', 'Cliente Mayorista Uno', 'compras@clientemayorista.gt', '5555-0202', 'Zona 11, Guatemala', true, 1);
INSERT INTO public.clientes (id, nombre, email, telefono, direccion, activo, codigo) VALUES ('3179278a-f79b-4919-a5c3-41025211486d', 'HEIDY RODRIGUEZ', 'hrodriguez@gmail.com', '30303030', 'ciudad', true, 2);


--
-- Data for Name: configuraciones_rol; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.configuraciones_rol (id, rol, descripcion, permisos, created_at, updated_at) VALUES ('f276b6d5-5d01-47d3-96b6-9675ecbdeb4b', 'ADMIN', 'Administra usuarios, catálogos, compras, despachos y configuraciones globales.', '{Usuarios,Roles,Compras,Despachos,Picking,Inventario,Ubicaciones,Auditoría,"Configuraciones globales"}', '2026-05-18 03:22:06.619', '2026-05-18 04:02:08.166');
INSERT INTO public.configuraciones_rol (id, rol, descripcion, permisos, created_at, updated_at) VALUES ('2943f46c-a40f-470d-87e1-335add314b28', 'BODEGUERO', 'Ejecuta tareas operativas de bodega como recepcionar, preparar y mover inventario.', '{Recepciones,Picking,Despachos,"Ajustes operativos"}', '2026-05-18 03:22:06.619', '2026-05-18 04:02:08.166');
INSERT INTO public.configuraciones_rol (id, rol, descripcion, permisos, created_at, updated_at) VALUES ('b0508977-d6c8-4fbc-8b28-1e79433d8994', 'SUPERVISOR', 'Supervisa la operación y gestiona órdenes, recepción, picking y seguimiento.', '{Compras,Recepciones,Despachos,Picking,Reportes,Inventario,Auditoría}', '2026-05-18 03:22:06.619', '2026-05-18 04:02:08.166');


--
-- Data for Name: detalles_despacho; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.detalles_despacho (id, orden_despacho_id, producto_id, cantidad, ubicacion_id, recogido) VALUES ('13131313-1313-1313-1313-131313131313', '12121212-1212-1212-1212-121212121212', '66666666-6666-6666-6666-666666666666', 10.00, '99999999-9999-9999-9999-999999999999', false);
INSERT INTO public.detalles_despacho (id, orden_despacho_id, producto_id, cantidad, ubicacion_id, recogido) VALUES ('582f0b72-c4ab-43e2-a1cf-9f0afc516f44', 'c4cf9f3b-8bc3-4eca-8b13-dd5967a8854c', 'f999ccb5-bf57-45d9-a2e2-cf5790e18197', 49.00, '99999999-9999-9999-9999-999999999999', false);
INSERT INTO public.detalles_despacho (id, orden_despacho_id, producto_id, cantidad, ubicacion_id, recogido) VALUES ('8eac15d0-4b92-447e-9663-03560d585f1d', 'b54a7063-97a4-4e5a-b047-025bcfef01e4', '1a5a714e-cc6b-4674-b1de-c786fc3b22e4', 12.00, '99999999-9999-9999-9999-999999999999', false);
INSERT INTO public.detalles_despacho (id, orden_despacho_id, producto_id, cantidad, ubicacion_id, recogido) VALUES ('752d1ff1-1299-4ae3-a50c-f28323f670fc', 'f3b7bfed-b0c3-4f40-91ac-4fbae59008d7', '4dbfc6d6-de94-4ad8-86c0-12baf1354586', 3.00, '99999999-9999-9999-9999-999999999999', false);
INSERT INTO public.detalles_despacho (id, orden_despacho_id, producto_id, cantidad, ubicacion_id, recogido) VALUES ('7ea8b080-146e-4159-8ec1-75af260ede81', 'eabab48d-3755-4dfa-a7a6-1ee1821d2b5a', 'f999ccb5-bf57-45d9-a2e2-cf5790e18197', 2.00, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', false);
INSERT INTO public.detalles_despacho (id, orden_despacho_id, producto_id, cantidad, ubicacion_id, recogido) VALUES ('ef9a9189-5b89-4f42-a635-2ef39469a251', 'eabab48d-3755-4dfa-a7a6-1ee1821d2b5a', '4dbfc6d6-de94-4ad8-86c0-12baf1354586', 2.00, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', false);
INSERT INTO public.detalles_despacho (id, orden_despacho_id, producto_id, cantidad, ubicacion_id, recogido) VALUES ('00282938-ef3a-485e-b30e-d192e32bac49', 'd845c33f-7f90-4e50-8986-26a583630ddf', '66666666-6666-6666-6666-666666666666', 3.00, '99999999-9999-9999-9999-999999999999', false);


--
-- Data for Name: detalles_devolucion_despacho; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.detalles_devolucion_despacho (id, devolucion_id, detalle_despacho_id, cantidad) VALUES ('cb8b5aa4-2257-4867-b9b4-de403b67a4b9', 'b50982f3-17f0-4875-a3dc-bc547e417866', '00282938-ef3a-485e-b30e-d192e32bac49', 1.00);


--
-- Data for Name: detalles_orden_compra; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.detalles_orden_compra (id, orden_compra_id, producto_id, cantidad, precio_unitario) VALUES ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '66666666-6666-6666-6666-666666666666', 40.00, 3.50);
INSERT INTO public.detalles_orden_compra (id, orden_compra_id, producto_id, cantidad, precio_unitario) VALUES ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '77777777-7777-7777-7777-777777777777', 25.00, 2.25);
INSERT INTO public.detalles_orden_compra (id, orden_compra_id, producto_id, cantidad, precio_unitario) VALUES ('a5b048e2-ecad-44e7-a6e2-a0a8e0bc5905', '7cbe2602-1d4d-40e8-98b5-3af75a0a125a', '1a5a714e-cc6b-4674-b1de-c786fc3b22e4', 1.00, 10.00);
INSERT INTO public.detalles_orden_compra (id, orden_compra_id, producto_id, cantidad, precio_unitario) VALUES ('11f3597b-9576-4860-91e7-0434650ea02d', '366c97ca-3fc4-4f10-99f3-ea1c5eafbbb8', 'f999ccb5-bf57-45d9-a2e2-cf5790e18197', 14.00, 5.00);
INSERT INTO public.detalles_orden_compra (id, orden_compra_id, producto_id, cantidad, precio_unitario) VALUES ('2166c438-0c53-42b4-aab1-89e176a7d9c4', '7926cb6c-826c-4bfd-bfe9-561781d40c15', 'f999ccb5-bf57-45d9-a2e2-cf5790e18197', 60.00, 12.00);
INSERT INTO public.detalles_orden_compra (id, orden_compra_id, producto_id, cantidad, precio_unitario) VALUES ('3f23a021-61c3-43c1-8b6e-d05c0a4f5804', '0b95e0a2-1cfc-42b6-98e6-9e3a6fb18e89', '66666666-6666-6666-6666-666666666666', 14.00, 5.00);
INSERT INTO public.detalles_orden_compra (id, orden_compra_id, producto_id, cantidad, precio_unitario) VALUES ('4091e71a-a53e-45e1-95a8-c8325face169', 'e51b71a8-d84b-41a0-bfb1-61bd7554d777', '4dbfc6d6-de94-4ad8-86c0-12baf1354586', 20.00, 5.00);
INSERT INTO public.detalles_orden_compra (id, orden_compra_id, producto_id, cantidad, precio_unitario) VALUES ('f7927d2c-11e0-44e5-90ef-63fd19ce777c', '406afbc0-2524-42f5-b46f-0e7844512a0c', '77777777-7777-7777-7777-777777777777', 59.00, 4.00);
INSERT INTO public.detalles_orden_compra (id, orden_compra_id, producto_id, cantidad, precio_unitario) VALUES ('e346888b-c514-43cd-8883-1972f9771ddd', '406afbc0-2524-42f5-b46f-0e7844512a0c', 'f999ccb5-bf57-45d9-a2e2-cf5790e18197', 20.00, 10.00);


--
-- Data for Name: detalles_recepcion; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.detalles_recepcion (id, recepcion_id, producto_id, cantidad_esperada, cantidad_recibida, ubicacion_id) VALUES ('b4d79583-d781-4670-9eed-52be4bbf51cd', '36a39aae-f6b8-4b3d-aef5-ea8246f3808f', 'f999ccb5-bf57-45d9-a2e2-cf5790e18197', 14.00, 14.00, '99999999-9999-9999-9999-999999999999');
INSERT INTO public.detalles_recepcion (id, recepcion_id, producto_id, cantidad_esperada, cantidad_recibida, ubicacion_id) VALUES ('240ab871-0e94-4a4e-a918-21f8442c31d3', '5ffa8b6a-3f86-4117-bc90-ed50c5b13b82', 'f999ccb5-bf57-45d9-a2e2-cf5790e18197', 60.00, 60.00, '99999999-9999-9999-9999-999999999999');
INSERT INTO public.detalles_recepcion (id, recepcion_id, producto_id, cantidad_esperada, cantidad_recibida, ubicacion_id) VALUES ('57a64cba-a9e6-43fa-8e4c-8e780eb59432', '6e74e22a-091e-4f91-9875-c71ff9c76d7f', '1a5a714e-cc6b-4674-b1de-c786fc3b22e4', 1.00, 1.00, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
INSERT INTO public.detalles_recepcion (id, recepcion_id, producto_id, cantidad_esperada, cantidad_recibida, ubicacion_id) VALUES ('195da34d-b12f-43f3-8555-89e50f09a5e3', '60b9a074-2914-4d0f-9135-8b36472979ed', '66666666-6666-6666-6666-666666666666', 14.00, 1214.00, '99999999-9999-9999-9999-999999999999');
INSERT INTO public.detalles_recepcion (id, recepcion_id, producto_id, cantidad_esperada, cantidad_recibida, ubicacion_id) VALUES ('202433b0-0dae-408e-936c-6b8c7a4b7423', '9ab84733-5bff-42b1-8941-2b9ed48e49e9', '4dbfc6d6-de94-4ad8-86c0-12baf1354586', 20.00, 20.00, '99999999-9999-9999-9999-999999999999');
INSERT INTO public.detalles_recepcion (id, recepcion_id, producto_id, cantidad_esperada, cantidad_recibida, ubicacion_id) VALUES ('a7de8543-c721-4705-a025-3482687bf195', 'a113c5c0-11fa-488a-b1e4-52f5b3f9405f', '77777777-7777-7777-7777-777777777777', 59.00, 59.00, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
INSERT INTO public.detalles_recepcion (id, recepcion_id, producto_id, cantidad_esperada, cantidad_recibida, ubicacion_id) VALUES ('5b287f22-13bd-46f8-969b-af89bacb18e9', 'a113c5c0-11fa-488a-b1e4-52f5b3f9405f', 'f999ccb5-bf57-45d9-a2e2-cf5790e18197', 20.00, 20.00, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');


--
-- Data for Name: devoluciones_despacho; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.devoluciones_despacho (id, orden_despacho_id, usuario_id, motivo, created_at) VALUES ('b50982f3-17f0-4875-a3dc-bc547e417866', 'd845c33f-7f90-4e50-8986-26a583630ddf', '11111111-1111-1111-1111-111111111111', 'Devolución operativa registrada desde WMS', '2026-05-18 04:20:41.131');


--
-- Data for Name: inventarios; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.inventarios (id, producto_id, ubicacion_id, cantidad, fecha_act) VALUES ('20d7ffe5-1266-48d6-8bba-ad653746cae1', '1a5a714e-cc6b-4674-b1de-c786fc3b22e4', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 2.00, '2026-05-17 03:15:24.863');
INSERT INTO public.inventarios (id, producto_id, ubicacion_id, cantidad, fecha_act) VALUES ('e0abf92d-2777-4976-8235-ae9f3e46fbea', 'f999ccb5-bf57-45d9-a2e2-cf5790e18197', '99999999-9999-9999-9999-999999999999', 20.00, '2026-05-17 03:40:26.779');
INSERT INTO public.inventarios (id, producto_id, ubicacion_id, cantidad, fecha_act) VALUES ('ee72a2fa-ef6b-46e7-a7f4-8bf07d8c2b02', '4dbfc6d6-de94-4ad8-86c0-12baf1354586', '99999999-9999-9999-9999-999999999999', 17.00, '2026-05-17 04:35:44.504');
INSERT INTO public.inventarios (id, producto_id, ubicacion_id, cantidad, fecha_act) VALUES ('52cd7570-928f-4b09-b861-f1ce97143660', 'f999ccb5-bf57-45d9-a2e2-cf5790e18197', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 28.00, '2026-05-17 04:51:16.211');
INSERT INTO public.inventarios (id, producto_id, ubicacion_id, cantidad, fecha_act) VALUES ('cccccccc-cccc-cccc-cccc-cccccccccccc', '77777777-7777-7777-7777-777777777777', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 18.00, '2026-05-17 04:51:16.202');
INSERT INTO public.inventarios (id, producto_id, ubicacion_id, cantidad, fecha_act) VALUES ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '66666666-6666-6666-6666-666666666666', '99999999-9999-9999-9999-999999999999', 56.00, '2026-05-18 04:20:41.138');


--
-- Data for Name: movimientos_inventario; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.movimientos_inventario (id, tipo, producto_id, cantidad, usuario_id, referencia, fecha) VALUES ('14141414-1414-1414-1414-141414141414', 'ENTRADA', '66666666-6666-6666-6666-666666666666', 55.00, '11111111-1111-1111-1111-111111111111', 'SEED-INIT', '2026-05-08 22:15:11.28');
INSERT INTO public.movimientos_inventario (id, tipo, producto_id, cantidad, usuario_id, referencia, fecha) VALUES ('15151515-1515-1515-1515-151515151515', 'ENTRADA', '77777777-7777-7777-7777-777777777777', 18.00, '33333333-3333-3333-3333-333333333333', 'SEED-INIT', '2026-05-08 22:15:11.28');
INSERT INTO public.movimientos_inventario (id, tipo, producto_id, cantidad, usuario_id, referencia, fecha) VALUES ('6ae3fcf5-0bcc-4212-9dd5-596d4cf4de8c', 'ENTRADA', '66666666-6666-6666-6666-666666666666', 1.00, '11111111-1111-1111-1111-111111111111', 'AJUSTE_RAPIDO_FRONT', '2026-05-15 04:43:41.192');
INSERT INTO public.movimientos_inventario (id, tipo, producto_id, cantidad, usuario_id, referencia, fecha) VALUES ('a84a2db9-4a7b-4fdd-958a-f822a98de260', 'ENTRADA', '66666666-6666-6666-6666-666666666666', 1.00, '11111111-1111-1111-1111-111111111111', 'AJUSTE_RAPIDO_FRONT', '2026-05-15 04:43:42.967');
INSERT INTO public.movimientos_inventario (id, tipo, producto_id, cantidad, usuario_id, referencia, fecha) VALUES ('3f4166d7-a295-4861-82a4-23efa4a597c2', 'ENTRADA', '66666666-6666-6666-6666-666666666666', 1.00, '11111111-1111-1111-1111-111111111111', 'AJUSTE_RAPIDO_FRONT', '2026-05-15 04:43:56.04');
INSERT INTO public.movimientos_inventario (id, tipo, producto_id, cantidad, usuario_id, referencia, fecha) VALUES ('644786d0-2c8d-40a5-982e-87d941b6bcb0', 'ENTRADA', '66666666-6666-6666-6666-666666666666', 1.00, '11111111-1111-1111-1111-111111111111', 'AJUSTE_RAPIDO_FRONT', '2026-05-15 04:44:04.333');
INSERT INTO public.movimientos_inventario (id, tipo, producto_id, cantidad, usuario_id, referencia, fecha) VALUES ('1367b3cd-64b9-45b6-977c-a7b3c036ee8e', 'SALIDA', '66666666-6666-6666-6666-666666666666', 10.00, '11111111-1111-1111-1111-111111111111', 'DESPACHO:12121212-1212-1212-1212-121212121212', '2026-05-15 04:44:52.814');
INSERT INTO public.movimientos_inventario (id, tipo, producto_id, cantidad, usuario_id, referencia, fecha) VALUES ('1ebc9947-5ae8-46e6-b7ab-0200f3c79ec5', 'ENTRADA', '66666666-6666-6666-6666-666666666666', 1.00, '11111111-1111-1111-1111-111111111111', 'DEVOLUCION:12121212-1212-1212-1212-121212121212:13131313-1313-1313-1313-131313131313', '2026-05-16 01:58:00.997');
INSERT INTO public.movimientos_inventario (id, tipo, producto_id, cantidad, usuario_id, referencia, fecha) VALUES ('c69642e7-4a18-4b37-ade1-79e3e5aed18e', 'AJUSTE', '66666666-6666-6666-6666-666666666666', 5.00, '11111111-1111-1111-1111-111111111111', 'Ajuste rapido desde frontend', '2026-05-16 02:10:37.791');
INSERT INTO public.movimientos_inventario (id, tipo, producto_id, cantidad, usuario_id, referencia, fecha) VALUES ('c094849e-3dd4-4cd1-98a1-7842edbb7e93', 'AJUSTE', '66666666-6666-6666-6666-666666666666', 5.00, '11111111-1111-1111-1111-111111111111', 'Ajuste rapido desde frontend', '2026-05-16 02:10:39.831');
INSERT INTO public.movimientos_inventario (id, tipo, producto_id, cantidad, usuario_id, referencia, fecha) VALUES ('cf4b10bc-f961-47ef-ab13-1dc21df0918a', 'AJUSTE', '66666666-6666-6666-6666-666666666666', 5.00, '11111111-1111-1111-1111-111111111111', 'Ajuste rapido desde frontend', '2026-05-16 02:10:40.719');
INSERT INTO public.movimientos_inventario (id, tipo, producto_id, cantidad, usuario_id, referencia, fecha) VALUES ('566a9b15-488a-4379-a6b2-f5502943cfb7', 'ENTRADA', 'f999ccb5-bf57-45d9-a2e2-cf5790e18197', 1.00, '11111111-1111-1111-1111-111111111111', 'SCAN_FRONTEND', '2026-05-16 04:47:00.682');
INSERT INTO public.movimientos_inventario (id, tipo, producto_id, cantidad, usuario_id, referencia, fecha) VALUES ('ab1f68cc-1706-4d43-86ef-c56ba0b3d2c7', 'ENTRADA', '1a5a714e-cc6b-4674-b1de-c786fc3b22e4', 1.00, '11111111-1111-1111-1111-111111111111', 'SCAN_FRONTEND', '2026-05-16 04:48:56.998');
INSERT INTO public.movimientos_inventario (id, tipo, producto_id, cantidad, usuario_id, referencia, fecha) VALUES ('ee27d583-a1c1-4d0e-a06e-ebfdae571a19', 'ENTRADA', 'f999ccb5-bf57-45d9-a2e2-cf5790e18197', 14.00, '11111111-1111-1111-1111-111111111111', 'RECEPCION:36a39aae-f6b8-4b3d-aef5-ea8246f3808f', '2026-05-16 04:57:39.847');
INSERT INTO public.movimientos_inventario (id, tipo, producto_id, cantidad, usuario_id, referencia, fecha) VALUES ('cf9febdc-6ac8-4908-9362-811565b166ee', 'SALIDA', '66666666-6666-6666-6666-666666666666', 1.00, '11111111-1111-1111-1111-111111111111', 'SALIDA_RAPIDA_FRONT', '2026-05-16 04:58:06.731');
INSERT INTO public.movimientos_inventario (id, tipo, producto_id, cantidad, usuario_id, referencia, fecha) VALUES ('0b37f066-7922-41c2-b30f-e12d1a637bbf', 'AJUSTE', '66666666-6666-6666-6666-666666666666', 5.00, '11111111-1111-1111-1111-111111111111', 'Ajuste rapido desde frontend', '2026-05-16 04:58:13.327');
INSERT INTO public.movimientos_inventario (id, tipo, producto_id, cantidad, usuario_id, referencia, fecha) VALUES ('c49c1e3b-cdb3-4c52-be54-caea438efb83', 'SALIDA', '66666666-6666-6666-6666-666666666666', 1.00, '11111111-1111-1111-1111-111111111111', 'SALIDA_RAPIDA_FRONT', '2026-05-16 04:58:24.062');
INSERT INTO public.movimientos_inventario (id, tipo, producto_id, cantidad, usuario_id, referencia, fecha) VALUES ('d76ffc8a-6e9d-4162-8495-4f1badcf8244', 'ENTRADA', '66666666-6666-6666-6666-666666666666', 1.00, '11111111-1111-1111-1111-111111111111', 'AJUSTE_RAPIDO_FRONT', '2026-05-16 04:59:27.816');
INSERT INTO public.movimientos_inventario (id, tipo, producto_id, cantidad, usuario_id, referencia, fecha) VALUES ('a89e486a-d92a-4e83-ad24-02ec24fde394', 'SALIDA', '66666666-6666-6666-6666-666666666666', 1.00, '11111111-1111-1111-1111-111111111111', 'SALIDA_RAPIDA_FRONT', '2026-05-16 04:59:46.342');
INSERT INTO public.movimientos_inventario (id, tipo, producto_id, cantidad, usuario_id, referencia, fecha) VALUES ('d7eaa43a-05e9-44c8-871d-6a1d072fd017', 'SALIDA', 'f999ccb5-bf57-45d9-a2e2-cf5790e18197', 5.00, '11111111-1111-1111-1111-111111111111', '', '2026-05-16 05:07:59.924');
INSERT INTO public.movimientos_inventario (id, tipo, producto_id, cantidad, usuario_id, referencia, fecha) VALUES ('0b0dc8c2-9109-489a-a32e-833a5ea4c748', 'ENTRADA', 'f999ccb5-bf57-45d9-a2e2-cf5790e18197', 7.00, '11111111-1111-1111-1111-111111111111', '', '2026-05-16 05:08:37.127');
INSERT INTO public.movimientos_inventario (id, tipo, producto_id, cantidad, usuario_id, referencia, fecha) VALUES ('20dae829-58a3-4b65-94ae-168d5bac81a8', 'ENTRADA', 'f999ccb5-bf57-45d9-a2e2-cf5790e18197', 60.00, '11111111-1111-1111-1111-111111111111', 'RECEPCION:5ffa8b6a-3f86-4117-bc90-ed50c5b13b82', '2026-05-17 03:01:51.164');
INSERT INTO public.movimientos_inventario (id, tipo, producto_id, cantidad, usuario_id, referencia, fecha) VALUES ('f1b02826-25de-484c-927d-caab721c3edf', 'ENTRADA', '1a5a714e-cc6b-4674-b1de-c786fc3b22e4', 1.00, '11111111-1111-1111-1111-111111111111', 'RECEPCION:6e74e22a-091e-4f91-9875-c71ff9c76d7f', '2026-05-17 03:15:24.87');
INSERT INTO public.movimientos_inventario (id, tipo, producto_id, cantidad, usuario_id, referencia, fecha) VALUES ('31b2822a-1f4f-49f0-a25c-7e6da9fbbd29', 'SALIDA', 'f999ccb5-bf57-45d9-a2e2-cf5790e18197', 49.00, '11111111-1111-1111-1111-111111111111', 'DESPACHO:c4cf9f3b-8bc3-4eca-8b13-dd5967a8854c', '2026-05-17 03:40:26.787');
INSERT INTO public.movimientos_inventario (id, tipo, producto_id, cantidad, usuario_id, referencia, fecha) VALUES ('2403d6ff-8935-431e-9d86-59a8d7c32247', 'ENTRADA', '66666666-6666-6666-6666-666666666666', 1214.00, '11111111-1111-1111-1111-111111111111', 'RECEPCION:60b9a074-2914-4d0f-9135-8b36472979ed', '2026-05-17 04:28:23.207');
INSERT INTO public.movimientos_inventario (id, tipo, producto_id, cantidad, usuario_id, referencia, fecha) VALUES ('db0eae87-d8be-4500-a082-4cb74bca92d6', 'ENTRADA', '4dbfc6d6-de94-4ad8-86c0-12baf1354586', 20.00, '11111111-1111-1111-1111-111111111111', 'RECEPCION:9ab84733-5bff-42b1-8941-2b9ed48e49e9', '2026-05-17 04:35:08.771');
INSERT INTO public.movimientos_inventario (id, tipo, producto_id, cantidad, usuario_id, referencia, fecha) VALUES ('6a3682f5-8cea-4d4c-810e-ddb4ba34179e', 'SALIDA', '4dbfc6d6-de94-4ad8-86c0-12baf1354586', 3.00, '11111111-1111-1111-1111-111111111111', 'DESPACHO:f3b7bfed-b0c3-4f40-91ac-4fbae59008d7', '2026-05-17 04:35:44.508');
INSERT INTO public.movimientos_inventario (id, tipo, producto_id, cantidad, usuario_id, referencia, fecha) VALUES ('08f1bf18-8d9f-4aed-b5e8-30d2078768ec', 'ENTRADA', '77777777-7777-7777-7777-777777777777', 59.00, '11111111-1111-1111-1111-111111111111', 'RECEPCION:a113c5c0-11fa-488a-b1e4-52f5b3f9405f', '2026-05-17 04:51:16.209');
INSERT INTO public.movimientos_inventario (id, tipo, producto_id, cantidad, usuario_id, referencia, fecha) VALUES ('f30be882-2101-42c8-9ec5-33b8ff469328', 'ENTRADA', 'f999ccb5-bf57-45d9-a2e2-cf5790e18197', 20.00, '11111111-1111-1111-1111-111111111111', 'RECEPCION:a113c5c0-11fa-488a-b1e4-52f5b3f9405f', '2026-05-17 04:51:16.214');
INSERT INTO public.movimientos_inventario (id, tipo, producto_id, cantidad, usuario_id, referencia, fecha) VALUES ('2a707027-b0bd-4255-8646-8f3ea303a04d', 'SALIDA', '66666666-6666-6666-6666-666666666666', 3.00, '11111111-1111-1111-1111-111111111111', 'DESPACHO:d845c33f-7f90-4e50-8986-26a583630ddf', '2026-05-18 04:08:20.482');
INSERT INTO public.movimientos_inventario (id, tipo, producto_id, cantidad, usuario_id, referencia, fecha) VALUES ('c7aecaad-dc5a-4985-9c27-15b83a11db00', 'ENTRADA', '66666666-6666-6666-6666-666666666666', 1.00, '11111111-1111-1111-1111-111111111111', 'DEVOLUCION:d845c33f-7f90-4e50-8986-26a583630ddf:00282938-ef3a-485e-b30e-d192e32bac49', '2026-05-18 04:09:35.103');
INSERT INTO public.movimientos_inventario (id, tipo, producto_id, cantidad, usuario_id, referencia, fecha) VALUES ('46feb83b-0ab0-463c-9e4d-c790557026b4', 'ENTRADA', '66666666-6666-6666-6666-666666666666', 2.00, '11111111-1111-1111-1111-111111111111', 'DEVOLUCION:d845c33f-7f90-4e50-8986-26a583630ddf:00282938-ef3a-485e-b30e-d192e32bac49', '2026-05-18 04:09:57.703');
INSERT INTO public.movimientos_inventario (id, tipo, producto_id, cantidad, usuario_id, referencia, fecha) VALUES ('d4b0a12b-ac5f-4fac-92d3-b2db3175c581', 'ENTRADA', '66666666-6666-6666-6666-666666666666', 1.00, '11111111-1111-1111-1111-111111111111', 'DEVOLUCION:d845c33f-7f90-4e50-8986-26a583630ddf:00282938-ef3a-485e-b30e-d192e32bac49', '2026-05-18 04:20:41.142');


--
-- Data for Name: ordenes_compra; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.ordenes_compra (id, numero, proveedor_id, estado, fecha_emision, usuario_id) VALUES ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'OC-0001', 'c395b9e7-48a8-456d-a7ad-8f54af8de2cb', 'COMPLETA', '2026-05-08', '22222222-2222-2222-2222-222222222222');
INSERT INTO public.ordenes_compra (id, numero, proveedor_id, estado, fecha_emision, usuario_id) VALUES ('366c97ca-3fc4-4f10-99f3-ea1c5eafbbb8', 'C2223', 'c395b9e7-48a8-456d-a7ad-8f54af8de2cb', 'COMPLETA', '2026-05-16', '11111111-1111-1111-1111-111111111111');
INSERT INTO public.ordenes_compra (id, numero, proveedor_id, estado, fecha_emision, usuario_id) VALUES ('7926cb6c-826c-4bfd-bfe9-561781d40c15', 'OC-0009', 'c395b9e7-48a8-456d-a7ad-8f54af8de2cb', 'COMPLETA', '2026-05-17', '11111111-1111-1111-1111-111111111111');
INSERT INTO public.ordenes_compra (id, numero, proveedor_id, estado, fecha_emision, usuario_id) VALUES ('7cbe2602-1d4d-40e8-98b5-3af75a0a125a', 'OC-0099', 'c395b9e7-48a8-456d-a7ad-8f54af8de2cb', 'COMPLETA', '2026-05-15', '11111111-1111-1111-1111-111111111111');
INSERT INTO public.ordenes_compra (id, numero, proveedor_id, estado, fecha_emision, usuario_id) VALUES ('0b95e0a2-1cfc-42b6-98e6-9e3a6fb18e89', 'OC-2225', 'c395b9e7-48a8-456d-a7ad-8f54af8de2cb', 'COMPLETA', '2026-05-17', '11111111-1111-1111-1111-111111111111');
INSERT INTO public.ordenes_compra (id, numero, proveedor_id, estado, fecha_emision, usuario_id) VALUES ('e51b71a8-d84b-41a0-bfb1-61bd7554d777', 'OC-2226', 'c395b9e7-48a8-456d-a7ad-8f54af8de2cb', 'COMPLETA', '2026-05-17', '11111111-1111-1111-1111-111111111111');
INSERT INTO public.ordenes_compra (id, numero, proveedor_id, estado, fecha_emision, usuario_id) VALUES ('406afbc0-2524-42f5-b46f-0e7844512a0c', 'OC-2227', 'c395b9e7-48a8-456d-a7ad-8f54af8de2cb', 'COMPLETA', '2026-05-17', '11111111-1111-1111-1111-111111111111');


--
-- Data for Name: ordenes_despacho; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.ordenes_despacho (id, numero, cliente, estado, fecha_requerida, usuario_id, created_at, cliente_id) VALUES ('c4cf9f3b-8bc3-4eca-8b13-dd5967a8854c', 'OD-0002', 'HEIDY RODRIGUEZ', 'DESPACHADA', '2026-05-17', '11111111-1111-1111-1111-111111111111', '2026-05-17 03:00:25.506', NULL);
INSERT INTO public.ordenes_despacho (id, numero, cliente, estado, fecha_requerida, usuario_id, created_at, cliente_id) VALUES ('b54a7063-97a4-4e5a-b047-025bcfef01e4', 'OD-0004', 'HEIDY RODRIGUEZ', 'EN_PICKING', '2026-05-17', '11111111-1111-1111-1111-111111111111', '2026-05-17 04:09:41.771', NULL);
INSERT INTO public.ordenes_despacho (id, numero, cliente, estado, fecha_requerida, usuario_id, created_at, cliente_id) VALUES ('f3b7bfed-b0c3-4f40-91ac-4fbae59008d7', 'OD-0005', 'HEIDY RODRIGUEZ', 'DESPACHADA', '2026-05-17', '11111111-1111-1111-1111-111111111111', '2026-05-17 04:19:59.557', NULL);
INSERT INTO public.ordenes_despacho (id, numero, cliente, estado, fecha_requerida, usuario_id, created_at, cliente_id) VALUES ('12121212-1212-1212-1212-121212121212', 'OD-0001', 'Cliente Mayorista Uno', 'DESPACHADA', '2026-05-10', '22222222-2222-2222-2222-222222222222', '2026-05-08 22:15:11.28', '0d9d3f13-4f96-44ef-b7c3-7e91ddf17ce1');
INSERT INTO public.ordenes_despacho (id, numero, cliente, estado, fecha_requerida, usuario_id, created_at, cliente_id) VALUES ('eabab48d-3755-4dfa-a7a6-1ee1821d2b5a', 'OD-0006', 'HEIDY RODRIGUEZ', 'EN_PICKING', '2026-05-17', '11111111-1111-1111-1111-111111111111', '2026-05-17 04:55:53.452', NULL);
INSERT INTO public.ordenes_despacho (id, numero, cliente, estado, fecha_requerida, usuario_id, created_at, cliente_id) VALUES ('d845c33f-7f90-4e50-8986-26a583630ddf', 'OD-0007', 'HEIDY RODRIGUEZ', 'DESPACHADA', '2026-05-18', '11111111-1111-1111-1111-111111111111', '2026-05-18 03:54:45.634', '3179278a-f79b-4919-a5c3-41025211486d');


--
-- Data for Name: productos; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.productos (id, codigo_barras, nombre, descripcion, categoria_id, unidad_medida, stock_minimo, stock_maximo) VALUES ('66666666-6666-6666-6666-666666666666', '750100000001', 'Agua Purificada 600ml', NULL, '44444444-4444-4444-4444-444444444444', 'UND', 20, 200);
INSERT INTO public.productos (id, codigo_barras, nombre, descripcion, categoria_id, unidad_medida, stock_minimo, stock_maximo) VALUES ('77777777-7777-7777-7777-777777777777', '750100000002', 'Galleta Integral', NULL, '55555555-5555-5555-5555-555555555555', 'UND', 10, 120);
INSERT INTO public.productos (id, codigo_barras, nombre, descripcion, categoria_id, unidad_medida, stock_minimo, stock_maximo) VALUES ('4dbfc6d6-de94-4ad8-86c0-12baf1354586', '2342342', 'Pasta', 'Pasta', 'd78d9a3e-ea91-4c53-ad62-db6a5149a5aa', 'UND', 10, 400);
INSERT INTO public.productos (id, codigo_barras, nombre, descripcion, categoria_id, unidad_medida, stock_minimo, stock_maximo) VALUES ('ba8a17e6-75e1-4006-9b95-0b9b2a9f0f32', '750100009999', 'Producto Prueba UI', 'Alta de prueba', '44444444-4444-4444-4444-444444444444', 'UND', 1, 10);
INSERT INTO public.productos (id, codigo_barras, nombre, descripcion, categoria_id, unidad_medida, stock_minimo, stock_maximo) VALUES ('f999ccb5-bf57-45d9-a2e2-cf5790e18197', '121131313', 'Jabon', 'Jabon para bañarse', 'd78d9a3e-ea91-4c53-ad62-db6a5149a5aa', 'UND', 2, 400);
INSERT INTO public.productos (id, codigo_barras, nombre, descripcion, categoria_id, unidad_medida, stock_minimo, stock_maximo) VALUES ('1a5a714e-cc6b-4674-b1de-c786fc3b22e4', '123232', 'Shampoo', 'Shampoo', 'd78d9a3e-ea91-4c53-ad62-db6a5149a5aa', 'UND', 2, 40);


--
-- Data for Name: proveedores; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.proveedores (id, nombre, contacto, telefono, email, activo) VALUES ('c395b9e7-48a8-456d-a7ad-8f54af8de2cb', 'Distribuidora Central', 'Carlos Perez', '5555-0101', 'compras@distribuidoracentral.gt', true);


--
-- Data for Name: racks; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.racks (id, codigo, seccion_id, capacidad) VALUES ('88888888-8888-8888-8888-888888888888', 'A-01', 'ea515548-0a96-41e9-80de-54f9245b50d8', 3);


--
-- Data for Name: recepciones; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.recepciones (id, orden_compra_id, fecha, usuario_id, observaciones) VALUES ('36a39aae-f6b8-4b3d-aef5-ea8246f3808f', '366c97ca-3fc4-4f10-99f3-ea1c5eafbbb8', '2026-05-16 04:57:39.832', '11111111-1111-1111-1111-111111111111', '');
INSERT INTO public.recepciones (id, orden_compra_id, fecha, usuario_id, observaciones) VALUES ('5ffa8b6a-3f86-4117-bc90-ed50c5b13b82', '7926cb6c-826c-4bfd-bfe9-561781d40c15', '2026-05-17 03:01:51.15', '11111111-1111-1111-1111-111111111111', '');
INSERT INTO public.recepciones (id, orden_compra_id, fecha, usuario_id, observaciones) VALUES ('6e74e22a-091e-4f91-9875-c71ff9c76d7f', '7cbe2602-1d4d-40e8-98b5-3af75a0a125a', '2026-05-17 03:15:24.847', '11111111-1111-1111-1111-111111111111', '');
INSERT INTO public.recepciones (id, orden_compra_id, fecha, usuario_id, observaciones) VALUES ('60b9a074-2914-4d0f-9135-8b36472979ed', '0b95e0a2-1cfc-42b6-98e6-9e3a6fb18e89', '2026-05-17 04:28:23.196', '11111111-1111-1111-1111-111111111111', '');
INSERT INTO public.recepciones (id, orden_compra_id, fecha, usuario_id, observaciones) VALUES ('9ab84733-5bff-42b1-8941-2b9ed48e49e9', 'e51b71a8-d84b-41a0-bfb1-61bd7554d777', '2026-05-17 04:35:08.756', '11111111-1111-1111-1111-111111111111', '');
INSERT INTO public.recepciones (id, orden_compra_id, fecha, usuario_id, observaciones) VALUES ('a113c5c0-11fa-488a-b1e4-52f5b3f9405f', '406afbc0-2524-42f5-b46f-0e7844512a0c', '2026-05-17 04:51:16.197', '11111111-1111-1111-1111-111111111111', '');


--
-- Data for Name: secciones; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.secciones (id, nombre, bodega_id) VALUES ('ea515548-0a96-41e9-80de-54f9245b50d8', 'Sector A', '4cf9a8c9-90bd-4210-8d45-2ef8fdbe96b0');


--
-- Data for Name: ubicaciones; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.ubicaciones (id, codigo, rack_id, nivel, capacidad_max, ocupada) VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'A-01-N2', '88888888-8888-8888-8888-888888888888', 2, 90.00, true);
INSERT INTO public.ubicaciones (id, codigo, rack_id, nivel, capacidad_max, ocupada) VALUES ('99999999-9999-9999-9999-999999999999', 'A-01-N1', '88888888-8888-8888-8888-888888888888', 1, 120.00, true);


--
-- Data for Name: usuarios; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.usuarios (id, nombre, email, password_hash, rol, activo, created_at) VALUES ('11111111-1111-1111-1111-111111111111', 'Administrador WMS', 'admin@wms.local', '$2b$12$ZlmXHLOTR0QjjsQKn2qDCO2LuVfB3nu7Rem09INwXo2EShlKqTQXq', 'ADMIN', true, '2026-05-08 22:15:11.28');
INSERT INTO public.usuarios (id, nombre, email, password_hash, rol, activo, created_at) VALUES ('33333333-3333-3333-3333-333333333333', 'Bodeguero Operativo', 'bodeguero@wms.local', '$2b$12$QCWJ69w.284LxogjhHNC1OJGL8Dj53jb2YdrhmcLPSbV7JGi1C6Ve', 'BODEGUERO', true, '2026-05-08 22:15:11.28');
INSERT INTO public.usuarios (id, nombre, email, password_hash, rol, activo, created_at) VALUES ('22222222-2222-2222-2222-222222222222', 'Supervisor Logistico', 'supervisor@wms.local', '$2b$12$brVAKMR2rP9wxH8i0AHxHuS6rULZ2oQH/2JJ.r9E0VYvTAfMK3.R6', 'SUPERVISOR', true, '2026-05-08 22:15:11.28');


--
-- Name: clientes_codigo_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.clientes_codigo_seq', 2, true);


--
-- Name: auditorias auditorias_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auditorias
    ADD CONSTRAINT auditorias_pkey PRIMARY KEY (id);


--
-- Name: bodegas bodegas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bodegas
    ADD CONSTRAINT bodegas_pkey PRIMARY KEY (id);


--
-- Name: categorias categorias_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categorias
    ADD CONSTRAINT categorias_pkey PRIMARY KEY (id);


--
-- Name: clientes clientes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_pkey PRIMARY KEY (id);


--
-- Name: configuraciones_rol configuraciones_rol_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.configuraciones_rol
    ADD CONSTRAINT configuraciones_rol_pkey PRIMARY KEY (id);


--
-- Name: detalles_despacho detalles_despacho_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalles_despacho
    ADD CONSTRAINT detalles_despacho_pkey PRIMARY KEY (id);


--
-- Name: detalles_devolucion_despacho detalles_devolucion_despacho_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalles_devolucion_despacho
    ADD CONSTRAINT detalles_devolucion_despacho_pkey PRIMARY KEY (id);


--
-- Name: detalles_orden_compra detalles_orden_compra_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalles_orden_compra
    ADD CONSTRAINT detalles_orden_compra_pkey PRIMARY KEY (id);


--
-- Name: detalles_recepcion detalles_recepcion_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalles_recepcion
    ADD CONSTRAINT detalles_recepcion_pkey PRIMARY KEY (id);


--
-- Name: devoluciones_despacho devoluciones_despacho_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.devoluciones_despacho
    ADD CONSTRAINT devoluciones_despacho_pkey PRIMARY KEY (id);


--
-- Name: inventarios inventarios_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventarios
    ADD CONSTRAINT inventarios_pkey PRIMARY KEY (id);


--
-- Name: movimientos_inventario movimientos_inventario_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.movimientos_inventario
    ADD CONSTRAINT movimientos_inventario_pkey PRIMARY KEY (id);


--
-- Name: ordenes_compra ordenes_compra_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ordenes_compra
    ADD CONSTRAINT ordenes_compra_pkey PRIMARY KEY (id);


--
-- Name: ordenes_despacho ordenes_despacho_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ordenes_despacho
    ADD CONSTRAINT ordenes_despacho_pkey PRIMARY KEY (id);


--
-- Name: productos productos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productos
    ADD CONSTRAINT productos_pkey PRIMARY KEY (id);


--
-- Name: proveedores proveedores_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.proveedores
    ADD CONSTRAINT proveedores_pkey PRIMARY KEY (id);


--
-- Name: racks racks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.racks
    ADD CONSTRAINT racks_pkey PRIMARY KEY (id);


--
-- Name: recepciones recepciones_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recepciones
    ADD CONSTRAINT recepciones_pkey PRIMARY KEY (id);


--
-- Name: secciones secciones_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.secciones
    ADD CONSTRAINT secciones_pkey PRIMARY KEY (id);


--
-- Name: ubicaciones ubicaciones_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ubicaciones
    ADD CONSTRAINT ubicaciones_pkey PRIMARY KEY (id);


--
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);


--
-- Name: categorias_nombre_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX categorias_nombre_key ON public.categorias USING btree (nombre);


--
-- Name: clientes_codigo_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX clientes_codigo_key ON public.clientes USING btree (codigo);


--
-- Name: configuraciones_rol_rol_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX configuraciones_rol_rol_key ON public.configuraciones_rol USING btree (rol);


--
-- Name: inventarios_producto_id_ubicacion_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX inventarios_producto_id_ubicacion_id_key ON public.inventarios USING btree (producto_id, ubicacion_id);


--
-- Name: ordenes_compra_numero_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ordenes_compra_numero_key ON public.ordenes_compra USING btree (numero);


--
-- Name: ordenes_despacho_numero_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ordenes_despacho_numero_key ON public.ordenes_despacho USING btree (numero);


--
-- Name: productos_codigo_barras_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX productos_codigo_barras_key ON public.productos USING btree (codigo_barras);


--
-- Name: racks_codigo_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX racks_codigo_key ON public.racks USING btree (codigo);


--
-- Name: ubicaciones_codigo_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ubicaciones_codigo_key ON public.ubicaciones USING btree (codigo);


--
-- Name: usuarios_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX usuarios_email_key ON public.usuarios USING btree (email);


--
-- Name: auditorias auditorias_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auditorias
    ADD CONSTRAINT auditorias_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: detalles_despacho detalles_despacho_orden_despacho_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalles_despacho
    ADD CONSTRAINT detalles_despacho_orden_despacho_id_fkey FOREIGN KEY (orden_despacho_id) REFERENCES public.ordenes_despacho(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: detalles_despacho detalles_despacho_producto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalles_despacho
    ADD CONSTRAINT detalles_despacho_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.productos(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: detalles_despacho detalles_despacho_ubicacion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalles_despacho
    ADD CONSTRAINT detalles_despacho_ubicacion_id_fkey FOREIGN KEY (ubicacion_id) REFERENCES public.ubicaciones(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: detalles_devolucion_despacho detalles_devolucion_despacho_detalle_despacho_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalles_devolucion_despacho
    ADD CONSTRAINT detalles_devolucion_despacho_detalle_despacho_id_fkey FOREIGN KEY (detalle_despacho_id) REFERENCES public.detalles_despacho(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: detalles_devolucion_despacho detalles_devolucion_despacho_devolucion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalles_devolucion_despacho
    ADD CONSTRAINT detalles_devolucion_despacho_devolucion_id_fkey FOREIGN KEY (devolucion_id) REFERENCES public.devoluciones_despacho(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: detalles_orden_compra detalles_orden_compra_orden_compra_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalles_orden_compra
    ADD CONSTRAINT detalles_orden_compra_orden_compra_id_fkey FOREIGN KEY (orden_compra_id) REFERENCES public.ordenes_compra(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: detalles_orden_compra detalles_orden_compra_producto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalles_orden_compra
    ADD CONSTRAINT detalles_orden_compra_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.productos(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: detalles_recepcion detalles_recepcion_producto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalles_recepcion
    ADD CONSTRAINT detalles_recepcion_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.productos(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: detalles_recepcion detalles_recepcion_recepcion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalles_recepcion
    ADD CONSTRAINT detalles_recepcion_recepcion_id_fkey FOREIGN KEY (recepcion_id) REFERENCES public.recepciones(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: detalles_recepcion detalles_recepcion_ubicacion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalles_recepcion
    ADD CONSTRAINT detalles_recepcion_ubicacion_id_fkey FOREIGN KEY (ubicacion_id) REFERENCES public.ubicaciones(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: devoluciones_despacho devoluciones_despacho_orden_despacho_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.devoluciones_despacho
    ADD CONSTRAINT devoluciones_despacho_orden_despacho_id_fkey FOREIGN KEY (orden_despacho_id) REFERENCES public.ordenes_despacho(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: devoluciones_despacho devoluciones_despacho_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.devoluciones_despacho
    ADD CONSTRAINT devoluciones_despacho_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: inventarios inventarios_producto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventarios
    ADD CONSTRAINT inventarios_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.productos(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: inventarios inventarios_ubicacion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventarios
    ADD CONSTRAINT inventarios_ubicacion_id_fkey FOREIGN KEY (ubicacion_id) REFERENCES public.ubicaciones(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: movimientos_inventario movimientos_inventario_producto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.movimientos_inventario
    ADD CONSTRAINT movimientos_inventario_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.productos(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: movimientos_inventario movimientos_inventario_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.movimientos_inventario
    ADD CONSTRAINT movimientos_inventario_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ordenes_compra ordenes_compra_proveedor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ordenes_compra
    ADD CONSTRAINT ordenes_compra_proveedor_id_fkey FOREIGN KEY (proveedor_id) REFERENCES public.proveedores(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ordenes_compra ordenes_compra_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ordenes_compra
    ADD CONSTRAINT ordenes_compra_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ordenes_despacho ordenes_despacho_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ordenes_despacho
    ADD CONSTRAINT ordenes_despacho_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ordenes_despacho ordenes_despacho_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ordenes_despacho
    ADD CONSTRAINT ordenes_despacho_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: productos productos_categoria_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productos
    ADD CONSTRAINT productos_categoria_id_fkey FOREIGN KEY (categoria_id) REFERENCES public.categorias(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: racks racks_seccion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.racks
    ADD CONSTRAINT racks_seccion_id_fkey FOREIGN KEY (seccion_id) REFERENCES public.secciones(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: recepciones recepciones_orden_compra_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recepciones
    ADD CONSTRAINT recepciones_orden_compra_id_fkey FOREIGN KEY (orden_compra_id) REFERENCES public.ordenes_compra(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: recepciones recepciones_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recepciones
    ADD CONSTRAINT recepciones_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: secciones secciones_bodega_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.secciones
    ADD CONSTRAINT secciones_bodega_id_fkey FOREIGN KEY (bodega_id) REFERENCES public.bodegas(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ubicaciones ubicaciones_rack_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ubicaciones
    ADD CONSTRAINT ubicaciones_rack_id_fkey FOREIGN KEY (rack_id) REFERENCES public.racks(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

\unrestrict ih19W5HQvsO73Xfq3m8LayEbGreRiaurphWgcSxSbkk4PFb1OVQ0E7SgX8XrU88

