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
- **Hosting:** Vercel (FE) + Railway (BE)

## Estructura

```
wms-sistema/
├── frontend/           # React SPA
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── services/
│       └── context/
├── backend/            # REST API
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   └── services/
│   ├── prisma/
│   └── tests/
└── .github/workflows/  # CI/CD pipeline
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
