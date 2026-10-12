import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { overview, adminList } from '../api/admin'
import { deleteGig } from '../api/gigs'
import { parseApiError } from '../api/client'
import { useAsync } from '../lib/useAsync'
import CategoryArt from '../components/CategoryArt'
import { formatDate, formatRand, displayName, initials } from '../lib/format'

const ROLE_COLORS = { client: '#26A9FF', freelancer: '#8B35FF', admin: '#FFC400' }
const STATUS_DOT = { Active: '●', Paused: '●', Confirmed: '●', Pending: '●', Completed: '●', Cancelled: '○' }
const STATUS_LABEL = { Active: 'Active', Paused: 'Paused', Confirmed: 'Confirmed', Pending: 'Pending', Completed: 'Completed', Cancelled: 'Cancelled' }

function statusClass(s) {
    return (s || '').toLowerCase()
}

export default function AdminPage() {
    const [params, setParams] = useSearchParams()
    const validTabs = ['users', 'gigs', 'bookings']
    const tab = validTabs.includes(params.get('tab')) ? params.get('tab') : 'users'
    const page = Math.max(1, Number(params.get('page')) || 1)

    const setTab = (t) => setParams(t === 'users' ? {} : { tab: t })
    const setPage = (p) => setParams({ ...(tab === 'users' ? {} : { tab }), ...(p > 1 ? { page: String(p) } : {}) })

    const stats = useAsync(() => overview(), [])
    const list = useAsync(() => adminList(tab, { page, limit: 10 }), [tab, page])
    const [deleteTarget, setDeleteTarget] = useState(null)
    const [busy, setBusy] = useState(false)
    const [actionError, setActionError] = useState('')

    const s = stats.data?.data
    const rows = list.data?.data || []
    const meta = list.data?.meta

    async function confirmDelete() {
        setBusy(true)
        try {
            await deleteGig(deleteTarget.id)
            setActionError('')
            list.reload()
            stats.reload()
        } catch (err) {
            setActionError(parseApiError(err).message)
        } finally {
            setDeleteTarget(null)
            setBusy(false)
        }
    }

    return (
        <main className="page-content">
            <h1 className="page-title">Admin overview</h1>
            <p className="page-subtitle">Manage users, gigs and platform activity.</p>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon purple">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth="1.8">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                    </div>
                    <div>
                        <p className="stat-label">Total users</p>
                        <p className="stat-value">{s?.users ?? '–'}</p>
                        <p className="stat-sub">Registered accounts</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon purple">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth="1.8">
                            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                            <line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
                        </svg>
                    </div>
                    <div>
                        <p className="stat-label">Active gigs</p>
                        <p className="stat-value">{s?.gigs ?? '–'}</p>
                        <p className="stat-sub">Listed services</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon purple">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth="1.8">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                    </div>
                    <div>
                        <p className="stat-label">Total bookings</p>
                        <p className="stat-value">{s?.bookings ?? '–'}</p>
                        <p className="stat-sub">All time</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon gold">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FFC400" strokeWidth="1.8">
                            <line x1="12" y1="1" x2="12" y2="23" />
                            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                        </svg>
                    </div>
                    <div>
                        <p className="stat-label">Revenue</p>
                        <p className="stat-value">{s ? formatRand(s.revenue ?? 0) : '–'}</p>
                        <p className="stat-sub">All time</p>
                    </div>
                </div>
            </div>

            <div className="tabs">
                <button className={`tab ${tab === 'users' ? 'active' : ''}`} onClick={() => setTab('users')}>Users</button>
                <button className={`tab ${tab === 'gigs' ? 'active' : ''}`} onClick={() => setTab('gigs')}>Gigs</button>
                <button className={`tab ${tab === 'bookings' ? 'active' : ''}`} onClick={() => setTab('bookings')}>Bookings</button>
            </div>

            {actionError && <p className="error-msg" style={{ marginBottom: 12 }}>{actionError}</p>}

            <div className="table-card">
                <h3 className="table-heading">
                    {tab === 'users' ? 'All users' : tab === 'gigs' ? 'All gigs' : 'All bookings'}
                </h3>

                {list.error ? (
                    <p className="error-msg">Failed to load: {list.error.message} <button className="btn-ghost" onClick={list.reload}>Retry</button></p>
                ) : list.loading && !list.data ? (
                    <p className="loading-msg">Loading…</p>
                ) : rows.length === 0 ? (
                    <p className="text-muted" style={{ padding: '24px 0' }}>No records found.</p>
                ) : tab === 'users' ? (
                    <table className="data-table">
                        <thead>
                            <tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th><th>Action</th></tr>
                        </thead>
                        <tbody>
                            {rows.map(u => (
                                <tr key={u.id}>
                                    <td>
                                        <div className="table-user-cell">
                                            <div className="avatar-sm">{initials(u.name)}</div>
                                            <span>{displayName(u.name)}</span>
                                        </div>
                                    </td>
                                    <td>{u.email}</td>
                                    <td>
                                        <span
                                            className="role-pill"
                                            style={{
                                                background: (ROLE_COLORS[u.role] || '#B9BDE0') + '22',
                                                color: ROLE_COLORS[u.role] || '#B9BDE0',
                                                border: `1px solid ${(ROLE_COLORS[u.role] || '#B9BDE0')}55`,
                                            }}
                                        >
                                            {u.role ? u.role.charAt(0).toUpperCase() + u.role.slice(1) : '–'}
                                        </span>
                                    </td>
                                    <td>{formatDate(u.createdAt)}</td>
                                    <td>
                                        <button className="btn-table-action" onClick={() => navigator.clipboard?.writeText(u.id).catch(() => { })}>
                                            Copy ID
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : tab === 'gigs' ? (
                    <table className="data-table">
                        <thead>
                            <tr><th>Gig</th><th>Freelancer</th><th>Category</th><th>Price</th><th>Status</th><th>Action</th></tr>
                        </thead>
                        <tbody>
                            {rows.map(g => (
                                <tr key={g.id}>
                                    <td>
                                        <div className="table-gig-cell">
                                            <div className="table-gig-icon">
                                                <CategoryArt category={g.category} className="table-cat-img" />
                                            </div>
                                            <p className="table-gig-title">{g.title}</p>
                                        </div>
                                    </td>
                                    <td>{displayName(g.freelancer?.name)}</td>
                                    <td>{g.category}</td>
                                    <td className="text-gold">{formatRand(g.rate)}</td>
                                    <td>
                                        <span className={`status-badge ${statusClass(g.status)}`}>
                                            {STATUS_DOT[g.status] || '●'} {STATUS_LABEL[g.status] || g.status}
                                        </span>
                                    </td>
                                    <td>
                                        <button className="btn-icon-danger" title="Remove gig" onClick={() => setDeleteTarget(g)}>✕</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr><th>Gig</th><th>Client</th><th>Freelancer</th><th>Date</th><th>Amount</th><th>Status</th></tr>
                        </thead>
                        <tbody>
                            {rows.map(b => (
                                <tr key={b.id}>
                                    <td><p className="table-gig-title">{b.gig?.title || '—'}</p></td>
                                    <td>{displayName(b.client?.name)}</td>
                                    <td>{displayName(b.freelancer?.name)}</td>
                                    <td>{formatDate(b.createdAt)}</td>
                                    <td className="text-gold">{formatRand(b.transaction?.amount ?? b.gig?.rate)}</td>
                                    <td>
                                        <span className={`status-badge ${statusClass(b.status)}`}>
                                            {STATUS_DOT[b.status] || '●'} {STATUS_LABEL[b.status] || b.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {meta && (
                    <div className="pagination">
                        <button className="page-btn" disabled={page <= 1} onClick={() => setPage(page - 1)}>‹</button>
                        {Array.from({ length: Math.min(meta.totalPages || 1, 5) }, (_, i) => i + 1).map(n => (
                            <button key={n} className={`page-btn ${n === page ? 'active' : ''}`} onClick={() => setPage(n)}>{n}</button>
                        ))}
                        <button className="page-btn" disabled={page >= (meta.totalPages || 1)} onClick={() => setPage(page + 1)}>›</button>
                        <span className="pagination-info">Showing {rows.length} of {meta.total} {tab}</span>
                    </div>
                )}
            </div>

            {deleteTarget && (
                <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
                    <div className="auth-card" style={{ maxWidth: 400, width: '90%' }}>
                        <h2>Delete this gig?</h2>
                        <p className="subtitle">"{deleteTarget.title}" will be permanently removed from the platform.</p>
                        <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                            <button className="btn-primary" style={{ flex: 1, background: 'var(--hh-red, #EF4444)' }} disabled={busy} onClick={confirmDelete}>
                                {busy ? 'Deleting…' : 'Delete gig'}
                            </button>
                            <button className="btn-ghost" style={{ flex: 1 }} disabled={busy} onClick={() => setDeleteTarget(null)}>
                                Keep it
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    )
}