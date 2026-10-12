import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getGig } from '../api/gigs'
import { createBooking } from '../api/bookings'
import { parseApiError } from '../api/client'
import { useAsync } from '../lib/useAsync'
import { useAuth } from '../context/AuthContext'
import CategoryArt from '../components/CategoryArt'
import { displayName, initials, formatRand } from '../lib/format'
import { sanitiseHtml } from '../lib/sanitize'

export default function GigDetailPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { user } = useAuth()
    const { data, error, loading, reload } = useAsync(() => getGig(id), [id])

    const [notes, setNotes] = useState('')
    const [formError, setFormError] = useState('')
    const [busy, setBusy] = useState(false)

    const gig = data?.data

    async function handleBook(e) {
        e.preventDefault()
        setFormError('')
        setBusy(true)
        try {
            const res = await createBooking({ gigId: gig.id, notes: notes.trim() || undefined })
            navigate(`/booking-confirmed/${res.data.id}`)
        } catch (err) {
            const { message } = parseApiError(err)
            setFormError(message)
            setBusy(false)
        }
    }

    if (loading && !data) {
        return (
            <main className="page-content">
                <p className="loading-msg">Loading gig…</p>
            </main>
        )
    }

    if (error) {
        return (
            <main className="page-content">
                <button className="back-link" onClick={() => navigate('/gigs')}>← Back to results</button>
                <p className="error-msg">
                    {error.status === 404 ? "That gig doesn't exist or has been removed." : error.message}
                </p>
                {error.status !== 404 && <button className="btn-ghost" onClick={reload}>Try again</button>}
            </main>
        )
    }

    const bookable = gig.status === 'Active'
    const freelancerName = displayName(gig.freelancer?.name)
    const freelancerInitials = initials(gig.freelancer?.name)
    const durationText = `${gig.durationHours} ${gig.durationHours === 1 ? 'hour' : 'hours'}`
    const descText = (gig.description || '').replace(/<[^>]+>/g, '').trim()

    return (
        <main className="page-content">
            <button className="back-link" onClick={() => navigate('/gigs')}>← Back to results</button>

            <div className="gig-detail-layout">
                <div className="gig-detail-left">
                    <div className="gig-detail-image">
                        <CategoryArt category={gig.category} className="gig-detail-art" />
                    </div>
                    <div className="gig-detail-meta">
                        <span className="gig-category-badge-lg">{gig.category}</span>
                        <h1 className="gig-detail-title">{gig.title}</h1>
                        <div className="gig-detail-info-row">
                            <div className="avatar-sm">{freelancerInitials}</div>
                            <span>{freelancerName}</span>
                            <span className="dot-sep">·</span>
                            <span>⏱ {durationText}</span>
                        </div>
                    </div>
                    <div className="gig-detail-desc">
                        <h2>Description</h2>
                        {descText ? (
                            descText.split('\n\n').map((p, i) => <p key={i}>{p}</p>)
                        ) : (
                            <div dangerouslySetInnerHTML={{ __html: sanitiseHtml(gig.description) }} />
                        )}
                    </div>
                </div>

                <div className="gig-detail-right">
                    <div className="booking-card">
                        <h2>Book this service</h2>

                        {!user && (
                            <>
                                <p className="booking-card-sub">Log in as a client to place your booking.</p>
                                <BookingSummary gig={gig} freelancerName={freelancerName} durationText={durationText} />
                                <button className="btn-primary w-full" onClick={() => navigate('/login', { state: { from: `/gigs/${gig.id}` } })}>
                                    Log in to book
                                </button>
                                <p className="payment-notice">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#B9BDE0" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
                                    New here? <button className="link-btn" onClick={() => navigate('/register')}>Create an account</button>
                                </p>
                            </>
                        )}

                        {user && user.role !== 'client' && (
                            <>
                                <BookingSummary gig={gig} freelancerName={freelancerName} durationText={durationText} />
                                <p className="payment-notice">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#B9BDE0" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
                                    Only client accounts can book services.
                                </p>
                            </>
                        )}

                        {user?.role === 'client' && (
                            <form onSubmit={handleBook}>
                                <p className="booking-card-sub">Fill in the details below to place your booking.</p>
                                <BookingSummary gig={gig} freelancerName={freelancerName} durationText={durationText} />
                                {formError && <p className="error-msg" style={{ marginBottom: 8 }}>{formError}</p>}
                                {!bookable && <p className="error-msg" style={{ marginBottom: 8 }}>This gig isn't taking bookings right now.</p>}
                                <div className="field">
                                    <label>Notes for the freelancer (optional)</label>
                                    <textarea
                                        className="textarea"
                                        placeholder="Tell the freelancer about your project and any specific requirements…"
                                        value={notes}
                                        onChange={e => setNotes(e.target.value.slice(0, 500))}
                                        rows={5}
                                    />
                                    <span className="char-count">{notes.length} / 500</span>
                                </div>
                                <button type="submit" className="btn-primary w-full" disabled={busy || !bookable}>
                                    {busy ? 'Booking…' : 'Confirm booking'}
                                </button>
                                <div className="payment-notice">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#B9BDE0" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
                                    Payment is simulated, you won't be charged.
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </main>
    )
}

function BookingSummary({ gig, freelancerName, durationText }) {
    return (
        <table className="booking-summary-table">
            <tbody>
                <tr><td>Service</td><td>{gig.title}</td></tr>
                <tr><td>Freelancer</td><td>{freelancerName}</td></tr>
                <tr><td>Duration</td><td>{durationText}</td></tr>
                <tr><td>Price</td><td className="text-gold">{formatRand(gig.rate)}</td></tr>
            </tbody>
        </table>
    )
}