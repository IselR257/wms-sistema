# WMS Bodega

Sistema web para gestión de bodegas y centros de distribución. Proyecto del curso de Ingeniería de Software, Universidad Mariano Gálvez de Guatemala.

## ¿Qué es?

Un WMS (Warehouse Management System) que permite controlar recepción, almacenamiento, picking y despacho de mercadería, con trazabilidad de inventario en tiempo real.

## Stack

- **Frontend:** React + Vite + TailwindCSS
- **Backend:** Node.js + Express.js
- **BD:** PostgreSQL (Supabase)
- **ORM:** Prisma
- **Auth:** JWT + bcrypt
- **CI/CD:** GitHub Actions
- **Hosting:** Railway

## Estructura

```
wms-sistema/
├── frontend/           # SPA con Vite
├── backend/            # API REST con Express + Prisma
├── railway.toml        # Configuración de build/start para Railway
└── package.json        # Scripts raíz
```

## Despliegue en Railway

El repositorio quedó preparado para desplegarse como un solo servicio:

- Railway ejecuta `npm run build` en la raíz.
- El frontend se compila con Vite en `frontend/dist`.
- El backend compila TypeScript a `backend/dist`.
- `npm start` levanta Express y sirve tanto la API como la SPA desde el mismo dominio.

### Variables de entorno requeridas

```bash
PORT=3000
JWT_SECRET=coloca_un_secreto_largo_y_seguro
DATABASE_URL=postgresql://usuario:password@host:5432/wms_db
```

### Variables opcionales

```bash
VITE_API_BASE_URL=
```

Si `VITE_API_BASE_URL` está vacía, el frontend usa el mismo dominio de Railway y consume `/api` directamente.

### Endpoints de verificación

```bash
/health
/api/health
```

## Metodología

Scrum con sprints de 2 semanas. Branching con GitHub Flow (main, develop, feature/*, hotfix/*).

## Equipo

| Rol | Integrante |
|-----|-----------|
| Product Owner | Dairy Dallana Pernillo Salay |
| Scrum Master | Por definir |
| Dev Team | Por definir |

## Curso

Ingeniería de Software - Sección B | 9no semestre, 2026
Catedrático: Michael Rodolfo Asturias López
