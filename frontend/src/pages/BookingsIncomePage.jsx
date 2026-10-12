import { useState } from 'react'
import { incomingBookings, income, setBookingStatus } from '../api/bookings'
import { parseApiError } from '../api/client'
import { useAsync } from '../lib/useAsync'
import CategoryArt from '../components/CategoryArt'
import { formatMonth, formatRand, formatDate, displayName, initials } from '../lib/format'

const STATUS_LABEL = { Confirmed: 'Confirmed', Pending: 'Pending', Completed: 'Completed', Cancelled: 'Cancelled' }
const STATUS_DOT = { Confirmed: '●', Pending: '●', Completed: '●', Cancelled: '○' }

function statusClass(s) {
    const map = { Confirmed: 'confirmed', Pending: 'pending', Completed: 'completed', Cancelled: 'cancelled' }
    return map[s] || s?.toLowerCase() || ''
}

export default function BookingsIncomePage() {
    const [tab, setTab] = useState('bookings')

    return (
        <main className="page-content">
            <h1 className="page-title">Bookings &amp; income</h1>
            <p className="page-subtitle">Track your earnings, manage client bookings and view your income history.</p>

            <div className="tabs">
                <button className={`tab ${tab === 'bookings' ? 'active' : ''}`} onClick={() => setTab('bookings')}>Bookings</button>
                <button className={`tab ${tab === 'transactions' ? 'active' : ''}`} onClick={() => setTab('transactions')}>Income</button>
            </div>

            {tab === 'bookings' ? <IncomingTab /> : <IncomeTab />}
        </main>
    )
}

