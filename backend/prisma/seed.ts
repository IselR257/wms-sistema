import bcrypt from "bcrypt";
import {
  EstadoOrdenCompra,
  EstadoOrdenDespacho,
  Prisma,
  PrismaClient,
  RolUsuario,
  TipoMovimiento
} from "@prisma/client";

const prisma = new PrismaClient();

const toDecimal = (value: number) => new Prisma.Decimal(value);

const defaultRoleConfigurations = {
  ADMIN: {
    descripcion: "Administra usuarios, catálogos, compras, despachos y configuraciones globales.",
    permisos: ["Usuarios", "Roles", "Compras", "Despachos", "Picking", "Inventario", "Ubicaciones", "Auditoría", "Configuraciones globales"]
  },
  SUPERVISOR: {
    descripcion: "Supervisa la operación y gestiona órdenes, recepción, picking y seguimiento.",
    permisos: ["Compras", "Recepciones", "Despachos", "Picking", "Reportes", "Inventario", "Auditoría"]
  },
  BODEGUERO: {
    descripcion: "Ejecuta tareas operativas de bodega como recepcionar, preparar y mover inventario.",
    permisos: ["Recepciones", "Picking", "Despachos", "Ajustes operativos"]
  }
} as const;

const main = async () => {
  const adminPassword = await bcrypt.hash("Admin123*", 12);

  const admin = await prisma.usuario.upsert({
    where: { email: "admin@wms.local" },
    update: {},
    create: {
      nombre: "Administrador WMS",
      email: "admin@wms.local",
      passwordHash: adminPassword,
      rol: RolUsuario.ADMIN
    }
  });

  const supervisor = await prisma.usuario.upsert({
    where: { email: "supervisor@wms.local" },
    update: {},
    create: {
      nombre: "Supervisor Logistico",
      email: "supervisor@wms.local",
      passwordHash: await bcrypt.hash("Supervisor123*", 12),
      rol: RolUsuario.SUPERVISOR
    }
  });

  const bodeguero = await prisma.usuario.upsert({
    where: { email: "bodeguero@wms.local" },
    update: {},
    create: {
      nombre: "Bodeguero Operativo",
      email: "bodeguero@wms.local",
      passwordHash: await bcrypt.hash("Bodega123*", 12),
      rol: RolUsuario.BODEGUERO
    }
  });

  await Promise.all(
    Object.entries(defaultRoleConfigurations).map(([rol, config]) =>
      prisma.configuracionRol.upsert({
        where: { rol: rol as RolUsuario },
        update: {
          descripcion: config.descripcion,
          permisos: [...config.permisos]
        },
        create: {
          rol: rol as RolUsuario,
          descripcion: config.descripcion,
          permisos: [...config.permisos]
        }
      })
    )
  );

  const bebidas = await prisma.categoria.upsert({
    where: { nombre: "Bebidas" },
    update: {},
    create: {
      nombre: "Bebidas",
      descripcion: "Productos embotellados y enlatados"
    }
  });

  const snacks = await prisma.categoria.upsert({
    where: { nombre: "Snacks" },
    update: {},
    create: {
      nombre: "Snacks",
      descripcion: "Alimentos empacados de alta rotacion"
    }
  });

  const producto1 = await prisma.producto.upsert({
    where: { codigoBarras: "750100000001" },
    update: {},
    create: {
      codigoBarras: "750100000001",
      nombre: "Agua Purificada 600ml",
      categoriaId: bebidas.id,
      unidadMedida: "UND",
      stockMinimo: 20,
      stockMaximo: 200
    }
  });

  const producto2 = await prisma.producto.upsert({
    where: { codigoBarras: "750100000002" },
    update: {},
    create: {
      codigoBarras: "750100000002",
      nombre: "Galleta Integral",
      categoriaId: snacks.id,
      unidadMedida: "UND",
      stockMinimo: 10,
      stockMaximo: 120
    }
  });

  const bodega = await prisma.bodega.upsert({
    where: { id: "4cf9a8c9-90bd-4210-8d45-2ef8fdbe96b0" },
    update: {},
    create: {
      id: "4cf9a8c9-90bd-4210-8d45-2ef8fdbe96b0",
      nombre: "Bodega Central",
      direccion: "Zona 12, Guatemala"
    }
  });

  const seccionA = await prisma.seccion.upsert({
    where: { id: "ea515548-0a96-41e9-80de-54f9245b50d8" },
    update: {},
    create: {
      id: "ea515548-0a96-41e9-80de-54f9245b50d8",
      nombre: "Sector A",
      bodegaId: bodega.id
    }
  });

  const rackA1 = await prisma.rack.upsert({
    where: { codigo: "A-01" },
    update: {},
    create: {
      codigo: "A-01",
      seccionId: seccionA.id,
      capacidad: 3
    }
  });

  const ubicacion1 = await prisma.ubicacion.upsert({
    where: { codigo: "A-01-N1" },
    update: {},
    create: {
      codigo: "A-01-N1",
      rackId: rackA1.id,
      nivel: 1,
      capacidadMax: toDecimal(120),
      ocupada: true
    }
  });

  const ubicacion2 = await prisma.ubicacion.upsert({
    where: { codigo: "A-01-N2" },
    update: {},
    create: {
      codigo: "A-01-N2",
      rackId: rackA1.id,
      nivel: 2,
      capacidadMax: toDecimal(90),
      ocupada: true
    }
  });

  await prisma.inventario.upsert({
    where: {
      productoId_ubicacionId: {
        productoId: producto1.id,
        ubicacionId: ubicacion1.id
      }
    },
    update: {
      cantidad: toDecimal(55)
    },
    create: {
      productoId: producto1.id,
      ubicacionId: ubicacion1.id,
      cantidad: toDecimal(55)
    }
  });

  await prisma.inventario.upsert({
    where: {
      productoId_ubicacionId: {
        productoId: producto2.id,
        ubicacionId: ubicacion2.id
      }
    },
    update: {
      cantidad: toDecimal(18)
    },
    create: {
      productoId: producto2.id,
      ubicacionId: ubicacion2.id,
      cantidad: toDecimal(18)
    }
  });

  const proveedor = await prisma.proveedor.upsert({
    where: { id: "c395b9e7-48a8-456d-a7ad-8f54af8de2cb" },
    update: {},
    create: {
      id: "c395b9e7-48a8-456d-a7ad-8f54af8de2cb",
      nombre: "Distribuidora Central",
      contacto: "Carlos Perez",
      telefono: "5555-0101",
      email: "compras@distribuidoracentral.gt"
    }
  });

  const cliente = await prisma.cliente.upsert({
    where: { id: "0d9d3f13-4f96-44ef-b7c3-7e91ddf17ce1" },
    update: {},
    create: {
      id: "0d9d3f13-4f96-44ef-b7c3-7e91ddf17ce1",
      nombre: "Cliente Mayorista Uno",
      email: "compras@clientemayorista.gt",
      telefono: "5555-0202",
      direccion: "Zona 11, Guatemala"
    }
  });

  const ordenCompra = await prisma.ordenCompra.upsert({
    where: { numero: "OC-0001" },
    update: {},
    create: {
      numero: "OC-0001",
      proveedorId: proveedor.id,
      estado: EstadoOrdenCompra.COMPLETA,
      fechaEmision: new Date("2026-05-08"),
      usuarioId: supervisor.id,
      detalles: {
        create: [
          {
            productoId: producto1.id,
            cantidad: toDecimal(40),
            precioUnitario: toDecimal(3.5)
          },
          {
            productoId: producto2.id,
            cantidad: toDecimal(25),
            precioUnitario: toDecimal(2.25)
          }
        ]
      }
    }
  });

  await prisma.ordenDespacho.upsert({
    where: { numero: "OD-0001" },
    update: {
      cliente: cliente.nombre,
      clienteId: cliente.id
    },
    create: {
      numero: "OD-0001",
      cliente: "Cliente Mayorista Uno",
      clienteId: cliente.id,
      estado: EstadoOrdenDespacho.EN_PICKING,
      fechaRequerida: new Date("2026-05-10"),
      usuarioId: supervisor.id,
      detalles: {
        create: [
          {
            productoId: producto1.id,
            ubicacionId: ubicacion1.id,
            cantidad: toDecimal(10)
          }
        ]
      }
    }
  });

  const movimientoExistente = await prisma.movimientoInventario.findFirst({
    where: {
      referencia: "SEED-INIT"
    }
  });

  if (!movimientoExistente) {
    await prisma.movimientoInventario.createMany({
      data: [
        {
          tipo: TipoMovimiento.ENTRADA,
          productoId: producto1.id,
          cantidad: toDecimal(55),
          usuarioId: admin.id,
          referencia: "SEED-INIT"
        },
        {
          tipo: TipoMovimiento.ENTRADA,
          productoId: producto2.id,
          cantidad: toDecimal(18),
          usuarioId: bodeguero.id,
          referencia: "SEED-INIT"
        }
      ]
    });
  }

  console.log("Seed completado");
  console.log("Admin:", admin.email, " / Admin123*");
  console.log("Supervisor:", supervisor.email, " / Supervisor123*");
  console.log("Bodeguero:", bodeguero.email, " / Bodega123*");
  console.log("Orden de compra ejemplo:", ordenCompra.numero);
};

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
