import React from "react";
import { Trash2, X } from "lucide-react";

export default function KanbanSettingsModal({
  isOpen,
  styles,
  closeSettings,
  showSetupOnboarding,
  settingsError,
  draftConfig,
  setDraftConfig,
  addDraftTag,
  updateDraftTag,
  removeDraftTag,
  addDraftColumn,
  updateDraftColumn,
  plannedColumnMoves,
  setPlannedColumnMoves,
  removeDraftColumnWithMove,
  removeDraftColumn,
  addDraftIteration,
  updateDraftIteration,
  plannedIterationMoves,
  setPlannedIterationMoves,
  removeDraftIterationWithMove,
  removeDraftIteration,
  renderCustomSelect,
  applySettings,
  project,
}) {
  if (!isOpen || !draftConfig) return null;

  return (
    <div className={styles.overlay} aria-label="Modal de configuracion" onClick={closeSettings}>
      <div className={styles.modalWide} onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Configuracion tablero">
        <div className={`${styles.modalTop} ${styles.stickyTop}`}>
          <strong className={styles.modalHeader}>Configuracion del Tablero</strong>
          <button
            className={styles.iconBtn}
            onClick={closeSettings}
            aria-label="Cerrar modal"
            title="Cerrar"
            type="button"
          >
            <X size={18} strokeWidth={2.1} />
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
            <p className={styles.settingsSectionTitle}>Nombre del Proyecto</p>
            <p className={styles.settingsSectionDesc}>
              Este nombre se usa en el selector de proyectos y tambien en el titulo del tablero.
              Recomendacion: usa un nombre corto y claro del proyecto.
            </p>
          </div>
          <div className={styles.formRow}>
            <div className={`${styles.formGroup} ${styles.full}`}>
              <label className={styles.label}>Nombre del proyecto</label>
              <input
                className={styles.input}
                value={draftConfig.projectName}
                onChange={(e) =>
                  setDraftConfig((prev) => ({ ...prev, projectName: e.target.value }))
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
  );
}