function IncomingTab() {
    const [page, setPage] = useState(1)
    const list = useAsync(() => incomingBookings({ page, limit: 8 }), [page])
    const [pendingId, setPendingId] = useState(null)
    const [actionError, setActionError] = useState('')

    const rows = list.data?.data || []
    const meta = list.data?.meta

    async function markComplete(booking) {
        setPendingId(booking.id)
        setActionError('')
        try {
            await setBookingStatus(booking.id, 'Completed')
            list.reload()
        } catch (err) {
            setActionError(parseApiError(err).message)
        } finally {
            setPendingId(null)
        }
    }

    return (
        <div className="income-layout">
            <div className="table-card" style={{ marginTop: 0 }}>
                <h3 className="table-heading">Incoming bookings</h3>
                {actionError && <p className="error-msg" style={{ marginBottom: 8 }}>{actionError}</p>}
                {list.error ? (
                    <p className="error-msg">Failed to load bookings: {list.error.message}</p>
                ) : list.loading && !list.data ? (
                    <p className="loading-msg">Loading…</p>
                ) : rows.length === 0 ? (
                    <p className="text-muted" style={{ padding: '24px 0' }}>No bookings yet. When a client books one of your gigs it will show up here.</p>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr><th>Gig</th><th>Client</th><th>Amount</th><th>Status</th><th>Action</th></tr>
                        </thead>
                        <tbody>
                            {rows.map(b => {
                                const open = ['Pending', 'Confirmed'].includes(b.status)
                                return (
                                    <tr key={b.id}>
                                        <td>
                                            <div className="table-gig-cell">
                                                <div className="table-gig-icon">
                                                    <CategoryArt category={b.gig?.category} className="table-cat-img" />
                                                </div>
                                                <div>
                                                    <p className="table-gig-title">{b.gig?.title || 'Removed gig'}</p>
                                                    <p className="table-gig-cat">{formatDate(b.createdAt)}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="table-user-cell">
                                                <div className="avatar-sm">{initials(b.client?.name)}</div>
                                                <span>{displayName(b.client?.name)}</span>
                                            </div>
                                        </td>
                                        <td className="text-gold">{formatRand(b.transaction?.amount ?? b.gig?.rate)}</td>
                                        <td>
                                            <span className={`status-badge ${statusClass(b.status)}`}>
                                                {STATUS_DOT[b.status] || '●'} {STATUS_LABEL[b.status] || b.status}
                                            </span>
                                        </td>
                                        <td>
                                            {open
                                                ? <button className="btn-table-action" disabled={pendingId === b.id} onClick={() => markComplete(b)}>Mark complete</button>
                                                : <span className="text-muted">—</span>}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                )}
                {meta && (
                    <div className="pagination">
                        <button className="page-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>‹</button>
                        <span className="pagination-info">Page {page} of {meta.totalPages || 1}</span>
                        <button className="page-btn" disabled={page >= (meta.totalPages || 1)} onClick={() => setPage(p => p + 1)}>›</button>
                    </div>
                )}
            </div>
        </div>
    )
}

function IncomeTab() {
    const { data, error, loading, reload } = useAsync(() => income(), [])

    if (error) return <p className="error-msg">Failed to load income: {error.message} <button className="btn-ghost" onClick={reload}>Retry</button></p>
    if (loading && !data) return <p className="loading-msg">Loading…</p>

    const d = data?.data || {}
    const byMonth = d.byMonth || []
    const recent = d.recent || []

    return (
        <>
            <div className="stats-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <div className="stat-card">
                    <div className="stat-icon gold">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FFC400" strokeWidth="1.8">
                            <circle cx="8" cy="8" r="5" />
                            <path d="M18.09 10.37A6 6 0 1 1 10.34 18" />
                            <path d="M7 6h1v4" />
                            <path d="m16.71 13.88.7.71-2.82 2.82" />
                        </svg>
                    </div>
                    <div>
                        <p className="stat-label">Total earnings</p>
                        <p className="stat-value">{formatRand(d.totalEarned)}</p>
                        <p className="stat-sub">All time</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon green">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#19E58A" strokeWidth="1.8">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                    </div>
                    <div>
                        <p className="stat-label">Completed</p>
                        <p className="stat-value">{d.completedCount ?? 0}</p>
                        <p className="stat-sub">All time</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon purple">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth="1.8">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                        </svg>
                    </div>
                    <div>
                        <p className="stat-label">Pending</p>
                        <p className="stat-value">{d.pendingCount ?? 0}</p>
                        <p className="stat-sub">In progress</p>
                    </div>
                </div>
            </div>

            <div className="income-layout">
                <div className="table-card" style={{ marginTop: 0 }}>
                    <h3 className="table-heading">By month</h3>
                    {byMonth.length === 0 ? (
                        <p className="text-muted" style={{ padding: '16px 0' }}>No income data yet.</p>
                    ) : (
                        <table className="data-table">
                            <thead>
                                <tr><th>Month</th><th>Bookings</th><th>Earned</th></tr>
                            </thead>
                            <tbody>
                                {byMonth.map(m => (
                                    <tr key={m.month}>
                                        <td>{formatMonth(m.month)}</td>
                                        <td>{m.count}</td>
                                        <td className="text-gold">{formatRand(m.amount)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                <div className="table-card" style={{ marginTop: 0 }}>
                    <h3 className="table-heading">Recent transactions</h3>
                    {recent.length === 0 ? (
                        <p className="text-muted" style={{ padding: '16px 0' }}>No transactions yet.</p>
                    ) : (
                        <table className="data-table">
                            <thead>
                                <tr><th>Gig</th><th>Client</th><th>Amount</th><th>Status</th></tr>
                            </thead>
                            <tbody>
                                {recent.map(t => (
                                    <tr key={t.id}>
                                        <td>
                                            <div className="table-gig-cell">
                                                <div className="table-gig-icon">
                                                    <CategoryArt category={t.gig?.category} className="table-cat-img" />
                                                </div>
                                                <div>
                                                    <p className="table-gig-title">{t.gig?.title || 'Removed gig'}</p>
                                                    <p className="table-gig-cat">{t.gig?.category}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="table-user-cell">
                                                <div className="avatar-sm">{initials(t.client?.name)}</div>
                                                <span>{displayName(t.client?.name)}</span>
                                            </div>
                                        </td>
                                        <td className="text-gold">{formatRand(t.amount)}</td>
                                        <td>
                                            <span className={`status-badge ${statusClass(t.status)}`}>
                                                {STATUS_DOT[t.status] || '●'} {STATUS_LABEL[t.status] || t.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </>
    )
}