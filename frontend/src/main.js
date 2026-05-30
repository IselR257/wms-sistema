import "./styles.css";

const API_BASE = (
  import.meta.env.VITE_API_BASE_URL ||
  `${window.location.origin}/api`
).replace(/\/$/, "");

const PERMISSION_OPTIONS = [
  "Usuarios",
  "Roles",
  "Compras",
  "Recepciones",
  "Despachos",
  "Picking",
  "Inventario",
  "Ubicaciones",
  "Reportes",
  "Auditoría",
  "Ajustes operativos",
  "Configuraciones globales"
];

const SCREEN_PERMISSIONS = {
  dashboard: [],
  inventario: ["Inventario", "Ajustes operativos"],
  recepcion: ["Recepciones"],
  despacho: ["Despachos", "Picking"],
  compras: ["Compras"],
  administracion: ["Configuraciones globales"],
  ubicaciones: ["Ubicaciones"],
  reportes: ["Reportes"],
  usuarios: ["Usuarios"],
  roles: ["Roles"],
  auditoria: ["Auditoría"]
};

const screens = [
  { id: "login", label: "1. Login", title: "Acceso al sistema" },
  { id: "dashboard", label: "2. Dashboard", title: "Dashboard", subtitle: "KPIs y movimientos de la bodega" },
  { id: "inventario", label: "3. Inventario", title: "Gestión de Inventario", subtitle: "Existencias, filtros y acciones operativas" },
  { id: "recepcion", label: "4. Recepción", title: "Nueva Recepción de Mercadería", subtitle: "Registro contra orden de compra" },
  { id: "despacho", label: "5. Picking", title: "Picking y Despacho", subtitle: "Preparación y finalización de salidas" },
  { id: "compras", label: "Compras", title: "Compras y Proveedores", subtitle: "Órdenes de compra y gestión de proveedores" },
  { id: "administracion", label: "Administración", title: "Administración Maestra", subtitle: "Catálogos maestros y clientes" },
  { id: "ubicaciones", label: "Ubicaciones", title: "Ubicaciones", subtitle: "Estructura física de la bodega" },
  { id: "reportes", label: "Reportes", title: "Reportes", subtitle: "Resumen operativo basado en datos actuales" },
  { id: "usuarios", label: "Usuarios", title: "Usuarios y Permisos", subtitle: "Gestión de acceso al sistema" },
  { id: "roles", label: "Roles", title: "Roles del Sistema", subtitle: "Referencia de perfiles y permisos operativos" },
  { id: "auditoria", label: "Auditoría", title: "Auditoría", subtitle: "Trazabilidad de acciones críticas" }
];

const app = document.querySelector("#app");

const DEFAULT_ROLE_DEFINITIONS = {
  ADMIN: {
    descripcion: "Administra usuarios, catálogos, compras, despachos y configuraciones globales.",
    permisosList: ["Usuarios", "Roles", "Compras", "Despachos", "Inventario", "Ubicaciones", "Auditoría", "Configuraciones globales"]
  },
  SUPERVISOR: {
    descripcion: "Supervisa la operación y gestiona órdenes, recepción, picking y seguimiento.",
    permisosList: ["Compras", "Recepciones", "Despachos", "Picking", "Reportes", "Inventario", "Auditoría"]
  },
  BODEGUERO: {
    descripcion: "Ejecuta tareas operativas de bodega como recepcionar, preparar y mover inventario.",
    permisosList: ["Recepciones", "Picking", "Despachos", "Ajustes operativos"]
  }
};

const state = {
  token: "",
  user: null,
  currentPermissions: [],
  currentScreen: "login",
  loading: false,
  flash: null,
  dashboard: null,
  inventory: null,
  movements: [],
  purchaseOrders: [],
  dispatchOrders: [],
  locations: [],
  users: [],
  audit: [],
  products: [],
  categories: [],
  providers: [],
  clients: [],
  roleDefinitions: { ...DEFAULT_ROLE_DEFINITIONS },
  reports: null,
  reportFilters: {
    from: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString().slice(0, 10),
    to: new Date().toISOString().slice(0, 10)
  },
  inventoryFilters: {
    query: "",
    category: "",
    location: "",
    status: ""
  },
  inventoryOperation: {
    mode: "",
    productoId: "",
    ubicacionId: "",
    cantidad: 1,
    motivo: ""
  },
  receptionForm: {
    orderId: "",
    barcode: "",
    observaciones: "",
    cantidades: {},
    ubicaciones: {}
  },
  dispatchForm: {
    orderId: "",
    picked: {},
    returns: {},
    motivo: "Devolución operativa registrada desde WMS"
  },
  userForm: {
    id: "",
    nombre: "",
    email: "",
    password: "",
    rol: "BODEGUERO"
  },
  categoryForm: {
    nombre: "",
    descripcion: ""
  },
  productForm: {
    id: "",
    codigoBarras: "",
    nombre: "",
    descripcion: "",
    categoriaId: "",
    unidadMedida: "UND",
    stockMinimo: 0,
    stockMaximo: 0
  },
  providerForm: {
    id: "",
    nombre: "",
    contacto: "",
    telefono: "",
    email: ""
  },
  clientForm: {
    id: "",
    nombre: "",
    email: "",
    telefono: "",
    direccion: ""
  },
  purchaseOrderForm: {
    numero: "",
    proveedorId: "",
    fechaEmision: new Date().toISOString().slice(0, 10),
    productoId: "",
    cantidad: 1,
    precioUnitario: 0
  },
  purchaseOrderItems: [],
  dispatchOrderForm: {
    numero: "",
    clienteId: "",
    fechaRequerida: new Date().toISOString().slice(0, 10),
    productoId: "",
    ubicacionId: "",
    cantidad: 1
  },
  dispatchOrderItems: [],
  locationForms: {
    bodega: { nombre: "", direccion: "" },
    seccion: { nombre: "", bodegaId: "" },
    rack: { codigo: "", seccionId: "", capacidad: 10 },
    ubicacion: { codigo: "", rackId: "", nivel: 1, capacidadMax: 50 }
  },
  scanEntryForm: {
    barcode: "",
    ubicacionId: "",
    cantidad: 1
  },
  providerWindowOpen: false
};

void bootstrapSession();

function toRoleDefinitions(rows = []) {
  const entries = rows.map((item) => [
    item.rol,
    {
      descripcion: item.descripcion,
      permisosList: item.permisosList || []
    }
  ]);

  return {
    ...DEFAULT_ROLE_DEFINITIONS,
    ...Object.fromEntries(entries)
  };
}

function saveSession(payload) {
  state.token = "cookie";
  state.user = payload.user;
  state.currentPermissions = payload.permissions || [];
}

function clearSession() {
  state.token = "";
  state.user = null;
  state.currentPermissions = [];
  state.dashboard = null;
  state.inventory = null;
  state.movements = [];
  state.purchaseOrders = [];
  state.dispatchOrders = [];
  state.locations = [];
  state.users = [];
  state.audit = [];
  state.products = [];
  state.categories = [];
  state.providers = [];
  state.clients = [];
  state.roleDefinitions = { ...DEFAULT_ROLE_DEFINITIONS };
  state.reports = null;
  state.currentScreen = "login";
}

async function bootstrapSession() {
  state.loading = true;
  render();

  try {
    const response = await fetch(`${API_BASE}/usuarios/me`, {
      credentials: "include"
    });

    if (!response.ok) {
      clearSession();
      state.loading = false;
      render();
      return;
    }

    const payload = await response.json();
    saveSession(payload);
    state.currentScreen = "dashboard";
    await initializeApp();
  } catch {
    clearSession();
    state.loading = false;
    render();
  }
}

function setFlash(type, text) {
  state.flash = { type, text };
  render();
}

async function api(path, options = {}) {
  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers, credentials: "include" });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) {
      clearSession();
      state.flash = { type: "error", text: data.message || "La sesión expiró. Inicia sesión de nuevo." };
      render();
      throw new Error("__AUTH__");
    }
    if (Array.isArray(data.issues) && data.issues.length) {
      const issueText = data.issues
        .map((issue) => `${issue.path?.join(".") || "campo"}: ${issue.message}`)
        .join(" | ");
      throw new Error(issueText);
    }
    throw new Error(data.message || "No se pudo completar la solicitud");
  }

  return data;
}

async function initializeApp() {
  state.loading = true;
  render();

  try {
    const tasks = [loadDashboard()];

    if (canAccessScreen("inventario") || canAccessScreen("despacho")) {
      tasks.push(loadInventory(), loadMovements());
    }
    if (canAccessScreen("recepcion") || canAccessScreen("compras")) {
      tasks.push(loadPurchaseOrders());
    }
    if (canAccessScreen("despacho")) {
      tasks.push(loadDispatchOrders());
    }
    if (canAccessScreen("recepcion") || canAccessScreen("despacho") || canAccessScreen("ubicaciones")) {
      tasks.push(loadLocations());
    }
    if (canAccessScreen("inventario") || canAccessScreen("compras") || canAccessScreen("despacho") || canAccessScreen("administracion")) {
      tasks.push(loadProducts());
    }
    if (canAccessScreen("inventario") || canAccessScreen("administracion")) {
      tasks.push(loadCategories());
    }
    if (canAccessScreen("compras")) {
      tasks.push(loadProviders());
    }
    if (canAccessScreen("despacho") || canAccessScreen("administracion")) {
      tasks.push(loadClients());
    }
    if (canAccessScreen("usuarios") || canAccessScreen("roles")) {
      tasks.push(loadUsers());
    }
    if (canAccessScreen("roles")) {
      tasks.push(loadRoleDefinitions());
    }
    if (canAccessScreen("auditoria")) {
      tasks.push(loadAudit());
    }
    if (canAccessScreen("reportes")) {
      tasks.push(loadReports());
    }

    await Promise.all(tasks);
  } catch (error) {
    if (error.message === "__AUTH__") return;
    setFlash("error", error.message);
  } finally {
    state.loading = false;
    render();
  }
}

async function refreshData() {
  state.loading = true;
  render();
  try {
    const tasks = [loadDashboard()];

    if (canAccessScreen("inventario") || canAccessScreen("despacho")) {
      tasks.push(loadInventory(), loadMovements());
    }
    if (canAccessScreen("recepcion") || canAccessScreen("compras")) {
      tasks.push(loadPurchaseOrders());
    }
    if (canAccessScreen("despacho")) {
      tasks.push(loadDispatchOrders());
    }
    if (canAccessScreen("recepcion") || canAccessScreen("despacho") || canAccessScreen("ubicaciones")) {
      tasks.push(loadLocations());
    }
    if (canAccessScreen("inventario") || canAccessScreen("compras") || canAccessScreen("despacho") || canAccessScreen("administracion")) {
      tasks.push(loadProducts());
    }
    if (canAccessScreen("inventario") || canAccessScreen("administracion")) {
      tasks.push(loadCategories());
    }
    if (canAccessScreen("compras")) {
      tasks.push(loadProviders());
    }
    if (canAccessScreen("despacho") || canAccessScreen("administracion")) {
      tasks.push(loadClients());
    }
    if (canAccessScreen("usuarios") || canAccessScreen("roles")) {
      tasks.push(loadUsers());
    }
    if (canAccessScreen("roles")) {
      tasks.push(loadRoleDefinitions());
    }
    if (canAccessScreen("auditoria")) {
      tasks.push(loadAudit());
    }
    if (canAccessScreen("reportes")) {
      tasks.push(loadReports());
    }

    await Promise.all(tasks);
  } catch (error) {
    if (error.message === "__AUTH__") return;
    state.flash = { type: "error", text: error.message };
  } finally {
    state.loading = false;
    render();
  }
}

async function loadDashboard() {
  state.dashboard = await api("/dashboard");
}

async function loadInventory() {
  state.inventory = await api("/inventario");
}

async function loadMovements() {
  state.movements = await api("/inventario/movimientos");
}

async function loadPurchaseOrders() {
  state.purchaseOrders = await api("/compras/ordenes");
  const pendingOrders = state.purchaseOrders.filter((item) => item.estado !== "COMPLETA");
  const selectedStillPending = pendingOrders.some((item) => item.id === state.receptionForm.orderId);

  if (!state.purchaseOrderForm.numero) {
    state.purchaseOrderForm.numero = nextCorrelative("OC-", state.purchaseOrders, (item) => item.numero);
  }

  if (!selectedStillPending) {
    state.receptionForm.orderId = pendingOrders[0]?.id || "";
    syncReceptionSelection();
  }
}

async function loadDispatchOrders() {
  state.dispatchOrders = await api("/despachos/ordenes");
  if (!state.dispatchForm.orderId && state.dispatchOrders.length) {
    state.dispatchForm.orderId = state.dispatchOrders[0].id;
    syncDispatchSelection();
  }
  if (!state.dispatchOrderForm.numero) {
    state.dispatchOrderForm.numero = nextCorrelative("OD-", state.dispatchOrders, (item) => item.numero);
  }
}

async function loadLocations() {
  state.locations = await api("/ubicaciones");
  const flatLocations = flattenLocations();
  const flatSecciones = state.locations.flatMap((bodega) => bodega.secciones.map((seccion) => ({ id: seccion.id, nombre: seccion.nombre })));
  const flatRacks = state.locations.flatMap((bodega) =>
    bodega.secciones.flatMap((seccion) =>
      seccion.racks.map((rack) => ({ id: rack.id, codigo: rack.codigo }))
    )
  );

  if (!state.scanEntryForm.ubicacionId && flatLocations.length) state.scanEntryForm.ubicacionId = flatLocations[0].id;
  if (!state.inventoryOperation.ubicacionId && flatLocations.length) state.inventoryOperation.ubicacionId = flatLocations[0].id;
  if (!state.dispatchOrderForm.ubicacionId && flatLocations.length) state.dispatchOrderForm.ubicacionId = flatLocations[0].id;
  if (!state.locationForms.seccion.bodegaId && state.locations.length) state.locationForms.seccion.bodegaId = state.locations[0].id;
  if (!state.locationForms.rack.seccionId && flatSecciones.length) state.locationForms.rack.seccionId = flatSecciones[0].id;
  if (!state.locationForms.ubicacion.rackId && flatRacks.length) state.locationForms.ubicacion.rackId = flatRacks[0].id;
}

async function loadProducts() {
  state.products = await api("/productos");
  if (!state.productForm.categoriaId && state.categories.length) state.productForm.categoriaId = state.categories[0].id;
  if (!state.purchaseOrderForm.productoId && state.products.length) state.purchaseOrderForm.productoId = state.products[0].id;
  if (!state.inventoryOperation.productoId && state.products.length) state.inventoryOperation.productoId = state.products[0].id;
  if (!state.dispatchOrderForm.productoId && state.products.length) state.dispatchOrderForm.productoId = state.products[0].id;
}

async function loadCategories() {
  state.categories = await api("/productos/categorias");
  if (!state.productForm.categoriaId && state.categories.length) state.productForm.categoriaId = state.categories[0].id;
}

async function loadProviders() {
  state.providers = await api("/proveedores");
  if (!state.purchaseOrderForm.proveedorId && state.providers.length) state.purchaseOrderForm.proveedorId = state.providers[0].id;
}

async function loadClients() {
  state.clients = await api("/clientes");
  const selectedExists = state.clients.some((item) => item.id === state.dispatchOrderForm.clienteId);
  if ((!state.dispatchOrderForm.clienteId || !selectedExists) && state.clients.length) {
    state.dispatchOrderForm.clienteId = state.clients[0].id;
  }
}

async function loadRoleDefinitions() {
  state.roleDefinitions = toRoleDefinitions(await api("/roles/configuraciones"));
  if (state.user?.rol) {
    state.currentPermissions = state.roleDefinitions[state.user.rol]?.permisosList || [];
  }
}

async function loadUsers() {
  state.users = await api("/usuarios");
}

async function loadAudit() {
  state.audit = await api("/auditoria");
}

