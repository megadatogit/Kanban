import React, { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, DoorOpen, Menu as MenuIcon, Moon, Sun, Trash2 } from "lucide-react";
import styles from "./Kanban.module.css";
import { createDefaultProject } from "./defaultProject";
import {
  addProjectToIndex,
  getActiveProjectId,
  loadProject,
  loadProjectsIndex,
  removeProject,
  removeProjectFromIndex,
  saveProject,
  setActiveProjectId,
} from "./projectStorage";

function ddmmyyyyToISO(ddmmyyyy) {
  if (!ddmmyyyy || !ddmmyyyy.includes("/")) return "";
  const [dd, mm, yyyy] = ddmmyyyy.split("/");
  return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
}

function isoToDDMMYYYY(iso) {
  if (!iso || !iso.includes("-")) return "";
  const [yyyy, mm, dd] = iso.split("-");
  return `${dd}/${mm}/${yyyy}`;
}

function parseIterationRange(range) {
  const [start = "", end = ""] = range.split(" - ").map((s) => s.trim());
  return { start, end };
}

function tagSlug(tag) {
  return tag.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function makeId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function normalizeName(name) {
  return (name || "").trim().replace(/\s+/g, " ").toLowerCase();
}

function getUniqueProjectName(baseName, projects, excludeId = null) {
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

function normalizeTagsCatalog(tagsCatalogCandidate, tasksCandidate = []) {
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

function loadOrCreateInitialProject() {
  const index = loadProjectsIndex();
  const activeId = getActiveProjectId();

  if (activeId) {
    const active = loadProject(activeId);
    if (active) return { project: normalizeProject(active), index };
  }

  if (index.length > 0) {
    const first = loadProject(index[0].id);
    if (first) {
      setActiveProjectId(first.id);
      return { project: normalizeProject(first), index };
    }
  }

  const fresh = normalizeProject(createDefaultProject());
  saveProject(fresh);
  addProjectToIndex(fresh);
  setActiveProjectId(fresh.id);

  return {
    project: fresh,
    index: [{ id: fresh.id, name: fresh.name, updatedAt: fresh.updatedAt }],
  };
}

function sanitizeImportedProject(raw) {
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

function sanitizeImportedProjectForReplace(raw, currentProject) {
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

function normalizeProject(projectCandidate) {
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
      }))
    : [];
  normalized.tagsCatalog = normalizeTagsCatalog(normalized.tagsCatalog, normalized.tasks);
  normalized.originId = normalized.originId || normalized.id || makeId("origin");
  normalized.revision = Number.isFinite(normalized.revision) ? normalized.revision : 1;
  normalized.updatedAt = normalized.updatedAt || new Date().toISOString();

  return normalized;
}

export default function Kanban() {
  const [initialState] = useState(() => loadOrCreateInitialProject());
  const [project, setProject] = useState(initialState.project);
  const [projectsIndex, setProjectsIndex] = useState(initialState.index);
  const [activeProjectId, setActiveProjectIdState] = useState(initialState.project.id);
  const [screen, setScreen] = useState("home");
  const [homeProjectId, setHomeProjectId] = useState(initialState.project.id);
  const [darkMode, setDarkMode] = useState(false);
  const [draggedId, setDraggedId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProjectMenuOpen, setIsProjectMenuOpen] = useState(false);
  const [openSelectKey, setOpenSelectKey] = useState(null);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [isRenameProjectOpen, setIsRenameProjectOpen] = useState(false);
  const [isDeleteProjectOpen, setIsDeleteProjectOpen] = useState(false);
  const [deleteProjectError, setDeleteProjectError] = useState("");
  const [isDeleteFinalStep, setIsDeleteFinalStep] = useState(false);
  const [deleteCountdown, setDeleteCountdown] = useState(10);
  const [isImportModeOpen, setIsImportModeOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsError, setSettingsError] = useState("");
  const [draftConfig, setDraftConfig] = useState(null);
  const [plannedColumnMoves, setPlannedColumnMoves] = useState({});
  const [plannedIterationMoves, setPlannedIterationMoves] = useState({});
  const [selectedIteration, setSelectedIteration] = useState(
    project.iterations[0]?.id ?? ""
  );

  const [newTask, setNewTask] = useState({
    title: "",
    priority: "Media",
    tags: [],
    assignee: "",
    startDateISO: "",
    dueDateISO: "",
  });
  const importInputRef = useRef(null);
  const selectRefs = useRef({});
  const [pendingImportRaw, setPendingImportRaw] = useState(null);
  const [pendingImportName, setPendingImportName] = useState("");
  const [pendingImportRelatedProjectId, setPendingImportRelatedProjectId] = useState(null);
  const [pendingImportRelatedProjectName, setPendingImportRelatedProjectName] = useState("");
  const [pendingImportRelationType, setPendingImportRelationType] = useState(null);
  const [pendingImportNameStrategy, setPendingImportNameStrategy] = useState("use_imported");
  const [pendingImportManualName, setPendingImportManualName] = useState("");
  const [pendingImportError, setPendingImportError] = useState("");
  const [newProjectName, setNewProjectName] = useState("");
  const [renameProjectName, setRenameProjectName] = useState("");
  const [showFirstTaskOnboarding, setShowFirstTaskOnboarding] = useState(false);
  const [showSetupOnboarding, setShowSetupOnboarding] = useState(false);

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [darkMode]);

  useEffect(() => {
    setHomeProjectId(activeProjectId);
  }, [activeProjectId]);

  useEffect(() => {
    if (!isDeleteProjectOpen || !isDeleteFinalStep) return;
    setDeleteCountdown(10);
    const intervalId = setInterval(() => {
      setDeleteCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(intervalId);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [isDeleteProjectOpen, isDeleteFinalStep]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!openSelectKey) return;
      const currentRef = selectRefs.current[openSelectKey];
      if (currentRef && !currentRef.contains(event.target)) {
        setOpenSelectKey(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openSelectKey]);

  useEffect(() => {
    const allowedTags = new Set(project.tagsCatalog.map((tag) => normalizeName(tag.name)));
    setNewTask((prev) => {
      const filtered = prev.tags.filter((tag) => allowedTags.has(normalizeName(tag)));
      if (filtered.length === prev.tags.length) return prev;
      return { ...prev, tags: filtered };
    });
  }, [project.tagsCatalog]);

  const updateProject = (updater) => {
    setProject((prev) => {
      const nextProject = typeof updater === "function" ? updater(prev) : updater;
      const withTimestamp = {
        ...nextProject,
        originId: nextProject.originId || prev.originId || prev.id,
        revision: (Number.isFinite(prev.revision) ? prev.revision : 0) + 1,
        updatedAt: new Date().toISOString(),
      };
      saveProject(withTimestamp);
      addProjectToIndex(withTimestamp);
      setProjectsIndex(loadProjectsIndex());
      return withTimestamp;
    });
  };

  const findRelatedProjectByOriginId = (originId) => {
    if (!originId) return null;
    for (const item of projectsIndex) {
      const candidate = normalizeProject(loadProject(item.id));
      if (candidate?.originId === originId) {
        return candidate;
      }
    }
    return null;
  };

  const findRelatedProjectForImport = (rawCandidate) => {
    if (!rawCandidate || typeof rawCandidate !== "object") {
      return { project: null, relationType: null };
    }

    const byOrigin =
      findRelatedProjectByOriginId(rawCandidate.originId) ||
      findRelatedProjectByOriginId(rawCandidate.id);
    if (byOrigin) {
      return { project: byOrigin, relationType: "origin" };
    }

    const candidateName = normalizeName(rawCandidate.name);
    if (!candidateName) {
      return { project: null, relationType: null };
    }

    const sameNameProjects = projectsIndex.filter(
      (item) => normalizeName(item.name) === candidateName
    );
    if (sameNameProjects.length !== 1) {
      return { project: null, relationType: null };
    }

    const byName = normalizeProject(loadProject(sameNameProjects[0].id));
    return { project: byName, relationType: byName ? "name" : null };
  };

  const getIterationDates = (iterationId) => {
    const it = project.iterations.find((i) => i.id === iterationId);
    if (!it) return { start: "", end: "" };
    return parseIterationRange(it.range);
  };

  const openSettings = (withOnboarding = false) => {
    setSettingsError("");
    setShowSetupOnboarding(withOnboarding && isVirginBoard);
    setPlannedColumnMoves({});
    setPlannedIterationMoves({});
    setDraftConfig({
      title: project.title,
      columns: project.columns.map((col) => ({
        id: col.id,
        title: col.title,
        limit: String(col.limit),
        policy: col.policy,
      })),
      tags: project.tagsCatalog.map((tag) => ({
        id: tag.id,
        name: tag.name,
      })),
      iterations: project.iterations.map((it) => {
        const { start, end } = parseIterationRange(it.range);
        return {
          id: it.id,
          label: it.label,
          startDateISO: ddmmyyyyToISO(start),
          endDateISO: ddmmyyyyToISO(end),
        };
      }),
    });
    setIsSettingsOpen(true);
  };

  const closeSettings = () => {
    setIsSettingsOpen(false);
    setDraftConfig(null);
    setSettingsError("");
    setShowSetupOnboarding(false);
    setPlannedColumnMoves({});
    setPlannedIterationMoves({});
  };

  const updateDraftColumn = (columnId, field, value) => {
    setDraftConfig((prev) => ({
      ...prev,
      columns: prev.columns.map((col) =>
        col.id === columnId ? { ...col, [field]: value } : col
      ),
    }));
  };

  const updateDraftIteration = (iterationId, field, value) => {
    setDraftConfig((prev) => ({
      ...prev,
      iterations: prev.iterations.map((it) =>
        it.id === iterationId ? { ...it, [field]: value } : it
      ),
    }));
  };

  const updateDraftTag = (tagId, value) => {
    setDraftConfig((prev) => ({
      ...prev,
      tags: prev.tags.map((tag) =>
        tag.id === tagId ? { ...tag, name: value } : tag
      ),
    }));
  };

  const addDraftTag = () => {
    setDraftConfig((prev) => ({
      ...prev,
      tags: [...prev.tags, { id: makeId("tag"), name: "Nueva Etiqueta" }],
    }));
  };

  const removeDraftTag = (tagId) => {
    if (!draftConfig || draftConfig.tags.length <= 1) {
      setSettingsError("Debes mantener al menos una etiqueta.");
      return;
    }

    setSettingsError("");
    setDraftConfig((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag.id !== tagId),
    }));
  };

  const addDraftColumn = () => {
    setDraftConfig((prev) => ({
      ...prev,
      columns: [
        ...prev.columns,
        {
          id: makeId("col"),
          title: "Nueva Columna",
          limit: "1",
          policy: "Define DoR y DoD para esta columna.",
        },
      ],
    }));
  };

  const removeDraftColumn = (columnId) => {
    if (!draftConfig || draftConfig.columns.length <= 1) {
      setSettingsError("Debes mantener al menos una columna.");
      return;
    }

    const hasTasks = project.tasks.some((t) => t.columnId === columnId);
    if (hasTasks) {
      setSettingsError("No puedes eliminar una columna que tiene tareas.");
      return;
    }
    setSettingsError("");
    setDraftConfig((prev) => ({
      ...prev,
      columns: prev.columns.filter((col) => col.id !== columnId),
    }));
  };

  const removeDraftColumnWithMove = (columnId) => {
    const targetId = plannedColumnMoves[columnId];
    if (!targetId) {
      setSettingsError("Selecciona la columna destino para mover tareas.");
      return;
    }

    if (!draftConfig || draftConfig.columns.length <= 1) {
      setSettingsError("Debes mantener al menos una columna.");
      return;
    }

    setSettingsError("");
    setDraftConfig((prev) => ({
      ...prev,
      columns: prev.columns.filter((col) => col.id !== columnId),
    }));
  };

  const addDraftIteration = () => {
    setDraftConfig((prev) => ({
      ...prev,
      iterations: [
        ...prev.iterations,
        {
          id: makeId("it"),
          label: `Iteracion ${prev.iterations.length + 1}`,
          startDateISO: "",
          endDateISO: "",
        },
      ],
    }));
  };

  const removeDraftIteration = (iterationId) => {
    if (!draftConfig || draftConfig.iterations.length <= 1) {
      setSettingsError("Debes mantener al menos una iteracion.");
      return;
    }

    const hasTasks = project.tasks.some((t) => t.iteration === iterationId);
    if (hasTasks) {
      setSettingsError("No puedes eliminar una iteracion que tiene tareas.");
      return;
    }
    setSettingsError("");
    setDraftConfig((prev) => ({
      ...prev,
      iterations: prev.iterations.filter((it) => it.id !== iterationId),
    }));
  };

  const removeDraftIterationWithMove = (iterationId) => {
    const targetId = plannedIterationMoves[iterationId];
    if (!targetId) {
      setSettingsError("Selecciona la iteracion destino para mover tareas.");
      return;
    }

    if (!draftConfig || draftConfig.iterations.length <= 1) {
      setSettingsError("Debes mantener al menos una iteracion.");
      return;
    }

    setSettingsError("");
    setDraftConfig((prev) => ({
      ...prev,
      iterations: prev.iterations.filter((it) => it.id !== iterationId),
    }));
  };

  const applySettings = () => {
    if (!draftConfig) return;

    const title = draftConfig.title.trim();
    if (!title) {
      setSettingsError("El titulo del tablero es obligatorio.");
      return;
    }

    if (draftConfig.columns.length === 0) {
      setSettingsError("Debes tener al menos una columna.");
      return;
    }

    if (draftConfig.iterations.length === 0) {
      setSettingsError("Debes tener al menos una iteracion.");
      return;
    }

    const nextColumns = [];
    for (const col of draftConfig.columns) {
      const colTitle = col.title.trim();
      const limit = Number.parseInt(col.limit, 10);
      if (!colTitle) {
        setSettingsError("Todas las columnas deben tener nombre.");
        return;
      }
      if (!Number.isFinite(limit) || limit < 1) {
        setSettingsError("Todos los WIP deben ser numeros mayores o iguales a 1.");
        return;
      }
      nextColumns.push({
        id: col.id,
        title: colTitle,
        limit,
        policy: col.policy.trim() || "Sin politica definida.",
      });
    }

    const nextIterations = [];
    for (const it of draftConfig.iterations) {
      const startDate = it.startDateISO;
      const endDate = it.endDateISO;
      if (!startDate || !endDate) {
        setSettingsError("Todas las iteraciones deben tener fecha inicio y fin.");
        return;
      }
      if (startDate > endDate) {
        setSettingsError("La fecha inicio no puede ser mayor a la fecha fin.");
        return;
      }
      const range = `${isoToDDMMYYYY(startDate)} - ${isoToDDMMYYYY(endDate)}`;
      const label = it.label.trim() || `Iteracion (${range})`;
      nextIterations.push({ id: it.id, label, range });
    }

    if (!Array.isArray(draftConfig.tags) || draftConfig.tags.length === 0) {
      setSettingsError("Debes configurar al menos una etiqueta.");
      return;
    }

    const nextTagsCatalog = [];
    const seenTagNames = new Set();
    for (const tag of draftConfig.tags) {
      const name = String(tag.name || "").trim().replace(/\s+/g, " ");
      const normalizedName = normalizeName(name);
      if (!normalizedName) {
        setSettingsError("Todas las etiquetas deben tener nombre.");
        return;
      }
      if (seenTagNames.has(normalizedName)) {
        setSettingsError("No puedes repetir etiquetas con el mismo nombre.");
        return;
      }
      seenTagNames.add(normalizedName);
      nextTagsCatalog.push({ id: tag.id, name });
    }

    const validColumnIds = new Set(nextColumns.map((c) => c.id));
    const validIterationIds = new Set(nextIterations.map((i) => i.id));
    const prevTagIdByNormalizedName = new Map(
      project.tagsCatalog.map((tag) => [normalizeName(tag.name), tag.id])
    );
    const nextTagNameById = new Map(nextTagsCatalog.map((tag) => [tag.id, tag.name]));
    const nextCanonicalTagNameByNormalizedName = new Map(
      nextTagsCatalog.map((tag) => [normalizeName(tag.name), tag.name])
    );
    const fallbackColumnId = nextColumns[0].id;
    const fallbackIterationId = nextIterations[0].id;
    const nextSelectedIteration = validIterationIds.has(selectedIteration)
      ? selectedIteration
      : fallbackIterationId;

    updateProject((prev) => ({
      ...prev,
      title,
      columns: nextColumns,
      iterations: nextIterations,
      tagsCatalog: nextTagsCatalog,
      tasks: prev.tasks.map((t) => ({
        ...t,
        columnId: validColumnIds.has(t.columnId)
          ? t.columnId
          : validColumnIds.has(plannedColumnMoves[t.columnId])
            ? plannedColumnMoves[t.columnId]
            : fallbackColumnId,
        iteration: validIterationIds.has(t.iteration)
          ? t.iteration
          : validIterationIds.has(plannedIterationMoves[t.iteration])
            ? plannedIterationMoves[t.iteration]
            : fallbackIterationId,
        tags: Array.from(
          new Set(
            (t.tags || [])
              .map((tagName) => {
                const normalizedTagName = normalizeName(tagName);
                const previousTagId = prevTagIdByNormalizedName.get(normalizedTagName);
                if (previousTagId && nextTagNameById.has(previousTagId)) {
                  return nextTagNameById.get(previousTagId);
                }
                return nextCanonicalTagNameByNormalizedName.get(normalizedTagName) || "";
              })
              .filter(Boolean)
          )
        ),
      })),
    }));

    if (nextSelectedIteration !== selectedIteration) {
      setSelectedIteration(nextSelectedIteration);
    }

    if (isVirginBoard) {
      const nextIteration = nextIterations.find((it) => it.id === nextSelectedIteration);
      const { start, end } = parseIterationRange(nextIteration?.range || "");
      setNewTask({
        title: "",
        priority: "Media",
        tags: [],
        assignee: "",
        startDateISO: ddmmyyyyToISO(start),
        dueDateISO: ddmmyyyyToISO(end),
      });
    }

    closeSettings();

    if (isVirginBoard && showSetupOnboarding) {
      setShowFirstTaskOnboarding(true);
      setIsModalOpen(true);
    }
  };

  const visibleTasks = useMemo(
    () => project.tasks.filter((t) => t.iteration === selectedIteration),
    [project.tasks, selectedIteration]
  );
  const isVirginBoard = project.tasks.length === 0;

  const columnTasks = (colId) => visibleTasks.filter((t) => t.columnId === colId);

  const openModal = () => {
    setShowFirstTaskOnboarding(false);
    const { start, end } = getIterationDates(selectedIteration);
    setNewTask({
      title: "",
      priority: "Media",
      tags: [],
      assignee: "",
      startDateISO: ddmmyyyyToISO(start),
      dueDateISO: ddmmyyyyToISO(end),
    });
    setIsModalOpen(true);
  };

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTask.title.trim() || !newTask.assignee.trim()) return;
    const defaultColumnId = project.columns[0]?.id;
    if (!defaultColumnId) return;

    const initials = newTask.assignee
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    const { start, end } = getIterationDates(selectedIteration);

    const taskToAdd = {
      id: `t-${Date.now()}`,
      title: newTask.title.trim(),
      priority: newTask.priority,
      tags: newTask.tags,
      assignee: newTask.assignee.trim(),
      columnId: defaultColumnId,
      iteration: selectedIteration,
      initials,
      startDate: isoToDDMMYYYY(newTask.startDateISO) || start,
      dueDate: isoToDDMMYYYY(newTask.dueDateISO) || end,
    };

    updateProject((prev) => ({
      ...prev,
      tasks: [...prev.tasks, taskToAdd],
    }));

    setShowFirstTaskOnboarding(false);
    setIsModalOpen(false);
  };

  const toggleTag = (tag) => {
    setNewTask((prev) => {
      const exists = prev.tags.includes(tag);
      const next = exists ? prev.tags.filter((t) => t !== tag) : [...prev.tags, tag];
      return { ...prev, tags: next };
    });
  };

  const onDragStart = (taskId) => setDraggedId(taskId);
  const onDragOver = (e) => e.preventDefault();
  const onDropToColumn = (columnId) => {
    if (!draggedId) return;
    updateProject((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => (t.id === draggedId ? { ...t, columnId } : t)),
    }));
    setDraggedId(null);
  };

  const getPriorityClass = (p) => {
    switch (p) {
      case "Critica":
        return styles.priorityCritica;
      case "Alta":
        return styles.priorityAlta;
      case "Media":
        return styles.priorityMedia;
      default:
        return styles.priorityBaja;
    }
  };

  const currentIteration = project.iterations.find((i) => i.id === selectedIteration);

  const handleCreateProject = (name) => {
    if (!name || !name.trim()) return;
    const fresh = normalizeProject(createDefaultProject());
    const projectName = getUniqueProjectName(name, projectsIndex);
    fresh.name = projectName;
    fresh.title = `Tablero Kanban | ${projectName}`;
    fresh.originId = fresh.originId || fresh.id;
    fresh.revision = 1;
    fresh.updatedAt = new Date().toISOString();

    saveProject(fresh);
    addProjectToIndex(fresh);
    setProjectsIndex(loadProjectsIndex());
    setActiveProjectId(fresh.id);
    setActiveProjectIdState(fresh.id);
    setSelectedIteration(fresh.iterations[0]?.id ?? "");
    setProject(fresh);
    setScreen("board");
  };

  const openCreateProjectModal = () => {
    setIsProjectMenuOpen(false);
    setNewProjectName("");
    setIsCreateProjectOpen(true);
  };

  const closeCreateProjectModal = () => {
    setIsCreateProjectOpen(false);
    setNewProjectName("");
  };

  const submitCreateProject = (e) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    handleCreateProject(newProjectName);
    closeCreateProjectModal();
  };

  const handleProjectChange = (projectId) => {
    const next = normalizeProject(loadProject(projectId));
    if (!next) return;
    setActiveProjectId(projectId);
    setActiveProjectIdState(projectId);
    setSelectedIteration(next.iterations[0]?.id ?? "");
    setProject(next);
    setOpenSelectKey(null);
  };

  const handleRenameProject = () => {
    const name = getUniqueProjectName(renameProjectName, projectsIndex, project.id);
    if (!name) return;
    updateProject((prev) => ({
      ...prev,
      name,
      title: `Tablero Kanban | ${name}`,
    }));
    closeRenameProjectModal();
  };

  const openRenameProjectModal = () => {
    setIsProjectMenuOpen(false);
    setRenameProjectName(project.name || "");
    setIsRenameProjectOpen(true);
  };

  const closeRenameProjectModal = () => {
    setIsRenameProjectOpen(false);
    setRenameProjectName("");
  };

  const submitRenameProject = (e) => {
    e.preventDefault();
    handleRenameProject();
  };

  const handleDuplicateProject = () => {
    const duplicate = JSON.parse(JSON.stringify(project));
    duplicate.id = makeId("p");
    duplicate.name = getUniqueProjectName(`${project.name} (Copia)`, projectsIndex);
    duplicate.title = `Tablero Kanban | ${duplicate.name}`;
    duplicate.originId = duplicate.id;
    duplicate.updatedAt = new Date().toISOString();
    duplicate.revision = 1;
    duplicate.version = 1;

    saveProject(duplicate);
    addProjectToIndex(duplicate);
    setProjectsIndex(loadProjectsIndex());
    setActiveProjectId(duplicate.id);
    setActiveProjectIdState(duplicate.id);
    setSelectedIteration(duplicate.iterations[0]?.id ?? "");
    setProject(duplicate);
  };

  const handleDeleteProject = () => {
    removeProject(project.id);
    const nextIndex = removeProjectFromIndex(project.id);
    const fallbackId = nextIndex[0]?.id;
    if (!fallbackId) return;

    const fallbackProject = loadProject(fallbackId);
    if (!fallbackProject) return;

    setProjectsIndex(nextIndex);
    setActiveProjectId(fallbackId);
    setActiveProjectIdState(fallbackId);
    setSelectedIteration(fallbackProject.iterations[0]?.id ?? "");
    setProject(fallbackProject);
  };

  const openDeleteProjectModal = () => {
    setIsProjectMenuOpen(false);
    setDeleteProjectError("");
    setIsDeleteFinalStep(false);
    setDeleteCountdown(10);
    setIsDeleteProjectOpen(true);
  };

  const closeDeleteProjectModal = () => {
    setIsDeleteProjectOpen(false);
    setDeleteProjectError("");
    setIsDeleteFinalStep(false);
    setDeleteCountdown(10);
  };

  const confirmDeleteProject = () => {
    setIsDeleteFinalStep(true);
  };

  const executeDeleteProject = () => {
    if (projectsIndex.length <= 1) {
      setDeleteProjectError("No puedes eliminar el unico proyecto.");
      return;
    }
    handleDeleteProject();
    closeDeleteProjectModal();
  };

  const handleExportProject = () => {
    const blob = new Blob([JSON.stringify(project, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const safeName = project.name.replace(/[^a-zA-Z0-9-_]/g, "_");
    a.href = url;
    a.download = `kanban_${safeName}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    setIsProjectMenuOpen(false);
    importInputRef.current?.click();
  };

  const handleImportProject = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const isValidCandidate =
        sanitizeImportedProject(parsed) ||
        sanitizeImportedProjectForReplace(parsed, project);
      if (!isValidCandidate) {
        window.alert("Archivo invalido. Debe contener un proyecto Kanban.");
        return;
      }

      const rawCandidate = parsed?.project ?? parsed;
      const relatedInfo = findRelatedProjectForImport(rawCandidate);
      const related = relatedInfo.project;
      setPendingImportRaw(parsed);
      setPendingImportName(file.name);
      setPendingImportRelatedProjectId(related?.id ?? null);
      setPendingImportRelatedProjectName(related?.name ?? "");
      setPendingImportRelationType(relatedInfo.relationType);
      setPendingImportNameStrategy(related?.id ? "keep_local" : "use_imported");
      setPendingImportManualName("");
      setPendingImportError("");
      setIsImportModeOpen(true);
    } catch {
      window.alert("No se pudo importar el archivo.");
    } finally {
      event.target.value = "";
    }
  };

  const closeImportMode = () => {
    setIsImportModeOpen(false);
    setPendingImportRaw(null);
    setPendingImportName("");
    setPendingImportRelatedProjectId(null);
    setPendingImportRelatedProjectName("");
    setPendingImportRelationType(null);
    setPendingImportNameStrategy("use_imported");
    setPendingImportManualName("");
    setPendingImportError("");
  };

  const getResolvedImportName = ({
    importedName,
    targetName,
    targetId,
    forReplace,
  }) => {
    const importedBase = (importedName || "Proyecto Importado").trim();
    const targetBase = (targetName || "Proyecto").trim();
    const manualBase = pendingImportManualName.trim();

    let baseName = importedBase;
    if (pendingImportNameStrategy === "keep_local") {
      baseName = targetBase || importedBase;
    } else if (pendingImportNameStrategy === "manual") {
      if (!manualBase) {
        setPendingImportError("Escribe un nombre manual para continuar.");
        return null;
      }
      baseName = manualBase;
    }

    setPendingImportError("");
    return getUniqueProjectName(
      baseName,
      projectsIndex,
      forReplace ? targetId : null
    );
  };

  const handleImportAsNew = () => {
    const imported = normalizeProject(sanitizeImportedProject(pendingImportRaw));
    if (!imported) {
      window.alert("Archivo invalido. Debe contener un proyecto Kanban.");
      closeImportMode();
      return;
    }
    const targetProject = pendingImportRelatedProjectId
      ? normalizeProject(loadProject(pendingImportRelatedProjectId))
      : null;
    const uniqueName = getResolvedImportName({
      importedName: imported.name,
      targetName: targetProject?.name,
      targetId: targetProject?.id ?? null,
      forReplace: false,
    });
    if (!uniqueName) return;
    imported.name = uniqueName;
    imported.title = `Tablero Kanban | ${uniqueName}`;
    imported.updatedAt = new Date().toISOString();

    saveProject(imported);
    addProjectToIndex(imported);
    setProjectsIndex(loadProjectsIndex());
    setActiveProjectId(imported.id);
    setActiveProjectIdState(imported.id);
    setSelectedIteration(imported.iterations[0]?.id ?? "");
    setProject(imported);
    setScreen("board");
    closeImportMode();
  };

  const handleImportAsReplace = () => {
    const targetProject = pendingImportRelatedProjectId
      ? normalizeProject(loadProject(pendingImportRelatedProjectId))
      : project;
    const replaced = normalizeProject(
      sanitizeImportedProjectForReplace(pendingImportRaw, targetProject || project)
    );
    if (!replaced) {
      window.alert("Archivo invalido. Debe contener un proyecto Kanban.");
      closeImportMode();
      return;
    }
    const uniqueName = getResolvedImportName({
      importedName: replaced.name,
      targetName: targetProject?.name ?? project.name,
      targetId: replaced.id,
      forReplace: true,
    });
    if (!uniqueName) return;
    replaced.name = uniqueName;
    replaced.title = `Tablero Kanban | ${uniqueName}`;
    replaced.updatedAt = new Date().toISOString();

    saveProject(replaced);
    addProjectToIndex(replaced);
    setProjectsIndex(loadProjectsIndex());
    setActiveProjectId(replaced.id);
    setActiveProjectIdState(replaced.id);
    setSelectedIteration(replaced.iterations[0]?.id ?? "");
    setProject(replaced);
    setScreen("board");
    closeImportMode();
  };

  const enterBoard = () => {
    if (!homeProjectId) return;
    handleProjectChange(homeProjectId);
    setScreen("board");
  };

  const renderCustomSelect = ({
    selectKey,
    value,
    onChange,
    options,
    placeholder,
    ariaLabel,
  }) => {
    const selected = options.find((opt) => String(opt.value) === String(value));
    const isOpen = openSelectKey === selectKey;

    return (
      <div
        className={styles.customSelect}
        ref={(el) => {
          selectRefs.current[selectKey] = el;
        }}
      >
        <button
          type="button"
          className={styles.customSelectBtn}
          onClick={() => setOpenSelectKey((prev) => (prev === selectKey ? null : selectKey))}
          aria-label={ariaLabel}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <span>{selected?.label || placeholder}</span>
          <ChevronDown size={14} aria-hidden="true" />
        </button>
        {isOpen ? (
          <div className={styles.customSelectMenu} role="listbox" aria-label={ariaLabel}>
            {options.map((opt) => (
              <button
                type="button"
                key={`${selectKey}_${String(opt.value)}`}
                className={`${styles.customSelectItem} ${String(opt.value) === String(value) ? styles.customSelectItemActive : ""}`}
                onClick={() => {
                  onChange(opt.value);
                  setOpenSelectKey(null);
                }}
                role="option"
                aria-selected={String(opt.value) === String(value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <div className={`${styles.app} ${darkMode ? styles.dark : ""}`} aria-label="Kanban con proyectos locales">
      <input
        ref={importInputRef}
        type="file"
        accept="application/json,.json"
        onChange={handleImportProject}
        style={{ display: "none" }}
      />

      {screen === "home" ? (
        <section className={styles.homeScreen} aria-label="Pantalla de bienvenida">
          <div className={styles.homeCard}>
            <div className={styles.homeLeft}>
              <h1 className={styles.homeTitle}>Bienvenido a Tablero Kanban</h1>
              <p className={styles.homeText}>
                Selecciona un proyecto para continuar o crea uno nuevo para comenzar.
              </p>
            </div>
            <div className={styles.homeRight}>
              {projectsIndex.length > 0 ? (
                <>
                  <label className={styles.label}>Proyecto</label>
                  {renderCustomSelect({
                    selectKey: "home-project",
                    value: homeProjectId,
                    onChange: (nextId) => setHomeProjectId(nextId),
                    options: projectsIndex.map((p) => ({ value: p.id, label: p.name })),
                    placeholder: "Proyecto",
                    ariaLabel: "Seleccionar proyecto de inicio",
                  })}
                  <div className={styles.actions}>
                    <button type="button" className={`${styles.btn} ${styles.secondary}`} onClick={handleImportClick}>
                      Importar Proyecto
                    </button>
                    <button type="button" className={`${styles.btn} ${styles.secondary}`} onClick={openCreateProjectModal}>
                      Nuevo Proyecto
                    </button>
                    <button type="button" className={styles.btn} onClick={enterBoard}>
                      Entrar
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className={styles.homeText}>No hay proyectos disponibles.</p>
                  <div className={styles.actions}>
                    <button type="button" className={`${styles.btn} ${styles.secondary}`} onClick={handleImportClick}>
                      Importar Proyecto
                    </button>
                    <button type="button" className={styles.btn} onClick={openCreateProjectModal}>
                      Crear mi primer proyecto
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>
      ) : (
        <>
          <div className={styles.boardHeader} aria-label="Encabezado Tablero">
            <div className={styles.titleWrap}>
              <button
                type="button"
                className={`${styles.iconBtn} ${styles.homeBtn}`}
                onClick={() => {
                  setIsProjectMenuOpen(false);
                  setScreen("home");
                }}
                aria-label="Volver a la pantalla principal"
                title="Volver al inicio"
              >
                <DoorOpen size={16} strokeWidth={2.25} />
              </button>
              <div className={styles.titleBlock}>
                <div className={styles.title}>{project.title}</div>
                <div className={styles.description}>
                  {`[Iteracion actual: ${currentIteration?.label ?? "-"}]`}
                </div>
              </div>
            </div>

            <div className={styles.controls} role="group" aria-label="Controles">
              {renderCustomSelect({
                selectKey: "header-project",
                value: activeProjectId,
                onChange: (nextId) => handleProjectChange(nextId),
                options: projectsIndex.map((p) => ({ value: p.id, label: p.name })),
                placeholder: "Proyecto",
                ariaLabel: "Seleccionar proyecto",
              })}

              <div className={styles.menuWrap}>
                <button
                  type="button"
                  className={`${styles.iconBtn} ${styles.menuIconBtn}`}
                  onClick={() => setIsProjectMenuOpen((s) => !s)}
                  aria-label="Abrir menu de proyecto"
                  title="Menu de proyecto"
                  aria-expanded={isProjectMenuOpen}
                >
                  <MenuIcon size={16} strokeWidth={2.25} />
                </button>
                {isProjectMenuOpen ? (
                  <div className={styles.menuPanel} role="menu" aria-label="Acciones de proyecto">
                    <button type="button" className={styles.menuItem} onClick={openCreateProjectModal}>
                      Nuevo Proyecto
                    </button>
                    <button type="button" className={styles.menuItem} onClick={openRenameProjectModal}>
                      Renombrar
                    </button>
                    <button type="button" className={styles.menuItem} onClick={() => { setIsProjectMenuOpen(false); handleDuplicateProject(); }}>
                      Duplicar
                    </button>
                    <button type="button" className={styles.menuItem} onClick={openDeleteProjectModal}>
                      Eliminar
                    </button>
                    <button type="button" className={styles.menuItem} onClick={() => { setIsProjectMenuOpen(false); handleExportProject(); }}>
                      Exportar
                    </button>
                    <button type="button" className={styles.menuItem} onClick={handleImportClick}>
                      Importar
                    </button>
                    <button type="button" className={styles.menuItem} onClick={() => { setIsProjectMenuOpen(false); openSettings(); }}>
                      Configurar
                    </button>
                  </div>
                ) : null}
              </div>

              {renderCustomSelect({
                selectKey: "header-iteration",
                value: selectedIteration,
                onChange: (nextIteration) => setSelectedIteration(nextIteration),
                options: project.iterations.map((it) => ({ value: it.id, label: it.label })),
                placeholder: "Iteracion",
                ariaLabel: "Seleccionar Iteracion",
              })}

              <button className={`${styles.btn} ${styles.newTaskBtn}`} onClick={openModal} aria-label="Anadir nueva tarea">
                Nueva Tarea
              </button>

              <button
                className={`${styles.iconBtn} ${styles.themeBtn}`}
                onClick={() => setDarkMode((d) => !d)}
                aria-label="Alternar modo oscuro"
                title={darkMode ? "Modo claro" : "Modo oscuro"}
              >
                {darkMode ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
              </button>
            </div>
          </div>

          <div className={styles.board} aria-label="Tablero Kanban">
            <div className={styles.columns} role="region" aria-label="Columnas Kanban">
              {project.columns.map((col) => {
                const items = columnTasks(col.id);
                const atLimit = items.length >= col.limit;
                const overLimit = items.length > col.limit;

                return (
                  <section key={col.id} className={styles.column} aria-label={`Columna ${col.title}`} draggable={false}>
                    <div className={styles.columnHeader}>
                      <div className={styles.columnHeaderLeft}>
                        <span className={styles.columnColor} aria-label="Color de columna" />
                        <span className={styles.columnTitle}>{col.title}</span>
                      </div>

                      <div className={styles.columnHeaderRight}>
                        <span className={`${styles.badge} ${atLimit ? styles.badgeWarn : styles.badgeNeutral}`}>
                          WIP= {items.length} / {col.limit}
                        </span>
                        {overLimit ? <span className={`${styles.badge} ${styles.badgeDanger}`}>Sobre limite</span> : null}
                      </div>
                    </div>

                    <div className={styles.policyNote} aria-label={`Politicas de la columna ${col.title}`}>
                      {col.policy}
                    </div>

                    <div
                      className={`${styles.cardStack} ${darkMode ? styles.cardStackDark : ""}`}
                      onDragOver={onDragOver}
                      onDrop={() => onDropToColumn(col.id)}
                      role="group"
                      aria-label={`Area de tareas de ${col.title}`}
                    >
                      {isVirginBoard && col.id === "backlog" ? (
                        <button
                          type="button"
                          className={`${styles.card} ${styles.guideCard} ${styles.guideCardButton}`}
                          aria-label="Configurar tablero"
                          onClick={() => openSettings(true)}
                        >
                          <div className={styles.cardHeader}>
                            <div className={styles.cardTitle}>Configura tablero</div>
                            <span className={`${styles.badge} ${styles.badgeSoft}`}>Guia</span>
                          </div>
                          <p className={styles.description}>
                            Este proyecto esta virgen. Define politicas, WIP e iteraciones para comenzar.
                          </p>
                        </button>
                      ) : null}

                      {items.map((t) => (
                        <article
                          key={t.id}
                          className={`${styles.card} ${getPriorityClass(t.priority)}`}
                          draggable
                          onDragStart={() => onDragStart(t.id)}
                          role="article"
                          aria-label={`Tarea ${t.title}`}
                        >
                          <div className={styles.cardHeader}>
                            <div className={styles.cardTitle}>
                              {t.title}
                              <br />
                              <p className={styles.description}>{t.description}</p>
                            </div>
                            <span className={`${styles.badge} ${styles.badgeSoft}`}>{t.priority}</span>
                          </div>

                          <div className={styles.tagsRow}>
                            {t.tags.map((tag) => {
                              const slug = tagSlug(tag);
                              const tagClass = styles[`tag_${slug}`] || styles.tag_default;
                              return (
                                <span key={tag} className={`${styles.chip} ${tagClass}`}>
                                  {tag}
                                </span>
                              );
                            })}
                          </div>

                          <div className={styles.metaRow}>
                            <span className={styles.metaText}>
                              {t.assignee} - {t.initials}
                            </span>
                            <span className={styles.metaText}>{currentIteration?.label}</span>
                          </div>

                          <div className={styles.metaRow}>
                            <span className={styles.metaStrong}>ID: {t.id}</span>
                            <span className={styles.metaText}>
                              {t.startDate} - {t.dueDate}
                            </span>
                          </div>
                        </article>
                      ))}

                      {items.length === 0 && <div className={styles.emptyDrop}>Arrastra una tarea aqui</div>}
                    </div>
                  </section>
                );
              })}
            </div>
          </div>
        </>
      )}

      {isSettingsOpen && draftConfig && (
        <div className={styles.overlay} aria-label="Modal de configuracion" onClick={closeSettings}>
          <div className={styles.modalWide} onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Configuracion tablero">
            <div className={`${styles.modalTop} ${styles.stickyTop}`}>
              <strong className={styles.modalHeader}>Configuracion del Tablero</strong>
              <button className={`${styles.btn} ${styles.secondary}`} onClick={closeSettings} type="button">
                Cerrar
              </button>
            </div>

            <div className={styles.settingsBody}>
              {showSetupOnboarding ? (
                <p className={`${styles.hint} ${styles.onboardingHint}`}>
                  Paso 1/2: configura columnas, WIP, politicas e iteraciones.
                </p>
              ) : null}
              {settingsError ? <p className={styles.errorText}>{settingsError}</p> : null}

              <div className={styles.settingsSection}>
                <p className={styles.settingsSectionTitle}>Titulo del Tablero</p>
                <p className={styles.settingsSectionDesc}>
                  Define un nombre claro orientado al objetivo de entrega. Recomendacion: incluye
                  producto y alcance (ej. "Kanban | E-commerce Sprint de Pago").
                </p>
              </div>
              <div className={styles.formRow}>
                <div className={`${styles.formGroup} ${styles.full}`}>
                  <label className={styles.label}>Nombre del tablero</label>
                  <input
                    className={styles.input}
                    value={draftConfig.title}
                    onChange={(e) =>
                      setDraftConfig((prev) => ({ ...prev, title: e.target.value }))
                    }
                  />
                </div>
              </div>
              <hr className={styles.sectionDivider} />

              <div className={styles.settingsSection}>
                <p className={styles.settingsSectionTitle}>Etiquetas Globales</p>
                <p className={styles.settingsSectionDesc}>
                  Estandariza el lenguaje del equipo para clasificar tareas. Recomendacion: usa
                  etiquetas cortas por tipo de trabajo (frontend, backend, api, datos, qa).
                </p>
                <div className={styles.settingsHeader}>
                  <strong className={styles.settingsSubTitle}>Catalogo de etiquetas</strong>
                  <button className={`${styles.btn} ${styles.secondary}`} onClick={addDraftTag} type="button">
                    Agregar Etiqueta
                  </button>
                </div>
                <div className={styles.tagsEditorGrid}>
                  {draftConfig.tags.map((tag) => (
                    <div key={tag.id} className={styles.tagEditorItem}>
                      <input
                        className={`${styles.input} ${styles.tagInput}`}
                        value={tag.name}
                        onChange={(e) => updateDraftTag(tag.id, e.target.value)}
                        placeholder="Nombre de etiqueta"
                      />
                      <button
                        className={`${styles.iconBtn} ${styles.trashBtn}`}
                        type="button"
                        onClick={() => removeDraftTag(tag.id)}
                        aria-label={`Eliminar etiqueta ${tag.name}`}
                        title="Eliminar etiqueta"
                      >
                        <Trash2 size={16} strokeWidth={2.1} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <hr className={styles.sectionDivider} />

              <div className={styles.settingsGrid}>
                <div className={styles.settingsSection}>
                  <p className={styles.settingsSectionTitle}>Columnas</p>
                  <p className={styles.settingsSectionDesc}>
                    Configura el flujo de trabajo y sus limites WIP. Recomendacion: cada columna
                    debe representar un estado real y medible del proceso.
                  </p>
                  <div className={styles.settingsHeader}>
                    <strong className={styles.settingsSubTitle}>Definicion de columnas</strong>
                    <button className={`${styles.btn} ${styles.secondary}`} onClick={addDraftColumn} type="button">
                      Agregar Columna
                    </button>
                  </div>

                  {draftConfig.columns.map((col) => (
                    <div key={col.id} className={styles.settingsCard}>
                      {project.tasks.some((t) => t.columnId === col.id) ? (
                        <div className={styles.moveNotice}>
                          Esta columna tiene tareas.
                        </div>
                      ) : null}
                      <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                          <label className={styles.label}>Nombre</label>
                          <input
                            className={styles.input}
                            value={col.title}
                            onChange={(e) => updateDraftColumn(col.id, "title", e.target.value)}
                          />
                        </div>
                        <div className={styles.formGroup}>
                          <label className={styles.label}>WIP</label>
                          <input
                            className={styles.input}
                            type="number"
                            min="1"
                            value={col.limit}
                            onChange={(e) => updateDraftColumn(col.id, "limit", e.target.value)}
                          />
                        </div>
                      </div>
                      <div className={styles.formRow}>
                        <div className={`${styles.formGroup} ${styles.full}`}>
                          <label className={styles.label}>Regla / Politica</label>
                          <textarea
                            className={styles.textarea}
                            rows={3}
                            value={col.policy}
                            onChange={(e) => updateDraftColumn(col.id, "policy", e.target.value)}
                          />
                        </div>
                      </div>
                      <div className={styles.actions}>
                        {project.tasks.some((t) => t.columnId === col.id) ? (
                          <>
                            {renderCustomSelect({
                              selectKey: `move-column-${col.id}`,
                              value: plannedColumnMoves[col.id] ?? "",
                              onChange: (nextTargetId) =>
                                setPlannedColumnMoves((prev) => ({
                                  ...prev,
                                  [col.id]: nextTargetId,
                                })),
                              options: [
                                { value: "", label: "Mover tareas a..." },
                                ...draftConfig.columns
                                  .filter((c) => c.id !== col.id)
                                  .map((c) => ({ value: c.id, label: c.title })),
                              ],
                              placeholder: "Mover tareas a...",
                              ariaLabel: "Seleccionar columna destino",
                            })}
                            <button
                              className={`${styles.btn} ${styles.secondary}`}
                              type="button"
                              onClick={() => removeDraftColumnWithMove(col.id)}
                            >
                              Mover y Eliminar
                            </button>
                          </>
                        ) : (
                          <button
                            className={`${styles.btn} ${styles.secondary}`}
                            type="button"
                            onClick={() => removeDraftColumn(col.id)}
                          >
                            Eliminar Columna
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className={styles.settingsSection}>
                  <p className={styles.settingsSectionTitle}>Iteraciones</p>
                  <p className={styles.settingsSectionDesc}>
                    Ordena el trabajo por ventanas de tiempo. Recomendacion: define inicio y fin
                    realistas para facilitar seguimiento de compromisos.
                  </p>
                  <div className={styles.settingsHeader}>
                    <strong className={styles.settingsSubTitle}>Definicion de iteraciones</strong>
                    <button className={`${styles.btn} ${styles.secondary}`} onClick={addDraftIteration} type="button">
                      Agregar Iteracion
                    </button>
                  </div>

                  {draftConfig.iterations.map((it) => (
                    <div key={it.id} className={styles.settingsCard}>
                      {project.tasks.some((t) => t.iteration === it.id) ? (
                        <div className={styles.moveNotice}>
                          Esta iteracion tiene tareas.
                        </div>
                      ) : null}
                      <div className={styles.formRow}>
                        <div className={`${styles.formGroup} ${styles.full}`}>
                          <label className={styles.label}>Nombre</label>
                          <input
                            className={styles.input}
                            value={it.label}
                            onChange={(e) => updateDraftIteration(it.id, "label", e.target.value)}
                          />
                        </div>
                      </div>
                      <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                          <label className={styles.label}>Inicio</label>
                          <input
                            className={styles.input}
                            type="date"
                            value={it.startDateISO}
                            onChange={(e) => updateDraftIteration(it.id, "startDateISO", e.target.value)}
                          />
                        </div>
                        <div className={styles.formGroup}>
                          <label className={styles.label}>Fin</label>
                          <input
                            className={styles.input}
                            type="date"
                            value={it.endDateISO}
                            onChange={(e) => updateDraftIteration(it.id, "endDateISO", e.target.value)}
                          />
                        </div>
                      </div>
                      <div className={styles.actions}>
                        {project.tasks.some((t) => t.iteration === it.id) ? (
                          <>
                            {renderCustomSelect({
                              selectKey: `move-iteration-${it.id}`,
                              value: plannedIterationMoves[it.id] ?? "",
                              onChange: (nextTargetId) =>
                                setPlannedIterationMoves((prev) => ({
                                  ...prev,
                                  [it.id]: nextTargetId,
                                })),
                              options: [
                                { value: "", label: "Mover tareas a..." },
                                ...draftConfig.iterations
                                  .filter((i) => i.id !== it.id)
                                  .map((i) => ({ value: i.id, label: i.label })),
                              ],
                              placeholder: "Mover tareas a...",
                              ariaLabel: "Seleccionar iteracion destino",
                            })}
                            <button
                              className={`${styles.btn} ${styles.secondary}`}
                              type="button"
                              onClick={() => removeDraftIterationWithMove(it.id)}
                            >
                              Mover y Eliminar
                            </button>
                          </>
                        ) : (
                          <button
                            className={`${styles.btn} ${styles.secondary}`}
                            type="button"
                            onClick={() => removeDraftIteration(it.id)}
                          >
                            Eliminar Iteracion
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className={`${styles.actions} ${styles.stickyBottom}`}>
              <button type="button" className={`${styles.btn} ${styles.secondary}`} onClick={closeSettings}>
                Cancelar
              </button>
              <button type="button" className={styles.btn} onClick={applySettings}>
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {isImportModeOpen && (
        <div className={styles.overlay} aria-label="Modal de importacion" onClick={closeImportMode}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Modo importacion">
            <div className={styles.modalTop}>
              <strong className={styles.modalHeader}>Importar Proyecto</strong>
              <button
                className={`${styles.btn} ${styles.secondary}`}
                onClick={closeImportMode}
                type="button"
              >
                Cerrar
              </button>
            </div>

            <p className={styles.hint}>
              Archivo: <strong>{pendingImportName || "sin nombre"}</strong>
            </p>
            <p className={styles.hint}>
              Elige como aplicar los datos importados.
            </p>
            {pendingImportRelatedProjectId ? (
              <div className={styles.importConflictBox} role="alert" aria-live="polite">
                <p className={styles.importConflictTitle}>Conflicto detectado</p>
                <p className={styles.hint}>
                  {pendingImportRelationType === "origin"
                    ? "Se detecto coincidencia por historial de origen."
                    : "Se detecto coincidencia probable por nombre."}
                </p>
                <p className={styles.hint}>
                  Proyecto local relacionado: <strong>{pendingImportRelatedProjectName}</strong>
                </p>
              </div>
            ) : (
              <p className={styles.hint}>
                No se detecto relacion directa con proyectos locales.
              </p>
            )}

            <div className={styles.importOptions}>
              <p className={styles.importOptionsTitle}>Resolucion de nombre</p>
              <label className={styles.importOption}>
                <input
                  type="radio"
                  name="importNameStrategy"
                  value="keep_local"
                  checked={pendingImportNameStrategy === "keep_local"}
                  onChange={(e) => {
                    setPendingImportNameStrategy(e.target.value);
                    setPendingImportError("");
                  }}
                />
                <span>Conservar nombre local</span>
              </label>
              <p className={styles.importOptionText}>
                Mantiene la identidad del proyecto en esta maquina mientras actualiza el contenido.
              </p>
              <label className={styles.importOption}>
                <input
                  type="radio"
                  name="importNameStrategy"
                  value="use_imported"
                  checked={pendingImportNameStrategy === "use_imported"}
                  onChange={(e) => {
                    setPendingImportNameStrategy(e.target.value);
                    setPendingImportError("");
                  }}
                />
                <span>Usar nombre importado</span>
              </label>
              <p className={styles.importOptionText}>
                Adopta el nombre del archivo importado y ajusta sufijo si ya existe otro igual.
              </p>
              <label className={styles.importOption}>
                <input
                  type="radio"
                  name="importNameStrategy"
                  value="manual"
                  checked={pendingImportNameStrategy === "manual"}
                  onChange={(e) => {
                    setPendingImportNameStrategy(e.target.value);
                    setPendingImportError("");
                  }}
                />
                <span>Definir nombre manual</span>
              </label>
              <p className={styles.importOptionText}>
                Te permite decidir el nombre final antes de aplicar reemplazo o crear nuevo.
              </p>
              {pendingImportNameStrategy === "manual" ? (
                <input
                  type="text"
                  className={styles.input}
                  value={pendingImportManualName}
                  onChange={(e) => {
                    setPendingImportManualName(e.target.value);
                    if (pendingImportError) setPendingImportError("");
                  }}
                  placeholder="Nombre final del proyecto"
                />
              ) : null}
            </div>
            {pendingImportError ? <p className={styles.errorText}>{pendingImportError}</p> : null}

            <div className={styles.importPreview}>
              <p className={styles.hint}>
                Accion de reemplazo:{" "}
                <strong>{pendingImportRelatedProjectId ? "proyecto relacionado" : "proyecto actual"}</strong>
              </p>
              <p className={styles.hint}>
                Nombre final estimado:{" "}
                <strong>
                  {pendingImportNameStrategy === "manual" && !pendingImportManualName.trim()
                    ? "Pendiente de definir"
                    : getUniqueProjectName(
                        pendingImportNameStrategy === "keep_local"
                          ? (pendingImportRelatedProjectName || project.name || "Proyecto")
                          : pendingImportNameStrategy === "manual"
                            ? pendingImportManualName.trim()
                            : ((pendingImportRaw?.project ?? pendingImportRaw)?.name || "Proyecto Importado"),
                        projectsIndex,
                        pendingImportRelatedProjectId || project.id
                      )}
                </strong>
              </p>
            </div>

            <div className={styles.actions}>
              <button type="button" className={`${styles.btn} ${styles.secondary}`} onClick={closeImportMode}>
                Cancelar
              </button>
              <button type="button" className={`${styles.btn} ${styles.secondary}`} onClick={handleImportAsReplace}>
                {pendingImportRelatedProjectId ? "Reemplazar Relacionado" : "Reemplazar Actual"}
              </button>
              <button type="button" className={styles.btn} onClick={handleImportAsNew}>
                Crear Nuevo
              </button>
            </div>
          </div>
        </div>
      )}

      {isCreateProjectOpen && (
        <div className={styles.overlay} aria-label="Modal nuevo proyecto" onClick={closeCreateProjectModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Crear proyecto">
            <div className={styles.modalTop}>
              <strong className={styles.modalHeader}>Nuevo Proyecto</strong>
              <button
                className={`${styles.btn} ${styles.secondary}`}
                onClick={closeCreateProjectModal}
                type="button"
              >
                Cerrar
              </button>
            </div>

            <form onSubmit={submitCreateProject} className={styles.form}>
              <div className={styles.formRow}>
                <div className={`${styles.formGroup} ${styles.full}`}>
                  <label htmlFor="newProjectName" className={styles.label}>Nombre del proyecto</label>
                  <input
                    id="newProjectName"
                    className={styles.input}
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="Ej: App Inventario"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className={styles.actions}>
                <button type="button" className={`${styles.btn} ${styles.secondary}`} onClick={closeCreateProjectModal}>
                  Cancelar
                </button>
                <button type="submit" className={styles.btn}>
                  Crear Proyecto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isRenameProjectOpen && (
        <div className={styles.overlay} aria-label="Modal renombrar proyecto" onClick={closeRenameProjectModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Renombrar proyecto">
            <div className={styles.modalTop}>
              <strong className={styles.modalHeader}>Renombrar Proyecto</strong>
              <button
                className={`${styles.btn} ${styles.secondary}`}
                onClick={closeRenameProjectModal}
                type="button"
              >
                Cerrar
              </button>
            </div>

            <form onSubmit={submitRenameProject} className={styles.form}>
              <div className={styles.formRow}>
                <div className={`${styles.formGroup} ${styles.full}`}>
                  <label htmlFor="renameProjectName" className={styles.label}>Nuevo nombre</label>
                  <input
                    id="renameProjectName"
                    className={styles.input}
                    value={renameProjectName}
                    onChange={(e) => setRenameProjectName(e.target.value)}
                    placeholder="Ej: Proyecto Kanban"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className={styles.actions}>
                <button type="button" className={`${styles.btn} ${styles.secondary}`} onClick={closeRenameProjectModal}>
                  Cancelar
                </button>
                <button type="submit" className={styles.btn}>
                  Guardar Nombre
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDeleteProjectOpen && (
        <div className={styles.overlay} aria-label="Modal eliminar proyecto" onClick={closeDeleteProjectModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Eliminar proyecto">
            <div className={styles.modalTop}>
              <strong className={styles.modalHeader}>Eliminar Proyecto</strong>
              <button
                className={`${styles.btn} ${styles.secondary}`}
                onClick={closeDeleteProjectModal}
                type="button"
              >
                Cerrar
              </button>
            </div>

            <div className={styles.dangerBox} role="alert" aria-live="polite">
              <p className={styles.dangerTitle}>Advertencia importante</p>
              <p className={styles.hint}>
                Vas a eliminar el proyecto <strong>{project.name}</strong>.
              </p>
              <p className={styles.hint}>
                Implicaciones:
              </p>
              <ul className={styles.dangerList}>
                <li>Se perderan tareas, columnas, iteraciones y configuracion de este proyecto.</li>
                <li>La eliminacion es permanente y no se puede deshacer.</li>
                <li>Si necesitas respaldo, exporta el proyecto antes de eliminarlo.</li>
              </ul>
            </div>
            {isDeleteFinalStep ? (
              <div className={styles.finalWarningBox} role="alert" aria-live="assertive">
                <p className={styles.finalWarningTitle}>Confirmacion final requerida</p>
                <p className={styles.finalWarningText}>
                  Si continuas, este proyecto se eliminara definitivamente y no podras recuperarlo.
                </p>
                <p className={`${styles.finalWarningText} ${styles.finalWarningCountdown}`}>
                  Espera {deleteCountdown}s para habilitar la eliminacion.
                </p>
              </div>
            ) : null}
            {deleteProjectError ? <p className={styles.errorText}>{deleteProjectError}</p> : null}

            <div className={styles.actions}>
              <button type="button" className={`${styles.btn} ${styles.secondary}`} onClick={closeDeleteProjectModal}>
                Cancelar
              </button>
              {isDeleteFinalStep ? (
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnDanger}`}
                  onClick={executeDeleteProject}
                  disabled={deleteCountdown > 0}
                >
                  {deleteCountdown > 0
                    ? `Confirmar Eliminacion (${deleteCountdown}s)`
                    : "Confirmar Eliminacion"}
                </button>
              ) : (
                <button type="button" className={styles.btn} onClick={confirmDeleteProject}>
                  Eliminar Proyecto
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className={styles.overlay} aria-label="Modal de nueva tarea" onClick={() => { setShowFirstTaskOnboarding(false); setIsModalOpen(false); }}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Formulario">
            <div className={styles.modalTop}>
              <strong className={styles.modalHeader}>Nueva Tarea</strong>
              <button
                className={`${styles.btn} ${styles.secondary}`}
                onClick={() => { setShowFirstTaskOnboarding(false); setIsModalOpen(false); }}
                aria-label="Cerrar"
                type="button"
              >
                Cerrar
              </button>
            </div>

            {showFirstTaskOnboarding ? (
              <p className={`${styles.hint} ${styles.onboardingHint}`}>
                Paso 2/2: crea tu primera tarea para iniciar el flujo del tablero.
              </p>
            ) : null}

            <form onSubmit={handleAddTask} className={styles.form}>
              <div className={styles.formRow}>
                <div className={`${styles.formGroup} ${styles.full}`}>
                  <label htmlFor="title" className={styles.label}>Titulo</label>
                  <input
                    id="title"
                    className={styles.input}
                    value={newTask.title}
                    onChange={(e) => setNewTask((p) => ({ ...p, title: e.target.value }))}
                    placeholder="Ej: Refactorizar carrito"
                    required
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="priority" className={styles.label}>Prioridad</label>
                  {renderCustomSelect({
                    selectKey: "task-priority",
                    value: newTask.priority,
                    onChange: (nextPriority) => setNewTask((p) => ({ ...p, priority: nextPriority })),
                    options: [
                      { value: "Critica", label: "Critica" },
                      { value: "Alta", label: "Alta" },
                      { value: "Media", label: "Media" },
                      { value: "Baja", label: "Baja" },
                    ],
                    placeholder: "Prioridad",
                    ariaLabel: "Seleccionar prioridad",
                  })}
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Iteracion</label>
                  <input className={styles.input} value={currentIteration?.label ?? ""} readOnly aria-label="Iteracion" />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="startDate" className={styles.label}>Fecha inicio</label>
                  <input
                    id="startDate"
                    type="date"
                    className={styles.input}
                    value={newTask.startDateISO}
                    onChange={(e) => setNewTask((p) => ({ ...p, startDateISO: e.target.value }))}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="dueDate" className={styles.label}>Fecha limite</label>
                  <input
                    id="dueDate"
                    type="date"
                    className={styles.input}
                    value={newTask.dueDateISO}
                    onChange={(e) => setNewTask((p) => ({ ...p, dueDateISO: e.target.value }))}
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={`${styles.formGroup} ${styles.full}`}>
                  <label htmlFor="assignee" className={styles.label}>Responsable</label>
                  <input
                    id="assignee"
                    className={styles.input}
                    placeholder="Nombre del responsable"
                    value={newTask.assignee}
                    onChange={(e) => setNewTask((p) => ({ ...p, assignee: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Etiquetas</label>
                <div className={styles.tagButtons}>
                  {project.tagsCatalog.map((tagItem) => {
                    const tag = tagItem.name;
                    const active = newTask.tags.includes(tag);
                    return (
                      <button
                        type="button"
                        key={tagItem.id}
                        onClick={() => toggleTag(tag)}
                        className={`${styles.tagBtn} ${active ? styles.tagBtnActive : ""}`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className={styles.actions}>
                <button type="button" className={`${styles.btn} ${styles.secondary}`} onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className={styles.btn} aria-label="Crear tarea">
                  Crear Tarea
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
