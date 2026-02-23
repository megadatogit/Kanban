export const KANBAN_APP_ID = "kanban-local";
export const KANBAN_SCHEMA_VERSION = 1;
export const THEME_OPTIONS = [
  { value: "gray", label: "Gris Clasico", swatch: "#8a8a8a" },
  { value: "sage", label: "Sage Pastel", swatch: "#7d9989" },
  { value: "peach", label: "Peach Pastel", swatch: "#b88a78" },
  { value: "lavender", label: "Lavender Pastel", swatch: "#9185ae" },
  { value: "sky", label: "Sky Pastel", swatch: "#789db4" },
];

export function ddmmyyyyToISO(ddmmyyyy) {
  if (!ddmmyyyy || !ddmmyyyy.includes("/")) return "";
  const [dd, mm, yyyy] = ddmmyyyy.split("/");
  return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
}

export function isoToDDMMYYYY(iso) {
  if (!iso || !iso.includes("-")) return "";
  const [yyyy, mm, dd] = iso.split("-");
  return `${dd}/${mm}/${yyyy}`;
}

export function parseIterationRange(range) {
  const [start = "", end = ""] = range.split(" - ").map((s) => s.trim());
  return { start, end };
}

export function tagSlug(tag) {
  return tag.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function makeId(prefix) {
  const uuid =
    typeof globalThis !== "undefined" && globalThis.crypto?.randomUUID
      ? globalThis.crypto.randomUUID()
      : `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  return prefix ? `${prefix}_${uuid}` : uuid;
}

export function normalizeName(name) {
  return (name || "").trim().replace(/\s+/g, " ").toLowerCase();
}

export function getUniqueProjectName(baseName, projects, excludeId = null) {
  const cleanBase = (baseName || "Proyecto").trim().replace(/\s+/g, " ") || "Proyecto";
  const existing = new Set(
    projects
      .filter((p) => p.id !== excludeId)
      .map((p) => normalizeName(p.name))
  );

  if (!existing.has(normalizeName(cleanBase))) return cleanBase;

  let suffix = 2;
  let candidate = `${cleanBase} (${suffix})`;
  while (existing.has(normalizeName(candidate))) {
    suffix += 1;
    candidate = `${cleanBase} (${suffix})`;
  }
  return candidate;
}

export function normalizeTagsCatalog(tagsCatalogCandidate, tasksCandidate = []) {
  const defaultTagNames = ["Front-end", "Back-end", "API", "DB"];
  const tasks = Array.isArray(tasksCandidate) ? tasksCandidate : [];
  const source = Array.isArray(tagsCatalogCandidate) ? tagsCatalogCandidate : [];
  const normalized = [];
  const used = new Set();

  const addTag = (tagValue) => {
    const isObject = tagValue && typeof tagValue === "object";
    const id = isObject && tagValue.id ? String(tagValue.id) : makeId("tag");
    const rawName = isObject ? tagValue.name : tagValue;
    const name = String(rawName || "").trim().replace(/\s+/g, " ");
    const key = normalizeName(name);
    if (!key || used.has(key)) return;
    used.add(key);
    normalized.push({ id, name });
  };

  source.forEach(addTag);
  tasks.forEach((task) => (task.tags || []).forEach(addTag));

  if (normalized.length === 0) {
    defaultTagNames.forEach((name) => addTag({ id: makeId("tag"), name }));
  }

  return normalized;
}

export function validateImportedProjectPayload(rawPayload) {
  const wrapper = rawPayload && typeof rawPayload === "object" ? rawPayload : null;
  const candidate = wrapper?.project ?? wrapper;

  if (!candidate || typeof candidate !== "object") {
    return { ok: false, error: "El archivo no contiene un objeto de proyecto valido." };
  }

  if (wrapper && typeof wrapper === "object" && "schemaVersion" in wrapper) {
    if (!Number.isInteger(wrapper.schemaVersion) || wrapper.schemaVersion < 1) {
      return { ok: false, error: "schemaVersion es invalido en el archivo importado." };
    }
    if (wrapper.schemaVersion > KANBAN_SCHEMA_VERSION) {
      return {
        ok: false,
        error: `La version ${wrapper.schemaVersion} no es compatible. Version soportada: ${KANBAN_SCHEMA_VERSION}.`,
      };
    }
  }

  if (!Array.isArray(candidate.columns) || candidate.columns.length === 0) {
    return { ok: false, error: "Falta columns o no contiene columnas v lidas." };
  }
  if (!Array.isArray(candidate.iterations) || candidate.iterations.length === 0) {
    return { ok: false, error: "Falta iterations o no contiene iteraciones v lidas." };
  }
  if (!Array.isArray(candidate.tasks)) {
    return { ok: false, error: "Falta tasks o no es un arreglo valido." };
  }

  const columnIds = new Set();
  for (let i = 0; i < candidate.columns.length; i += 1) {
    const col = candidate.columns[i];
    if (!col || typeof col !== "object") {
      return { ok: false, error: `columns[${i}] no es un objeto valido.` };
    }
    if (!String(col.id || "").trim()) {
      return { ok: false, error: `columns[${i}].id es obligatorio.` };
    }
    if (!String(col.title || "").trim()) {
      return { ok: false, error: `columns[${i}].title es obligatorio.` };
    }
    const limit = Number(col.limit);
    if (!Number.isFinite(limit) || limit < 1) {
      return { ok: false, error: `columns[${i}].limit debe ser un numero mayor o igual a 1.` };
    }
    columnIds.add(String(col.id));
  }

  const iterationIds = new Set();
  for (let i = 0; i < candidate.iterations.length; i += 1) {
    const it = candidate.iterations[i];
    if (!it || typeof it !== "object") {
      return { ok: false, error: `iterations[${i}] no es un objeto valido.` };
    }
    if (!String(it.id || "").trim()) {
      return { ok: false, error: `iterations[${i}].id es obligatorio.` };
    }
    if (!String(it.label || "").trim()) {
      return { ok: false, error: `iterations[${i}].label es obligatorio.` };
    }
    if (!String(it.range || "").trim()) {
      return { ok: false, error: `iterations[${i}].range es obligatorio.` };
    }
    iterationIds.add(String(it.id));
  }

  for (let i = 0; i < candidate.tasks.length; i += 1) {
    const task = candidate.tasks[i];
    if (!task || typeof task !== "object") {
      return { ok: false, error: `tasks[${i}] no es un objeto valido.` };
    }
    if (!String(task.id || "").trim()) {
      return { ok: false, error: `tasks[${i}].id es obligatorio.` };
    }
    if (!String(task.title || "").trim()) {
      return { ok: false, error: `tasks[${i}].title es obligatorio.` };
    }
    if (!columnIds.has(String(task.columnId || ""))) {
      return { ok: false, error: `tasks[${i}].columnId no existe en columns.` };
    }
    if (!iterationIds.has(String(task.iteration || ""))) {
      return { ok: false, error: `tasks[${i}].iteration no existe en iterations.` };
    }
    if (!Array.isArray(task.tags)) {
      return { ok: false, error: `tasks[${i}].tags debe ser un arreglo.` };
    }
  }

  if (candidate.tagsCatalog !== undefined) {
    if (!Array.isArray(candidate.tagsCatalog)) {
      return { ok: false, error: "tagsCatalog debe ser un arreglo." };
    }
    for (let i = 0; i < candidate.tagsCatalog.length; i += 1) {
      const tag = candidate.tagsCatalog[i];
      if (!tag || typeof tag !== "object") {
        return { ok: false, error: `tagsCatalog[${i}] no es un objeto valido.` };
      }
      if (!String(tag.name || "").trim()) {
        return { ok: false, error: `tagsCatalog[${i}].name es obligatorio.` };
      }
    }
  }

  return { ok: true, candidate };
}

export function sanitizeImportedProject(raw) {
  const candidate = raw?.project ?? raw;
  if (!candidate || typeof candidate !== "object") return null;
  if (!Array.isArray(candidate.columns)) return null;
  if (!Array.isArray(candidate.iterations)) return null;
  if (!Array.isArray(candidate.tasks)) return null;

  return {
    ...candidate,
    id: makeId("p"),
    name: (candidate.name || "Proyecto Importado").trim(),
    title: (candidate.title || "Tablero Kanban | Proyecto Importado").trim(),
    originId: candidate.originId || candidate.id || makeId("origin"),
    version: 1,
    revision: Number.isFinite(candidate.revision) ? candidate.revision : 1,
    updatedAt: new Date().toISOString(),
  };
}

export function sanitizeImportedProjectForReplace(raw, currentProject) {
  const candidate = raw?.project ?? raw;
  if (!candidate || typeof candidate !== "object") return null;
  if (!Array.isArray(candidate.columns)) return null;
  if (!Array.isArray(candidate.iterations)) return null;
  if (!Array.isArray(candidate.tasks)) return null;

  return {
    ...candidate,
    id: currentProject.id,
    name: (candidate.name || currentProject.name || "Proyecto").trim(),
    title: (candidate.title || currentProject.title || "Tablero Kanban").trim(),
    originId: currentProject.originId || currentProject.id,
    version: 1,
    revision: Number.isFinite(candidate.revision) ? candidate.revision : (currentProject.revision ?? 1),
    updatedAt: new Date().toISOString(),
  };
}

export function normalizeProject(projectCandidate) {
  if (!projectCandidate || typeof projectCandidate !== "object") return projectCandidate;
  const normalized = { ...projectCandidate };

  normalized.columns = Array.isArray(normalized.columns)
    ? normalized.columns.map((col) => ({
        ...col,
        policy: (col?.policy || "").trim() || "Configurar las politicas",
      }))
    : [];

  normalized.iterations = Array.isArray(normalized.iterations) ? normalized.iterations : [];
  normalized.tasks = Array.isArray(normalized.tasks)
    ? normalized.tasks.map((task) => ({
        ...task,
        tags: Array.isArray(task.tags)
          ? Array.from(
              new Set(
                task.tags
                  .map((tag) => String(tag || "").trim().replace(/\s+/g, " "))
                  .filter(Boolean)
              )
            )
          : [],
        checklist: Array.isArray(task.checklist)
          ? task.checklist
              .map((item) => {
                if (typeof item === "string") {
                  const text = item.trim();
                  return text ? { id: makeId("chk"), text, done: false } : null;
                }
                if (!item || typeof item !== "object") return null;
                const text = String(item.text || "").trim();
                if (!text) return null;
                return {
                  id: String(item.id || makeId("chk")),
                  text,
                  done: Boolean(item.done),
                };
              })
              .filter(Boolean)
          : [],
      }))
    : [];
  normalized.tagsCatalog = normalizeTagsCatalog(normalized.tagsCatalog, normalized.tasks);
  const rawName = String(normalized.name || "").trim();
  const rawTitle = String(normalized.title || "").trim();
  let effectiveName = rawName;

  if (rawTitle) {
    if (rawTitle.startsWith("Tablero Kanban |")) {
      const derivedName = rawTitle.replace("Tablero Kanban |", "").trim();
      if (!effectiveName && derivedName) effectiveName = derivedName;
    } else if (rawTitle !== rawName) {
      // Legacy migration: before name/title unification, users edited only title.
      effectiveName = rawTitle;
    }
  }

  normalized.name = effectiveName || "Proyecto";
  normalized.title = `Tablero Kanban | ${normalized.name}`;
  normalized.originId = normalized.originId || normalized.id || makeId("origin");
  normalized.revision = Number.isFinite(normalized.revision) ? normalized.revision : 1;
  normalized.updatedAt = normalized.updatedAt || new Date().toISOString();

  return normalized;
}