async function loadReports() {
  const query = new URLSearchParams({
    from: state.reportFilters.from,
    to: state.reportFilters.to
  });
  state.reports = await api(`/reportes?${query.toString()}`);
}

function syncReceptionSelection() {
  const order = selectedPurchaseOrder();
  if (!order) {
    state.receptionForm.orderId = "";
    state.receptionForm.barcode = "";
    state.receptionForm.observaciones = "";
    state.receptionForm.cantidades = {};
    state.receptionForm.ubicaciones = {};
    return;
  }

  const firstLocation = flattenLocations()[0]?.id || "";
  const cantidades = {};
  const ubicaciones = {};

  order.detalles.forEach((detail) => {
    cantidades[detail.productoId] = 0;
    ubicaciones[detail.productoId] = firstLocation;
  });

  state.receptionForm.barcode = "";
  state.receptionForm.observaciones = "";
  state.receptionForm.cantidades = cantidades;
  state.receptionForm.ubicaciones = ubicaciones;
}

function syncDispatchSelection() {
  const order = selectedDispatchOrder();
  if (!order) {
    state.dispatchForm.picked = {};
    state.dispatchForm.returns = {};
    return;
  }

  const picked = {};
  const returns = {};
  order.detalles.forEach((detail) => {
    picked[detail.id] = Boolean(detail.recogido);
    returns[detail.id] = 0;
  });
  state.dispatchForm.picked = picked;
  state.dispatchForm.returns = returns;
}

function flattenLocations() {
  return state.locations.flatMap((bodega) =>
    bodega.secciones.flatMap((seccion) =>
      seccion.racks.flatMap((rack) =>
        rack.ubicaciones.map((ubicacion) => ({
          id: ubicacion.id,
          codigo: ubicacion.codigo,
          rack: rack.codigo,
          bodega: bodega.nombre,
          ocupada: ubicacion.ocupada
        }))
      )
    )
  );
}

function selectedPurchaseOrder() {
  return state.purchaseOrders.find((order) => order.id === state.receptionForm.orderId) || null;
}

function selectedDispatchOrder() {
  return state.dispatchOrders.find((order) => order.id === state.dispatchForm.orderId) || null;
}

function inventoryQuantityFor(productoId, ubicacionId) {
  const item = state.inventory?.items?.find(
    (inventoryItem) =>
      inventoryItem.producto.id === productoId && inventoryItem.ubicacion.id === ubicacionId
  );

  return item ? Number(item.cantidad) : 0;
}

function returnedQuantityFor(detail) {
  return Number(detail.cantidadDevuelta || 0);
}

function remainingReturnQuantityFor(detail) {
  return Math.max(Number(detail.cantidadDisponibleDevolucion ?? Number(detail.cantidad) - returnedQuantityFor(detail)), 0);
}

