import { Link, useParams } from 'react-router-dom'
import { getBooking } from '../api/bookings'
import { useAsync } from '../lib/useAsync'
import CategoryArt from '../components/CategoryArt'
import { bookingRef, transactionRef, formatDate, formatRand, displayName, initials } from '../lib/format'
import successCheck from '../assets/states/success-check.svg'

export default function BookingConfirmedPage() {
    const { id } = useParams()
    const { data, error, loading, reload } = useAsync(() => getBooking(id), [id])

    if (loading && !data) {
        return (
            <main className="page-content confirmed-page">
                <p className="loading-msg">Loading your booking…</p>
            </main>
        )
    }

    if (error) {
        return (
            <main className="page-content confirmed-page">
                <p className="error-msg">Could not load booking: {error.message}</p>
                <button className="btn-ghost" onClick={reload}>Try again</button>
            </main>
        )
    }

    const b = data?.data
    if (!b) return null

    const gig = b.gig || {}

    return (
        <main className="page-content confirmed-page">
            <div className="confirmed-icon">
                <img src={successCheck} alt="Booking confirmed" width="120" height="120" />
            </div>
            <h1 className="confirmed-heading">Your booking is <span className="text-purple">confirmed</span></h1>
            <p className="confirmed-sub">Payment is simulated, so you have not been charged.</p>

            <div className="confirmed-card">
                <div className="confirmed-card-header">
                    <strong>Booking summary</strong>
                    <span className="status-badge confirmed">● {b.status}</span>
                </div>
                <div className="confirmed-gig-row">
                    <div className="confirmed-gig-image">
                        <CategoryArt category={gig.category} className="confirmed-gig-art" />
                    </div>
                    <div>
                        <p className="confirmed-gig-title">{gig.title}</p>
                        <span className="gig-category-badge-sm">{gig.category}</span>
                        <div className="gig-freelancer-row">
                            <div className="avatar-sm">{initials(b.freelancer?.name)}</div>
                            <span>{displayName(b.freelancer?.name)}</span>
                        </div>
                    </div>
                </div>
                <div className="confirmed-details">
                    <div><span className="detail-label">Booking reference</span><strong>{bookingRef(b)}</strong></div>
                    <div><span className="detail-label">Date</span><strong>{formatDate(b.createdAt)}</strong></div>
                    <div><span className="detail-label">Amount</span><strong className="text-gold">{formatRand(b.transaction?.amount ?? gig.rate)}</strong></div>
                    <div><span className="detail-label">Transaction reference</span><strong>{b.transaction ? transactionRef(b.transaction) : '—'}</strong></div>
                </div>
            </div>

            <div className="confirmed-actions">
                <Link to="/my-bookings" className="btn-primary">View my bookings</Link>
                <Link to="/gigs" className="btn-outline">Browse more gigs</Link>
            </div>
        </main>
    )
}