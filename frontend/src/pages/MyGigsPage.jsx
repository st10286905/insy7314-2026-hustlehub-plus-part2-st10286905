import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { myGigs, setGigStatus, deleteGig } from '../api/gigs'
import { parseApiError } from '../api/client'
import { useAsync } from '../lib/useAsync'
import CategoryArt from '../components/CategoryArt'

export default function MyGigsPage() {
    const navigate = useNavigate()
    const { data, error, loading, reload } = useAsync(() => myGigs(), [])
    const [pendingId, setPendingId] = useState(null)
    const [actionError, setActionError] = useState('')

    const gigs = data?.data || []

    async function toggleStatus(gig) {
        setPendingId(gig.id)
        setActionError('')
        try {
            await setGigStatus(gig.id, gig.status === 'Active' ? 'Paused' : 'Active')
            reload()
        } catch (err) {
            setActionError(parseApiError(err).message)
        } finally {
            setPendingId(null)
        }
    }

    async function handleDelete(gig) {
        if (!window.confirm(`Delete "${gig.title}"? This can't be undone.`)) return
        setPendingId(gig.id)
        setActionError('')
        try {
            await deleteGig(gig.id)
            reload()
        } catch (err) {
            setActionError(parseApiError(err).message)
        } finally {
            setPendingId(null)
        }
    }

    return (
        <main className="page-content">
            <div className="page-header-row">
                <div>
                    <h1 className="page-title">My gigs</h1>
                    <p className="page-subtitle">Manage your services and track bookings.</p>
                </div>
                <button className="btn-primary" onClick={() => navigate('/my-gigs/create')}>+ Create gig</button>            </div>

            {actionError && <p className="error-msg" style={{ marginBottom: 12 }}>{actionError}</p>}

            {error ? (
                <div className="table-card">
                    <p className="error-msg">Failed to load gigs: {error.message}</p>
                    <button className="btn-ghost" onClick={reload}>Try again</button>
                </div>
            ) : loading && !data ? (
                <div className="table-card">
                    <p className="loading-msg">Loading your gigs…</p>
                </div>
            ) : gigs.length === 0 ? (
                <div className="table-card empty-state">
                    <p>You haven't created any gigs yet.</p>
                    <button className="btn-primary" onClick={() => navigate('/my-gigs/create')}>+ Create your first gig</button>
                </div>
            ) : (
                <div className="table-card">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Gig</th>
                                <th>Price</th>
                                <th>Duration</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {gigs.map(g => (
                                <tr key={g.id}>
                                    <td>
                                        <div className="table-gig-cell">
                                            <div className="table-gig-icon">
                                                <CategoryArt category={g.category} className="table-cat-img" />
                                            </div>
                                            <div>
                                                <p className="table-gig-title">{g.title}</p>
                                                <p className="table-gig-cat">{g.category}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="text-gold">R{Number(g.rate).toLocaleString('en-ZA')}</td>
                                    <td>{g.durationHours} {g.durationHours === 1 ? 'hour' : 'hours'}</td>
                                    <td>
                                        <span className={`status-badge ${g.status?.toLowerCase()}`}>
                                            ● {g.status}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button className="btn-table-action" onClick={() => navigate(`/my-gigs/${g.id}/edit`)}>Edit</button>
                                            <button className="btn-table-action" disabled={pendingId === g.id} onClick={() => toggleStatus(g)}>
                                                {g.status === 'Active' ? 'Pause' : 'Resume'}
                                            </button>
                                            <button className="btn-icon-danger" title="Delete" disabled={pendingId === g.id} onClick={() => handleDelete(g)}>✕</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="pagination">
                        <span className="pagination-info">Showing {gigs.length} gig{gigs.length !== 1 ? 's' : ''}</span>
                    </div>
                </div>
            )}
        </main>
    )
}