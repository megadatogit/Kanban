const PROJECTS_INDEX_KEY = "kanban:projects:index";
const ACTIVE_PROJECT_KEY = "kanban:projects:active";
const PROJECT_KEY_PREFIX = "kanban:project:";

function safeReadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function saveJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getProjectKey(projectId) {
  return `${PROJECT_KEY_PREFIX}${projectId}`;
}

export function loadProjectsIndex() {
  return safeReadJson(PROJECTS_INDEX_KEY, []);
}

export function saveProjectsIndex(index) {
  saveJson(PROJECTS_INDEX_KEY, index);
}

export function loadProject(projectId) {
  return safeReadJson(getProjectKey(projectId), null);
}

export function saveProject(project) {
  saveJson(getProjectKey(project.id), project);
}

export function removeProject(projectId) {
  localStorage.removeItem(getProjectKey(projectId));
}

export function getActiveProjectId() {
  return localStorage.getItem(ACTIVE_PROJECT_KEY);
}

export function setActiveProjectId(projectId) {
  localStorage.setItem(ACTIVE_PROJECT_KEY, projectId);
}

export function addProjectToIndex(project) {
  const current = loadProjectsIndex();
  const next = current.filter((p) => p.id !== project.id);
  next.push({
    id: project.id,
    name: project.name,
    updatedAt: project.updatedAt,
  });
  saveProjectsIndex(next);
}

export function removeProjectFromIndex(projectId) {
  const current = loadProjectsIndex();
  const next = current.filter((p) => p.id !== projectId);
  saveProjectsIndex(next);
  return next;
}
