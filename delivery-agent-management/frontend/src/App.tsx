import { useState, useEffect, useCallback, useRef } from 'react'
import { agentApi, extractErrorMessage } from './api/agents'
import type { Agent, AgentFilters, CreateAgentInput } from './api/agents'
import { AgentFormModal } from './components/AgentFormModal'
import { AgentDetailModal } from './components/AgentDetailModal'
import { DeleteConfirmModal } from './components/DeleteConfirmModal'
import { ToastContainer, toast } from './components/Toast'
import { formatPhoneNumber, formatDate } from './utils/formatters'
import './index.css'

// ─── Types ────────────────────────────────────────────────────────────────────

type Modal =
  | { type: 'create' }
  | { type: 'edit'; agent: Agent }
  | { type: 'detail'; agent: Agent }
  | { type: 'delete'; agent: Agent }

// ─── Skeleton rows ────────────────────────────────────────────────────────────

function SkeletonRows({ count = 5 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <tr key={i} className="skeleton-row">
          <td>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="skeleton skeleton-avatar" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div className="skeleton" style={{ width: 120, height: 14 }} />
                <div className="skeleton" style={{ width: 160, height: 11 }} />
              </div>
            </div>
          </td>
          <td>
            <div className="skeleton" style={{ width: 130, height: 14 }} />
          </td>
          <td>
            <div className="skeleton" style={{ width: 110, height: 24, borderRadius: 99 }} />
          </td>
          <td>
            <div className="skeleton" style={{ width: 75, height: 24, borderRadius: 99 }} />
          </td>
          <td>
            <div className="skeleton" style={{ width: 85, height: 13 }} />
          </td>
          <td style={{ textAlign: 'right' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
              <div className="skeleton" style={{ width: 32, height: 32, borderRadius: 8 }} />
              <div className="skeleton" style={{ width: 32, height: 32, borderRadius: 8 }} />
              <div className="skeleton" style={{ width: 32, height: 32, borderRadius: 8 }} />
            </div>
          </td>
        </tr>
      ))}
    </>
  )
}

// ─── Pagination ───────────────────────────────────────────────────────────────

