// All API traffic is intercepted. No accounts or payments are created in AWS.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir } from "node:fs/promises";
import { createServer } from "vite";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
process.env.VITE_API_MODE = "path";
process.env.VITE_API_BASE_URL = "http://api.test";
const server = await createServer({
  server: { host: "127.0.0.1", port: 5198, strictPort: true },
});
await server.listen();
const browser = await chromium.launch({
  headless: true,
  channel: process.env.PLAYWRIGHT_CHANNEL || "msedge",
});
const errors = [];
const writes = [];
const units = [
  { id: 1, codigo: "A-101", edificio_id: 1 },
  { id: 2, codigo: "B-202", edificio_id: 2 },
];
let residents = [
  {
    id: 20,
    nombres: "Otra",
    apellidos: "Persona",
    email: "other@test.pe",
    unidad_id: 2,
    documento: "87654321",
    activo: true,
  },
];
let quotas = [
  {
    id: 1,
    unidadId: 1,
    concepto: "Mantenimiento A",
    monto: 100,
    estado: "PENDIENTE",
    periodo: "2026-09",
    fechaVencim: "2026-09-30",
  },
  {
    id: 2,
    unidadId: 2,
    concepto: "Privado B",
    monto: 900,
    estado: "PENDIENTE",
  },
];
let payments = [
  {
    id: 1,
    cuotaId: 1,
    montoPagado: 40,
    fechaPago: "2026-09-11",
    referencia: "ABONO-A",
  },
  { id: 2, cuotaId: 2, montoPagado: 900, referencia: "PRIVADO-B" },
];
let profileFailure = false;
let paymentsFailure = false;
let activityFailure = false;
async function setup(role = "RESIDENTE", signedIn = false) {
  const context = await browser.newContext({
    viewport: { width: 1366, height: 900 },
  });
  const user = {
    id: role === "ADMIN" ? 2 : 1,
    email: role === "ADMIN" ? "admin@test.pe" : "ana@test.pe",
    rol: role,
    residente_id: null,
  };
  if (signedIn)
    await context.addInitScript((user) => {
      localStorage.setItem("condominio_token", "test-token");
      localStorage.setItem("condominio_token_user", JSON.stringify(user));
    }, user);
  await context.route("**/*", async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    if (url.hostname === "127.0.0.1") return route.continue();
    if (url.hostname !== "api.test") return route.abort();
    const path = url.pathname;
    const method = req.method();
    const body = req.postDataJSON();
    if (method === "POST" || method === "PUT")
      writes.push({ path, method, body });
    let result;
    let status = 200;
    if (path === "/auth/register" || path === "/auth/login")
      result = { access_token: "test-token", usuario: user };
    else if (path === "/auth/me") result = user;
    else if (path === "/unidades") result = units;
    else if (path.startsWith("/unidades/"))
      result = {
        ...units.find((u) => String(u.id) === path.split("/")[2]),
        piso: 2,
        area_m2: "78.50",
      };
    else if (path === "/pagos" && paymentsFailure) {
      status = 405;
      result = { detail: "Método no permitido" };
    } else if (path === "/residentes" && method === "POST") {
      result = { ...body, id: 21, activo: true };
      residents.push(result);
      status = 201;
    } else if (path === "/residentes") {
      if (profileFailure) {
        status = 503;
        result = { detail: "Servicio temporalmente no disponible" };
      } else result = residents;
    } else if (path.startsWith("/residentes/")) {
      const index = residents.findIndex(
        (r) => String(r.id) === path.split("/")[2],
      );
      if (method === "PUT") residents[index] = { ...residents[index], ...body };
      result = {
        ...residents[index],
        unidad: units.find((u) => u.id === residents[index]?.unidad_id),
      };
    } else if (path === "/cuotas" && method === "POST") {
      result = { ...body, id: 3, estado: "PENDIENTE" };
      quotas.push(result);
    } else if (path === "/pagos" && method === "POST") {
      result = { ...body, id: 3 };
      payments.push(result);
    } else if (path === "/cuotas") result = quotas;
    else if (path === "/pagos") result = payments;
    else if (path === "/incidencias" || path === "/reservas") {
      if (activityFailure) return route.abort("failed");
      result = [];
    } else {
      status = 404;
      result = { detail: "No disponible" };
    }
    await route.fulfill({
      status,
      contentType: "application/json",
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify(result),
    });
  });
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  return { page, context };
}
try {
  await mkdir("tests/artifacts", { recursive: true });
  const { page, context } = await setup();
  await page.goto("http://127.0.0.1:5198/register");
  assert.equal(await page.getByLabel("Perfil", { exact: true }).count(), 0);
  await page.getByLabel("Correo electrónico").fill("ana@test.pe");
  await page.getByLabel("Contraseña", { exact: true }).fill("1234567");
  await page.getByLabel("Repetir contraseña").fill("1234567");
  await page.getByRole("button", { name: "Crear cuenta", exact: true }).click();
  assert.equal(writes.length, 0);
  await page.getByLabel("Contraseña", { exact: true }).fill("12345678");
  await page.getByLabel("Repetir contraseña").fill("12345678");
  await page.getByRole("button", { name: "Crear cuenta", exact: true }).click();
  await page.getByRole("heading", { name: "Completar mi ficha" }).waitFor();
  await page.getByLabel("Nombres", { exact: true }).fill("Ana");
  await page.getByLabel("Apellidos").fill("Torres");
  await page.getByLabel("Documento de identidad").fill("12345678");
  await page.getByLabel("Unidad", { exact: true }).selectOption("1");
  await page
    .getByRole("button", { name: "Guardar ficha de residente" })
    .click();
  await page.getByRole("heading", { name: "Ana Torres" }).waitFor();
  assert.equal(writes.filter((w) => w.path === "/auth/register").length, 1);
  assert.equal(writes.filter((w) => w.path === "/residentes").length, 1);
  await page.getByRole("button", { name: "Editar mis datos" }).click();
  await page.getByLabel("Teléfono").fill("999888777");
  await page.getByRole("button", { name: "Guardar cambios" }).click();
  await page.getByText("999888777", { exact: true }).waitFor();
  await page
    .getByRole("link", { name: "Mis cuotas y pagos", exact: true })
    .click();
  await page.getByText("Mantenimiento A", { exact: true }).waitFor();
  assert.equal(await page.getByText("Privado B", { exact: true }).count(), 0);
  assert.equal(
    await page.getByRole("button", { name: "Registrar pago recibido" }).count(),
    0,
  );
  await page.getByRole("button", { name: "Pagos", exact: true }).click();
  await page.getByText("ABONO-A", { exact: true }).waitFor();
  assert.equal(await page.getByText("PRIVADO-B", { exact: true }).count(), 0);
  await page.screenshot({
    path: "tests/artifacts/resident-payments.png",
    fullPage: true,
  });
  await page.goto("http://127.0.0.1:5198/analitica");
  await page.getByRole("heading", { name: "Mi hogar", exact: true }).waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "tests/artifacts/resident-mobile.png",
    fullPage: true,
  });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
  );
  await context.close();

  const admin = await setup("ADMIN", true);
  await admin.page.goto("http://127.0.0.1:5198/residentes");
  await admin.page
    .getByRole("link", { name: "Ana Torres", exact: true })
    .waitFor();
  await admin.page
    .getByRole("link", { name: "Cuotas y pagos", exact: true })
    .click();
  await admin.page.getByRole("button", { name: "Emitir cuota" }).click();
  await admin.page.getByLabel("Unidad", { exact: true }).selectOption("1");
  await admin.page.getByLabel("Periodo", { exact: true }).fill("2026-10");
  await admin.page
    .getByLabel("Concepto", { exact: true })
    .fill("Cuota octubre");
  await admin.page.getByLabel("Fecha de emisión").fill("2026-09-11");
  await admin.page
    .getByLabel("Vencimiento", { exact: true })
    .fill("2026-10-31");
  await admin.page.getByLabel("Monto (S/)").fill("120");
  await admin.page.getByRole("button", { name: "Confirmar registro" }).click();
  await admin.page.getByText("Cuota octubre", { exact: true }).waitFor();
  await admin.page
    .getByRole("button", { name: "Registrar pago recibido" })
    .click();
  await admin.page.getByLabel("Cuota", { exact: true }).selectOption("3");
  await admin.page.getByLabel("Referencia / comprobante").fill("OPERACION-123");
  await admin.page.getByLabel("Monto (S/)").fill("120");
  await admin.page.getByRole("button", { name: "Confirmar registro" }).click();
  await admin.page.getByRole("button", { name: "Pagos", exact: true }).click();
  await admin.page.getByText("OPERACION-123", { exact: true }).waitFor();
  await admin.page.screenshot({
    path: "tests/artifacts/admin-payments.png",
    fullPage: true,
  });
  await admin.context.close();

  profileFailure = true;
  const failed = await setup("RESIDENTE", true);
  await failed.page.goto("http://127.0.0.1:5198/pagos");
  await failed.page
    .getByText("Servicio temporalmente no disponible", { exact: true })
    .waitFor();
  assert.equal(
    await failed.page.getByText("Mantenimiento A", { exact: true }).count(),
    0,
  );
  profileFailure = false;
  await failed.page.getByRole("button", { name: "Reintentar" }).click();
  await failed.page.getByText("Mantenimiento A", { exact: true }).waitFor();
  await failed.context.close();
  const partial = await setup("RESIDENTE", true);
  paymentsFailure = true;
  await partial.page.goto("http://127.0.0.1:5198/pagos");
  await partial.page.getByText("Mantenimiento A", { exact: true }).waitFor();
  await partial.page
    .getByRole("button", { name: "ms-pagos · Hay un problema", exact: true })
    .click();
  await partial.page
    .getByText("HTTP 405: Método no permitido", { exact: true })
    .waitFor();
  paymentsFailure = false;
  await partial.page
    .getByRole("button", { name: "Comprobar conexión", exact: true })
    .click();
  await partial.page
    .getByRole("button", { name: "ms-pagos · Conectado", exact: true })
    .waitFor();
  await partial.context.close();
  const activity = await setup("RESIDENTE", true);
  activityFailure = true;
  for (const path of ["/incidencias", "/reservas"]) {
    await activity.page.goto("http://127.0.0.1:5198" + path);
    await activity.page
      .getByRole("button", {
        name: "ms-incidencias · Hay un problema",
        exact: true,
      })
      .waitFor();
    await activity.page
      .getByText("No se pudo leer la respuesta.", { exact: false })
      .waitFor();
    assert.equal(
      await activity.page
        .getByText("No hay registros disponibles", { exact: true })
        .count(),
      0,
    );
  }
  activityFailure = false;
  await activity.page
    .getByRole("button", { name: "Reintentar", exact: true })
    .click();
  await activity.page
    .getByRole("button", { name: "ms-incidencias · Conectado", exact: true })
    .waitFor();
  await activity.page.goto("http://127.0.0.1:5198/mi-unidad");
  await activity.page
    .getByRole("heading", { name: "Mi hogar", exact: true })
    .waitFor();
  await activity.context.close();
  residents.find((r) => r.id === 21).tipo = "PROPIETARIO";
  const owner = await setup("RESIDENTE", true);
  await owner.page.goto("http://127.0.0.1:5198/");
  await owner.page
    .getByRole("heading", { name: "Mi propiedad", exact: true })
    .waitFor();
  await owner.page
    .getByRole("link", { name: "Mi unidad", exact: true })
    .click();
  await owner.page.getByText("78.50", { exact: true }).waitFor();
  await owner.page
    .getByRole("button", { name: "ms-residentes · Conectado", exact: true })
    .waitFor();
  await owner.page.screenshot({
    path: "tests/artifacts/owner-unit.png",
    fullPage: true,
  });
  assert.equal(
    await owner.page
      .getByRole("link", { name: "Residentes", exact: true })
      .count(),
    0,
  );
  await owner.context.close();
  assert.deepEqual(errors, []);
  console.log(
    "PASS: registration, onboarding, edit, resident scope, role routes, admin quota/payment, mobile, error recovery; no real API writes.",
  );
} finally {
  await browser.close();
  await server.close();
}
