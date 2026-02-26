import styles from "./Kanban.module.css";
import { ChevronDown } from "lucide-react";
import KanbanTaskModal from "./components/KanbanTaskModal";
import KanbanMainScreen from "./components/KanbanMainScreen";
import { useThemeMode } from "./hooks/useThemeMode";
import KanbanImportModal from "./components/KanbanImportModal";
import { useSelectMenu } from "./hooks/useSelectMenu";
import KanbanProjectModals from "./components/KanbanProjectModals";
import KanbanSettingsModal from "./components/KanbanSettingsModal";
import { createDefaultProject } from "./defaultProject";
import { useKanbanTaskActions } from "./hooks/useKanbanTaskActions";
import { useKanbanImportActions } from "./hooks/useKanbanImportActions";
import { useKanbanProjectCrudActions } from "./hooks/useKanbanProjectCrudActions";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  loadProject,
  saveProject,
  addProjectToIndex,
  getActiveProjectId,
  loadProjectsIndex,
  setActiveProjectId,
} from "./projectStorage";
import {
  makeId,
  tagSlug,
  KANBAN_APP_ID,
  THEME_OPTIONS,
  ddmmyyyyToISO,
  isoToDDMMYYYY,
  normalizeName,
  normalizeProject,
  parseIterationRange,
  getUniqueProjectName,
  KANBAN_SCHEMA_VERSION,
} from "./kanbanLogic";

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

