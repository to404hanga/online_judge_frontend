import type {
  CompetitionDetailItem,
  CompetitionProblemItem,
} from '../api/competition'
import { formatDateTimeText } from '../utils/datetime'
import { COMPETITION_TIMEZONE_OPTIONS } from '../utils/competitionTime'
import {
  renderCompetitionProblemStatusPill,
  renderCompetitionRuntimePill,
  renderCompetitionStatusPill,
} from './AdminCompetitionPills'

type ImportProblemItem = {
  id: number
  title: string
  time_limit: number
  memory_limit: number
}

type AdminCompetitionDetailProps = {
  activeCompetitionId: number
  activeCompetition: CompetitionDetailItem | null
  competitionDetailLoading: boolean
  competitionDetailError: string
  competitionDetailEditing: boolean
  competitionDetailNameDraft: string
  competitionDetailStatusDraft: number | null
  competitionDetailStartTimeDraft: string
  competitionDetailEndTimeDraft: string
  competitionDetailStatusDropdownOpen: boolean
  competitionDetailSubmitting: boolean
  competitionDetailTimezoneOffset: number
  competitionDetailHasChanges: boolean
  onBackToList: () => void
  onStartEdit: () => void
  onCancelEdit: () => void
  onConfirmEdit: () => void
  onChangeNameDraft: (value: string) => void
  onToggleStatusDropdown: () => void
  onChangeStatusDraft: (status: number) => void
  onChangeTimezoneOffset: (nextOffset: number) => void
  onChangeStartTimeDraft: (value: string) => void
  onChangeEndTimeDraft: (value: string) => void

  competitionProblems: CompetitionProblemItem[]
  competitionProblemsLoading: boolean
  competitionProblemsError: string
  competitionProblemsUpdating: boolean
  competitionProblemsDeleting: boolean
  competitionProblemDeletingId: number | null
  competitionProblemDeleteConfirm: CompetitionProblemItem | null
  onUpdateCompetitionProblemStatus: (
    problemId: number,
    targetStatus: number,
  ) => void
  onDeleteCompetitionProblem: (problem: CompetitionProblemItem) => void
  onCancelDeleteCompetitionProblem: () => void
  onConfirmDeleteCompetitionProblem: () => void

  importProblemModalOpen: boolean
  importProblemList: ImportProblemItem[]
  selectedImportProblemIds: number[]
  importProblemPage: number
  importProblemTotal: number
  importProblemLoading: boolean
  importProblemSubmitting: boolean
  importProblemError: string
  onOpenImportProblemModal: () => void
  onCloseImportProblemModal: () => void
  onToggleImportProblemSelected: (problemId: number) => void
  onAddSelectedImportProblems: () => void
  onChangeImportProblemPage: (page: number) => void
}

