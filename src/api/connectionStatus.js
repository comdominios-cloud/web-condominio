let snapshot = {};
const listeners = new Set();
export const connectionKey = (service, path, method = "GET") =>
  `${service}:${method}:${path}`;
export const getConnections = () => snapshot;
export const subscribeConnections = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
export function publishConnection(key, update) {
  snapshot = { ...snapshot, [key]: { ...update, checkedAt: Date.now() } };
  listeners.forEach((listener) => listener());
}
export function clearConnections() {
  snapshot = {};
  listeners.forEach((listener) => listener());
}
