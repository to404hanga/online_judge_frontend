import type { ReactNode } from 'react'
import type { ProblemDetail } from '../api/problem'
import { formatDateTimeText } from '../utils/datetime'

type AdminProblemDetailProps = {
  problemDetail: ProblemDetail | null
  problemDetailLoading: boolean
  problemDetailEditing: boolean
  problemDetailTitleDraft: string
  problemDetailStatusDraft: number | null
  problemDetailVisibleDraft: number | null
  problemDetailTimeLimitDraft: number | ''
  problemDetailMemoryLimitDraft: number | ''
  problemDetailDescriptionDraft: string
  problemDetailHasChanges: boolean
  problemDetailStatusDropdownOpen: boolean
  problemDetailVisibleDropdownOpen: boolean
  onBackToList: () => void
  onOpenUploadModal: () => void
  onStartEdit: () => void
  onCancelEdit: () => void
  onConfirmEdit: () => void
  onChangeTitleDraft: (value: string) => void
  onChangeStatusDraft: (status: number) => void
  onChangeVisibleDraft: (visible: number) => void
  onChangeTimeLimitDraft: (value: number | '') => void
  onChangeMemoryLimitDraft: (value: number | '') => void
  onChangeDescriptionDraft: (value: string) => void
  onToggleStatusDropdown: () => void
  onToggleVisibleDropdown: () => void
  onStatusMouseEnter: () => void
  onStatusMouseLeave: () => void
  onVisibleMouseEnter: () => void
  onVisibleMouseLeave: () => void
  onClampTimeLimit: () => void
  onClampMemoryLimit: () => void
  renderDescription: (text: string) => ReactNode[]
}