export default function AdminCompetitionDetail(props: AdminCompetitionDetailProps) {
  const {
    activeCompetitionId,
    activeCompetition,
    competitionDetailLoading,
    competitionDetailError,
    competitionDetailEditing,
    competitionDetailNameDraft,
    competitionDetailStatusDraft,
    competitionDetailStartTimeDraft,
    competitionDetailEndTimeDraft,
    competitionDetailStatusDropdownOpen,
    competitionDetailSubmitting,
    competitionDetailTimezoneOffset,
    competitionDetailHasChanges,
    onBackToList,
    onStartEdit,
    onCancelEdit,
    onConfirmEdit,
    onChangeNameDraft,
    onToggleStatusDropdown,
    onChangeStatusDraft,
    onChangeTimezoneOffset,
    onChangeStartTimeDraft,
    onChangeEndTimeDraft,
    competitionProblems,
    competitionProblemsLoading,
    competitionProblemsError,
    competitionProblemsUpdating,
    competitionProblemsDeleting,
    competitionProblemDeletingId,
    competitionProblemDeleteConfirm,
    onUpdateCompetitionProblemStatus,
    onDeleteCompetitionProblem,
    onCancelDeleteCompetitionProblem,
    onConfirmDeleteCompetitionProblem,
    importProblemModalOpen,
    importProblemList,
    selectedImportProblemIds,
    importProblemPage,
    importProblemTotal,
    importProblemLoading,
    importProblemSubmitting,
    importProblemError,
    onOpenImportProblemModal,
    onCloseImportProblemModal,
    onToggleImportProblemSelected,
    onAddSelectedImportProblems,
    onChangeImportProblemPage,
  } = props

  const competitionProblemIdSet = new Set(
    competitionProblems.map((item) => item.problem_id),
  )

  return (
    <>
      <div className="problem-detail">
        <div className="competition-detail-split">
          <div className="competition-detail-left">
            <div className="problem-detail-header">
              <button
                type="button"
                className="problem-detail-back-btn"
                onClick={onBackToList}
              >
                ← 返回比赛列表
              </button>
              <div className="problem-detail-header-main">
                <div className="competition-detail-title-row">
                  <div className="problem-detail-title">
                    {activeCompetition?.name || '比赛详情'}
                  </div>
                  <div className="competition-detail-title-id">
                    ID {activeCompetitionId}
                  </div>
                </div>
                <div className="competition-detail-meta-lines">
                  {competitionDetailLoading && (
                    <div className="competition-detail-meta-line">
                      正在加载比赛详情…
                    </div>
                  )}
                  {!competitionDetailLoading && competitionDetailError && (
                    <div className="competition-detail-meta-line">
                      {competitionDetailError}
                    </div>
                  )}
                  {!competitionDetailLoading &&
                    !competitionDetailError &&
                    activeCompetition && (
                      <>
                        <div className="competition-detail-meta-line">
                          最后更新用户{' '}
                          {activeCompetition.updater_realname?.trim()
                            ? activeCompetition.updater_realname
                            : activeCompetition.updater_id}{' '}
                          · {formatDateTimeText(activeCompetition.updated_at)}
                        </div>
                        <div className="competition-detail-meta-line">
                          创建用户{' '}
                          {activeCompetition.creator_realname?.trim()
                            ? activeCompetition.creator_realname
                            : activeCompetition.creator_id}{' '}
                          · {formatDateTimeText(activeCompetition.created_at)}
                        </div>
                      </>
                    )}
                </div>
              </div>
            </div>
            <div className="problem-detail-body">
              <div className="problem-detail-section">
                <div className="problem-detail-section-title">基本信息</div>
                <div className="problem-detail-main-row">
                  <div className="problem-detail-grid">
                    <div className="problem-detail-item-label">比赛名称</div>
                    <div className="problem-detail-item-value">
                      {competitionDetailEditing ? (
                        <div className="problem-detail-title-input-wrapper">
                          <input
                            type="text"
                            className="problem-detail-input problem-detail-input-title"
                            maxLength={255}
                            value={competitionDetailNameDraft}
                            onChange={(e) =>
                              onChangeNameDraft(e.target.value)
                            }
                          />
                          <span className="problem-detail-title-counter">
                            {competitionDetailNameDraft.length} / 255
                          </span>
                        </div>
                      ) : (
                        activeCompetition?.name ?? '-'
                      )}
                    </div>
                    <div className="problem-detail-item-label">发布状态</div>
                    <div className="problem-detail-item-value">
                      {competitionDetailEditing ? (
                        <div className="problem-sort-select-wrapper">
                          <button
                            type="button"
                            className={
                              'problem-sort-select problem-detail-select-trigger' +
                              (competitionDetailStatusDropdownOpen
                                ? ' problem-sort-select-open'
                                : '')
                            }
                            onClick={onToggleStatusDropdown}
                          >
                            {(competitionDetailStatusDraft ??
                              (activeCompetition?.status ?? 0)) === 0
                              ? '未发布'
                              : (competitionDetailStatusDraft ??
                                    (activeCompetition?.status ?? 0)) === 1
                                ? '已发布'
                                : '已删除'}
                          </button>
                          {competitionDetailStatusDropdownOpen && (
                            <div className="problem-sort-menu problem-detail-select-menu">
                              <button
                                type="button"
                                className="problem-sort-menu-item"
                                onClick={() => onChangeStatusDraft(0)}
                              >
                                未发布
                              </button>
                              <button
                                type="button"
                                className="problem-sort-menu-item"
                                onClick={() => onChangeStatusDraft(1)}
                              >
                                已发布
                              </button>
                              <button
                                type="button"
                                className="problem-sort-menu-item"
                                onClick={() => onChangeStatusDraft(2)}
                              >
                                已删除
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        (activeCompetition
                          ? renderCompetitionStatusPill(activeCompetition.status)
                          : '-')
                      )}
                    </div>
                    <div className="problem-detail-item-label">进行状态</div>
                    <div className="problem-detail-item-value">
                      {activeCompetition
                        ? renderCompetitionRuntimePill(activeCompetition)
                        : '-'}
                    </div>
                    <div className="problem-detail-item-label">时区</div>
                    <div className="problem-detail-item-value">
                      {competitionDetailEditing ? (
                        <select
                          className="problem-detail-input problem-detail-input-inline"
                          value={competitionDetailTimezoneOffset}
                          onChange={(e) => {
                            const nextOffset = Number(e.target.value)
                            if (Number.isNaN(nextOffset)) {
                              onChangeTimezoneOffset(0)
                              return
                            }
                            onChangeTimezoneOffset(nextOffset)
                          }}
                        >
                          {COMPETITION_TIMEZONE_OPTIONS.map((item) => (
                            <option key={item.offset} value={item.offset}>
                              {item.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        (
                          COMPETITION_TIMEZONE_OPTIONS.find(
                            (item) => item.offset === competitionDetailTimezoneOffset,
                          ) ?? COMPETITION_TIMEZONE_OPTIONS[0]
                        ).label
                      )}
                    </div>
                    <div className="problem-detail-item-label">开始时间</div>
                    <div className="problem-detail-item-value">
                      {competitionDetailEditing ? (
                        <input
                          type="datetime-local"
                          className="problem-detail-input problem-detail-input-inline"
                          style={{ minWidth: '180px' }}
                          value={competitionDetailStartTimeDraft}
                          step={1}
                          onChange={(e) =>
                            onChangeStartTimeDraft(e.target.value)
                          }
                        />
                      ) : (
                        (activeCompetition
                          ? formatDateTimeText(activeCompetition.start_time)
                          : '-')
                      )}
                    </div>
                    <div className="problem-detail-item-label">结束时间</div>
                    <div className="problem-detail-item-value">
                      {competitionDetailEditing ? (
                        <input
                          type="datetime-local"
                          className="problem-detail-input problem-detail-input-inline"
                          style={{ minWidth: '180px' }}
                          value={competitionDetailEndTimeDraft}
                          step={1}
                          onChange={(e) => onChangeEndTimeDraft(e.target.value)}
                        />
                      ) : (
                        (activeCompetition
                          ? formatDateTimeText(activeCompetition.end_time)
                          : '-')
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div
                className="problem-detail-actions competition-detail-actions-left"
              >
                {!competitionDetailEditing && (
                  <button
                    type="button"
                    className="problem-detail-edit-btn"
                    disabled={
                      !activeCompetition ||
                      competitionDetailLoading ||
                      !!competitionDetailError
                    }
                    onClick={onStartEdit}
                  >
                    修改
                  </button>
                )}
                {competitionDetailEditing && (
                  <>
                    <button
                      type="button"
                      className="problem-detail-cancel-btn"
                      onClick={onCancelEdit}
                    >
                      取消修改
                    </button>
                    <button
                      type="button"
                      className="problem-detail-confirm-btn"
                      disabled={
                        !competitionDetailHasChanges || competitionDetailSubmitting
                      }
                      onClick={onConfirmEdit}
                    >
                      确认修改
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="competition-detail-right">
            <div className="problem-detail-section">
              <div className="problem-detail-section-title-row">
                <div className="problem-detail-section-title">比赛题目</div>
                <button
                  type="button"
                  className="problem-add-button"
                  aria-label="导入题目"
                  title="导入题目"
                  onClick={onOpenImportProblemModal}
                >
                  ＋
                </button>
              </div>
              <div className="problem-detail-main-row">
                {competitionProblemsLoading && (
                  <div className="competition-empty">正在加载比赛题目…</div>
                )}
                {!competitionProblemsLoading && competitionProblemsError && (
                  <div className="competition-error">{competitionProblemsError}</div>
                )}
                {!competitionProblemsLoading &&
                  !competitionProblemsError &&
                  competitionProblems.length === 0 && (
                    <div className="competition-empty">当前比赛暂无题目</div>
                  )}
                {!competitionProblemsLoading &&
                  !competitionProblemsError &&
                  competitionProblems.length > 0 && (
                    <div className="competition-admin-list-table competition-problem-list-table">
                      <div className="competition-admin-list-row competition-admin-list-row-header competition-problem-list-row">
                        <div className="competition-admin-col-id">题目ID</div>
                        <div className="competition-admin-col-name">题目标题</div>
                        <div className="competition-admin-col-status">状态</div>
                        <div className="competition-admin-col-actions">操作</div>
                      </div>
                      <div className="competition-admin-list-body">
                        {competitionProblems.map((item) => (
                          <div
                            key={item.id}
                            className="competition-admin-list-row competition-problem-list-row"
                          >
                            <div className="competition-admin-col-id">
                              {item.problem_id}
                            </div>
                            <div className="competition-admin-col-name">
                              {item.problem_title}
                            </div>
                            <div className="competition-admin-col-status">
                              {renderCompetitionProblemStatusPill(item.status)}
                            </div>
                            <div className="competition-admin-col-actions problem-col-actions">
                              {item.status === 1 ? (
                                <button
                                  type="button"
                                  className="competition-problem-action-btn competition-problem-action-btn-danger"
                                  disabled={
                                    competitionProblemsUpdating ||
                                    competitionProblemsDeleting
                                  }
                                  onClick={() =>
                                    onUpdateCompetitionProblemStatus(
                                      item.problem_id,
                                      0,
                                    )
                                  }
                                >
                                  禁用
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  className="competition-problem-action-btn"
                                  disabled={
                                    competitionProblemsUpdating ||
                                    competitionProblemsDeleting
                                  }
                                  onClick={() =>
                                    onUpdateCompetitionProblemStatus(
                                      item.problem_id,
                                      1,
                                    )
                                  }
                                >
                                  启用
                                </button>
                              )}
                              <button
                                type="button"
                                className="competition-problem-action-btn competition-problem-action-btn-danger"
                                disabled={
                                  competitionProblemsUpdating ||
                                  competitionProblemsDeleting
                                }
                                onClick={() => {
                                  onDeleteCompetitionProblem(item)
                                }}
                              >
                                {competitionProblemsDeleting &&
                                competitionProblemDeletingId === item.problem_id
                                  ? '删除中…'
                                  : '删除'}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {competitionProblemDeleteConfirm && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal-title">确认删除</div>
            <div className="admin-modal-message">
              确认要删除比赛题目（题目ID: {competitionProblemDeleteConfirm.problem_id}）吗？
            </div>
            <div className="admin-modal-actions">
              <button
                type="button"
                className="problem-detail-edit-btn"
                disabled={competitionProblemsDeleting}
                onClick={onCancelDeleteCompetitionProblem}
              >
                取消
              </button>
              <button
                type="button"
                className="admin-modal-primary-btn"
                disabled={competitionProblemsDeleting}
                onClick={onConfirmDeleteCompetitionProblem}
              >
                {competitionProblemsDeleting ? '删除中…' : '确认删除'}
              </button>
            </div>
          </div>
        </div>
      )}
      {importProblemModalOpen && (
        <div className="admin-modal-overlay">
          <div
            className="admin-modal"
            style={{
              width: '640px',
              maxHeight: '80vh',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div className="admin-modal-title">导入题目</div>
            <div
              className="admin-modal-message"
              style={{
                flex: '1 1 auto',
                minHeight: 0,
                marginBottom: '12px',
                overflow: 'hidden',
              }}
            >
              {importProblemLoading && <div>正在加载题目列表…</div>}
              {!importProblemLoading && importProblemError && (
                <div>{importProblemError}</div>
              )}
              {!importProblemLoading &&
                !importProblemError &&
                importProblemList.length === 0 && <div>暂无可导入的题目</div>}
              {!importProblemLoading &&
                !importProblemError &&
                importProblemList.length > 0 && (
                  <div className="competition-admin-list-table competition-problem-list-table import-problem-table">
                    <div className="competition-admin-list-row competition-admin-list-row-header import-problem-list-row">
                      <div className="competition-admin-col-select"></div>
                      <div className="competition-admin-col-id">题目ID</div>
                      <div className="competition-admin-col-name">题目标题</div>
                      <div className="competition-admin-col-status">时间限制</div>
                      <div className="competition-admin-col-actions">内存限制</div>
                    </div>
                    <div className="competition-admin-list-body">
                      {importProblemList.map((item) => {
                        const isInCompetition = competitionProblemIdSet.has(
                          item.id,
                        )
                        const checkboxTip = isInCompetition
                          ? '该题目已在当前比赛题目列表中'
                          : '选择题目'
                        return (
                          <div
                            key={item.id}
                            className={
                              'competition-admin-list-row import-problem-list-row' +
                              (isInCompetition
                                ? ' import-problem-list-row-disabled'
                                : '')
                            }
                          >
                            <div className="competition-admin-col-select">
                              <span title={checkboxTip}>
                                <input
                                  type="checkbox"
                                  aria-label={`选择题目 ${item.id}`}
                                  disabled={
                                    isInCompetition || importProblemSubmitting
                                  }
                                  checked={
                                    !isInCompetition &&
                                    selectedImportProblemIds.includes(item.id)
                                  }
                                  onChange={() => {
                                    if (isInCompetition) return
                                    if (importProblemSubmitting) return
                                    onToggleImportProblemSelected(item.id)
                                  }}
                                />
                              </span>
                            </div>
                            <div className="competition-admin-col-id">
                              {item.id}
                            </div>
                            <div className="competition-admin-col-name">
                              {item.title}
                            </div>
                            <div className="competition-admin-col-status">
                              {item.time_limit} ms
                            </div>
                            <div className="competition-admin-col-actions problem-col-actions">
                              {item.memory_limit} MB
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
            </div>
            <div className="admin-modal-actions">
              <button
                type="button"
                className="problem-detail-edit-btn"
                onClick={onCloseImportProblemModal}
              >
                关闭
              </button>
              <button
                type="button"
                className="problem-detail-edit-btn import-problem-add-btn"
                disabled={
                  importProblemSubmitting ||
                  selectedImportProblemIds.filter(
                    (id) => !competitionProblemIdSet.has(id),
                  ).length === 0
                }
                onClick={onAddSelectedImportProblems}
              >
                {importProblemSubmitting ? '添加中…' : '添加'}
              </button>
              {importProblemTotal > 0 && (
                <div
                  style={{
                    marginLeft: 'auto',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <button
                    type="button"
                    onClick={() =>
                      onChangeImportProblemPage(Math.max(1, importProblemPage - 1))
                    }
                    disabled={
                      importProblemPage <= 1 ||
                      importProblemLoading ||
                      importProblemSubmitting
                    }
                  >
                    上一页
                  </button>
                  <span className="competition-page-info">
                    第 {importProblemPage} /{' '}
                    {Math.max(1, Math.ceil(importProblemTotal / 10))} 页
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      onChangeImportProblemPage(
                        Math.min(
                          Math.max(1, Math.ceil(importProblemTotal / 10)),
                          importProblemPage + 1,
                        ),
                      )
                    }
                    disabled={
                      importProblemPage >=
                        Math.max(1, Math.ceil(importProblemTotal / 10)) ||
                      importProblemLoading ||
                      importProblemSubmitting
                    }
                  >
                    下一页
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
