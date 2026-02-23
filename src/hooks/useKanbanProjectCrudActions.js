import { createDefaultProject } from "../defaultProject";
import {
  addProjectToIndex,
  loadProject,
  loadProjectsIndex,
  removeProject,
  removeProjectFromIndex,
  saveProject,
  setActiveProjectId,
} from "../projectStorage";
import { getUniqueProjectName, makeId, normalizeProject } from "../kanbanLogic";

export function useKanbanProjectCrudActions({
  project,
  projectsIndex,
  updateProject,
  setProjectsIndex,
  setActiveProjectIdState,
  setSelectedIteration,
  setProject,
  setScreen,
  setOpenSelectKey,
  setIsProjectMenuOpen,
  newProjectName,
  setNewProjectName,
  setIsCreateProjectOpen,
  renameProjectName,
  setRenameProjectName,
  setIsRenameProjectOpen,
  setDeleteProjectError,
  setIsDeleteFinalStep,
  setDeleteCountdown,
  setIsDeleteProjectOpen,
  homeProjectId,
  onProjectDeleted,
}) {
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
    if (!fallbackId) return false;

    const fallbackProject = normalizeProject(loadProject(fallbackId));
    if (!fallbackProject) return false;

    setProjectsIndex(nextIndex);
    setActiveProjectId(fallbackId);
    setActiveProjectIdState(fallbackId);
    setSelectedIteration(fallbackProject.iterations[0]?.id ?? "");
    setProject(fallbackProject);
    return true;
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
    const deletedProjectName = project.name;
    const deleted = handleDeleteProject();
    if (!deleted) {
      setDeleteProjectError("No se pudo completar la eliminacion del proyecto.");
      return;
    }
    closeDeleteProjectModal();
    if (typeof onProjectDeleted === "function") {
      onProjectDeleted(deletedProjectName);
    }
  };

  const enterBoard = () => {
    if (!homeProjectId) return;
    handleProjectChange(homeProjectId);
    setScreen("board");
  };

  return {
    openCreateProjectModal,
    closeCreateProjectModal,
    submitCreateProject,
    handleProjectChange,
    openRenameProjectModal,
    closeRenameProjectModal,
    submitRenameProject,
    handleDuplicateProject,
    openDeleteProjectModal,
    closeDeleteProjectModal,
    confirmDeleteProject,
    executeDeleteProject,
    enterBoard,
  };
}
