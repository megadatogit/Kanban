import React, { useEffect, useRef, useState } from "react";
import { Clock3, DoorOpen, Menu as MenuIcon, Moon, SquarePen, Sun, X } from "lucide-react";

const SCREEN_TRANSITION_MS = 220;

export default function KanbanMainScreen({
  screen,
  styles,
  renderCustomSelect,
  theme,
  setTheme,
  darkMode,
  setDarkMode,
  themeOptions,
  projectsIndex,
  homeProjectId,
  setHomeProjectId,
  handleImportClick,
  openCreateProjectModal,
  enterBoard,
  setIsProjectMenuOpen,
  setScreen,
  project,
  currentIteration,
  activeProjectId,
  handleProjectChange,
  isProjectMenuOpen,
  openRenameProjectModal,
  handleDuplicateProject,
  openDeleteProjectModal,
  handleExportProject,
  openSettings,
  selectedIteration,
  setSelectedIteration,
  openModal,
  openEditTask,
  columnTasks,
  onDragOver,
  onDropToColumn,
  isVirginBoard,
  getPriorityClass,
  onDragStart,
  tagSlug,
}) {
  const [renderNow, setRenderNow] = useState(() => Date.now());
  const [displayedScreen, setDisplayedScreen] = useState(screen);
  const [transitionStage, setTransitionStage] = useState("idle");
  const [transitionDirection, setTransitionDirection] = useState("forward");
  const exitTimeoutRef = useRef(null);
  const enterTimeoutRef = useRef(null);

  useEffect(() => {
    const timerId = setInterval(() => {
      setRenderNow(Date.now());
    }, 60000);

    return () => clearInterval(timerId);
  }, []);

  useEffect(() => {
    return () => {
      if (exitTimeoutRef.current) {
        clearTimeout(exitTimeoutRef.current);
      }
      if (enterTimeoutRef.current) {
        clearTimeout(enterTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (screen === displayedScreen) return;

    setTransitionDirection(screen === "home" ? "backward" : "forward");
    setTransitionStage("exit");

    if (exitTimeoutRef.current) {
      clearTimeout(exitTimeoutRef.current);
    }
    if (enterTimeoutRef.current) {
      clearTimeout(enterTimeoutRef.current);
    }

    exitTimeoutRef.current = setTimeout(() => {
      setDisplayedScreen(screen);
      setTransitionStage("enter");

      enterTimeoutRef.current = setTimeout(() => {
        setTransitionStage("idle");
        enterTimeoutRef.current = null;
      }, SCREEN_TRANSITION_MS);

      exitTimeoutRef.current = null;
    }, SCREEN_TRANSITION_MS);
  }, [screen, displayedScreen]);

  const parseDDMMYYYY = (value) => {
    const [dd = "", mm = "", yyyy = ""] = String(value || "").split("/");
    const day = Number(dd);
    const month = Number(mm);
    const year = Number(yyyy);
    if (!day || !month || !year) return null;
    const date = new Date(year, month - 1, day);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const getTaskTimeProgress = (task) => {
    const start = parseDDMMYYYY(task.startDate);
    const due = parseDDMMYYYY(task.dueDate);
    if (!start || !due) return 0;
    const startMs = start.getTime();
    const dueMs = due.getTime();
    if (dueMs <= startMs) return 100;
    const now = renderNow;
    if (now <= startMs) return 0;
    if (now >= dueMs) return 100;
    return Math.max(0, Math.min(100, ((now - startMs) / (dueMs - startMs)) * 100));
  };

  const getTaskDueState = (task) => {
    const due = parseDDMMYYYY(task.dueDate);
    if (!due) return "ok";
    const now = new Date(renderNow);
    const dueEnd = new Date(due.getFullYear(), due.getMonth(), due.getDate(), 23, 59, 59, 999);
    if (now.getTime() > dueEnd.getTime()) return "overdue";
    const msRemaining = dueEnd.getTime() - now.getTime();
    const hoursRemaining = msRemaining / (1000 * 60 * 60);
    if (hoursRemaining <= 24) return "dueSoon";
    return "ok";
  };

  const getTaskShortId = (taskId) => {
    const raw = String(taskId || "");
    const withoutPrefix = raw.includes("_") ? raw.slice(raw.indexOf("_") + 1) : raw;
    const segments = withoutPrefix.split("-").filter(Boolean);
    return segments.length > 0 ? segments[segments.length - 1] : withoutPrefix;
  };

  const screenTransitionClass = [
    styles.screenTransition,
    transitionStage !== "idle" ? styles[`screenTransition_${transitionStage}`] : "",
    styles[`screenTransition_${transitionDirection}`],
  ]
    .filter(Boolean)
    .join(" ");

  if (displayedScreen === "home") {
    return (
      <div className={screenTransitionClass}>
        <section className={styles.homeScreen} aria-label="Pantalla de bienvenida">
        <div className={styles.homeThemeControls}>
          <span className={styles.homeThemeLabel}>Tema</span>
          {renderCustomSelect({
            selectKey: "home-theme",
            value: theme,
            onChange: (nextTheme) => setTheme(nextTheme),
            options: themeOptions,
            placeholder: "Tema",
            ariaLabel: "Seleccionar tema visual",
            compact: true,
          })}
          <button
            className={`${styles.iconBtn} ${styles.themeBtn}`}
            onClick={() => setDarkMode((d) => !d)}
            aria-label="Alternar modo oscuro"
            title={darkMode ? "Modo claro" : "Modo oscuro"}
          >
            {darkMode ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
          </button>
        </div>
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
      </div>
    );
  }

  return (
    <div className={screenTransitionClass}>
      <div className={styles.boardHeader} aria-label="Encabezado Tablero">
        <div className={styles.desktopHeader}>
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
                  <button
                    type="button"
                    className={styles.menuItem}
                    onClick={() => {
                      setIsProjectMenuOpen(false);
                      handleDuplicateProject();
                    }}
                  >
                    Duplicar
                  </button>
                  <button type="button" className={styles.menuItem} onClick={openDeleteProjectModal}>
                    Eliminar
                  </button>
                  <button
                    type="button"
                    className={styles.menuItem}
                    onClick={() => {
                      setIsProjectMenuOpen(false);
                      handleExportProject();
                    }}
                  >
                    Exportar
                  </button>
                  <button type="button" className={styles.menuItem} onClick={handleImportClick}>
                    Importar
                  </button>
                  <button
                    type="button"
                    className={styles.menuItem}
                    onClick={() => {
                      setIsProjectMenuOpen(false);
                      openSettings();
                    }}
                  >
                    Configurar
                  </button>
                </div>
              ) : null}
            </div>
            <div className={styles.titleBlock}>
              <div className={styles.title}>{project.title}</div>
              <div className={styles.iterationHeaderRow}>
                <div className={styles.description}>
                  {`[Iteracion actual: ${currentIteration?.label ?? "-"}]`}
                </div>
                <button className={`${styles.btn} ${styles.newTaskBtn}`} onClick={openModal} aria-label="Anadir nueva tarea">
                  Nueva Tarea
                </button>
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

            {renderCustomSelect({
              selectKey: "header-iteration",
              value: selectedIteration,
              onChange: (nextIteration) => setSelectedIteration(nextIteration),
              options: project.iterations.map((it) => ({ value: it.id, label: it.label })),
              placeholder: "Iteracion",
              ariaLabel: "Seleccionar Iteracion",
            })}

            {renderCustomSelect({
              selectKey: "header-theme",
              value: theme,
              onChange: (nextTheme) => setTheme(nextTheme),
              options: themeOptions,
              placeholder: "Tema",
              ariaLabel: "Seleccionar tema visual",
              compact: true,
              swatchOnly: true,
            })}

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

        <div className={styles.mobileHeader}>
          <div className={styles.mobileTopRow}>
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

            <div className={styles.mobileTopActions}>
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

          <div className={styles.mobileTitleRow}>
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
            <div className={styles.mobileTitle}>{project.title}</div>
          </div>
          <div className={styles.mobileIterationRow}>
            <div className={styles.mobileIterationText}>
              {`Iteracion actual: ${currentIteration?.label ?? "-"}`}
            </div>
            <button className={`${styles.btn} ${styles.newTaskBtn}`} onClick={openModal} aria-label="Anadir nueva tarea">
              Nueva Tarea
            </button>
          </div>
        </div>
      </div>

      {isProjectMenuOpen ? (
        <div className={styles.mobileDrawerOverlay} onClick={() => setIsProjectMenuOpen(false)} aria-label="Menu lateral">
          <aside
            className={styles.mobileDrawer}
            role="dialog"
            aria-label="Acciones de proyecto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.mobileDrawerHeader}>
              <strong className={styles.modalHeader}>Menu</strong>
              <button
                type="button"
                className={styles.iconBtn}
                onClick={() => setIsProjectMenuOpen(false)}
                aria-label="Cerrar menu"
                title="Cerrar menu"
              >
                <X size={18} strokeWidth={2.1} />
              </button>
            </div>

            <div className={styles.mobileDrawerBody}>
              <div className={styles.mobileDrawerSection}>
                <p className={styles.mobileDrawerLabel}>Proyecto</p>
                {renderCustomSelect({
                  selectKey: "drawer-project",
                  value: activeProjectId,
                  onChange: (nextId) => {
                    handleProjectChange(nextId);
                    setIsProjectMenuOpen(false);
                  },
                  options: projectsIndex.map((p) => ({ value: p.id, label: p.name })),
                  placeholder: "Proyecto",
                  ariaLabel: "Seleccionar proyecto",
                })}
              </div>

              <div className={styles.mobileDrawerSection}>
                <p className={styles.mobileDrawerLabel}>Iteracion</p>
                {renderCustomSelect({
                  selectKey: "drawer-iteration",
                  value: selectedIteration,
                  onChange: (nextIteration) => {
                    setSelectedIteration(nextIteration);
                    setIsProjectMenuOpen(false);
                  },
                  options: project.iterations.map((it) => ({ value: it.id, label: it.label })),
                  placeholder: "Iteracion",
                  ariaLabel: "Seleccionar Iteracion",
                })}
              </div>

              <div className={styles.mobileDrawerActions}>
                <button type="button" className={styles.menuItem} onClick={openCreateProjectModal}>
                  Nuevo Proyecto
                </button>
                <button type="button" className={styles.menuItem} onClick={openRenameProjectModal}>
                  Renombrar
                </button>
                <button
                  type="button"
                  className={styles.menuItem}
                  onClick={() => {
                    setIsProjectMenuOpen(false);
                    handleDuplicateProject();
                  }}
                >
                  Duplicar
                </button>
                <button type="button" className={styles.menuItem} onClick={openDeleteProjectModal}>
                  Eliminar
                </button>
                <button
                  type="button"
                  className={styles.menuItem}
                  onClick={() => {
                    setIsProjectMenuOpen(false);
                    handleExportProject();
                  }}
                >
                  Exportar
                </button>
                <button type="button" className={styles.menuItem} onClick={handleImportClick}>
                  Importar
                </button>
                <button
                  type="button"
                  className={styles.menuItem}
                  onClick={() => {
                    setIsProjectMenuOpen(false);
                    openSettings();
                  }}
                >
                  Configurar
                </button>
                <div className={styles.mobileDrawerThemeRow}>
                  <span className={styles.mobileDrawerLabel}>Tema</span>
                  <div className={styles.mobileThemeSwatches} role="radiogroup" aria-label="Seleccionar tema visual">
                    {themeOptions.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        className={`${styles.mobileThemeSwatchBtn} ${theme === opt.value ? styles.mobileThemeSwatchBtnActive : ""}`}
                        onClick={() => setTheme(opt.value)}
                        aria-label={`Tema ${opt.label}`}
                        aria-pressed={theme === opt.value}
                        title={opt.label}
                      >
                        <span
                          className={styles.mobileThemeSwatchDot}
                          style={{ backgroundColor: opt.swatch }}
                          aria-hidden="true"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      ) : null}

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

                  {items.map((t) => {
                    const checklistItems = Array.isArray(t.checklist) ? t.checklist : [];
                    const visibleChecklist = checklistItems.slice(0, 5);
                    const overflowChecklist = checklistItems.length - visibleChecklist.length;
                    const checklistCount = checklistItems.length;
                    const timeProgress = getTaskTimeProgress(t);
                    const dueState = getTaskDueState(t);
                    const hasChecklist = checklistItems.length > 0;
                    const showTitleTooltip = String(t.title || "").trim().length > 52;

                    return (
                      <article
                        key={t.id}
                        className={`${styles.card} ${getPriorityClass(t.priority)}`}
                        draggable
                        onDragStart={() => onDragStart(t.id)}
                        role="article"
                        aria-label={`Tarea ${t.title}`}
                      >
                        <div className={styles.cardMain}>
                        <div className={styles.cardHeader}>
                          <div className={styles.cardTitleBlock}>
                          <div className={styles.cardTitleRow}>
                              <button
                                type="button"
                                className={`${styles.iconBtn} ${styles.cardEditBtn}`}
                                onClick={() => openEditTask(t)}
                                aria-label={`Editar tarea ${t.title}`}
                                title="Editar tarea"
                              >
                                <SquarePen size={14} strokeWidth={2.2} className={styles.cardEditIcon} aria-hidden="true" />
                              </button>
                              <div className={styles.cardTitleWithTooltip}>
                                <div className={styles.cardTitle} tabIndex={showTitleTooltip ? 0 : -1}>
                                  {t.title}
                                </div>
                                {showTitleTooltip ? (
                                  <span className={styles.cardTitleTooltip} role="tooltip">
                                    {t.title}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                            <p
                              className={`${styles.cardDateRange} ${dueState !== "ok" ? styles.cardDateRangeAlert : ""} ${dueState === "overdue" ? styles.cardDateRangeOverdue : ""} ${dueState === "dueSoon" ? styles.cardDateRangeDueSoon : ""}`}
                            >
                              {dueState !== "ok" ? (
                                <span className={styles.cardDateAlertIcon} aria-label="Alerta de vencimiento">
                                  <Clock3 size={11} aria-hidden="true" />
                                  <span className={styles.cardDateAlertBang} aria-hidden="true">!</span>
                                </span>
                              ) : null}
                              {t.startDate} - {t.dueDate}
                            </p>
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
                          <div className={styles.metaStack}>
                            <span className={styles.metaText}>Responsable: {t.assignee || "-"}</span>
                            <span className={styles.metaText}>Iteracion: {currentIteration?.label || "-"}</span>
                            <span className={styles.metaStrong}>ID: {getTaskShortId(t.id)}</span>
                          </div>
                        </div>
                      </div>

                      <aside
                        className={styles.cardAside}
                        aria-label="Resumen de progreso y actividades"
                        role="button"
                        tabIndex={0}
                        onClick={() => openEditTask(t)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            openEditTask(t);
                          }
                        }}
                        title="Editar tarea"
                      >
                        <div className={styles.timeRail} aria-label={`Progreso de tiempo ${Math.round(timeProgress)}%`}>
                          <span
                            className={styles.timeRailFill}
                              style={{ height: `${timeProgress}%` }}
                              aria-hidden="true"
                            />
                          </div>
                          <div
                            className={`${styles.checklistSummary} ${!hasChecklist ? styles.checklistSummaryEmpty : ""}`}
                            aria-label="Actividades de la tarea"
                          >
                            {hasChecklist && overflowChecklist > 0 ? (
                              <span className={styles.checklistMore}>+{overflowChecklist}</span>
                            ) : null}
                            {hasChecklist && overflowChecklist === 0 ? (
                              <span className={styles.checklistMore}>{checklistCount}</span>
                            ) : null}
                            {hasChecklist
                              ? visibleChecklist.map((item) => (
                                  <span
                                    key={item.id}
                                    className={`${styles.checklistSquare} ${item.done ? styles.checklistSquareDone : ""}`}
                                    aria-hidden="true"
                                  />
                                ))
                              : (
                                <>
                                  <span className={`${styles.checklistMore} ${styles.checklistMoreGhost}`}>+</span>
                                  {Array.from({ length: 3 }).map((_, idx) => (
                                    <span
                                      key={`ghost_${t.id}_${idx + 1}`}
                                      className={`${styles.checklistSquare} ${styles.checklistSquareGhost}`}
                                      aria-hidden="true"
                                    />
                                  ))}
                                </>
                              )}
                          </div>
                        </aside>
                      </article>
                    );
                  })}

                  {items.length === 0 && <div className={styles.emptyDrop}>Arrastra una tarea aqui</div>}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
9
