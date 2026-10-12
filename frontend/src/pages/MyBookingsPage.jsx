import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { myBookings, myTransactions, setBookingStatus } from '../api/bookings'
import { parseApiError } from '../api/client'
import { useAsync } from '../lib/useAsync'
import CategoryArt from '../components/CategoryArt'
import { formatDate, formatRand, displayName, initials, transactionRef } from '../lib/format'

const STATUS_LABEL = { Confirmed: 'Confirmed', Pending: 'Pending', Completed: 'Completed', Cancelled: 'Cancelled' }
const STATUS_DOT = { Confirmed: '●', Pending: '●', Completed: '●', Cancelled: '○' }

function statusClass(s) {
    const map = { Confirmed: 'confirmed', Pending: 'pending', Completed: 'completed', Cancelled: 'cancelled' }
    return map[s] || s?.toLowerCase() || ''
}

export default function MyBookingsPage() {
    const navigate = useNavigate()
    const [params, setParams] = useSearchParams()
    const tab = params.get('tab') === 'transactions' ? 'transactions' : 'bookings'
    const page = Math.max(1, Number(params.get('page')) || 1)

    const setTab = (t) => setParams(t === 'bookings' ? {} : { tab: t })
    const setPage = (p) => setParams({ ...(tab === 'bookings' ? {} : { tab }), ...(p > 1 ? { page: String(p) } : {}) })

    const list = useAsync(
        () => tab === 'bookings' ? myBookings({ page, limit: 5 }) : myTransactions({ page, limit: 5 }),
        [tab, page]
    )

    const [cancelTarget, setCancelTarget] = useState(null)
    const [busy, setBusy] = useState(false)
    const [actionError, setActionError] = useState('')

    const rows = list.data?.data || []
    const meta = list.data?.meta

    async function confirmCancel() {
        setBusy(true)
        try {
            await setBookingStatus(cancelTarget.id, 'Cancelled')
            setCancelTarget(null)
            setActionError('')
            list.reload()
        } catch (err) {
            setActionError(parseApiError(err).message)
            setCancelTarget(null)
        } finally {
            setBusy(false)
        }
    }

    return (
        <main className="page-content">
            <h1 className="page-title">My bookings</h1>
            <p className="page-subtitle">View and manage your bookings, track progress and payments.</p>

            <div className="tabs">
                <button className={`tab ${tab === 'bookings' ? 'active' : ''}`} onClick={() => setTab('bookings')}>Bookings</button>
                <button className={`tab ${tab === 'transactions' ? 'active' : ''}`} onClick={() => setTab('transactions')}>Transactions</button>
            </div>

            {actionError && <p className="error-msg" style={{ marginBottom: 12 }}>{actionError}</p>}

            <div className="table-card">
                <h3 className="table-heading">{tab === 'bookings' ? 'Bookings' : 'Transactions'}</h3>

                {list.error ? (
                    <p className="error-msg">Failed to load: {list.error.message} <button className="btn-ghost" onClick={list.reload}>Retry</button></p>
                ) : list.loading && !list.data ? (
                    <p className="loading-msg">Loading…</p>
                ) : rows.length === 0 ? (
                    <div className="empty-state" style={{ padding: '32px 0' }}>
                        <p>{tab === 'bookings' ? 'No bookings yet.' : 'No transactions yet.'}</p>
                        <button className="btn-primary" onClick={() => navigate('/gigs')}>Browse gigs</button>
                    </div>
                ) : tab === 'bookings' ? (
                    <table className="data-table">
                        <thead>
                            <tr><th>Gig</th><th>Freelancer</th><th>Date</th><th>Amount</th><th>Status</th><th>Action</th></tr>
                        </thead>
                        <tbody>
                            {rows.map(b => (
                                <tr key={b.id}>
                                    <td>
                                        <div className="table-gig-cell">
                                            <div className="table-gig-icon">
                                                <CategoryArt category={b.gig?.category} className="table-cat-img" />
                                            </div>
                                            <div>
                                                <p className="table-gig-title">{b.gig?.title || 'Removed gig'}</p>
                                                <p className="table-gig-cat">{b.gig?.category}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="table-user-cell">
                                            <div className="avatar-sm">{initials(b.freelancer?.name)}</div>
                                            <span>{displayName(b.freelancer?.name)}</span>
                                        </div>
                                    </td>
                                    <td>{formatDate(b.createdAt)}</td>
                                    <td className="text-gold">{formatRand(b.transaction?.amount ?? b.gig?.rate)}</td>
                                    <td>
                                        <span className={`status-badge ${statusClass(b.status)}`}>
                                            {STATUS_DOT[b.status] || '●'} {STATUS_LABEL[b.status] || b.status}
                                        </span>
                                    </td>
                                    <td>
                                        {['Pending', 'Confirmed'].includes(b.status)
                                            ? <button className="btn-table-action" onClick={() => setCancelTarget(b)}>Cancel</button>
                                            : <span className="text-muted">—</span>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr><th>Reference</th><th>Gig</th><th>Date</th><th>Amount</th><th>Status</th></tr>
                        </thead>
                        <tbody>
                            {rows.map(t => (
                                <tr key={t.id}>
                                    <td className="mono" style={{ fontSize: 13 }}>{transactionRef(t)}</td>
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
                                    <td>{formatDate(t.createdAt)}</td>
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

            {cancelTarget && (
                <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
                    <div className="auth-card" style={{ maxWidth: 400, width: '90%' }}>
                        <h2>Cancel this booking?</h2>
                        <p className="subtitle">"{cancelTarget.gig?.title}" will be cancelled and the payment marked as refunded.</p>
                        <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                            <button className="btn-primary" style={{ flex: 1 }} disabled={busy} onClick={confirmCancel}>
                                {busy ? 'Cancelling…' : 'Cancel booking'}
                            </button>
                            <button className="btn-ghost" style={{ flex: 1 }} disabled={busy} onClick={() => setCancelTarget(null)}>
                                Keep booking
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    )
}