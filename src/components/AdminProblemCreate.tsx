import type { ChangeEvent } from 'react'

type AdminProblemCreateProps = {
  problemDetailTitleDraft: string
  problemDetailVisibleDraft: number | null
  problemDetailTimeLimitDraft: number | ''
  problemDetailMemoryLimitDraft: number | ''
  problemDetailDescriptionDraft: string
  problemDetailVisibleDropdownOpen: boolean
  problemCreateSubmitting: boolean
  canSubmitCreateProblem: boolean
  onCancelCreate: () => void
  onChangeTitleDraft: (value: string) => void
  onToggleVisibleDropdown: () => void
  onChangeVisibleDraft: (visible: number) => void
  onChangeTimeLimitDraft: (value: number | '') => void
  onClampTimeLimit: () => void
  onChangeMemoryLimitDraft: (value: number | '') => void
  onClampMemoryLimit: () => void
  onChangeDescriptionDraft: (value: string) => void
  onConfirmCreate: () => void
}

export default function AdminProblemCreate(props: AdminProblemCreateProps) {
  const {
    problemDetailTitleDraft,
    problemDetailVisibleDraft,
    problemDetailTimeLimitDraft,
    problemDetailMemoryLimitDraft,
    problemDetailDescriptionDraft,
    problemDetailVisibleDropdownOpen,
    problemCreateSubmitting,
    canSubmitCreateProblem,
    onCancelCreate,
    onChangeTitleDraft,
    onToggleVisibleDropdown,
    onChangeVisibleDraft,
    onChangeTimeLimitDraft,
    onClampTimeLimit,
    onChangeMemoryLimitDraft,
    onClampMemoryLimit,
    onChangeDescriptionDraft,
    onConfirmCreate,
  } = props

  function handleTimeLimitChange(e: ChangeEvent<HTMLInputElement>) {
    const v = e.target.value
    onChangeTimeLimitDraft(v === '' ? '' : Number(v))
  }

  function handleMemoryLimitChange(e: ChangeEvent<HTMLInputElement>) {
    const v = e.target.value
    onChangeMemoryLimitDraft(v === '' ? '' : Number(v))
  }

  return (
    <div className="problem-detail">
      <div className="problem-detail-header">
        <button
          type="button"
          className="problem-detail-back-btn"
          onClick={onCancelCreate}
          disabled={problemCreateSubmitting}
        >
          ← 返回题目列表
        </button>
        <div className="problem-detail-header-main">
          <div className="problem-detail-title">创建题目</div>
          <div className="problem-detail-meta">
            <span className="problem-detail-meta-item">
              请填写题目信息并点击右下角确认创建
            </span>
          </div>
        </div>
      </div>
      <div className="problem-detail-body">
        <div className="problem-detail-section">
          <div className="problem-detail-section-title">基本信息</div>
          <div className="problem-detail-main-row">
            <div className="problem-detail-grid">
              <div className="problem-detail-item-label">标题</div>
              <div className="problem-detail-item-value">
                <div className="problem-detail-title-input-wrapper">
                  <input
                    type="text"
                    className="problem-detail-input problem-detail-input-title"
                    maxLength={255}
                    value={problemDetailTitleDraft}
                    onChange={(e) => onChangeTitleDraft(e.target.value)}
                    disabled={problemCreateSubmitting}
                  />
                  <span className="problem-detail-title-counter">
                    {problemDetailTitleDraft.length} / 255
                  </span>
                </div>
              </div>
              <div className="problem-detail-item-label">非赛时可见性</div>
              <div className="problem-detail-item-value">
                <div className="problem-sort-select-wrapper">
                  <button
                    type="button"
                    className={
                      'problem-sort-select problem-detail-select-trigger' +
                      (problemDetailVisibleDropdownOpen
                        ? ' problem-sort-select-open'
                        : '')
                    }
                    onClick={onToggleVisibleDropdown}
                    disabled={problemCreateSubmitting}
                  >
                    {(problemDetailVisibleDraft ?? 1) === 1 ? '可见' : '不可见'}
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
              </div>
              <div className="problem-detail-item-label">时间限制</div>
              <div className="problem-detail-item-value">
                <div className="problem-detail-limit-input-wrapper">
                  <input
                    type="number"
                    className="problem-detail-input problem-detail-input-inline problem-detail-input-with-unit"
                    min={50}
                    max={30000}
                    value={problemDetailTimeLimitDraft}
                    onChange={handleTimeLimitChange}
                    onBlur={onClampTimeLimit}
                    disabled={problemCreateSubmitting}
                  />
                  <span className="problem-detail-limit-unit">ms</span>
                </div>
              </div>
              <div className="problem-detail-item-label">内存限制</div>
              <div className="problem-detail-item-value">
                <div className="problem-detail-limit-input-wrapper">
                  <input
                    type="number"
                    className="problem-detail-input problem-detail-input-inline problem-detail-input-with-unit"
                    min={128}
                    max={1024}
                    value={problemDetailMemoryLimitDraft}
                    onChange={handleMemoryLimitChange}
                    onBlur={onClampMemoryLimit}
                    disabled={problemCreateSubmitting}
                  />
                  <span className="problem-detail-limit-unit">MB</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="problem-detail-section">
          <div className="problem-detail-section-title">题目描述</div>
          <div className="problem-detail-description">
            <textarea
              className="problem-detail-textarea"
              value={problemDetailDescriptionDraft}
              onChange={(e) => onChangeDescriptionDraft(e.target.value)}
              disabled={problemCreateSubmitting}
            />
          </div>
          <div className="problem-detail-actions">
            <button
              type="button"
              className="problem-detail-cancel-btn"
              onClick={onCancelCreate}
              disabled={problemCreateSubmitting}
            >
              取消创建
            </button>
            <button
              type="button"
              className="problem-detail-confirm-btn"
              disabled={!canSubmitCreateProblem}
              onClick={onConfirmCreate}
            >
              {problemCreateSubmitting ? '创建中…' : '确认创建'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

