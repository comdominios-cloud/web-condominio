import { connectionKey, publishConnection } from "./connectionStatus.js";
import { TOKEN_STORAGE_KEY, serviceUrl } from "./config.js";

const DEFAULT_TIMEOUT = 15000;

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

export function readToken() {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

function buildQuery(params) {
  if (!params) return "";

  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      search.append(key, value);
    }
  });

  const qs = search.toString();

  return qs ? `?${qs}` : "";
}

async function parseBody(response) {
  const text = await response.text();

  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function messageFrom(body, response) {
  if (body && typeof body === "object") {
    const candidate =
      body.message || body.detail || body.error || body.msg || body.mensaje;

    if (typeof candidate === "string" && candidate.trim()) return candidate;

    if (Array.isArray(body.detail) && body.detail.length) {
      const first = body.detail[0];
      if (typeof first === "string") return first;
      if (first && typeof first.msg === "string") return first.msg;
    }
  }

  if (
    typeof body === "string" &&
    body.trim() &&
    body.length < 240 &&
    !body.includes("<")
  )
    return body;

  if (response.status === 401)
    return "Credenciales invalidas o sesion expirada.";
  if (response.status === 403) return "No tienes permisos para esta operacion.";
  if (response.status === 404)
    return "La ruta solicitada no está disponible (404). Revisa el despliegue y el enrutamiento del microservicio.";
  if (response.status >= 500)
    return "El microservicio no esta disponible en este momento.";

  return `La solicitud fallo con codigo ${response.status}.`;
}

export async function request(service, path, options = {}) {
  const {
    method = "GET",
    body,
    params,
    auth = true,
    timeout = DEFAULT_TIMEOUT,
  } = options;

  const url = `${serviceUrl(service, path)}${buildQuery(params)}`;

  const headers = { Accept: "application/json" };

  if (body !== undefined) headers["Content-Type"] = "application/json";

  if (auth) {
    const token = readToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const key = connectionKey(service, path, method);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  publishConnection(key, { state: "loading", message: "Consulta en curso…" });
  try {
    const response = await fetch(url, {
      method,
      headers,
      signal: controller.signal,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const payload = await parseBody(response);
    if (!response.ok)
      throw new ApiError(
        messageFrom(payload, response),
        response.status,
        payload,
      );
    if (typeof payload === "string")
      throw new ApiError(
        "La ruta devolvió texto o HTML en lugar de datos JSON. Revisa la integración del servicio.",
        response.status,
      );
    publishConnection(key, {
      state: "ok",
      status: response.status,
      message: "Respuesta JSON recibida (HTTP " + response.status + ").",
    });
    return payload;
  } catch (error) {
    const failure =
      error instanceof ApiError
        ? error
        : new ApiError(
            error.name === "AbortError"
              ? "La consulta agotó el tiempo de espera."
              : "No se pudo leer la respuesta. Puede ser un bloqueo CORS, un problema de red o un servicio inaccesible.",
            0,
          );
    publishConnection(key, {
      state: "error",
      status: failure.status,
      message:
        (failure.status ? "HTTP " + failure.status + ": " : "") +
        failure.message,
    });
    throw failure;
  } finally {
    clearTimeout(timer);
  }
}

export function toList(payload) {
  if (Array.isArray(payload)) return payload;

  if (payload && typeof payload === "object") {
    const keys = ["items", "data", "results", "content", "rows", "registros"];

    for (const key of keys) {
      if (Array.isArray(payload[key])) return payload[key];
    }

    const nested = Object.values(payload).find((value) => Array.isArray(value));
    if (nested) return nested;
  }

  return [];
}