function Pagination({
  page, totalPages, total, limit, onPage,
}: {
  page: number
  totalPages: number
  total: number
  limit: number
  onPage: (p: number) => void
}) {
  const start = total === 0 ? 0 : (page - 1) * limit + 1
  const end = Math.min(page * limit, total)

  const pages: (number | '…')[] = []
  const safeTotalPages = Math.max(1, totalPages)
  if (safeTotalPages <= 7) {
    for (let i = 1; i <= safeTotalPages; i++) pages.push(i)
  } else {
    pages.push(1)
    if (page > 3) pages.push('…')
    for (let i = Math.max(2, page - 1); i <= Math.min(safeTotalPages - 1, page + 1); i++) pages.push(i)
    if (page < safeTotalPages - 2) pages.push('…')
    pages.push(safeTotalPages)
  }

  return (
    <div className="pagination">
      <span className="pagination-info">
        {total === 0 ? 'No agents found' : `Showing ${start}-${end} of ${total}`}
      </span>
      <div className="pagination-controls">
        <button
          className="page-btn page-btn-prev"
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
        >‹ Prev</button>
        {pages.map((p, i) =>
          p === '…'
            ? <span key={`ellipsis-${i}`} className="pagination-ellipsis">…</span>
            : <button
                key={p}
                className={`page-btn ${page === p ? 'active' : ''}`}
                onClick={() => onPage(p as number)}
                aria-current={page === p ? 'page' : undefined}
              >{p}</button>
        )}
        <button
          className="page-btn page-btn-next"
          onClick={() => onPage(page + 1)}
          disabled={page >= safeTotalPages || safeTotalPages <= 1}
          aria-label="Next page"
        >Next ›</button>
      </div>
    </div>
  )
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10, totalPages: 0 })
  const [filters, setFilters] = useState<AgentFilters>({ page: 1, limit: 10, status: '', q: '' })
  const [searchInput, setSearchInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [modal, setModal] = useState<Modal | null>(null)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Stats
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 })

  const fetchAgents = useCallback(async (f: AgentFilters) => {
    setLoading(true)
    setError(null)
    try {
      const res = await agentApi.list(f)
      setAgents(res.data)
      setMeta(res.meta)
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchStats = useCallback(async () => {
    try {
      const [all, active, inactive] = await Promise.all([
        agentApi.list({ limit: 1 }),
        agentApi.list({ limit: 1, status: 'ACTIVE' }),
        agentApi.list({ limit: 1, status: 'INACTIVE' }),
      ])
      setStats({
        total: all.meta.total,
        active: active.meta.total,
        inactive: inactive.meta.total,
      })
    } catch {
      // stats are non-critical
    }
  }, [])

  useEffect(() => {
    fetchAgents(filters)
  }, [filters, fetchAgents])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  function handleSearch(q: string) {
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      setFilters(prev => ({ ...prev, q, page: 1 }))
    }, 350)
  }

  function handleStatusFilter(status: string) {
    setFilters(prev => ({ ...prev, status: status as AgentFilters['status'], page: 1 }))
  }

  function handlePage(page: number) {
    setFilters(prev => ({ ...prev, page }))
  }

  async function handleCreate(data: CreateAgentInput) {
    setActionLoading(true)
    try {
      await agentApi.create(data)
      setModal(null)
      toast('Agent created successfully')
      fetchAgents(filters)
      fetchStats()
    } catch (err) {
      toast(extractErrorMessage(err), 'error')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleUpdate(id: string, data: CreateAgentInput) {
    setActionLoading(true)
    try {
      await agentApi.update(id, data)
      setModal(null)
      toast('Agent updated successfully')
      fetchAgents(filters)
      fetchStats()
    } catch (err) {
      toast(extractErrorMessage(err), 'error')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleDelete(id: string) {
    setActionLoading(true)
    try {
      await agentApi.delete(id)
      setModal(null)
      toast('Agent deleted')
      fetchAgents(filters)
      fetchStats()
    } catch (err) {
      toast(extractErrorMessage(err), 'error')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="app-layout">
      <ToastContainer />

      {/* ── Topbar ── */}
      <header className="topbar">
        <div className="topbar-brand">
          <div className="topbar-logo">🚴</div>
          <div>
            <div className="topbar-title">Zoop · DeliveryOps</div>
            <div className="topbar-subtitle">Agent Management</div>
          </div>
        </div>
        <div className="topbar-right">
          <span className="live-badge">
            <span className="live-dot" /> System Active
          </span>
        </div>
      </header>

      <main className="main-content">
        <div className="page-header">
          <div>
            <h1>Delivery Agents</h1>
            <p>Manage and monitor your delivery personnel across active service areas</p>
          </div>
          <button
            id="create-agent-btn"
            className="btn btn-primary page-action-btn"
            onClick={() => setModal({ type: 'create' })}
          >
            <span>+</span> New Agent
          </button>
        </div>

        {/* ── Stats ── */}
        <div className="stats-bar">
          <div
            className={`stat-card stat-card-clickable ${filters.status === '' ? 'stat-active-all' : ''}`}
            onClick={() => handleStatusFilter('')}
            role="button"
            tabIndex={0}
            onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && handleStatusFilter('')}
            title="Filter table: All Agents"
          >
            <div className="stat-value" style={{ color: 'var(--accent)' }}>{stats.total.toLocaleString()}</div>
            <div className="stat-label">Total Agents</div>
            <div className="stat-hint">{filters.status === '' ? '● Showing All' : 'Click to show all'}</div>
          </div>
          <div
            className={`stat-card stat-card-clickable ${filters.status === 'ACTIVE' ? 'stat-active-active' : ''}`}
            onClick={() => handleStatusFilter('ACTIVE')}
            role="button"
            tabIndex={0}
            onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && handleStatusFilter('ACTIVE')}
            title="Filter table: Active Agents only"
          >
            <div className="stat-value" style={{ color: 'var(--success)' }}>{stats.active.toLocaleString()}</div>
            <div className="stat-label">Active Agents</div>
            <div className="stat-hint">{filters.status === 'ACTIVE' ? '● Filtered Active' : 'Click to filter'}</div>
          </div>
          <div
            className={`stat-card stat-card-clickable ${filters.status === 'INACTIVE' ? 'stat-active-inactive' : ''}`}
            onClick={() => handleStatusFilter('INACTIVE')}
            role="button"
            tabIndex={0}
            onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && handleStatusFilter('INACTIVE')}
            title="Filter table: Inactive Agents only"
          >
            <div className="stat-value" style={{ color: '#cbd5e1' }}>{stats.inactive.toLocaleString()}</div>
            <div className="stat-label">Inactive Agents</div>
            <div className="stat-hint">{filters.status === 'INACTIVE' ? '● Filtered Inactive' : 'Click to filter'}</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--warning)' }}>
              {stats.total ? Math.round((stats.active / stats.total) * 100) : 0}%
            </div>
            <div className="stat-label">Active Ratio</div>
            <div className="stat-hint">Fleet operational</div>
          </div>
        </div>

        {/* ── Toolbar ── */}
        <div className="toolbar">
          <div className="search-box">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              id="search-input"
              type="text"
              placeholder="Search by name, area or phone…"
              value={searchInput}
              onChange={e => {
                setSearchInput(e.target.value)
                handleSearch(e.target.value)
              }}
            />
            {searchInput && (
              <button
                className="search-clear-btn"
                type="button"
                onClick={() => {
                  setSearchInput('')
                  handleSearch('')
                }}
                title="Clear search"
                aria-label="Clear search"
              >✕</button>
            )}
          </div>

          <div className="toolbar-filters">
            <select
              id="status-filter"
              className="filter-select"
              value={filters.status}
              onChange={e => handleStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>

            <select
              id="limit-select"
              className="filter-select"
              value={filters.limit}
              onChange={e => setFilters(prev => ({ ...prev, limit: +e.target.value, page: 1 }))}
            >
              <option value="10">10 / page</option>
              <option value="25">25 / page</option>
              <option value="50">50 / page</option>
            </select>
          </div>
        </div>

        {/* ── Error State ── */}
        {error && (
          <div className="error-alert">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: '1.25rem' }}>⚠️</span>
              <div>
                <div style={{ fontWeight: 600, color: '#fecdd3' }}>Failed to load delivery agents</div>
                <div style={{ fontSize: '0.84rem', color: '#fda4af', marginTop: 2 }}>{error}</div>
              </div>
            </div>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                fetchAgents(filters)
                fetchStats()
              }}
            >Retry</button>
          </div>
        )}

        {/* ── Table ── */}
        <div className="table-container">
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Agent</th>
                  <th>Phone</th>
                  <th>Service Area</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <SkeletonRows count={filters.limit ?? 10} />
                ) : agents.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <div className="empty-state">
                        <div className="empty-state-icon">🔍</div>
                        <h3>No agents found</h3>
                        <p>No agents found. Try a different search or clear your filters.</p>
                        {(filters.q || filters.status) && (
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ marginTop: 14 }}
                            onClick={() => {
                              setSearchInput('')
                              setFilters(prev => ({ ...prev, q: '', status: '', page: 1 }))
                            }}
                          >
                            Clear search & filters
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  agents.map(agent => (
                    <tr key={agent.id}>
                      <td>
                        <div className="agent-cell">
                          <div className="agent-avatar">
                            {agent.fullName[0]?.toUpperCase() || 'A'}
                          </div>
                          <div className="agent-info">
                            <div className="agent-name">{agent.fullName}</div>
                            <div className="agent-email">{agent.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="agent-phone">
                        <a
                          href={`tel:${agent.phone}`}
                          className="agent-phone-clean"
                          title={`Call ${formatPhoneNumber(agent.phone)}`}
                        >
                          {formatPhoneNumber(agent.phone)}
                        </a>
                      </td>
                      <td>
                        <span className="area-tag">{agent.serviceArea}</span>
                      </td>
                      <td>
                        <span className={`badge ${agent.status === 'ACTIVE' ? 'badge-active' : 'badge-inactive'}`}>
                          {agent.status}
                        </span>
                      </td>
                      <td className="agent-date">
                        {formatDate(agent.createdAt)}
                      </td>
                      <td>
                        <div className="row-actions">
                          <button
                            className="btn-action btn-action-view"
                            title="View details"
                            aria-label={`View ${agent.fullName}`}
                            onClick={() => setModal({ type: 'detail', agent })}
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          </button>
                          <button
                            className="btn-action btn-action-edit"
                            title="Edit agent"
                            aria-label={`Edit ${agent.fullName}`}
                            onClick={() => setModal({ type: 'edit', agent })}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                              <path d="m15 5 4 4" />
                            </svg>
                          </button>
                          <button
                            className="btn-action btn-action-delete"
                            title="Delete agent"
                            aria-label={`Delete ${agent.fullName}`}
                            onClick={() => setModal({ type: 'delete', agent })}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M3 6h18" />
                              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && meta.total > 0 && (
            <Pagination
              page={meta.page}
              totalPages={meta.totalPages || 1}
              total={meta.total}
              limit={meta.limit}
              onPage={handlePage}
            />
          )}
        </div>
      </main>

      {/* ── Modals ── */}
      {modal?.type === 'create' && (
        <AgentFormModal
          agent={null}
          onSave={handleCreate}
          onClose={() => setModal(null)}
          loading={actionLoading}
        />
      )}

      {modal?.type === 'edit' && (
        <AgentFormModal
          agent={modal.agent}
          onSave={data => handleUpdate(modal.agent.id, data)}
          onClose={() => setModal(null)}
          loading={actionLoading}
        />
      )}

      {modal?.type === 'detail' && (
        <AgentDetailModal
          agent={modal.agent}
          onClose={() => setModal(null)}
          onEdit={() => setModal({ type: 'edit', agent: modal.agent })}
        />
      )}

      {modal?.type === 'delete' && (
        <DeleteConfirmModal
          agentName={modal.agent.fullName}
          onConfirm={() => handleDelete(modal.agent.id)}
          onClose={() => setModal(null)}
          loading={actionLoading}
        />
      )}
    </div>
  )
}