export default function AdminProblemDetail(props: AdminProblemDetailProps) {
  const {
    problemDetail,
    problemDetailLoading,
    problemDetailEditing,
    problemDetailTitleDraft,
    problemDetailStatusDraft,
    problemDetailVisibleDraft,
    problemDetailTimeLimitDraft,
    problemDetailMemoryLimitDraft,
    problemDetailDescriptionDraft,
    problemDetailHasChanges,
    problemDetailStatusDropdownOpen,
    problemDetailVisibleDropdownOpen,
    onBackToList,
    onOpenUploadModal,
    onStartEdit,
    onCancelEdit,
    onConfirmEdit,
    onChangeTitleDraft,
    onChangeStatusDraft,
    onChangeVisibleDraft,
    onChangeTimeLimitDraft,
    onChangeMemoryLimitDraft,
    onChangeDescriptionDraft,
    onToggleStatusDropdown,
    onToggleVisibleDropdown,
    onStatusMouseEnter,
    onStatusMouseLeave,
    onVisibleMouseEnter,
    onVisibleMouseLeave,
    onClampTimeLimit,
    onClampMemoryLimit,
    renderDescription,
  } = props

  return (
    <div className="problem-detail">
      <div className="problem-detail-header">
        <button
          type="button"
          className="problem-detail-back-btn"
          onClick={onBackToList}
        >
          ← 返回题目列表
        </button>
        <div className="problem-detail-header-main">
          <div className="problem-detail-title">
            {problemDetail?.title ?? '题目详情'}
          </div>
          {problemDetail && (
            <div className="problem-detail-meta">
              <span className="problem-detail-meta-item">
                ID {problemDetail.id}
              </span>
              <span className="problem-detail-dot" />
              <span className="problem-detail-meta-item">
                创建{' '}
                {(problemDetail.creator_realname || '未知') +
                  ' · ' +
                  formatDateTimeText(problemDetail.created_at)}
              </span>
              <span className="problem-detail-dot" />
              <span className="problem-detail-meta-item">
                最后更新{' '}
                {(problemDetail.updater_realname || '未知') +
                  ' · ' +
                  formatDateTimeText(problemDetail.updated_at)}
              </span>
            </div>
          )}
        </div>
      </div>
      {problemDetailLoading && (
        <div className="problem-detail-body">正在加载题目详情…</div>
      )}
      {!problemDetailLoading && problemDetail && (
        <div className="problem-detail-body">
          <div className="problem-detail-section">
            <div className="problem-detail-section-title">基本信息</div>
            <div className="problem-detail-main-row">
              <div className="problem-detail-grid">
                <div className="problem-detail-item-label">标题</div>
                <div className="problem-detail-item-value">
                  {problemDetailEditing ? (
                    <div className="problem-detail-title-input-wrapper">
                      <input
                        type="text"
                        className="problem-detail-input problem-detail-input-title"
                        maxLength={255}
                        value={problemDetailTitleDraft}
                        onChange={(e) =>
                          onChangeTitleDraft(e.target.value)
                        }
                      />
                      <span className="problem-detail-title-counter">
                        {problemDetailTitleDraft.length} / 255
                      </span>
                    </div>
                  ) : (
                    problemDetail.title
                  )}
                </div>
                <div className="problem-detail-item-label">状态</div>
                <div className="problem-detail-item-value">
                  {problemDetailEditing ? (
                    <div
                      className="problem-sort-select-wrapper"
                      onMouseEnter={onStatusMouseEnter}
                      onMouseLeave={onStatusMouseLeave}
                    >
                      <button
                        type="button"
                        className={
                          'problem-sort-select problem-detail-select-trigger' +
                          (problemDetailStatusDropdownOpen
                            ? ' problem-sort-select-open'
                            : '')
                        }
                        onClick={onToggleStatusDropdown}
                      >
                        {(problemDetailStatusDraft ??
                          problemDetail.status) === 0
                          ? '未发布'
                          : (problemDetailStatusDraft ??
                            problemDetail.status) === 1
                            ? '已发布'
                            : '已删除'}
                      </button>
                      {problemDetailStatusDropdownOpen && (
                        <div className="problem-sort-menu problem-detail-select-menu">
                          <button
                            type="button"
                            className="problem-sort-menu-item"
                            onClick={() => {
                              onChangeStatusDraft(0)
                              onToggleStatusDropdown()
                            }}
                          >
                            未发布
                          </button>
                          <button
                            type="button"
                            className="problem-sort-menu-item"
                            onClick={() => {
                              onChangeStatusDraft(1)
                              onToggleStatusDropdown()
                            }}
                          >
                            已发布
                          </button>
                          <button
                            type="button"
                            className="problem-sort-menu-item"
                            onClick={() => {
                              onChangeStatusDraft(2)
                              onToggleStatusDropdown()
                            }}
                          >
                            已删除
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <span
                      className={
                        'problem-status-pill ' +
                        (problemDetail.status === 0
                          ? 'problem-status-pill-pending'
                          : problemDetail.status === 1
                            ? 'problem-status-pill-active'
                            : 'problem-status-pill-deleted')
                      }
                    >
                      {problemDetail.status === 0
                        ? '未发布'
                        : problemDetail.status === 1
                          ? '已发布'
                          : '已删除'}
                    </span>
                  )}
                </div>
                <div className="problem-detail-item-label">
                  非赛时可见性
                </div>
                <div className="problem-detail-item-value">
                  {problemDetailEditing ? (
                    <div
                      className="problem-sort-select-wrapper"
                      onMouseEnter={onVisibleMouseEnter}
                      onMouseLeave={onVisibleMouseLeave}
                    >
                      <button
                        type="button"
                        className={
                          'problem-sort-select problem-detail-select-trigger' +
                          (problemDetailVisibleDropdownOpen
                            ? ' problem-sort-select-open'
                            : '')
                        }
                        onClick={onToggleVisibleDropdown}
                      >
                        {(problemDetailVisibleDraft ??
                          problemDetail.visible) === 1
                          ? '可见'
                          : '不可见'}
                      </button>
                      {problemDetailVisibleDropdownOpen && (
                        <div className="problem-sort-menu problem-detail-select-menu">
                          <button
                            type="button"
                            className="problem-sort-menu-item"
                            onClick={() => {
                              onChangeVisibleDraft(1)
                              onToggleVisibleDropdown()
                            }}
                          >
                            可见
                          </button>
                          <button
                            type="button"
                            className="problem-sort-menu-item"
                            onClick={() => {
                              onChangeVisibleDraft(0)
                              onToggleVisibleDropdown()
                            }}
                          >
                            不可见
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <span
                      className={
                        'problem-visible-pill ' +
                        (problemDetail.visible === 1
                          ? 'problem-visible-pill-on'
                          : 'problem-visible-pill-off')
                      }
                    >
                      {problemDetail.visible === 1 ? '可见' : '不可见'}
                    </span>
                  )}
                </div>
                <div className="problem-detail-item-label">时间限制</div>
                <div className="problem-detail-item-value">
                  {problemDetailEditing ? (
                    <div className="problem-detail-limit-input-wrapper">
                      <input
                        type="number"
                        className="problem-detail-input problem-detail-input-inline problem-detail-input-with-unit"
                        min={50}
                        max={30000}
                        value={problemDetailTimeLimitDraft}
                        onChange={(e) => {
                          const v = e.target.value
                          onChangeTimeLimitDraft(
                            v === '' ? '' : Number(v),
                          )
                        }}
                        onBlur={onClampTimeLimit}
                      />
                      <span className="problem-detail-limit-unit">
                        ms
                      </span>
                    </div>
                  ) : (
                    `${problemDetail.time_limit} ms`
                  )}
                </div>
                <div className="problem-detail-item-label">内存限制</div>
                <div className="problem-detail-item-value">
                  {problemDetailEditing ? (
                    <div className="problem-detail-limit-input-wrapper">
                      <input
                        type="number"
                        className="problem-detail-input problem-detail-input-inline problem-detail-input-with-unit"
                        min={128}
                        max={1024}
                        value={problemDetailMemoryLimitDraft}
                        onChange={(e) => {
                          const v = e.target.value
                          onChangeMemoryLimitDraft(
                            v === '' ? '' : Number(v),
                          )
                        }}
                        onBlur={onClampMemoryLimit}
                      />
                      <span className="problem-detail-limit-unit">
                        MB
                      </span>
                    </div>
                  ) : (
                    `${problemDetail.memory_limit} MB`
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="problem-detail-section">
            <div className="problem-detail-section-title">题目描述</div>
            <div className="problem-detail-description">
              {problemDetailEditing ? (
                <textarea
                  className="problem-detail-textarea"
                  value={problemDetailDescriptionDraft}
                  onChange={(e) =>
                    onChangeDescriptionDraft(e.target.value)
                  }
                />
              ) : (
                renderDescription(problemDetail.description)
              )}
            </div>
            <div className="problem-detail-actions">
              {!problemDetailEditing && (
                <>
                  <button
                    type="button"
                    className="problem-detail-edit-btn"
                    onClick={onOpenUploadModal}
                  >
                    上传测试用例
                  </button>
                  <button
                    type="button"
                    className="problem-detail-edit-btn"
                    onClick={onStartEdit}
                  >
                    修改
                  </button>
                </>
              )}
              {problemDetailEditing && (
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
                    disabled={!problemDetailHasChanges}
                    onClick={onConfirmEdit}
                  >
                    确认修改
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