export default function Kanban() {
  const [screen, setScreen] = useState("home");
  const { darkMode, setDarkMode, theme, setTheme } = useThemeMode(THEME_OPTIONS);
  const [draggedId, setDraggedId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draftConfig, setDraftConfig] = useState(null);
  const [initialState] = useState(() => loadOrCreateInitialProject());
  const [projectsIndex, setProjectsIndex] = useState(initialState.index);
  const [homeProjectId, setHomeProjectId] = useState(initialState.project.id);
  const [settingsError, setSettingsError] = useState("");
  const { openSelectKey, setOpenSelectKey, selectRefs } = useSelectMenu();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeProjectId, setActiveProjectIdState] = useState(initialState.project.id);
  const [deleteCountdown, setDeleteCountdown] = useState(10);
  const [isImportModeOpen, setIsImportModeOpen] = useState(false);
  const [isProjectMenuOpen, setIsProjectMenuOpen] = useState(false);
  const [isDeleteFinalStep, setIsDeleteFinalStep] = useState(false);
  const [deleteProjectError, setDeleteProjectError] = useState("");
  const [plannedColumnMoves, setPlannedColumnMoves] = useState({});
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [isRenameProjectOpen, setIsRenameProjectOpen] = useState(false);
  const [isDeleteProjectOpen, setIsDeleteProjectOpen] = useState(false);
  const [plannedIterationMoves, setPlannedIterationMoves] = useState({});
  const [project, setProject] = useState(initialState.project);
  const [isDeleteSuccessOpen, setIsDeleteSuccessOpen] = useState(false);
  const [deletedProjectName, setDeletedProjectName] = useState("");
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [selectedIteration, setSelectedIteration] = useState(
    project.iterations[0]?.id ?? ""
  );
  
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "Media",
    tags: [],
    assignee: "",
    startDateISO: "",
    dueDateISO: "",
    checklistItems: [],
  });
  const importInputRef = useRef(null);
  const [newProjectName, setNewProjectName] = useState("");
  const [pendingImportRaw, setPendingImportRaw] = useState(null);
  const [pendingImportName, setPendingImportName] = useState("");
  const [renameProjectName, setRenameProjectName] = useState("");
  const [pendingImportError, setPendingImportError] = useState("");
  const [showSetupOnboarding, setShowSetupOnboarding] = useState(false);
  const [taskFormError, setTaskFormError] = useState("");
  const [pendingImportManualName, setPendingImportManualName] = useState("");
  const [showFirstTaskOnboarding, setShowFirstTaskOnboarding] = useState(false);
  const [pendingImportNameStrategy, setPendingImportNameStrategy] = useState("use_imported");
  const [pendingImportRelationType, setPendingImportRelationType] = useState(null);
  const [pendingImportRelatedProjectId, setPendingImportRelatedProjectId] = useState(null);
  const [pendingImportRelatedProjectName, setPendingImportRelatedProjectName] = useState("");

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
    const tagsCatalog = Array.isArray(project?.tagsCatalog) ? project.tagsCatalog : [];
    const allowedTags = new Set(tagsCatalog.map((tag) => normalizeName(tag.name)));
    setNewTask((prev) => {
      const filtered = prev.tags.filter((tag) => allowedTags.has(normalizeName(tag)));
      if (filtered.length === prev.tags.length) return prev;
      return { ...prev, tags: filtered };
    });
  }, [project?.tagsCatalog]);

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
      projectName: project.name,
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

    const projectNameInput = String(draftConfig.projectName || "").trim();
    if (!projectNameInput) {
      setSettingsError("El nombre del proyecto es obligatorio.");
      return;
    }
    const projectName = getUniqueProjectName(projectNameInput, projectsIndex, project.id);
    const title = `Tablero Kanban | ${projectName}`;

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
      name: projectName,
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
        description: "",
        priority: "Media",
        tags: [],
        assignee: "",
        startDateISO: ddmmyyyyToISO(start),
        dueDateISO: ddmmyyyyToISO(end),
        checklistItems: [],
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
  const { openModal, openEditTask, handleAddTask, toggleTag, onDragStart, onDragOver, onDropToColumn, getPriorityClass } =
    useKanbanTaskActions({
      styles,
      project,
      newTask,
      editingTaskId,
      draggedId,
      setNewTask,
      setEditingTaskId,
      setTaskFormError,
      setDraggedId,
      updateProject,
      setIsModalOpen,
      selectedIteration,
      getIterationDates,
      setShowFirstTaskOnboarding,
    });

  const currentIteration = project.iterations.find((i) => i.id === selectedIteration);
  const {
    enterBoard,
    handleProjectChange,
    submitCreateProject,
    submitRenameProject,
    confirmDeleteProject,
    executeDeleteProject,
    openCreateProjectModal,
    openRenameProjectModal,
    handleDuplicateProject,
    openDeleteProjectModal,
    closeCreateProjectModal,
    closeRenameProjectModal,
    closeDeleteProjectModal,
  } = useKanbanProjectCrudActions({
    project,
    setScreen,
    setProject,
    projectsIndex,
    updateProject,
    homeProjectId,
    newProjectName,
    setProjectsIndex,
    setOpenSelectKey,
    setNewProjectName,
    renameProjectName,
    setDeleteCountdown,
    setSelectedIteration,
    setIsProjectMenuOpen,
    setRenameProjectName,
    setIsDeleteFinalStep,
    setDeleteProjectError,
    setIsCreateProjectOpen,
    setIsRenameProjectOpen,
    setActiveProjectIdState,
    setIsDeleteProjectOpen,
    onProjectDeleted: (name) => {
      setDeletedProjectName(name || "");
      setIsDeleteSuccessOpen(true);
      setScreen("home");
    },
  });
  const {
    closeImportMode,
    handleImportClick,
    handleImportAsNew,
    handleImportProject,
    handleImportAsReplace,
  } = useKanbanImportActions({
    project,
    setScreen,
    setProject,
    projectsIndex,
    importInputRef,
    setProjectsIndex,
    pendingImportRaw,
    setPendingImportRaw,
    setIsImportModeOpen,
    setIsProjectMenuOpen,
    setPendingImportName,
    setSelectedIteration,
    setPendingImportError,
    setActiveProjectIdState,
    pendingImportManualName,
    pendingImportNameStrategy,
    setPendingImportManualName,
    setPendingImportRelationType,
    setPendingImportNameStrategy,
    pendingImportRelatedProjectId,
    setPendingImportRelatedProjectId,
    setPendingImportRelatedProjectName,
  });

  const handleExportProject = () => {
    const exportPayload = {
      app: KANBAN_APP_ID,
      schemaVersion: KANBAN_SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      project,
    };
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
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

  const renderCustomSelect = ({
    selectKey,
    value,
    onChange,
    options,
    placeholder,
    ariaLabel,
    compact = false,
    swatchOnly = false,
  }) => {
    const selected = options.find((opt) => String(opt.value) === String(value));
    const isOpen = openSelectKey === selectKey;

    return (
      <div
        className={`${styles.customSelect} ${compact ? styles.customSelectCompact : ""} ${swatchOnly ? styles.customSelectSwatchOnly : ""}`}
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
          <span className={styles.selectValueWrap}>
            {selected?.swatch ? (
              <span
                className={styles.themeSwatch}
                style={{ backgroundColor: selected.swatch }}
                aria-hidden="true"
              />
            ) : null}
            {!swatchOnly ? <span>{selected?.label || placeholder}</span> : null}
          </span>
          {!swatchOnly ? <ChevronDown size={14} aria-hidden="true" /> : null}
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
                <span className={styles.selectValueWrap}>
                  {opt.swatch ? (
                    <span
                      className={styles.themeSwatch}
                      style={{ backgroundColor: opt.swatch }}
                      aria-hidden="true"
                    />
                  ) : null}
                  {!swatchOnly ? <span>{opt.label}</span> : null}
                </span>
              </button>
            ))}
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <div
      className={`app ${darkMode ? "dark" : ""}`}
      data-theme={theme}
      aria-label="Kanban con proyectos locales"
    >
      <input
        ref={importInputRef}
        type="file"
        accept="application/json,.json"
        onChange={handleImportProject}
        style={{ display: "none" }}
      />

      <KanbanMainScreen
        theme={theme}
        screen={screen}
        styles={styles}
        project={project}
        tagSlug={tagSlug}
        setTheme={setTheme}
        darkMode={darkMode}
        setScreen={setScreen}
        openModal={openModal}
        enterBoard={enterBoard}
        onDragOver={onDragOver}
        setDarkMode={setDarkMode}
        columnTasks={columnTasks}
        onDragStart={onDragStart}
        openSettings={openSettings}
        themeOptions={THEME_OPTIONS}
        projectsIndex={projectsIndex}
        homeProjectId={homeProjectId}
        isVirginBoard={isVirginBoard}
        onDropToColumn={onDropToColumn}
        activeProjectId={activeProjectId}
        setHomeProjectId={setHomeProjectId}
        currentIteration={currentIteration}
        getPriorityClass={getPriorityClass}
        isProjectMenuOpen={isProjectMenuOpen}
        handleImportClick={handleImportClick}
        selectedIteration={selectedIteration}
        renderCustomSelect={renderCustomSelect}
        handleExportProject={handleExportProject}
        handleProjectChange={handleProjectChange}
        setIsProjectMenuOpen={setIsProjectMenuOpen}
        setSelectedIteration={setSelectedIteration}
        openEditTask={openEditTask}
        openRenameProjectModal={openRenameProjectModal}
        openCreateProjectModal={openCreateProjectModal}
        handleDuplicateProject={handleDuplicateProject}
        openDeleteProjectModal={openDeleteProjectModal}
      />

      <KanbanSettingsModal
        styles={styles}
        project={project}
        isOpen={isSettingsOpen}
        draftConfig={draftConfig}
        addDraftTag={addDraftTag}
        closeSettings={closeSettings}
        settingsError={settingsError}
        applySettings={applySettings}
        setDraftConfig={setDraftConfig}
        updateDraftTag={updateDraftTag}
        removeDraftTag={removeDraftTag}
        addDraftColumn={addDraftColumn}
        updateDraftColumn={updateDraftColumn}
        removeDraftColumn={removeDraftColumn}
        addDraftIteration={addDraftIteration}
        plannedColumnMoves={plannedColumnMoves}
        renderCustomSelect={renderCustomSelect}
        showSetupOnboarding={showSetupOnboarding}
        updateDraftIteration={updateDraftIteration}
        removeDraftIteration={removeDraftIteration}
        setPlannedColumnMoves={setPlannedColumnMoves}
        plannedIterationMoves={plannedIterationMoves}
        setPlannedIterationMoves={setPlannedIterationMoves}
        removeDraftColumnWithMove={removeDraftColumnWithMove}
        removeDraftIterationWithMove={removeDraftIterationWithMove}
      />

      <KanbanImportModal
        styles={styles}
        project={project}
        isOpen={isImportModeOpen}
        projectsIndex={projectsIndex}
        closeImportMode={closeImportMode}
        pendingImportRaw={pendingImportRaw}
        pendingImportName={pendingImportName}
        handleImportAsNew={handleImportAsNew}
        pendingImportError={pendingImportError}
        getUniqueProjectName={getUniqueProjectName}
        setPendingImportError={setPendingImportError}
        handleImportAsReplace={handleImportAsReplace}
        pendingImportManualName={pendingImportManualName}
        pendingImportRelationType={pendingImportRelationType}
        pendingImportNameStrategy={pendingImportNameStrategy}
        setPendingImportManualName={setPendingImportManualName}
        setPendingImportNameStrategy={setPendingImportNameStrategy}
        pendingImportRelatedProjectId={pendingImportRelatedProjectId}
        pendingImportRelatedProjectName={pendingImportRelatedProjectName}
      />

      <KanbanProjectModals
        styles={styles}
        project={project}
        deletedProjectName={deletedProjectName}
        newProjectName={newProjectName}
        deleteCountdown={deleteCountdown}
        isDeleteSuccessOpen={isDeleteSuccessOpen}
        setNewProjectName={setNewProjectName}
        renameProjectName={renameProjectName}
        isDeleteFinalStep={isDeleteFinalStep}
        deleteProjectError={deleteProjectError}
        isCreateProjectOpen={isCreateProjectOpen}
        submitCreateProject={submitCreateProject}
        isRenameProjectOpen={isRenameProjectOpen}
        submitRenameProject={submitRenameProject}
        isDeleteProjectOpen={isDeleteProjectOpen}
        setRenameProjectName={setRenameProjectName}
        executeDeleteProject={executeDeleteProject}
        confirmDeleteProject={confirmDeleteProject}
        closeCreateProjectModal={closeCreateProjectModal}
        closeRenameProjectModal={closeRenameProjectModal}
        closeDeleteProjectModal={closeDeleteProjectModal}
        closeDeleteSuccessModal={() => {
          setIsDeleteSuccessOpen(false);
          setDeletedProjectName("");
          setScreen("home");
        }}
      />

      <KanbanTaskModal
        styles={styles}
        newTask={newTask}
        project={project}
        isOpen={isModalOpen}
        toggleTag={toggleTag}
        setNewTask={setNewTask}
        taskFormError={taskFormError}
        editingTaskId={editingTaskId}
        setEditingTaskId={setEditingTaskId}
        setTaskFormError={setTaskFormError}
        handleAddTask={handleAddTask}
        setIsModalOpen={setIsModalOpen}
        currentIteration={currentIteration}
        renderCustomSelect={renderCustomSelect}
        showFirstTaskOnboarding={showFirstTaskOnboarding}
        setShowFirstTaskOnboarding={setShowFirstTaskOnboarding}
      />
    </div>
  );
}




