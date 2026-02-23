import {
  addProjectToIndex,
  loadProject,
  loadProjectsIndex,
  saveProject,
  setActiveProjectId,
} from "../projectStorage";
import {
  getUniqueProjectName,
  normalizeName,
  normalizeProject,
  sanitizeImportedProject,
  sanitizeImportedProjectForReplace,
  validateImportedProjectPayload,
} from "../kanbanLogic";

export function useKanbanImportActions({
  importInputRef,
  project,
  projectsIndex,
  setIsProjectMenuOpen,
  setPendingImportRaw,
  setPendingImportName,
  setPendingImportRelatedProjectId,
  setPendingImportRelatedProjectName,
  setPendingImportRelationType,
  setPendingImportNameStrategy,
  setPendingImportManualName,
  setPendingImportError,
  setIsImportModeOpen,
  setProjectsIndex,
  setActiveProjectIdState,
  setSelectedIteration,
  setProject,
  setScreen,
  pendingImportRaw,
  pendingImportRelatedProjectId,
  pendingImportNameStrategy,
  pendingImportManualName,
}) {
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
      const validation = validateImportedProjectPayload(parsed);
      if (!validation.ok) {
        window.alert(`Archivo invalido: ${validation.error}`);
        return;
      }

      const rawCandidate = validation.candidate;
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
      window.alert("No se pudo importar el archivo. Revisa que sea un JSON valido.");
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

  return {
    handleImportClick,
    handleImportProject,
    closeImportMode,
    handleImportAsNew,
    handleImportAsReplace,
  };
}