function formatDate(value) {
  return new Intl.DateTimeFormat("es-GT", {
    dateStyle: "medium"
  }).format(new Date(value));
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat("es-GT", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function getInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function getStatusLabel(item) {
  const quantity = Number(item.cantidad);
  const minimum = item.producto.stockMinimo;
  if (quantity <= minimum) return { label: "Bajo mínimo", tone: "bajo" };
  if (quantity <= minimum + 5) return { label: "Cerca de mínimo", tone: "cerca" };
  return { label: "Normal", tone: "normal" };
}

function movementTone(tipo) {
  if (tipo === "ENTRADA") return "entrada";
  if (tipo === "SALIDA") return "salida";
  return "ajuste";
}

function purchaseOrderStatusMeta(estado) {
  if (estado === "COMPLETA") {
    return { tone: "ok", label: "Recepcionada" };
  }
  if (estado === "PARCIAL") {
    return { tone: "warning", label: "Recepción parcial" };
  }
  return { tone: "pendiente", label: "Pendiente" };
}

function dispatchOrderStatusMeta(estado) {
  if (estado === "DESPACHADA") {
    return { tone: "ok", label: "Despachada" };
  }
  if (estado === "EN_PICKING") {
    return { tone: "warning", label: "En picking" };
  }
  return { tone: "pendiente", label: "Pendiente" };
}

function nextCorrelative(prefix, items, accessor) {
  const maxNumber = items.reduce((max, item) => {
    const raw = accessor(item);
    const match = String(raw || "").match(/(\d+)$/);
    if (!match) return max;
    return Math.max(max, Number(match[1]));
  }, 0);

  return `${prefix}${String(maxNumber + 1).padStart(4, "0")}`;
}

function currentRolePermissions() {
  return state.currentPermissions || [];
}

function canAccessScreen(screenId) {
  if (screenId === "login") return true;
  if (!state.token) return false;
  if (screenId === "dashboard") return true;

  const requiredPermissions = SCREEN_PERMISSIONS[screenId] || [];
  if (!requiredPermissions.length) return true;

  const rolePermissions = currentRolePermissions();
  return requiredPermissions.some((permission) => rolePermissions.includes(permission));
}

function defaultAuthorizedScreen() {
  const orderedScreens = ["dashboard", "inventario", "recepcion", "despacho", "compras", "administracion", "ubicaciones", "reportes", "usuarios", "roles", "auditoria"];
  return orderedScreens.find((screenId) => canAccessScreen(screenId)) || "dashboard";
}

function ensureAuthorizedScreen() {
  if (!state.token) {
    state.currentScreen = "login";
    return;
  }

  if (!canAccessScreen(state.currentScreen)) {
    state.currentScreen = defaultAuthorizedScreen();
  }
}

function receptionItemStatusMeta(recibida, esperada) {
  if (recibida >= esperada && esperada > 0) {
    return { tone: "ok", label: "Completo" };
  }
  if (recibida > 0) {
    return { tone: "warning", label: "Parcial" };
  }
  return { tone: "pendiente", label: "Pendiente por recepcionar" };
}

function currentScreenData() {
  return screens.find((screen) => screen.id === state.currentScreen) || screens[0];
}

function render() {
  ensureAuthorizedScreen();
  const shell = state.token ? renderAppShell() : renderLogin();
  app.innerHTML = shell;
}

function renderTopButtons() {
  const topIds = ["login", "dashboard", "inventario", "recepcion", "despacho"];
  return topIds
    .filter((id) => !state.token || canAccessScreen(id))
    .map((id) => {
      const screen = screens.find((item) => item.id === id);
      const active = state.currentScreen === id ? "active" : "";
      return `<button class="${active}" data-screen="${id}">${screen.label}</button>`;
    })
    .join("");
}

function renderLogin() {
  return `
    <div class="screen-nav">
      <span>WMS Wireframes</span>
      ${renderTopButtons()}
    </div>
    <div class="login-bg">
      <form class="login-card" id="login-form">
        <div class="login-logo">
          <div class="icon">📦</div>
          <h1>WMS Bodega</h1>
          <p>Plataforma de Gestión de Bodegas</p>
        </div>
        ${renderFlash()}
        <div class="form-group">
          <label for="email">Correo electrónico</label>
          <input id="email" name="email" type="email" placeholder="usuario@empresa.com" value="admin@wms.local" />
        </div>
        <div class="form-group">
          <label for="password">Contraseña</label>
          <input id="password" name="password" type="password" placeholder="Ingrese su contraseña" value="Admin123*" />
        </div>
        <button class="btn-primary" type="submit">Iniciar Sesión</button>
        <div class="login-version">WMS Bodega v1.0.0</div>
      </form>
    </div>
  `;
}

function renderAppShell() {
  const current = currentScreenData();
  return `
    <div class="screen-nav">
      <span>WMS Wireframes</span>
      ${renderTopButtons()}
      <div class="spacer"></div>
      <button data-action="refresh">Actualizar</button>
      <button data-action="logout">Salir</button>
    </div>
    <div class="screen-shell ${state.loading ? "loading" : ""}">
      <div class="app-layout">
        <aside class="sidebar">
          <div class="brand">
            <h2>📦 WMS Bodega</h2>
            <p>Gestión de Bodegas</p>
          </div>
          <nav>
            ${renderSidebarButton("dashboard", "📊", "Dashboard")}
            ${renderSidebarButton("inventario", "📦", "Inventario")}
            ${renderSidebarButton("recepcion", "📥", "Recepción")}
            ${renderSidebarButton("despacho", "🚚", "Despacho")}
            ${renderSidebarButton("compras", "🧾", "Compras")}
            ${renderSidebarButton("administracion", "🛠️", "Administración")}
            ${renderSidebarButton("ubicaciones", "📍", "Ubicaciones")}
            ${renderSidebarButton("reportes", "📈", "Reportes")}
            ${renderSidebarButton("usuarios", "👥", "Usuarios")}
            ${renderSidebarButton("roles", "🧩", "Roles")}
            ${renderSidebarButton("auditoria", "🔐", "Auditoría")}
          </nav>
          <div class="user-info">
            <div class="avatar">${getInitials(state.user?.nombre)}</div>
            <div class="user-meta">
              <strong>${state.user?.nombre || ""}</strong>
              <span>${state.user?.rol || ""}</span>
            </div>
          </div>
        </aside>
        <main class="main">
          <div class="topbar">
            <div>
              <h1>${current.title}</h1>
              <p>${current.subtitle || ""}</p>
            </div>
            <div class="actions">
              <div style="display:flex;align-items:center;gap:8px;">
                <div class="avatar">${getInitials(state.user?.nombre)}</div>
                <span style="font-size:13px;">${state.user?.nombre || ""}</span>
              </div>
            </div>
          </div>
          <div class="content">
            ${renderFlash()}
            ${renderCurrentScreen()}
          </div>
        </main>
      </div>
    </div>
  `;
}

function renderSidebarButton(id, icon, label) {
  if (!canAccessScreen(id)) return "";
  const active = state.currentScreen === id ? "active" : "";
  return `<button class="${active}" data-screen="${id}"><span class="nav-icon">${icon}</span>${label}</button>`;
}

function renderFlash() {
  if (!state.flash) return "";
  return `<div class="flash ${state.flash.type}">${state.flash.text}</div>`;
}

function renderCurrentScreen() {
  switch (state.currentScreen) {
    case "dashboard":
      return renderDashboard();
    case "inventario":
      return renderInventory();
    case "recepcion":
      return renderReception();
    case "despacho":
      return renderDispatch();
    case "compras":
      return renderPurchases();
    case "administracion":
      return renderAdministration();
    case "ubicaciones":
      return renderLocations();
    case "reportes":
      return renderReports();
    case "usuarios":
      return renderUsers();
    case "roles":
      return renderRoles();
    case "auditoria":
      return renderAudit();
    default:
      return "";
  }
}

function renderDashboard() {
  const dashboard = state.dashboard;
  if (!dashboard) return renderEmpty("No se pudo cargar el dashboard.");

  const bars = buildMovementBars(dashboard.recentMovements);
  return `
    <div class="kpi-grid">
      ${renderKpi("Total Productos", dashboard.kpis.totalProductos, "📦", "blue", "Catálogo activo")}
      ${renderKpi("Movimientos Hoy", dashboard.kpis.movimientosHoy, "🔄", "green", `${dashboard.recentMovements.filter((item) => item.tipo === "ENTRADA").length} entradas / ${dashboard.recentMovements.filter((item) => item.tipo !== "ENTRADA").length} salidas`)}
      ${renderKpi("Alertas Stock", dashboard.kpis.alertasStock, "⚠️", "red", "Productos bajo mínimo")}
      ${renderKpi("Ocupación Bodega", `${dashboard.kpis.ocupacionBodega}%`, "🏭", "purple", "Ubicaciones ocupadas")}
    </div>
    <div class="charts-row">
      <div class="chart-card">
        <h3>Movimientos de la Semana</h3>
        <div class="bar-chart">${bars}</div>
        <div class="chart-legend"><span class="leg-entrada">Entradas</span><span class="leg-salida">Salidas</span></div>
      </div>
      <div class="chart-card">
        <h3>Últimos Movimientos</h3>
        <table class="data-table">
          <thead>
            <tr><th>Tipo</th><th>Producto</th><th>Cant.</th></tr>
          </thead>
          <tbody>
            ${dashboard.recentMovements
              .map(
                (item) => `
                  <tr>
                    <td><span class="status ${movementTone(item.tipo)}">${item.tipo}</span></td>
                    <td>${item.producto}</td>
                    <td>${item.tipo === "SALIDA" ? "-" : "+"}${item.cantidad}</td>
                  </tr>
                `
              )
              .join("")}
          </tbody>
        </table>
      </div>
    </div>
    <div class="grid-two">
      <div class="summary-card">
        <h3>Alertas de Stock</h3>
        ${
          dashboard.alertas.length
            ? `<table class="data-table"><thead><tr><th>Producto</th><th>Ubicación</th><th>Actual</th><th>Mínimo</th></tr></thead><tbody>${dashboard.alertas
                .map(
                  (alerta) => `
                    <tr>
                      <td>${alerta.producto}</td>
                      <td class="mono">${alerta.ubicacion}</td>
                      <td>${alerta.stockActual}</td>
                      <td>${alerta.stockMinimo}</td>
                    </tr>
                  `
                )
                .join("")}</tbody></table>`
            : `<p class="muted">No hay productos bajo mínimo en este momento.</p>`
        }
      </div>
      <div class="summary-card">
        <h3>Acciones rápidas</h3>
        <div class="toolbar-actions">
          <button class="btn btn-blue" data-screen="recepcion">Registrar recepción</button>
          <button class="btn btn-outline" data-screen="despacho">Ir a picking</button>
          <button class="btn btn-outline" data-screen="inventario">Ver inventario</button>
        </div>
      </div>
    </div>
  `;
}

function renderKpi(label, value, icon, tone, change) {
  return `
    <div class="kpi-card">
      <div class="kpi-header">
        <span class="kpi-label">${label}</span>
        <div class="kpi-icon ${tone}">${icon}</div>
      </div>
      <div class="kpi-value">${value}</div>
      <div class="kpi-change ${tone === "red" ? "down" : "up"}">${change}</div>
    </div>
  `;
}

function buildMovementBars(movements) {
  const grouped = new Map();
  movements.forEach((item) => {
    const day = new Date(item.fecha).toLocaleDateString("es-GT", { weekday: "short" }).replace(".", "");
    const current = grouped.get(day) || { entrada: 0, salida: 0 };
    if (item.tipo === "SALIDA") current.salida += item.cantidad;
    else current.entrada += item.cantidad;
    grouped.set(day, current);
  });
  const entries = [...grouped.entries()];
  if (!entries.length) {
    return `<div class="empty-state">Sin movimientos recientes para graficar.</div>`;
  }
  const maxValue = Math.max(...entries.flatMap(([, value]) => [value.entrada, value.salida, 1]));
  return entries
    .map(([label, value]) => {
      const inHeight = Math.max(8, Math.round((value.entrada / maxValue) * 160));
      const outHeight = Math.max(8, Math.round((value.salida / maxValue) * 160));
      return `
        <div class="bar-column">
          <div class="bar-group">
            <div class="bar entrada" style="height:${inHeight}px"></div>
            <div class="bar salida" style="height:${outHeight}px"></div>
          </div>
          <div class="bar-label">${label}</div>
        </div>
      `;
    })
    .join("");
}

function renderInventory() {
  if (!state.inventory) return renderEmpty("No se pudo cargar el inventario.");

  const locations = flattenLocations();
  const operationMode =
    state.inventoryOperation.mode === "entry"
      ? "Nueva entrada manual"
      : state.inventoryOperation.mode === "exit"
        ? "Nueva salida manual"
        : state.inventoryOperation.mode === "adjust"
          ? "Ajuste manual de inventario"
          : "";
  const filtered = state.inventory.items.filter((item) => {
    const query = state.inventoryFilters.query.trim().toLowerCase();
    const status = getStatusLabel(item);
    return (
      (!query ||
        item.producto.nombre.toLowerCase().includes(query) ||
        item.producto.codigoBarras.toLowerCase().includes(query)) &&
      (!state.inventoryFilters.category || item.producto.categoria?.id === state.inventoryFilters.category) &&
      (!state.inventoryFilters.location || item.ubicacion.id === state.inventoryFilters.location) &&
      (!state.inventoryFilters.status || status.tone === state.inventoryFilters.status)
    );
  });

  return `
    <div class="toolbar">
      <div class="search">
        <input class="wide" name="inventory-query" type="text" placeholder="Buscar por nombre o código de barras..." value="${escapeHtml(state.inventoryFilters.query)}" />
        <select name="inventory-category">
          <option value="">Todas las categorías</option>
          ${state.categories
            .map((item) => `<option value="${item.id}" ${state.inventoryFilters.category === item.id ? "selected" : ""}>${item.nombre}</option>`)
            .join("")}
        </select>
        <select name="inventory-location">
          <option value="">Todas las ubicaciones</option>
          ${locations
            .map((item) => `<option value="${item.id}" ${state.inventoryFilters.location === item.id ? "selected" : ""}>${item.codigo}</option>`)
            .join("")}
        </select>
        <select name="inventory-status">
          <option value="">Todos los estados</option>
          <option value="normal" ${state.inventoryFilters.status === "normal" ? "selected" : ""}>Stock normal</option>
          <option value="bajo" ${state.inventoryFilters.status === "bajo" ? "selected" : ""}>Bajo mínimo</option>
          <option value="cerca" ${state.inventoryFilters.status === "cerca" ? "selected" : ""}>Cerca de mínimo</option>
        </select>
      </div>
      <div class="toolbar-actions">
        <button class="btn btn-blue" data-action="open-entry">+ Nueva entrada manual</button>
        <button class="btn btn-outline" data-action="open-exit">Nueva salida manual</button>
        <button class="btn btn-outline" data-action="open-adjust">Ajuste manual</button>
      </div>
    </div>
    ${
      state.inventoryOperation.mode
        ? `
          <div class="form-card" style="margin-bottom:20px;">
            <h2>${operationMode}</h2>
            <form id="inventory-operation-form" class="inline-form">
              <div class="form-field">
                <label>Producto</label>
                <select name="invop-producto">
                  ${state.products
                    .map(
                      (item) =>
                        `<option value="${item.id}" ${state.inventoryOperation.productoId === item.id ? "selected" : ""}>${item.nombre}</option>`
                    )
                    .join("")}
                </select>
              </div>
              <div class="form-field">
                <label>Ubicación</label>
                <select name="invop-ubicacion">
                  ${locations
                    .map(
                      (item) =>
                        `<option value="${item.id}" ${state.inventoryOperation.ubicacionId === item.id ? "selected" : ""}>${item.codigo}</option>`
                    )
                    .join("")}
                </select>
              </div>
              <div class="form-field">
                <label>${state.inventoryOperation.mode === "adjust" ? "Nueva cantidad" : "Cantidad"}</label>
                <input name="invop-cantidad" type="number" min="0" value="${state.inventoryOperation.cantidad}" />
              </div>
              <div class="form-field">
                <label>${state.inventoryOperation.mode === "adjust" ? "Motivo del ajuste" : "Referencia"}</label>
                <input name="invop-motivo" value="${escapeHtml(state.inventoryOperation.motivo)}" placeholder="${state.inventoryOperation.mode === "adjust" ? "Ej. Conteo físico" : "Ej. Entrada manual"}" />
              </div>
              <div class="admin-actions-row">
                <button class="btn btn-blue" type="submit">Guardar ${operationMode.toLowerCase()}</button>
                <button class="btn btn-muted" type="button" data-action="cancel-inventory-operation">Cancelar</button>
              </div>
            </form>
          </div>
        `
        : ""
    }
    <div class="chart-card" style="padding:0;overflow:hidden;">
      <table class="data-table">
        <thead>
          <tr>
            <th>Código</th>
            <th>Producto</th>
            <th>Categoría</th>
            <th>Ubicación</th>
            <th>Stock</th>
            <th>Unidad</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          ${filtered
            .map((item) => {
              const status = getStatusLabel(item);
              return `
                <tr>
                  <td><strong>${item.producto.codigoBarras}</strong></td>
                  <td>${item.producto.nombre}</td>
                  <td>${item.producto.categoria?.nombre || "Sin categoría"}</td>
                  <td class="mono">${item.ubicacion.codigo}</td>
                  <td>${Number(item.cantidad)}</td>
                  <td>${item.producto.unidadMedida}</td>
                  <td><span class="status ${status.tone}">${status.label}</span></td>
                </tr>
              `;
            })
            .join("")}
        </tbody>
      </table>
    </div>
    <div class="pagination">
      <span>Mostrando ${filtered.length} de ${state.inventory.items.length} registros</span>
      <div class="pages">
        <button class="active">1</button>
      </div>
    </div>
  `;
}

function renderReception() {
  const order = selectedPurchaseOrder();
  const locationOptions = flattenLocations();
  const selectableOrders = state.purchaseOrders.filter((item) => item.estado !== "COMPLETA");

  return `
    <div class="chart-card" style="padding:0;overflow:hidden;margin-bottom:20px;">
      <div style="padding:20px 20px 0;">
        <h3>Listado de órdenes de compra</h3>
        <p class="muted">Selecciona una orden pendiente o parcial para registrarle la recepción. Aquí también puedes ver cuáles ya fueron recepcionadas.</p>
      </div>
      <table class="data-table">
        <thead>
          <tr><th>Número</th><th>Proveedor</th><th>Fecha</th><th>Hora</th><th>Productos</th><th>Estado</th><th>Recepción</th><th>Acción</th></tr>
        </thead>
        <tbody>
          ${state.purchaseOrders
            .map((item) => {
              const status = purchaseOrderStatusMeta(item.estado);
              const latestReception = [...(item.recepciones || [])].sort(
                (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
              )[0];
              const hourText = latestReception
                ? new Intl.DateTimeFormat("es-GT", { timeStyle: "short" }).format(new Date(latestReception.fecha))
                : "-";
              const productsText = item.detalles.length
                ? item.detalles.map((detail) => detail.producto.nombre).join(", ")
                : "Sin productos";
              const selected = state.receptionForm.orderId === item.id;
              return `
                <tr>
                  <td><strong>${item.numero}</strong></td>
                  <td>${item.proveedor.nombre}</td>
                  <td>${formatDate(item.fechaEmision)}</td>
                  <td>${hourText}</td>
                  <td>${productsText}</td>
                  <td><span class="status ${status.tone}">${status.label}</span></td>
                  <td>${item.estado === "COMPLETA" ? "Sí" : item.estado === "PARCIAL" ? "Parcial" : "No"}</td>
                  <td>
                    ${
                      item.estado === "COMPLETA"
                        ? '<span class="muted">Ya recibida</span>'
                        : `<button class="btn ${selected ? "btn-muted" : "btn-outline"}" type="button" data-action="select-reception-order" data-order-id="${item.id}" ${selected ? "disabled" : ""}>${selected ? "Seleccionada" : "Recepcionar"}</button>`
                    }
                  </td>
                </tr>
              `;
            })
            .join("")}
        </tbody>
      </table>
    </div>
    <form class="form-card" id="reception-form">
      <h2>Datos de Recepción</h2>
      <div class="form-row">
        <div class="form-field">
          <label>No. Recepción</label>
          <input type="text" value="${order ? `REC-${new Date().getFullYear()}-${order.numero.replace(/\D/g, "").padStart(4, "0")}` : "REC-0000"}" disabled />
        </div>
        <div class="form-field">
          <label>Fecha</label>
          <input type="date" value="${new Date().toISOString().slice(0, 10)}" disabled />
        </div>
        <div class="form-field">
          <label>Orden de Compra</label>
          <select name="reception-order">
            ${selectableOrders
              .map(
                (item) =>
                  `<option value="${item.id}" ${state.receptionForm.orderId === item.id ? "selected" : ""}>${item.numero} - ${item.proveedor.nombre}</option>`
              )
              .join("")}
          </select>
        </div>
      </div>
      <div class="scan-area">
        <div class="scan-icon">📷</div>
        <p><strong>Escanear código de barras</strong></p>
        <p>Escanea o ingresa un código para aumentar la cantidad recibida del producto correspondiente en la orden.</p>
        <div class="inline-form" style="grid-template-columns:2fr auto;max-width:560px;margin:16px auto 0;">
          <input name="reception-barcode" value="${escapeHtml(state.receptionForm.barcode)}" placeholder="Ingrese código de barra" />
          <button class="btn btn-outline" type="button" data-action="scan-reception-barcode">Aplicar escaneo</button>
        </div>
      </div>
      <h2>Items Recibidos</h2>
      ${
        order
          ? `
        ${
          !locationOptions.length
            ? `<div class="flash error" style="margin:0 0 16px;">No hay ubicaciones configuradas para recepcionar productos. Crea al menos una ubicación en el módulo de Ubicaciones.</div>`
            : ""
        }
        <table class="data-table">
          <thead>
            <tr><th>Producto</th><th>OC Cantidad</th><th>Recibido</th><th>Diferencia</th><th>Ubicación</th><th>Estado</th></tr>
          </thead>
          <tbody>
            ${order.detalles
              .map((detail) => {
                const recibida = Number(state.receptionForm.cantidades[detail.productoId] ?? detail.cantidad);
                const esperada = Number(detail.cantidad);
                const diferencia = recibida - esperada;
                const itemStatus = receptionItemStatusMeta(recibida, esperada);
                return `
                  <tr>
                    <td>${detail.producto.nombre}</td>
                    <td>${esperada}</td>
                    <td><input name="qty-${detail.productoId}" type="number" min="0" value="${recibida}" style="width:96px;padding:8px;border:1px solid #ddd;border-radius:6px;" /></td>
                    <td style="color:${diferencia < 0 ? "#c62828" : "#2e7d32"};">${diferencia}</td>
                    <td>
                      <select name="loc-${detail.productoId}" style="padding:8px;border:1px solid #ddd;border-radius:6px;">
                        ${locationOptions
                          .map(
                            (location) =>
                              `<option value="${location.id}" ${state.receptionForm.ubicaciones[detail.productoId] === location.id ? "selected" : ""}>${location.codigo}</option>`
                          )
                          .join("")}
                      </select>
                    </td>
                    <td><span class="status ${itemStatus.tone}">${itemStatus.label}</span></td>
                  </tr>
                `;
              })
              .join("")}
          </tbody>
        </table>
        <div style="margin-top:16px;">
          <div class="form-field">
            <label>Observaciones</label>
            <textarea name="reception-observaciones" rows="3" placeholder="Notas sobre la recepción">${escapeHtml(state.receptionForm.observaciones)}</textarea>
          </div>
        </div>
        <div class="form-actions">
          <button type="button" class="btn btn-muted" data-action="refresh">Cancelar</button>
          <button type="submit" class="btn btn-blue" ${!locationOptions.length ? "disabled" : ""}>Guardar Recepción</button>
        </div>
      `
          : renderEmpty("No hay órdenes de compra disponibles para recibir.")
      }
    </form>
  `;
}

function renderDispatch() {
  const order = selectedDispatchOrder();
  const canGeneratePicking = currentRolePermissions().includes("Picking");
  const totalItems = order?.detalles.length || 0;
  const pickedCount = order ? order.detalles.filter((detail) => state.dispatchForm.picked[detail.id]).length : 0;
  const percent = totalItems ? Math.round((pickedCount / totalItems) * 100) : 0;
  const locationOptions = flattenLocations();
  const pendingDispatchOrders = state.dispatchOrders.filter((item) => item.estado !== "DESPACHADA");
  const finishedDispatchOrders = state.dispatchOrders.filter((item) => item.estado === "DESPACHADA");

  return `
    <div class="form-card" style="margin-bottom:20px;">
      <h2>Nueva orden de despacho</h2>
      <form id="dispatch-order-form" class="inline-form">
        <div class="form-field"><label>Número</label><input name="do-numero" value="${escapeHtml(state.dispatchOrderForm.numero)}" placeholder="OD-0002" /></div>
        <div class="form-field">
          <label>Cliente</label>
          <select name="do-cliente-id">
            <option value="">Selecciona un cliente</option>
            ${state.clients.map((item) => `<option value="${item.id}" ${state.dispatchOrderForm.clienteId === item.id ? "selected" : ""}>${item.nombre}</option>`).join("")}
          </select>
        </div>
        <div class="form-field"><label>Fecha requerida</label><input name="do-fecha" type="date" value="${state.dispatchOrderForm.fechaRequerida}" /></div>
        <div class="form-field"><label>Producto</label><select name="do-producto">${state.products.map((item) => `<option value="${item.id}" ${state.dispatchOrderForm.productoId === item.id ? "selected" : ""}>${item.nombre}</option>`).join("")}</select></div>
        <div class="form-field"><label>Ubicación</label><select name="do-ubicacion">${locationOptions.map((item) => `<option value="${item.id}" ${state.dispatchOrderForm.ubicacionId === item.id ? "selected" : ""}>${item.codigo}</option>`).join("")}</select></div>
        <div class="form-field"><label>Cantidad</label><input name="do-cantidad" type="number" min="1" value="${state.dispatchOrderForm.cantidad}" /></div>
        <div class="admin-actions-row">
          <button class="btn btn-outline" type="button" data-action="add-dispatch-item">Agregar producto</button>
          <button class="btn btn-blue" type="submit">Crear nueva orden de despacho</button>
        </div>
      </form>
    </div>
    <div class="admin-table-card" style="margin-bottom:20px;">
      <div style="padding:20px 20px 0;">
        <h3>Productos de este despacho</h3>
        <p class="muted">Agrega uno o varios productos con su ubicación antes de guardar la orden de despacho.</p>
      </div>
      <table class="data-table">
        <thead><tr><th>Producto</th><th>Ubicación</th><th>Cantidad</th><th>Acción</th></tr></thead>
        <tbody>
          ${
            state.dispatchOrderItems.length
              ? state.dispatchOrderItems
                  .map(
                    (item, index) => `
                      <tr>
                        <td>${item.productoNombre}</td>
                        <td class="mono">${item.ubicacionCodigo}</td>
                        <td>${item.cantidad}</td>
                        <td><button class="btn btn-muted" type="button" data-action="remove-dispatch-item" data-item-index="${index}">Quitar</button></td>
                      </tr>
                    `
                  )
                  .join("")
              : '<tr><td colspan="4">Todavía no has agregado productos a esta orden de despacho.</td></tr>'
          }
        </tbody>
      </table>
    </div>
    <div class="admin-layout" style="margin-bottom:20px;">
      <div class="summary-card">
        <h3>Órdenes ya despachadas</h3>
        ${
          finishedDispatchOrders.length
            ? `<table class="data-table">
                <thead><tr><th>Orden</th><th>Cliente</th><th>Acción</th></tr></thead>
                <tbody>
                  ${finishedDispatchOrders
                    .map((item) => {
                      const selected = state.dispatchForm.orderId === item.id;
                      return `
                        <tr>
                          <td><strong>${item.numero}</strong></td>
                          <td>${item.cliente}</td>
                          <td><button class="btn ${selected ? "btn-muted" : "btn-outline"}" type="button" data-action="select-dispatch-order" data-order-id="${item.id}" ${selected ? "disabled" : ""}>${selected ? "Vista actual" : "Ver despacho"}</button></td>
                        </tr>
                      `;
                    })
                    .join("")}
                </tbody>
              </table>`
            : '<p class="muted">Todavía no hay órdenes completamente despachadas.</p>'
        }
      </div>
      <div class="summary-card">
        <h3>Órdenes pendientes por despachar</h3>
        ${
          pendingDispatchOrders.length
            ? `<table class="data-table">
                <thead><tr><th>Orden</th><th>Cliente</th><th>Estado</th><th>Acción</th></tr></thead>
                <tbody>
                  ${pendingDispatchOrders
                    .map((item) => {
                      const status = dispatchOrderStatusMeta(item.estado);
                      const selected = state.dispatchForm.orderId === item.id;
                      return `
                        <tr>
                          <td><strong>${item.numero}</strong></td>
                          <td>${item.cliente}</td>
                          <td><span class="status ${status.tone}">${status.label}</span></td>
                          <td><button class="btn ${selected ? "btn-muted" : "btn-outline"}" type="button" data-action="select-dispatch-order" data-order-id="${item.id}" ${selected ? "disabled" : ""}>${selected ? "Seleccionada" : "Trabajar orden"}</button></td>
                        </tr>
                      `;
                    })
                    .join("")}
                </tbody>
              </table>`
            : '<p class="muted">No hay órdenes pendientes ni en picking en este momento.</p>'
        }
      </div>
    </div>
    ${
      order
        ? `
      <div class="toolbar">
        <div class="search">
          <select name="dispatch-order">
            ${state.dispatchOrders
              .map(
                (item) =>
                  `<option value="${item.id}" ${state.dispatchForm.orderId === item.id ? "selected" : ""}>${item.numero} - ${item.cliente}</option>`
              )
              .join("")}
          </select>
        </div>
        <div class="toolbar-actions">
          ${order.estado === "PENDIENTE" && canGeneratePicking ? '<button class="btn btn-blue" data-action="generate-picking">Generar picking</button>' : ""}
        </div>
      </div>
      <div class="order-header">
        <div class="order-info">
          <h2>Orden de Despacho: ${order.numero}</h2>
          <p>Cliente: ${order.cliente} | Fecha requerida: ${formatDate(order.fechaRequerida)}</p>
        </div>
        <div class="order-status">
          <strong style="font-size:18px;color:#2E5C8A;">${pickedCount} de ${totalItems} items</strong>
          <p class="muted">Estado actual: ${order.estado}</p>
          <div class="progress-bar"><div class="fill" style="width:${percent}%"></div></div>
        </div>
      </div>
      <div class="summary-card" style="margin-bottom:20px;">
        <h3>Ubicaciones a recoger</h3>
        <table class="data-table">
          <thead><tr><th>Producto</th><th>Código</th><th>Ubicación</th><th>Cantidad a despachar</th><th>Stock disponible</th><th>Validación</th></tr></thead>
          <tbody>
            ${order.detalles
              .map((detail) => {
                const stockDisponible = inventoryQuantityFor(detail.producto.id, detail.ubicacion.id);
                const cantidadDespacho = Number(detail.cantidad);
                const enoughStock = stockDisponible >= cantidadDespacho;

                return `
                  <tr>
                    <td>${detail.producto.nombre}</td>
                    <td>${detail.producto.codigoBarras}</td>
                    <td><strong class="mono">${detail.ubicacion.codigo}</strong></td>
                    <td>${cantidadDespacho}</td>
                    <td>${stockDisponible}</td>
                    <td><span class="status ${enoughStock ? "ok" : "danger"}">${enoughStock ? "Stock suficiente" : "Stock insuficiente"}</span></td>
                  </tr>
                `;
              })
              .join("")}
          </tbody>
        </table>
      </div>
      ${
        order.estado === "DESPACHADA"
          ? `
            <div class="summary-card" style="margin-bottom:20px;">
              <h3>Despacho ya finalizado</h3>
              <p class="muted">Esta orden ya salió de bodega. Aquí solo puedes consultar las ubicaciones usadas y, si aplica, registrar una devolución.</p>
            </div>
          `
          : ""
      }
      ${
        order.estado === "DESPACHADA"
          ? `
            <div class="picking-list">
              ${order.detalles
                .map(
                  (detail) => `
                    <div class="picking-item">
                      <div class="check checked">✓</div>
                      <div class="ubicacion-tag">${detail.ubicacion.codigo}</div>
                      <div class="producto"><strong>${detail.producto.nombre}</strong><span>Código: ${detail.producto.codigoBarras}</span></div>
                      <div class="cantidad">${Number(detail.cantidad)}</div>
                      <span class="status ok">Despachado</span>
                    </div>
                  `
                )
                .join("")}
              <button class="btn-finalizar" disabled>Despacho finalizado</button>
            </div>
          `
          : order.estado === "PENDIENTE"
            ? `
              <div class="summary-card" style="margin-top:20px;">
                <h3>Picking pendiente de iniciar</h3>
                <p class="muted">${
                  canGeneratePicking
                    ? "Antes de completar esta orden debes dar clic en <strong>Generar picking</strong>. Cuando la orden pase a <strong>En picking</strong> podrás marcar los productos como recogidos y confirmar el despacho."
                    : "Esta orden sigue pendiente. Tu usuario no tiene permiso de <strong>Picking</strong> para iniciarla."
                }</p>
              </div>
              <div class="picking-list" style="opacity:0.72;">
                ${order.detalles
                  .map(
                    (detail) => `
                      <div class="picking-item">
                        <div class="check"></div>
                        <div class="ubicacion-tag">${detail.ubicacion.codigo}</div>
                        <div class="producto"><strong>${detail.producto.nombre}</strong><span>Código: ${detail.producto.codigoBarras}</span></div>
                        <div class="cantidad">${Number(detail.cantidad)}</div>
                        <span class="status pendiente">Pendiente de picking</span>
                      </div>
                    `
                  )
                  .join("")}
                <button class="btn-finalizar" disabled>Debes generar el picking primero</button>
              </div>
            `
          : `
            <div class="picking-list">
              ${order.detalles
                .map(
                  (detail) => `
                    <label class="picking-item">
                      <input type="checkbox" name="pick-${detail.id}" ${state.dispatchForm.picked[detail.id] ? "checked" : ""} style="display:none;" />
                      <div class="check ${state.dispatchForm.picked[detail.id] ? "checked" : ""}">${state.dispatchForm.picked[detail.id] ? "✓" : ""}</div>
                      <div class="ubicacion-tag">${detail.ubicacion.codigo}</div>
                      <div class="producto"><strong>${detail.producto.nombre}</strong><span>Código: ${detail.producto.codigoBarras}</span></div>
                      <div class="cantidad">${Number(detail.cantidad)}</div>
                      <span class="status ${state.dispatchForm.picked[detail.id] ? "ok" : "warning"}">${state.dispatchForm.picked[detail.id] ? "Recogido" : "Pendiente"}</span>
                    </label>
                  `
                )
                .join("")}
              <button class="btn-finalizar" data-action="finalize-dispatch" ${!totalItems || pickedCount !== totalItems ? "disabled" : ""}>
                ${`Confirmar Despacho${pickedCount !== totalItems ? ` (faltan ${totalItems - pickedCount} ítems)` : ""}`}
              </button>
            </div>
          `
      }
      ${
        order.estado === "DESPACHADA"
          ? `
            <div class="form-card" style="margin-top:20px;">
              <h2>Registrar devolución</h2>
              <div class="form-field" style="margin-bottom:16px;">
                <label>Motivo</label>
                <input name="return-motivo" value="${escapeHtml(state.dispatchForm.motivo)}" />
              </div>
              <table class="data-table">
                <thead><tr><th>Producto</th><th>Ubicación</th><th>Despachado</th><th>Ya devuelto</th><th>Pendiente</th><th>Cantidad a devolver</th></tr></thead>
                <tbody>
                  ${order.detalles
                    .map((detail) => {
                      const returned = returnedQuantityFor(detail);
                      const remaining = remainingReturnQuantityFor(detail);
                      const currentValue = Math.min(Number(state.dispatchForm.returns[detail.id] ?? 0), remaining);

                      return `
                        <tr>
                          <td>${detail.producto.nombre}</td>
                          <td>${detail.ubicacion.codigo}</td>
                          <td>${Number(detail.cantidad)}</td>
                          <td>${returned}</td>
                          <td>${remaining}</td>
                          <td>
                            <input
                              type="number"
                              min="0"
                              max="${remaining}"
                              name="return-${detail.id}"
                              value="${currentValue}"
                              ${remaining === 0 ? "disabled" : ""}
                              style="width:110px;padding:8px;border:1px solid #ddd;border-radius:6px;"
                            />
                          </td>
                        </tr>
                      `;
                    })
                    .join("")}
                </tbody>
              </table>
              <div class="admin-actions-row" style="margin-top:16px;">
                <button class="btn btn-outline" data-action="process-return">Registrar devolución</button>
              </div>
              <div class="summary-card" style="margin-top:20px;">
                <h3>Reporte de devoluciones</h3>
                ${
                  order.devoluciones?.length
                    ? `
                      <table class="data-table">
                        <thead><tr><th>Fecha</th><th>Motivo</th><th>Usuario</th><th>Detalle</th><th>Total</th></tr></thead>
                        <tbody>
                          ${order.devoluciones
                            .map(
                              (devolucion) => `
                                <tr>
                                  <td>${formatDateTime(devolucion.createdAt)}</td>
                                  <td>${devolucion.motivo}</td>
                                  <td>${devolucion.usuario?.nombre || "N/D"}</td>
                                  <td>${devolucion.detalles
                                    .map(
                                      (item) =>
                                        `${item.detalleDespacho.producto.nombre} (${item.detalleDespacho.ubicacion.codigo}): ${Number(item.cantidad)}`
                                    )
                                    .join(" | ")}</td>
                                  <td>${devolucion.totalItems}</td>
                                </tr>
                              `
                            )
                            .join("")}
                        </tbody>
                      </table>
                    `
                    : '<p class="muted">Todavía no se han registrado devoluciones para esta orden.</p>'
                }
              </div>
            </div>
          `
          : ""
      }
    `
        : renderEmpty("No hay órdenes de despacho disponibles.")
    }
  `;
}

function renderLocations() {
  const locations = flattenLocations();
  const secciones = state.locations.flatMap((bodega) => bodega.secciones);
  const racks = secciones.flatMap((seccion) => seccion.racks);
  return `
    <div class="summary-grid">
      <div class="summary-card">
        <h3>Resumen</h3>
        <p class="muted">Bodegas: ${state.locations.length}</p>
        <p class="muted">Ubicaciones: ${locations.length}</p>
        <p class="muted">Ocupadas: ${locations.filter((item) => item.ocupada).length}</p>
      </div>
      <div class="summary-card">
        <h3>Mapa de ubicaciones</h3>
        <p class="muted">Vista jerárquica con bodegas, secciones, racks y ubicaciones disponibles.</p>
      </div>
    </div>
    <div class="tree-grid" style="margin-top:20px;">
      ${state.locations
        .map(
          (bodega) => `
            <div class="tree-card">
              <h3>${bodega.nombre}</h3>
              <p class="muted">${bodega.direccion || "Sin dirección"}</p>
              <ul>
                ${bodega.secciones
                  .map(
                    (seccion) => `
                      <li>
                        <strong>${seccion.nombre}</strong>
                        <ul>
                          ${seccion.racks
                            .map(
                              (rack) => `
                                <li>
                                  Rack ${rack.codigo} · capacidad ${rack.capacidad}
                                  <ul>
                                    ${rack.ubicaciones
                                      .map(
                                        (ubicacion) =>
                                          `<li>${ubicacion.codigo} · nivel ${ubicacion.nivel} · ${ubicacion.ocupada ? "ocupada" : "libre"}</li>`
                                      )
                                      .join("")}
                                  </ul>
                                </li>
                              `
                            )
                            .join("")}
                        </ul>
                      </li>
                    `
                  )
                  .join("")}
              </ul>
            </div>
          `
        )
        .join("")}
    </div>
    <div class="admin-layout" style="margin-top:20px;">
      <section class="admin-section">
        <div class="admin-section-header">
          <div>
            <h2>Configuración física</h2>
            <p>Crea bodegas, secciones, racks y ubicaciones en el mismo módulo donde visualizas la estructura.</p>
          </div>
          <span class="admin-badge">Layout</span>
        </div>
        <div class="admin-stack">
          <div class="admin-form-card">
            <h3>Bodega y secciones</h3>
            <form id="bodega-form" class="inline-form">
              <div class="form-field"><label>Bodega</label><input name="bodega-nombre" value="${escapeHtml(state.locationForms.bodega.nombre)}" /></div>
              <div class="form-field"><label>Dirección</label><input name="bodega-direccion" value="${escapeHtml(state.locationForms.bodega.direccion)}" /></div>
              <div class="admin-actions-row"><button class="btn btn-blue" type="submit">Crear bodega</button></div>
            </form>
            <form id="seccion-form" class="inline-form" style="margin-top:16px;">
              <div class="form-field"><label>Sección</label><input name="seccion-nombre" value="${escapeHtml(state.locationForms.seccion.nombre)}" /></div>
              <div class="form-field"><label>Bodega</label><select name="seccion-bodega">${state.locations.map((item) => `<option value="${item.id}" ${state.locationForms.seccion.bodegaId === item.id ? "selected" : ""}>${item.nombre}</option>`).join("")}</select></div>
              <div class="admin-actions-row"><button class="btn btn-blue" type="submit">Crear sección</button></div>
            </form>
          </div>
          <div class="admin-form-card">
            <h3>Racks y ubicaciones</h3>
            <form id="rack-form" class="inline-form">
              <div class="form-field"><label>Código rack</label><input name="rack-codigo" value="${escapeHtml(state.locationForms.rack.codigo)}" /></div>
              <div class="form-field"><label>Sección</label><select name="rack-seccion">${secciones.map((item) => `<option value="${item.id}" ${state.locationForms.rack.seccionId === item.id ? "selected" : ""}>${item.nombre}</option>`).join("")}</select></div>
              <div class="form-field"><label>Capacidad</label><input name="rack-capacidad" type="number" min="1" value="${state.locationForms.rack.capacidad}" /></div>
              <div class="admin-actions-row"><button class="btn btn-blue" type="submit">Crear rack</button></div>
            </form>
            <form id="ubicacion-form" class="inline-form" style="margin-top:16px;">
              <div class="form-field"><label>Código ubicación</label><input name="ubicacion-codigo" value="${escapeHtml(state.locationForms.ubicacion.codigo)}" /></div>
              <div class="form-field"><label>Rack</label><select name="ubicacion-rack">${racks.map((item) => `<option value="${item.id}" ${state.locationForms.ubicacion.rackId === item.id ? "selected" : ""}>${item.codigo}</option>`).join("")}</select></div>
              <div class="form-field"><label>Nivel</label><input name="ubicacion-nivel" type="number" min="1" value="${state.locationForms.ubicacion.nivel}" /></div>
              <div class="form-field"><label>Capacidad máxima</label><input name="ubicacion-capacidad" type="number" min="1" step="0.01" value="${state.locationForms.ubicacion.capacidadMax}" /></div>
              <div class="admin-actions-row"><button class="btn btn-blue" type="submit">Crear ubicación</button></div>
            </form>
          </div>
        </div>
      </section>
    </div>
  `;
}

function renderAdministration() {
  const isEditingProduct = Boolean(state.productForm.id);
  const isEditingClient = Boolean(state.clientForm.id);
  return `
    <div class="admin-layout">
      <section class="admin-section">
        <div class="admin-section-header">
          <div>
            <h2>Catálogos maestros</h2>
            <p>Crea categorías, administra productos y mantén ordenado el catálogo base del sistema.</p>
          </div>
          <span class="admin-badge">Catálogos</span>
        </div>
        <div class="admin-stack">
          <div class="admin-form-card">
            <h2>Nueva categoría</h2>
            <form id="category-form" class="inline-form">
              <div class="form-field"><label>Nombre</label><input name="category-nombre" value="${escapeHtml(state.categoryForm.nombre)}" /></div>
              <div class="form-field"><label>Descripción</label><input name="category-descripcion" value="${escapeHtml(state.categoryForm.descripcion)}" /></div>
              <div style="display:flex;align-items:end;"><button class="btn btn-blue" type="submit">Crear categoría</button></div>
            </form>
          </div>
        </div>
        <div class="admin-form-card">
          <h2>${isEditingProduct ? "Editar producto" : "Nuevo producto"}</h2>
          <form id="product-form" class="inline-form">
            <div class="form-field"><label>Código de barras</label><input name="product-codigo" value="${escapeHtml(state.productForm.codigoBarras)}" /></div>
            <div class="form-field"><label>Nombre</label><input name="product-nombre" value="${escapeHtml(state.productForm.nombre)}" /></div>
            <div class="form-field"><label>Descripción</label><input name="product-descripcion" value="${escapeHtml(state.productForm.descripcion)}" /></div>
            <div class="form-field"><label>Categoría</label><select name="product-categoria">${state.categories.map((item) => `<option value="${item.id}" ${state.productForm.categoriaId === item.id ? "selected" : ""}>${item.nombre}</option>`).join("")}</select></div>
            <div class="form-field"><label>Unidad</label><input name="product-unidad" value="${escapeHtml(state.productForm.unidadMedida)}" /></div>
            <div class="form-field"><label>Stock mínimo</label><input name="product-minimo" type="number" min="0" value="${state.productForm.stockMinimo}" /></div>
            <div class="form-field"><label>Stock máximo</label><input name="product-maximo" type="number" min="0" value="${state.productForm.stockMaximo}" /></div>
            <div style="display:flex;align-items:end;gap:8px;">
              <button class="btn btn-blue" type="submit">${isEditingProduct ? "Guardar cambios" : "Crear producto"}</button>
              ${isEditingProduct ? '<button class="btn btn-muted" type="button" data-action="cancel-product-edit">Cancelar</button>' : ""}
            </div>
          </form>
        </div>
        <div class="admin-table-card">
          <div style="padding:20px 20px 0;">
            <h3>CRUD de productos</h3>
            <p class="muted">Aquí aparecen los productos creados aunque todavía no tengan stock en inventario.</p>
          </div>
          <table class="data-table">
            <thead><tr><th>Código</th><th>Producto</th><th>Categoría</th><th>Unidad</th><th>Stock mínimo</th><th>Stock máximo</th><th>Acciones</th></tr></thead>
            <tbody>
              ${state.products
                .map(
                  (item) => `
                    <tr>
                      <td><strong>${item.codigoBarras}</strong></td>
                      <td>${item.nombre}</td>
                      <td>${item.categoria?.nombre || "Sin categoría"}</td>
                      <td>${item.unidadMedida}</td>
                      <td>${item.stockMinimo}</td>
                      <td>${item.stockMaximo}</td>
                      <td>
                        <div class="toolbar-actions">
                          <button class="btn btn-outline" type="button" data-action="edit-product" data-product-id="${item.id}">Editar</button>
                          <button class="btn btn-muted" type="button" data-action="delete-product" data-product-id="${item.id}">Eliminar</button>
                        </div>
                      </td>
                    </tr>
                  `
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </section>

      <section class="admin-section">
        <div class="admin-section-header">
          <div>
          <h2>CRUD de clientes</h2>
          <p>Administra el catálogo de clientes que luego usarás al crear nuevas órdenes de despacho.</p>
          </div>
          <span class="admin-badge">Clientes</span>
        </div>
      <div class="admin-form-card">
        <h2>${isEditingClient ? "Editar cliente" : "Nuevo cliente"}</h2>
        <form id="client-form" class="inline-form">
          <div class="form-field"><label>Nombre</label><input name="client-nombre" value="${escapeHtml(state.clientForm.nombre)}" /></div>
          <div class="form-field"><label>Email</label><input name="client-email" type="email" value="${escapeHtml(state.clientForm.email)}" /></div>
          <div class="form-field"><label>Teléfono</label><input name="client-telefono" value="${escapeHtml(state.clientForm.telefono)}" /></div>
          <div class="form-field"><label>Dirección</label><input name="client-direccion" value="${escapeHtml(state.clientForm.direccion)}" /></div>
          <div class="admin-actions-row">
            <button class="btn btn-blue" type="submit">${isEditingClient ? "Guardar cliente" : "Crear cliente"}</button>
            ${isEditingClient ? '<button class="btn btn-muted" type="button" data-action="cancel-client-edit">Cancelar</button>' : ""}
          </div>
        </form>
      </div>
      <div class="admin-table-card">
        <div style="padding:20px 20px 0;">
          <h3>Catálogo de clientes</h3>
          <p class="muted">Clientes disponibles para las órdenes de despacho.</p>
        </div>
        <table class="data-table">
          <thead><tr><th>ID</th><th>Nombre</th><th>Email</th><th>Teléfono</th><th>Dirección</th><th>Acciones</th></tr></thead>
          <tbody>
            ${state.clients.length
              ? state.clients
                  .map(
                    (client) => `
                      <tr>
                        <td class="mono">${client.codigo}</td>
                        <td>${client.nombre}</td>
                        <td>${client.email || "-"}</td>
                        <td>${client.telefono || "-"}</td>
                        <td>${client.direccion || "-"}</td>
                        <td>
                          <div class="toolbar-actions">
                            <button class="btn btn-outline" type="button" data-action="edit-client" data-client-id="${client.id}">Editar</button>
                            <button class="btn btn-muted" type="button" data-action="delete-client" data-client-id="${client.id}">Eliminar</button>
                          </div>
                        </td>
                      </tr>
                    `
                  )
                  .join("")
              : '<tr><td colspan="6">No hay clientes creados todavía.</td></tr>'}
          </tbody>
        </table>
      </div>
      </section>

      <section class="admin-section">
        <div class="admin-section-header">
          <div>
            <h2>Atajos relacionados</h2>
            <p>Usa estas rutas para seguir con operaciones específicas sin duplicar módulos dentro de Administración.</p>
          </div>
          <span class="admin-badge">Accesos</span>
        </div>
        <div class="admin-grid-wide">
          <div class="admin-form-card">
            <h3>Compras y proveedores</h3>
            <p>Las órdenes de compra y el CRUD de proveedores viven en su módulo propio para evitar duplicidad.</p>
            <div class="admin-actions-row">
              <button class="btn btn-blue" type="button" data-screen="compras">Ir a compras y proveedores</button>
            </div>
          </div>
          <div class="admin-form-card">
            <h3>Ubicaciones</h3>
            <p>La configuración de bodegas, secciones, racks y ubicaciones quedó en la pestaña de Ubicaciones.</p>
            <div class="admin-actions-row">
              <button class="btn btn-blue" type="button" data-screen="ubicaciones">Ir a ubicaciones</button>
            </div>
          </div>
        </div>
      </section>
    </div>
  `;
}

function renderPurchases() {
  return `
    <div class="admin-layout">
      <section class="admin-section">
        <div class="admin-section-header">
          <div>
            <h2>Órdenes de compra</h2>
            <p>Crea nuevas órdenes de compra y usa la gestión de proveedores solo cuando la necesites.</p>
          </div>
          <span class="admin-badge">Compras</span>
        </div>
        <div class="admin-form-card">
          <form id="purchase-order-form" class="inline-form">
            <div class="form-field"><label>Número</label><input name="po-numero" value="${escapeHtml(state.purchaseOrderForm.numero)}" placeholder="OC-0002" /></div>
            <div class="form-field"><label>Proveedor</label><select name="po-proveedor">${state.providers.map((item) => `<option value="${item.id}" ${state.purchaseOrderForm.proveedorId === item.id ? "selected" : ""}>${item.nombre}</option>`).join("")}</select></div>
            <div class="form-field"><label>Fecha</label><input name="po-fecha" type="date" value="${state.purchaseOrderForm.fechaEmision}" /></div>
            <div class="form-field"><label>Producto</label><select name="po-producto">${state.products.map((item) => `<option value="${item.id}" ${state.purchaseOrderForm.productoId === item.id ? "selected" : ""}>${item.nombre}</option>`).join("")}</select></div>
            <div class="form-field"><label>Cantidad</label><input name="po-cantidad" type="number" min="1" value="${state.purchaseOrderForm.cantidad}" /></div>
            <div class="form-field"><label>Precio unitario</label><input name="po-precio" type="number" min="0" step="0.01" value="${state.purchaseOrderForm.precioUnitario}" /></div>
            <div class="admin-actions-row">
              <button class="btn btn-outline" type="button" data-action="add-purchase-item">Agregar producto</button>
              <button class="btn btn-blue" type="submit">Crear orden de compra</button>
              <button class="btn btn-outline" type="button" data-action="open-provider-window">Gestión de proveedores</button>
            </div>
          </form>
        </div>
        <div class="admin-table-card">
          <div style="padding:20px 20px 0;">
            <h3>Productos de esta orden</h3>
            <p class="muted">Agrega uno o varios productos antes de guardar la orden de compra.</p>
          </div>
          <table class="data-table">
            <thead><tr><th>Producto</th><th>Cantidad</th><th>Precio unitario</th><th>Subtotal</th><th>Acción</th></tr></thead>
            <tbody>
              ${
                state.purchaseOrderItems.length
                  ? state.purchaseOrderItems
                      .map((item, index) => `
                        <tr>
                          <td>${item.productoNombre}</td>
                          <td>${item.cantidad}</td>
                          <td>${item.precioUnitario}</td>
                          <td>${(item.cantidad * item.precioUnitario).toFixed(2)}</td>
                          <td><button class="btn btn-muted" type="button" data-action="remove-purchase-item" data-item-index="${index}">Quitar</button></td>
                        </tr>
                      `)
                      .join("")
                  : '<tr><td colspan="5">Todavía no has agregado productos a esta orden.</td></tr>'
              }
            </tbody>
          </table>
        </div>
        <div class="admin-table-card">
          <div style="padding:20px 20px 0;">
            <h3>Órdenes registradas</h3>
            <p class="muted">Listado actual de órdenes de compra creadas en el sistema.</p>
          </div>
          <table class="data-table">
            <thead><tr><th>Número</th><th>Proveedor</th><th>Estado</th><th>Fecha</th><th>Hora</th><th>Producto(s)</th><th>Items</th></tr></thead>
            <tbody>
              ${state.purchaseOrders
                .map((item) => {
                  const latestReception = [...(item.recepciones || [])].sort(
                    (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
                  )[0];
                  const hourText = latestReception
                    ? new Intl.DateTimeFormat("es-GT", { timeStyle: "short" }).format(new Date(latestReception.fecha))
                    : "-";
                  const productsText = item.detalles.length
                    ? item.detalles.map((detail) => detail.producto.nombre).join(", ")
                    : "Sin productos";

                  return `
                    <tr>
                      <td>${item.numero}</td>
                      <td>${item.proveedor.nombre}</td>
                      <td>${item.estado}</td>
                      <td>${formatDate(item.fechaEmision)}</td>
                      <td>${hourText}</td>
                      <td>${productsText}</td>
                      <td>${item.detalles.length}</td>
                    </tr>
                  `;
                })
                .join("")}
            </tbody>
          </table>
        </div>
      </section>
      ${renderProviderWindow()}
    </div>
  `;
}

function renderProviderWindow() {
  if (!state.providerWindowOpen) return "";
  const isEditingProvider = Boolean(state.providerForm.id);
  return `
    <div class="modal-backdrop">
      <div class="modal-window">
        <div class="modal-header">
          <div>
            <h3>Gestión de proveedores</h3>
            <p>Administra los proveedores sin salir del módulo de compras.</p>
          </div>
          <button class="btn btn-muted" type="button" data-action="close-provider-window">Cerrar</button>
        </div>
        <div class="admin-form-card">
          <h3>${isEditingProvider ? "Editar proveedor" : "Nuevo proveedor"}</h3>
          <form id="provider-form" class="inline-form">
            <div class="form-field"><label>Nombre</label><input name="provider-nombre" value="${escapeHtml(state.providerForm.nombre)}" /></div>
            <div class="form-field"><label>Contacto</label><input name="provider-contacto" value="${escapeHtml(state.providerForm.contacto)}" /></div>
            <div class="form-field"><label>Teléfono</label><input name="provider-telefono" value="${escapeHtml(state.providerForm.telefono)}" /></div>
            <div class="form-field"><label>Email</label><input name="provider-email" type="email" value="${escapeHtml(state.providerForm.email)}" /></div>
            <div class="admin-actions-row">
              <button class="btn btn-blue" type="submit">${isEditingProvider ? "Guardar proveedor" : "Crear proveedor"}</button>
              ${isEditingProvider ? '<button class="btn btn-muted" type="button" data-action="cancel-provider-edit">Cancelar</button>' : ""}
            </div>
          </form>
        </div>
        <div class="admin-table-card">
          <div style="padding:20px 20px 0;">
            <h3>CRUD de proveedores</h3>
            <p class="muted">Administra los proveedores desde esta ventana sin mezclar el flujo con las órdenes de compra.</p>
          </div>
          <table class="data-table">
            <thead><tr><th>Nombre</th><th>Contacto</th><th>Teléfono</th><th>Email</th><th>Acciones</th></tr></thead>
            <tbody>
              ${state.providers
                .map(
                  (item) => `
                    <tr>
                      <td>${item.nombre}</td>
                      <td>${item.contacto || "-"}</td>
                      <td>${item.telefono || "-"}</td>
                      <td>${item.email || "-"}</td>
                      <td>
                        <div class="toolbar-actions">
                          <button class="btn btn-outline" type="button" data-action="edit-provider" data-provider-id="${item.id}">Editar</button>
                          <button class="btn btn-muted" type="button" data-action="delete-provider" data-provider-id="${item.id}">Eliminar</button>
                        </div>
                      </td>
                    </tr>
                  `
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function renderReports() {
  if (!state.reports) return renderEmpty("No se pudo generar el resumen.");
  const reportBars = buildReportBars(state.reports.movementByDay || []);
  return `
    <div class="form-card">
      <h2>Filtro de reportes</h2>
      <form id="report-form" class="inline-form">
        <div class="form-field">
          <label>Desde</label>
          <input name="report-from" type="date" value="${state.reportFilters.from}" />
        </div>
        <div class="form-field">
          <label>Hasta</label>
          <input name="report-to" type="date" value="${state.reportFilters.to}" />
        </div>
        <div style="display:flex;align-items:end;">
          <button class="btn btn-blue" type="submit">Actualizar reporte</button>
        </div>
      </form>
    </div>
    <div class="kpi-grid">
      ${renderKpi("Movimientos", state.reports.summary.movimientos, "📈", "blue", `${state.reports.summary.entradas} entradas / ${state.reports.summary.salidas} salidas`)}
      ${renderKpi("Compras", state.reports.summary.ordenesCompra, "📥", "green", `${state.reports.summary.unidadesCompradas} unidades compradas`)}
      ${renderKpi("Despachos", state.reports.summary.ordenesDespacho, "🚚", "purple", `${state.reports.summary.unidadesDespachadas} unidades despachadas`)}
      ${renderKpi("Alertas", state.reports.summary.alertasStock, "⚠️", "red", `${state.reports.summary.eventosAuditados} eventos auditados`)}
    </div>
    <div class="grid-two">
      <div class="summary-card">
        <h3>Movimientos por día</h3>
        <div class="bar-chart">${reportBars}</div>
        <div class="chart-legend"><span class="leg-entrada">Entradas</span><span class="leg-salida">Salidas</span></div>
      </div>
      <div class="summary-card">
        <h3>Ranking de rotación</h3>
        <table class="data-table">
          <thead><tr><th>Producto</th><th>Entradas</th><th>Salidas</th><th>Total</th></tr></thead>
          <tbody>
            ${state.reports.rotationRanking
              .map(
                (item) => `
                  <tr>
                    <td>${item.producto}</td>
                    <td>${item.entradas}</td>
                    <td>${item.salidas}</td>
                    <td>${item.total}</td>
                  </tr>
                `
              )
              .join("")}
          </tbody>
        </table>
      </div>
      <div class="summary-card">
        <h3>Acciones recientes auditadas</h3>
        <table class="data-table">
          <thead><tr><th>Fecha</th><th>Usuario</th><th>Acción</th></tr></thead>
          <tbody>
            ${state.reports.recentAudit
              .map(
                (item) => `
                  <tr>
                    <td>${formatDateTime(item.fecha)}</td>
                    <td>${item.usuario?.nombre || "N/D"}</td>
                    <td>${item.accion}</td>
                  </tr>
                `
              )
              .join("")}
          </tbody>
        </table>
      </div>
    </div>
    <div class="grid-two" style="margin-top:20px;">
      <div class="summary-card">
        <h3>Alertas de stock en rango</h3>
        ${
          state.reports.lowStock.length
            ? `<table class="data-table"><thead><tr><th>Producto</th><th>Ubicación</th><th>Actual</th><th>Mínimo</th></tr></thead><tbody>${state.reports.lowStock
                .map(
                  (item) => `
                    <tr>
                      <td>${item.producto}</td>
                      <td>${item.ubicacion}</td>
                      <td>${item.stockActual}</td>
                      <td>${item.stockMinimo}</td>
                    </tr>
                  `
                )
                .join("")}</tbody></table>`
            : `<p class="muted">Sin alertas para el rango seleccionado.</p>`
        }
      </div>
      <div class="summary-card">
        <h3>Órdenes procesadas</h3>
        <table class="data-table">
          <thead><tr><th>Tipo</th><th>Número</th><th>Estado</th><th>Unidades</th></tr></thead>
          <tbody>
            ${state.reports.purchaseSummary
              .slice(0, 5)
              .map(
                (item) => `
                  <tr>
                    <td>Compra</td>
                    <td>${item.numero}</td>
                    <td>${item.estado}</td>
                    <td>${item.unidades}</td>
                  </tr>
                `
              )
              .join("")}
            ${state.reports.dispatchSummary
              .slice(0, 5)
              .map(
                (item) => `
                  <tr>
                    <td>Despacho</td>
                    <td>${item.numero}</td>
                    <td>${item.estado}</td>
                    <td>${item.unidades}</td>
                  </tr>
                `
              )
              .join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function buildReportBars(movementByDay) {
  if (!movementByDay.length) {
    return `<div class="empty-state">No hay movimientos en el rango seleccionado.</div>`;
  }

  const maxValue = Math.max(
    ...movementByDay.flatMap((item) => [item.entradas, item.salidas, 1])
  );

  return movementByDay
    .map((item) => {
      const label = new Date(item.fecha).toLocaleDateString("es-GT", { month: "short", day: "numeric" });
      return `
        <div class="bar-column">
          <div class="bar-group">
            <div class="bar entrada" style="height:${Math.max(8, Math.round((item.entradas / maxValue) * 160))}px"></div>
            <div class="bar salida" style="height:${Math.max(8, Math.round((item.salidas / maxValue) * 160))}px"></div>
          </div>
          <div class="bar-label">${label}</div>
        </div>
      `;
    })
    .join("");
}

function renderUsers() {
  const isEditingUser = Boolean(state.userForm.id);
  return `
    <div class="form-card">
      <h2>${isEditingUser ? "Editar usuario" : "Nuevo usuario"}</h2>
      <form id="user-form" class="inline-form">
        <div class="form-field">
          <label>Nombre</label>
          <input name="user-nombre" value="${escapeHtml(state.userForm.nombre)}" />
        </div>
        <div class="form-field">
          <label>Email</label>
          <input name="user-email" type="email" value="${escapeHtml(state.userForm.email)}" />
        </div>
        <div class="form-field">
          <label>${isEditingUser ? "Nueva contraseña (opcional)" : "Contraseña"}</label>
          <input name="user-password" type="password" value="${escapeHtml(state.userForm.password)}" placeholder="${isEditingUser ? "Déjala vacía si no cambiará" : ""}" />
        </div>
        <div class="form-field">
          <label>Rol</label>
          <select name="user-rol">
            ${["ADMIN", "SUPERVISOR", "BODEGUERO"]
              .map((rol) => `<option value="${rol}" ${state.userForm.rol === rol ? "selected" : ""}>${rol}</option>`)
              .join("")}
          </select>
        </div>
        <div class="admin-actions-row">
          <button class="btn btn-blue" type="submit">${isEditingUser ? "Guardar usuario" : "Crear usuario"}</button>
          ${isEditingUser ? '<button class="btn btn-muted" type="button" data-action="cancel-user-edit">Cancelar</button>' : ""}
        </div>
      </form>
    </div>
    <div class="chart-card" style="padding:0;overflow:hidden;margin-top:20px;">
      <table class="data-table">
        <thead><tr><th>Nombre</th><th>Email</th><th>Rol</th><th>Estado</th><th>Alta</th><th>Acción</th></tr></thead>
        <tbody>
          ${state.users
            .map(
              (user) => `
                <tr>
                  <td>${user.nombre}</td>
                  <td>${user.email}</td>
                  <td>${user.rol}</td>
                  <td><span class="status ${user.activo ? "ok" : "danger"}">${user.activo ? "Activo" : "Inactivo"}</span></td>
                  <td>${formatDate(user.createdAt)}</td>
                  <td>
                    <div class="toolbar-actions">
                      <button class="btn btn-outline" data-action="edit-user" data-user-id="${user.id}">Editar</button>
                      <button class="btn btn-outline" data-action="toggle-user" data-user-id="${user.id}" data-next-active="${String(!user.activo)}">${user.activo ? "Desactivar" : "Activar"}</button>
                    </div>
                  </td>
                </tr>
              `
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderRoles() {
  const canManageRoles = state.user?.rol === "ADMIN";
  const roleCards = [
    {
      rol: "ADMIN",
      descripcion: state.roleDefinitions.ADMIN.descripcion,
      usuarios: state.users.filter((user) => user.rol === "ADMIN").length,
      permisosList: state.roleDefinitions.ADMIN.permisosList
    },
    {
      rol: "SUPERVISOR",
      descripcion: state.roleDefinitions.SUPERVISOR.descripcion,
      usuarios: state.users.filter((user) => user.rol === "SUPERVISOR").length,
      permisosList: state.roleDefinitions.SUPERVISOR.permisosList
    },
    {
      rol: "BODEGUERO",
      descripcion: state.roleDefinitions.BODEGUERO.descripcion,
      usuarios: state.users.filter((user) => user.rol === "BODEGUERO").length,
      permisosList: state.roleDefinitions.BODEGUERO.permisosList
    }
  ];

  return `
    <div class="admin-layout">
      ${roleCards
        .map(
          (item) => `
            <section class="admin-section">
              <div class="admin-section-header">
                <div>
                  <h2>${item.rol}</h2>
                  <p>${item.descripcion}</p>
                </div>
                <span class="admin-badge">${item.usuarios} usuario(s)</span>
              </div>
              <div class="admin-form-card">
                <h3>Permisos principales</h3>
                <p>${item.permisosList.join(", ")}</p>
              </div>
              ${
                canManageRoles
                  ? `
                    <div class="admin-form-card">
                      <h3>Editar contenido del rol</h3>
                      <form data-role-meta-form="true" data-role-key="${item.rol}" class="inline-form">
                        <div class="form-field">
                          <label>Descripción</label>
                          <textarea name="role-descripcion" rows="3">${escapeHtml(item.descripcion)}</textarea>
                        </div>
                        <div class="form-field" style="grid-column:1 / -1;">
                          <label>Permisos del rol</label>
                          <div class="toolbar-actions" style="gap:12px 18px;">
                            ${PERMISSION_OPTIONS.map(
                              (permission) => `
                                <label style="display:flex;align-items:center;gap:8px;min-width:220px;">
                                  <input type="checkbox" name="role-permisos" value="${permission}" ${item.permisosList.includes(permission) ? "checked" : ""} />
                                  <span>${permission}</span>
                                </label>
                              `
                            ).join("")}
                          </div>
                        </div>
                        <div class="admin-actions-row">
                          <button class="btn btn-blue" type="submit">Guardar contenido</button>
                        </div>
                      </form>
                    </div>
                  `
                  : ""
              }
            </section>
          `
        )
        .join("")}
      <section class="admin-section">
        <div class="admin-section-header">
          <div>
            <h2>Asignación de roles</h2>
            <p>${canManageRoles ? "Como administrador puedes cambiar el rol de cada usuario desde esta pantalla." : "Solo un administrador puede modificar la asignación de roles. Aquí la vista es de solo lectura."}</p>
          </div>
          <span class="admin-badge">${canManageRoles ? "Editable" : "Solo lectura"}</span>
        </div>
        <div class="admin-table-card">
          <table class="data-table">
            <thead><tr><th>Usuario</th><th>Email</th><th>Rol actual</th><th>Cambiar a</th><th>Acción</th></tr></thead>
            <tbody>
              ${state.users
                .map(
                  (user) => `
                    <tr>
                      <td>${user.nombre}</td>
                      <td>${user.email}</td>
                      <td><span class="status ok">${user.rol}</span></td>
                      <td>
                        ${
                          canManageRoles
                            ? `
                              <form data-role-form="true" data-user-id="${user.id}" class="toolbar-actions" style="align-items:center;">
                                <select name="role-target" style="min-width:180px;">
                                  ${["ADMIN", "SUPERVISOR", "BODEGUERO"]
                                    .map((rol) => `<option value="${rol}" ${user.rol === rol ? "selected" : ""}>${rol}</option>`)
                                    .join("")}
                                </select>
                                <button class="btn btn-blue" type="submit">Guardar rol</button>
                              </form>
                            `
                            : user.rol
                        }
                      </td>
                      <td>${canManageRoles ? "Solo administrador" : "No disponible"}</td>
                    </tr>
                  `
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  `;
}

function renderAudit() {
  return `
    <div class="chart-card" style="padding:0;overflow:hidden;">
      <table class="data-table">
        <thead><tr><th>Fecha</th><th>Usuario</th><th>Rol</th><th>Acción</th><th>IP</th><th>Metadata</th></tr></thead>
        <tbody>
          ${state.audit
            .map(
              (log) => `
                <tr>
                  <td>${formatDateTime(log.fecha)}</td>
                  <td>${log.usuario?.nombre || "N/D"}</td>
                  <td>${log.usuario?.rol || "N/D"}</td>
                  <td>${log.accion}</td>
                  <td>${log.ipOrigen || "-"}</td>
                  <td class="mono">${escapeHtml(JSON.stringify(log.metadata || {}))}</td>
                </tr>
              `
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderEmpty(message) {
  return `<div class="empty-state">${message}</div>`;
}

function resetProductForm() {
  state.productForm = {
    id: "",
    codigoBarras: "",
    nombre: "",
    descripcion: "",
    categoriaId: state.categories[0]?.id || "",
    unidadMedida: "UND",
    stockMinimo: 0,
    stockMaximo: 0
  };
}

function resetClientForm() {
  state.clientForm = {
    id: "",
    nombre: "",
    email: "",
    telefono: "",
    direccion: ""
  };
}

function resetProviderForm() {
  state.providerForm = {
    id: "",
    nombre: "",
    contacto: "",
    telefono: "",
    email: ""
  };
}

function resetUserForm() {
  state.userForm = {
    id: "",
    nombre: "",
    email: "",
    password: "",
    rol: "BODEGUERO"
  };
}

function resetPurchaseOrderDraft() {
  state.purchaseOrderForm = {
    numero: nextCorrelative("OC-", state.purchaseOrders, (item) => item.numero),
    proveedorId: state.providers[0]?.id || "",
    fechaEmision: new Date().toISOString().slice(0, 10),
    productoId: state.products[0]?.id || "",
    cantidad: 1,
    precioUnitario: 0
  };
  state.purchaseOrderItems = [];
}

function resetDispatchOrderDraft() {
  state.dispatchOrderForm = {
    numero: nextCorrelative("OD-", state.dispatchOrders, (item) => item.numero),
    clienteId: state.clients[0]?.id || "",
    fechaRequerida: new Date().toISOString().slice(0, 10),
    productoId: state.products[0]?.id || "",
    ubicacionId: flattenLocations()[0]?.id || "",
    cantidad: 1
  };
  state.dispatchOrderItems = [];
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

app.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-action], [data-screen]");
  if (!button) return;

  const screen = button.dataset.screen;
  if (screen) {
    if (state.token && screen !== "login" && !canAccessScreen(screen)) {
      state.currentScreen = defaultAuthorizedScreen();
      state.flash = { type: "error", text: "No tienes permiso para entrar a esa pantalla." };
      render();
      return;
    }

    state.currentScreen = state.token && screen === "login" ? defaultAuthorizedScreen() : screen;
    if (screen !== "compras") {
      state.providerWindowOpen = false;
      resetProviderForm();
    }
    state.flash = null;
    render();
    return;
  }

  const action = button.dataset.action;

  try {
    if (action === "logout") {
      await fetch(`${API_BASE}/auth/logout`, {
        method: "POST",
        credentials: "include"
      }).catch(() => null);
      clearSession();
      render();
      return;
    }

    if (action === "refresh") {
      await refreshData();
      state.flash = { type: "success", text: "Datos actualizados." };
      render();
      return;
    }

    if (action === "cancel-product-edit") {
      resetProductForm();
      state.currentScreen = "administracion";
      state.flash = { type: "info", text: "Edición de producto cancelada." };
      render();
      return;
    }

    if (action === "cancel-client-edit") {
      resetClientForm();
      state.currentScreen = "administracion";
      state.flash = { type: "info", text: "Edición de cliente cancelada." };
      render();
      return;
    }

    if (action === "cancel-provider-edit") {
      resetProviderForm();
      state.providerWindowOpen = true;
      state.currentScreen = "compras";
      state.flash = { type: "info", text: "Edición de proveedor cancelada." };
      render();
      return;
    }

    if (action === "edit-product") {
      const product = state.products.find((item) => item.id === button.dataset.productId);
      if (!product) {
        setFlash("error", "No se encontró el producto seleccionado.");
        return;
      }

      state.productForm = {
        id: product.id,
        codigoBarras: product.codigoBarras,
        nombre: product.nombre,
        descripcion: product.descripcion || "",
        categoriaId: product.categoriaId || state.categories[0]?.id || "",
        unidadMedida: product.unidadMedida,
        stockMinimo: product.stockMinimo,
        stockMaximo: product.stockMaximo
      };
      state.currentScreen = "administracion";
      state.flash = { type: "info", text: `Editando producto "${product.nombre}".` };
      render();
      return;
    }

    if (action === "delete-product") {
      const product = state.products.find((item) => item.id === button.dataset.productId);
      if (!product) {
        setFlash("error", "No se encontró el producto seleccionado.");
        return;
      }

      const confirmed = window.confirm(`¿Eliminar el producto "${product.nombre}"?`);
      if (!confirmed) return;

      await api(`/productos/${product.id}`, {
        method: "DELETE"
      });
      if (state.productForm.id === product.id) {
        resetProductForm();
      }
      await refreshData();
      state.currentScreen = "administracion";
      state.flash = { type: "success", text: `Producto "${product.nombre}" eliminado correctamente.` };
      return;
    }

    if (action === "edit-client") {
      const client = state.clients.find((item) => item.id === button.dataset.clientId);
      if (!client) {
        setFlash("error", "No se encontró el cliente seleccionado.");
        return;
      }

      state.clientForm = { ...client };
      state.currentScreen = "administracion";
      state.flash = { type: "info", text: `Editando cliente "${client.nombre}".` };
      render();
      return;
    }

    if (action === "delete-client") {
      const client = state.clients.find((item) => item.id === button.dataset.clientId);
      if (!client) {
        setFlash("error", "No se encontró el cliente seleccionado.");
        return;
      }

      const confirmed = window.confirm(`¿Eliminar el cliente "${client.nombre}"?`);
      if (!confirmed) return;

      await api(`/clientes/${client.id}`, {
        method: "DELETE"
      });
      if (state.clientForm.id === client.id) {
        resetClientForm();
      }
      await refreshData();
      state.currentScreen = "administracion";
      state.flash = { type: "success", text: `Cliente "${client.nombre}" eliminado correctamente.` };
      return;
    }

    if (action === "open-provider-window") {
      state.providerWindowOpen = true;
      state.currentScreen = "compras";
      render();
      return;
    }

    if (action === "close-provider-window") {
      state.providerWindowOpen = false;
      resetProviderForm();
      state.currentScreen = "compras";
      render();
      return;
    }

    if (action === "add-purchase-item") {
      const producto = state.products.find((item) => item.id === state.purchaseOrderForm.productoId);
      if (!producto) {
        setFlash("error", "Selecciona un producto válido.");
        return;
      }

      if (state.purchaseOrderForm.cantidad <= 0) {
        setFlash("error", "La cantidad debe ser mayor que 0.");
        return;
      }

      state.purchaseOrderItems = [
        ...state.purchaseOrderItems,
        {
          productoId: producto.id,
          productoNombre: producto.nombre,
          cantidad: Number(state.purchaseOrderForm.cantidad),
          precioUnitario: Number(state.purchaseOrderForm.precioUnitario)
        }
      ];
      state.flash = { type: "success", text: `Producto "${producto.nombre}" agregado a la orden.` };
      render();
      return;
    }

    if (action === "remove-purchase-item") {
      const index = Number(button.dataset.itemIndex);
      state.purchaseOrderItems = state.purchaseOrderItems.filter((_, itemIndex) => itemIndex !== index);
      state.flash = { type: "info", text: "Producto removido de la orden." };
      render();
      return;
    }

    if (action === "add-dispatch-item") {
      const producto = state.products.find((item) => item.id === state.dispatchOrderForm.productoId);
      const ubicacion = flattenLocations().find((item) => item.id === state.dispatchOrderForm.ubicacionId);

      if (!producto) {
        setFlash("error", "Selecciona un producto válido.");
        return;
      }

      if (!ubicacion) {
        setFlash("error", "Selecciona una ubicación válida.");
        return;
      }

      if (state.dispatchOrderForm.cantidad <= 0) {
        setFlash("error", "La cantidad debe ser mayor que 0.");
        return;
      }

      state.dispatchOrderItems = [
        ...state.dispatchOrderItems,
        {
          productoId: producto.id,
          productoNombre: producto.nombre,
          ubicacionId: ubicacion.id,
          ubicacionCodigo: ubicacion.codigo,
          cantidad: Number(state.dispatchOrderForm.cantidad)
        }
      ];
      state.flash = { type: "success", text: `Producto "${producto.nombre}" agregado al despacho.` };
      render();
      return;
    }

    if (action === "remove-dispatch-item") {
      const index = Number(button.dataset.itemIndex);
      state.dispatchOrderItems = state.dispatchOrderItems.filter((_, itemIndex) => itemIndex !== index);
      state.flash = { type: "info", text: "Producto removido del despacho." };
      render();
      return;
    }

    if (action === "edit-provider") {
      const provider = state.providers.find((item) => item.id === button.dataset.providerId);
      if (!provider) {
        setFlash("error", "No se encontró el proveedor seleccionado.");
        return;
      }

      state.providerForm = {
        id: provider.id,
        nombre: provider.nombre,
        contacto: provider.contacto || "",
        telefono: provider.telefono || "",
        email: provider.email || ""
      };
      state.providerWindowOpen = true;
      state.currentScreen = "compras";
      state.flash = { type: "info", text: `Editando proveedor "${provider.nombre}".` };
      render();
      return;
    }

    if (action === "delete-provider") {
      const provider = state.providers.find((item) => item.id === button.dataset.providerId);
      if (!provider) {
        setFlash("error", "No se encontró el proveedor seleccionado.");
        return;
      }

      const confirmed = window.confirm(`¿Eliminar el proveedor "${provider.nombre}"?`);
      if (!confirmed) return;

      await api(`/proveedores/${provider.id}`, { method: "DELETE" });
      if (state.providerForm.id === provider.id) {
        resetProviderForm();
      }
      await refreshData();
      state.providerWindowOpen = true;
      state.currentScreen = "compras";
      state.flash = { type: "success", text: `Proveedor "${provider.nombre}" eliminado correctamente.` };
      return;
    }

    if (action === "scan-reception-barcode") {
      const order = selectedPurchaseOrder();
      if (!order) {
        setFlash("error", "Selecciona una orden de compra.");
        return;
      }

      const barcode = state.receptionForm.barcode.trim();
      const detail = order.detalles.find((item) => item.producto.codigoBarras === barcode);

      if (!detail) {
        setFlash("error", "El código no corresponde a un producto de la orden seleccionada.");
        return;
      }

      const current = Number(state.receptionForm.cantidades[detail.productoId] ?? detail.cantidad);
      state.receptionForm.cantidades[detail.productoId] = current + 1;
      state.receptionForm.barcode = "";
      state.flash = { type: "success", text: `Escaneo aplicado a ${detail.producto.nombre}.` };
      render();
      return;
    }

    if (action === "select-reception-order") {
      state.receptionForm.orderId = button.dataset.orderId || "";
      syncReceptionSelection();
      state.currentScreen = "recepcion";
      state.flash = { type: "info", text: "Orden de compra cargada para recepción." };
      render();
      return;
    }

    if (action === "select-dispatch-order") {
      state.dispatchForm.orderId = button.dataset.orderId || "";
      syncDispatchSelection();
      state.currentScreen = "despacho";
      state.flash = { type: "info", text: "Orden de despacho cargada para trabajar." };
      render();
      return;
    }

    if (action === "generate-picking") {
      const order = selectedDispatchOrder();
      if (!order) return;
      await api(`/despachos/${order.id}/generar-picking`, { method: "POST" });
      await refreshData();
      state.currentScreen = "despacho";
      state.flash = { type: "success", text: "Picking generado correctamente." };
      return;
    }

    if (action === "finalize-dispatch") {
      const order = selectedDispatchOrder();
      if (!order) return;
      await api(`/despachos/${order.id}/finalizar`, { method: "POST" });
      await refreshData();
      state.currentScreen = "despacho";
      state.flash = { type: "success", text: "Despacho finalizado y stock actualizado." };
      return;
    }

    if (action === "process-return") {
      const order = selectedDispatchOrder();
      if (!order) return;

      const items = order.detalles
        .map((detail) => {
          const requested = Number(state.dispatchForm.returns[detail.id] ?? 0);
          const remaining = remainingReturnQuantityFor(detail);

          if (requested > remaining) {
            throw new Error(`La devolución para ${detail.producto.nombre} excede lo pendiente.`);
          }

          return {
            detalleId: detail.id,
            cantidad: requested
          };
        })
        .filter((detail) => detail.cantidad > 0);

      if (!items.length) {
        setFlash("error", "Ingresa al menos una cantidad a devolver.");
        return;
      }

      await api(`/despachos/${order.id}/devolucion`, {
        method: "POST",
        body: JSON.stringify({
          motivo: state.dispatchForm.motivo,
          items
        })
      });
      await refreshData();
      syncDispatchSelection();
      state.currentScreen = "despacho";
      state.flash = { type: "success", text: "Devolución registrada y reintegrada al inventario." };
      return;
    }

    if (action === "toggle-user") {
      await api(`/usuarios/${button.dataset.userId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ activo: button.dataset.nextActive === "true" })
      });
      await refreshData();
      state.currentScreen = "usuarios";
      state.flash = { type: "success", text: "Estado de usuario actualizado." };
      return;
    }

    if (action === "edit-user") {
      const user = state.users.find((item) => item.id === button.dataset.userId);
      if (!user) {
        setFlash("error", "No se encontró el usuario seleccionado.");
        return;
      }

      state.userForm = {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        password: "",
        rol: user.rol
      };
      state.currentScreen = "usuarios";
      state.flash = { type: "info", text: `Editando usuario "${user.nombre}".` };
      render();
      return;
    }

    if (action === "cancel-user-edit") {
      resetUserForm();
      state.currentScreen = "usuarios";
      state.flash = { type: "info", text: "Edición de usuario cancelada." };
      render();
      return;
    }

    if (action === "open-entry" || action === "open-exit" || action === "open-adjust") {
      const product = state.products[0];
      const location = flattenLocations()[0];
      if (!product || !location) {
        setFlash("error", "Faltan productos o ubicaciones para ejecutar esta acción.");
        return;
      }
      state.inventoryOperation = {
        mode: action === "open-entry" ? "entry" : action === "open-exit" ? "exit" : "adjust",
        productoId: product.id,
        ubicacionId: location.id,
        cantidad: action === "open-adjust" ? 0 : 1,
        motivo: ""
      };
      state.currentScreen = "inventario";
      state.flash = {
        type: "info",
        text:
          action === "open-entry"
            ? "Completa el formulario para registrar una nueva entrada manual."
            : action === "open-exit"
              ? "Completa el formulario para registrar una nueva salida manual."
              : "Completa el formulario para aplicar un ajuste manual de inventario."
      };
      render();
      return;
    }

    if (action === "cancel-inventory-operation") {
      state.inventoryOperation = {
        mode: "",
        productoId: state.products[0]?.id || "",
        ubicacionId: flattenLocations()[0]?.id || "",
        cantidad: 1,
        motivo: ""
      };
      state.currentScreen = "inventario";
      state.flash = { type: "info", text: "Operación de inventario cancelada." };
      render();
      return;
    }
  } catch (error) {
    setFlash("error", error.message);
  }
});

app.addEventListener("change", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement)) {
    return;
  }

  let shouldRender = false;

  if (target.name === "inventory-query") {
    state.inventoryFilters.query = target.value;
    shouldRender = true;
  }
  if (target.name === "inventory-category") {
    state.inventoryFilters.category = target.value;
    shouldRender = true;
  }
  if (target.name === "inventory-location") {
    state.inventoryFilters.location = target.value;
    shouldRender = true;
  }
  if (target.name === "inventory-status") {
    state.inventoryFilters.status = target.value;
    shouldRender = true;
  }

  if (target.name === "invop-producto") state.inventoryOperation.productoId = target.value;
  if (target.name === "invop-ubicacion") state.inventoryOperation.ubicacionId = target.value;
  if (target.name === "invop-cantidad") state.inventoryOperation.cantidad = Number(target.value);
  if (target.name === "invop-motivo") state.inventoryOperation.motivo = target.value;

  if (target.name === "reception-order") {
    state.receptionForm.orderId = target.value;
    syncReceptionSelection();
    shouldRender = true;
  }

  if (target.name === "reception-barcode") state.receptionForm.barcode = target.value;

  if (target.name.startsWith("qty-")) {
    state.receptionForm.cantidades[target.name.replace("qty-", "")] = Number(target.value);
  }

  if (target.name.startsWith("loc-")) {
    state.receptionForm.ubicaciones[target.name.replace("loc-", "")] = target.value;
  }

  if (target.name === "reception-observaciones") {
    state.receptionForm.observaciones = target.value;
  }

  if (target.name === "dispatch-order") {
    state.dispatchForm.orderId = target.value;
    syncDispatchSelection();
    shouldRender = true;
  }

  if (target.name.startsWith("return-")) {
    const detailId = target.name.replace("return-", "");
    const order = selectedDispatchOrder();
    const detail = order?.detalles.find((item) => item.id === detailId);
    const remaining = detail ? remainingReturnQuantityFor(detail) : 0;
    const nextValue = Math.max(0, Math.min(Number(target.value || 0), remaining));
    state.dispatchForm.returns[detailId] = nextValue;
  }

  if (target.name === "return-motivo") {
    state.dispatchForm.motivo = target.value;
  }

  if (target.name === "report-from") state.reportFilters.from = target.value;
  if (target.name === "report-to") state.reportFilters.to = target.value;

  if (target.name.startsWith("pick-")) {
    state.dispatchForm.picked[target.name.replace("pick-", "")] = target.checked;
    shouldRender = true;
  }

  if (target.name === "user-nombre") state.userForm.nombre = target.value;
  if (target.name === "user-email") state.userForm.email = target.value;
  if (target.name === "user-password") state.userForm.password = target.value;
  if (target.name === "user-rol") state.userForm.rol = target.value;

  if (target.name === "category-nombre") state.categoryForm.nombre = target.value;
  if (target.name === "category-descripcion") state.categoryForm.descripcion = target.value;

  if (target.name === "product-codigo") state.productForm.codigoBarras = target.value;
  if (target.name === "product-nombre") state.productForm.nombre = target.value;
  if (target.name === "product-descripcion") state.productForm.descripcion = target.value;
  if (target.name === "product-categoria") state.productForm.categoriaId = target.value;
  if (target.name === "product-unidad") state.productForm.unidadMedida = target.value;
  if (target.name === "product-minimo") state.productForm.stockMinimo = Number(target.value);
  if (target.name === "product-maximo") state.productForm.stockMaximo = Number(target.value);

  if (target.name === "provider-nombre") state.providerForm.nombre = target.value;
  if (target.name === "provider-contacto") state.providerForm.contacto = target.value;
  if (target.name === "provider-telefono") state.providerForm.telefono = target.value;
  if (target.name === "provider-email") state.providerForm.email = target.value;

  if (target.name === "client-nombre") state.clientForm.nombre = target.value;
  if (target.name === "client-email") state.clientForm.email = target.value;
  if (target.name === "client-telefono") state.clientForm.telefono = target.value;
  if (target.name === "client-direccion") state.clientForm.direccion = target.value;

  if (target.name === "po-numero") state.purchaseOrderForm.numero = target.value;
  if (target.name === "po-proveedor") state.purchaseOrderForm.proveedorId = target.value;
  if (target.name === "po-fecha") state.purchaseOrderForm.fechaEmision = target.value;
  if (target.name === "po-producto") state.purchaseOrderForm.productoId = target.value;
  if (target.name === "po-cantidad") state.purchaseOrderForm.cantidad = Number(target.value);
  if (target.name === "po-precio") state.purchaseOrderForm.precioUnitario = Number(target.value);

  if (target.name === "do-numero") state.dispatchOrderForm.numero = target.value;
  if (target.name === "do-cliente-id") state.dispatchOrderForm.clienteId = target.value;
  if (target.name === "do-fecha") state.dispatchOrderForm.fechaRequerida = target.value;
  if (target.name === "do-producto") state.dispatchOrderForm.productoId = target.value;
  if (target.name === "do-ubicacion") state.dispatchOrderForm.ubicacionId = target.value;
  if (target.name === "do-cantidad") state.dispatchOrderForm.cantidad = Number(target.value);

  if (target.name === "bodega-nombre") state.locationForms.bodega.nombre = target.value;
  if (target.name === "bodega-direccion") state.locationForms.bodega.direccion = target.value;
  if (target.name === "seccion-nombre") state.locationForms.seccion.nombre = target.value;
  if (target.name === "seccion-bodega") state.locationForms.seccion.bodegaId = target.value;
  if (target.name === "rack-codigo") state.locationForms.rack.codigo = target.value;
  if (target.name === "rack-seccion") state.locationForms.rack.seccionId = target.value;
  if (target.name === "rack-capacidad") state.locationForms.rack.capacidad = Number(target.value);
  if (target.name === "ubicacion-codigo") state.locationForms.ubicacion.codigo = target.value;
  if (target.name === "ubicacion-rack") state.locationForms.ubicacion.rackId = target.value;
  if (target.name === "ubicacion-nivel") state.locationForms.ubicacion.nivel = Number(target.value);
  if (target.name === "ubicacion-capacidad") state.locationForms.ubicacion.capacidadMax = Number(target.value);

  if (target.name === "scan-barcode") state.scanEntryForm.barcode = target.value;
  if (target.name === "scan-ubicacion") state.scanEntryForm.ubicacionId = target.value;
  if (target.name === "scan-cantidad") state.scanEntryForm.cantidad = Number(target.value);

  if (shouldRender) {
    render();
  }
});

app.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.target;

  try {
    if (form.id === "login-form") {
      const data = new FormData(form);
      const result = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: data.get("email"),
          password: data.get("password")
        })
      });
      const payload = await result.json();
      if (!result.ok) throw new Error(payload.message || "No fue posible iniciar sesión");
      saveSession(payload);
      state.currentScreen = "dashboard";
      state.flash = { type: "success", text: `Bienvenido, ${payload.user.nombre}.` };
      await initializeApp();
      return;
    }

    if (form.id === "reception-form") {
      const order = selectedPurchaseOrder();
      if (!order) throw new Error("Selecciona una orden de compra.");
      const data = new FormData(form);
      const locationOptions = flattenLocations();

      if (!locationOptions.length) {
        throw new Error("No hay ubicaciones configuradas para registrar la recepción.");
      }

      const items = order.detalles.map((detail) => {
        const ubicacionId = String(data.get(`loc-${detail.productoId}`) || "").trim();
        const cantidadRecibida = Number(data.get(`qty-${detail.productoId}`) || 0);

        if (!ubicacionId) {
          throw new Error(`Debes seleccionar una ubicación válida para ${detail.producto.nombre}.`);
        }

        state.receptionForm.ubicaciones[detail.productoId] = ubicacionId;
        state.receptionForm.cantidades[detail.productoId] = cantidadRecibida;

        return {
          productoId: detail.productoId,
          ubicacionId,
          cantidadEsperada: Number(detail.cantidad),
          cantidadRecibida
        };
      });
      await api("/compras/recepciones", {
        method: "POST",
        body: JSON.stringify({
          ordenCompraId: order.id,
          observaciones: state.receptionForm.observaciones,
          items
        })
      });
      await refreshData();
      const nextPendingOrder = state.purchaseOrders.find((item) => item.estado !== "COMPLETA");
      state.receptionForm.orderId = nextPendingOrder?.id || "";
      syncReceptionSelection();
      state.currentScreen = "recepcion";
      state.flash = { type: "success", text: `Recepción registrada para ${order.numero}.` };
      render();
      return;
    }

    if (form.id === "inventory-operation-form") {
      const data = new FormData(form);
      const mode = state.inventoryOperation.mode;
      const payload = {
        productoId: String(data.get("invop-producto") || ""),
        ubicacionId: String(data.get("invop-ubicacion") || ""),
        cantidad: Number(data.get("invop-cantidad") || 0),
        referencia: String(data.get("invop-motivo") || ""),
        nuevaCantidad: Number(data.get("invop-cantidad") || 0),
        motivo: String(data.get("invop-motivo") || "")
      };

      if (!mode) throw new Error("Selecciona primero el tipo de operación.");

      if (mode === "entry") {
        await api("/inventario/entrada", {
          method: "POST",
          body: JSON.stringify({
            productoId: payload.productoId,
            ubicacionId: payload.ubicacionId,
            cantidad: payload.cantidad,
            referencia: payload.referencia
          })
        });
      }

      if (mode === "exit") {
        await api("/inventario/salida", {
          method: "POST",
          body: JSON.stringify({
            productoId: payload.productoId,
            ubicacionId: payload.ubicacionId,
            cantidad: payload.cantidad,
            referencia: payload.referencia
          })
        });
      }

      if (mode === "adjust") {
        await api("/inventario/ajuste", {
          method: "POST",
          body: JSON.stringify({
            productoId: payload.productoId,
            ubicacionId: payload.ubicacionId,
            nuevaCantidad: payload.nuevaCantidad,
            motivo: payload.motivo
          })
        });
      }

      state.inventoryOperation = {
        mode: "",
        productoId: state.products[0]?.id || "",
        ubicacionId: flattenLocations()[0]?.id || "",
        cantidad: 1,
        motivo: ""
      };
      await refreshData();
      state.currentScreen = "inventario";
      state.flash = {
        type: "success",
        text:
          mode === "entry"
            ? "Entrada registrada correctamente."
            : mode === "exit"
              ? "Salida registrada correctamente."
              : "Ajuste aplicado correctamente."
      };
      return;
    }

    if (form.id === "user-form") {
      const isEditingUser = Boolean(state.userForm.id);
      const payload = {
        nombre: state.userForm.nombre,
        email: state.userForm.email,
        rol: state.userForm.rol
      };

      if (!isEditingUser && !state.userForm.password) {
        throw new Error("La contraseña es obligatoria para crear el usuario.");
      }

      await api(isEditingUser ? `/usuarios/${state.userForm.id}` : "/usuarios", {
        method: isEditingUser ? "PATCH" : "POST",
        body: JSON.stringify(
          isEditingUser
            ? {
                ...payload,
                ...(state.userForm.password ? { password: state.userForm.password } : {})
              }
            : {
                ...payload,
                password: state.userForm.password
              }
        )
      });
      resetUserForm();
      await refreshData();
      state.currentScreen = "usuarios";
      state.flash = { type: "success", text: isEditingUser ? "Usuario actualizado correctamente." : "Usuario creado correctamente." };
      return;
    }

    if (form instanceof HTMLFormElement && form.dataset.roleForm === "true") {
      if (state.user?.rol !== "ADMIN") {
        throw new Error("Solo un administrador puede modificar roles.");
      }

      const data = new FormData(form);
      const userId = String(form.dataset.userId || "");
      const user = state.users.find((item) => item.id === userId);
      const newRole = String(data.get("role-target") || "");

      if (!user) {
        throw new Error("No se encontró el usuario a actualizar.");
      }

      await api(`/usuarios/${user.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          nombre: user.nombre,
          email: user.email,
          rol: newRole
        })
      });

      await refreshData();
      state.currentScreen = "roles";
      state.flash = { type: "success", text: `Rol de "${user.nombre}" actualizado a ${newRole}.` };
      return;
    }

    if (form instanceof HTMLFormElement && form.dataset.roleMetaForm === "true") {
      if (state.user?.rol !== "ADMIN") {
        throw new Error("Solo un administrador puede editar la configuración visible de roles.");
      }

      const data = new FormData(form);
      const roleKey = String(form.dataset.roleKey || "");
      const descripcion = String(data.get("role-descripcion") || "").trim();
      const permisosList = data
        .getAll("role-permisos")
        .map((item) => String(item).trim())
        .filter(Boolean);

      if (!roleKey || !state.roleDefinitions[roleKey]) {
        throw new Error("No se encontró el rol a editar.");
      }

      if (!descripcion) {
        throw new Error("La descripción del rol es obligatoria.");
      }

      if (!permisosList.length) {
        throw new Error("Selecciona al menos un permiso para el rol.");
      }

      await api(`/roles/configuraciones/${roleKey}`, {
        method: "PATCH",
        body: JSON.stringify({
          descripcion,
          permisosList
        })
      });

      await loadRoleDefinitions();
      if (state.user?.rol === roleKey) {
        state.currentPermissions = permisosList;
      }
      state.currentScreen = "roles";
      state.flash = { type: "success", text: `Contenido del rol ${roleKey} actualizado correctamente.` };
      render();
      return;
    }

    if (form.id === "report-form") {
      await loadReports();
      state.currentScreen = "reportes";
      state.flash = { type: "success", text: "Reporte actualizado para el rango seleccionado." };
      render();
      return;
    }

    if (form.id === "category-form") {
      await api("/productos/categorias", {
        method: "POST",
        body: JSON.stringify(state.categoryForm)
      });
      state.categoryForm = { nombre: "", descripcion: "" };
      await refreshData();
      state.currentScreen = "administracion";
      state.flash = { type: "success", text: "Categoría creada correctamente." };
      return;
    }

    if (form.id === "product-form") {
      const data = new FormData(form);
      const payload = {
        codigoBarras: String(data.get("product-codigo") || ""),
        nombre: String(data.get("product-nombre") || ""),
        descripcion: String(data.get("product-descripcion") || ""),
        categoriaId: String(data.get("product-categoria") || ""),
        unidadMedida: String(data.get("product-unidad") || ""),
        stockMinimo: Number(data.get("product-minimo") || 0),
        stockMaximo: Number(data.get("product-maximo") || 0)
      };
      const productName = payload.nombre;
      const isEditingProduct = Boolean(state.productForm.id);
      await api(isEditingProduct ? `/productos/${state.productForm.id}` : "/productos", {
        method: isEditingProduct ? "PATCH" : "POST",
        body: JSON.stringify(payload)
      });
      resetProductForm();
      await refreshData();
      state.currentScreen = "administracion";
      state.flash = {
        type: "success",
        text: isEditingProduct
          ? `Producto "${productName}" actualizado correctamente.`
          : `Producto "${productName}" creado correctamente. Lo verás abajo en el catálogo; aparecerá en inventario cuando tenga stock.`
      };
      return;
    }

    if (form.id === "scan-entry-form") {
      const data = new FormData(form);
      const barcode = String(data.get("scan-barcode") || "").trim();
      const ubicacionId = String(data.get("scan-ubicacion") || "");
      const cantidad = Number(data.get("scan-cantidad") || 0);
      const product = state.products.find((item) => item.codigoBarras === barcode);
      if (!product) throw new Error("No existe un producto con ese código de barras.");
      await api("/inventario/entrada", {
        method: "POST",
        body: JSON.stringify({
          productoId: product.id,
          ubicacionId,
          cantidad,
          referencia: "SCAN_FRONTEND"
        })
      });
      state.scanEntryForm.barcode = "";
      state.scanEntryForm.cantidad = 1;
      await refreshData();
      state.currentScreen = "administracion";
      state.flash = { type: "success", text: `Entrada registrada por código de barras para ${product.nombre}.` };
      return;
    }

    if (form.id === "provider-form") {
      const data = new FormData(form);
      const payload = {
        nombre: String(data.get("provider-nombre") || "").trim(),
        contacto: String(data.get("provider-contacto") || "").trim() || undefined,
        telefono: String(data.get("provider-telefono") || "").trim() || undefined,
        email: String(data.get("provider-email") || "").trim() || undefined
      };
      const isEditingProvider = Boolean(state.providerForm.id);
      await api(isEditingProvider ? `/proveedores/${state.providerForm.id}` : "/proveedores", {
        method: isEditingProvider ? "PATCH" : "POST",
        body: JSON.stringify({
          ...payload
        })
      });
      resetProviderForm();
      await refreshData();
      state.providerWindowOpen = true;
      state.currentScreen = "compras";
      state.flash = {
        type: "success",
        text: isEditingProvider ? "Proveedor actualizado correctamente." : "Proveedor creado correctamente."
      };
      return;
    }

    if (form.id === "client-form") {
      const data = new FormData(form);
      const isEditingClient = Boolean(state.clientForm.id);
      const payload = {
        nombre: String(data.get("client-nombre") || "").trim(),
        email: String(data.get("client-email") || "").trim(),
        telefono: String(data.get("client-telefono") || "").trim(),
        direccion: String(data.get("client-direccion") || "").trim()
      };

      if (!payload.nombre) {
        throw new Error("El nombre del cliente es obligatorio.");
      }

      await api(state.clientForm.id ? `/clientes/${state.clientForm.id}` : "/clientes", {
        method: state.clientForm.id ? "PATCH" : "POST",
        body: JSON.stringify(payload)
      });

      resetClientForm();
      await refreshData();
      state.currentScreen = "administracion";
      state.flash = {
        type: "success",
        text: isEditingClient ? "Cliente actualizado correctamente." : "Cliente creado correctamente."
      };
      return;
    }

    if (form.id === "purchase-order-form") {
      const data = new FormData(form);
      const numero = String(data.get("po-numero") || "").trim();
      const proveedorId = String(data.get("po-proveedor") || "");
      const fechaEmision = String(data.get("po-fecha") || "");

      if (numero.length < 2) {
        throw new Error("El número de orden de compra es obligatorio.");
      }

      if (!proveedorId) {
        throw new Error("Selecciona un proveedor.");
      }

      if (!state.purchaseOrderItems.length) {
        throw new Error("Agrega al menos un producto a la orden de compra.");
      }

      await api("/compras/ordenes", {
        method: "POST",
        body: JSON.stringify({
          numero,
          proveedorId,
          fechaEmision,
          detalles: state.purchaseOrderItems.map((item) => ({
            productoId: item.productoId,
            cantidad: item.cantidad,
            precioUnitario: item.precioUnitario
          }))
        })
      });
      resetPurchaseOrderDraft();
      await refreshData();
      state.currentScreen = "compras";
      state.flash = { type: "success", text: "Orden de compra creada correctamente." };
      return;
    }

    if (form.id === "dispatch-order-form") {
      const data = new FormData(form);
      const clientId = String(data.get("do-cliente-id") || "");
      const client = state.clients.find((item) => item.id === clientId);
      if (!client) {
        throw new Error("Selecciona un cliente válido para la orden de despacho.");
      }
      const numero = String(data.get("do-numero") || "").trim();
      const fechaRequerida = String(data.get("do-fecha") || "");

      if (numero.length < 2) {
        throw new Error("El número de orden de despacho es obligatorio.");
      }

      if (!state.dispatchOrderItems.length) {
        throw new Error("Agrega al menos un producto a la orden de despacho.");
      }

      await api("/despachos/ordenes", {
        method: "POST",
        body: JSON.stringify({
          numero,
          clienteId: client.id,
          fechaRequerida,
          detalles: state.dispatchOrderItems.map((item) => ({
            productoId: item.productoId,
            ubicacionId: item.ubicacionId,
            cantidad: item.cantidad
          }))
        })
      });
      resetDispatchOrderDraft();
      await refreshData();
      state.currentScreen = "despacho";
      state.flash = { type: "success", text: "Orden de despacho creada correctamente." };
      return;
    }

    if (form.id === "bodega-form") {
      const data = new FormData(form);
      await api("/ubicaciones/bodegas", {
        method: "POST",
        body: JSON.stringify({
          nombre: String(data.get("bodega-nombre") || ""),
          direccion: String(data.get("bodega-direccion") || "")
        })
      });
      state.locationForms.bodega = { nombre: "", direccion: "" };
      await refreshData();
      state.currentScreen = "ubicaciones";
      state.flash = { type: "success", text: "Bodega creada correctamente." };
      return;
    }

    if (form.id === "seccion-form") {
      const data = new FormData(form);
      await api("/ubicaciones/secciones", {
        method: "POST",
        body: JSON.stringify({
          nombre: String(data.get("seccion-nombre") || ""),
          bodegaId: String(data.get("seccion-bodega") || "")
        })
      });
      state.locationForms.seccion.nombre = "";
      await refreshData();
      state.currentScreen = "ubicaciones";
      state.flash = { type: "success", text: "Sección creada correctamente." };
      return;
    }

    if (form.id === "rack-form") {
      const data = new FormData(form);
      await api("/ubicaciones/racks", {
        method: "POST",
        body: JSON.stringify({
          codigo: String(data.get("rack-codigo") || ""),
          seccionId: String(data.get("rack-seccion") || ""),
          capacidad: Number(data.get("rack-capacidad") || 0)
        })
      });
      state.locationForms.rack.codigo = "";
      state.locationForms.rack.capacidad = 10;
      await refreshData();
      state.currentScreen = "ubicaciones";
      state.flash = { type: "success", text: "Rack creado correctamente." };
      return;
    }

    if (form.id === "ubicacion-form") {
      const data = new FormData(form);
      await api("/ubicaciones/items", {
        method: "POST",
        body: JSON.stringify({
          codigo: String(data.get("ubicacion-codigo") || ""),
          rackId: String(data.get("ubicacion-rack") || ""),
          nivel: Number(data.get("ubicacion-nivel") || 0),
          capacidadMax: Number(data.get("ubicacion-capacidad") || 0)
        })
      });
      state.locationForms.ubicacion.codigo = "";
      state.locationForms.ubicacion.nivel = 1;
      state.locationForms.ubicacion.capacidadMax = 50;
      await refreshData();
      state.currentScreen = "ubicaciones";
      state.flash = { type: "success", text: "Ubicación creada correctamente." };
      return;
    }
  } catch (error) {
    setFlash("error", error.message);
  }
});
