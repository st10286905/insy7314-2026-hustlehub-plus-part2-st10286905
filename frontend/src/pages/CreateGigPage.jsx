import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createGig, updateGig, getGig } from '../api/gigs'
import { parseApiError } from '../api/client'
import { useAsync } from '../lib/useAsync'

const CATEGORIES = ['Design', 'Development', 'Writing', 'Marketing', 'Other']
const LIMITS = { title: 80, description: 1000, rateMin: 50, hoursMin: 1, hoursMax: 200 }

export default function CreateGigPage() {
    const { id } = useParams()
    const editing = Boolean(id)
    const navigate = useNavigate()

    const loaded = useAsync(() => (editing ? getGig(id) : Promise.resolve(null)), [id])

    if (loaded.loading && editing) {
        return (
            <main className="page-content">
                <p className="loading-msg">Loading gig…</p>
            </main>
        )
    }

    if (loaded.error) {
        return (
            <main className="page-content">
                <button className="back-link" onClick={() => navigate('/my-gigs')}>← Back to my gigs</button>
                <p className="error-msg">Failed to load gig: {loaded.error.message}</p>
                <button className="btn-ghost" onClick={loaded.reload}>Try again</button>
            </main>
        )
    }

    const gig = loaded.data?.data
    const initial = gig
        ? { title: gig.title, category: gig.category, description: gig.description || '', price: String(gig.rate), duration: String(gig.durationHours), status: gig.status === 'Active' ? 'active' : 'paused' }
        : { title: '', category: 'Design', description: '', price: '', duration: '', status: 'active' }

    return <GigForm key={id || 'new'} editing={editing} gigId={id} initial={initial} />
}

function GigForm({ editing, gigId, initial }) {
    const navigate = useNavigate()
    const [form, setForm] = useState(initial)
    const [errors, setErrors] = useState({})
    const [formError, setFormError] = useState('')
    const [busy, setBusy] = useState(false)

    function set(field, val) {
        setForm(prev => ({ ...prev, [field]: val }))
        if (errors[field]) setErrors(e => ({ ...e, [field]: '' }))
    }

    function validate() {
        const e = {}
        if (!form.title.trim()) e.title = 'Title is required.'
        else if (form.title.length > LIMITS.title) e.title = `Title must be ${LIMITS.title} characters or less.`
        if (!form.category) e.category = 'Please select a category.'
        if (!form.description.trim()) e.description = 'Description is required.'
        else if (form.description.length > LIMITS.description) e.description = `Description must be ${LIMITS.description} characters or less.`
        const rate = Number(form.price)
        if (!form.price || isNaN(rate) || rate < LIMITS.rateMin) e.price = `Price must be at least R${LIMITS.rateMin}.`
        const hours = Number(form.duration)
        if (!form.duration || isNaN(hours) || hours < LIMITS.hoursMin || hours > LIMITS.hoursMax)
            e.duration = `Duration must be between ${LIMITS.hoursMin} and ${LIMITS.hoursMax} hours.`
        return e
    }

    async function handleSubmit(e) {
        e.preventDefault()
        setFormError('')
        const errs = validate()
        if (Object.keys(errs).length) { setErrors(errs); return }
        setErrors({})
        setBusy(true)

        const payload = {
            title: form.title.trim(),
            category: form.category,
            description: form.description.trim(),
            rate: Number(form.price),
            durationHours: Number(form.duration),
            status: form.status === 'active' ? 'Active' : 'Paused',
        }

        try {
            if (editing) await updateGig(gigId, payload)
            else await createGig(payload)
            navigate('/my-gigs')
        } catch (err) {
            const { message, fields } = parseApiError(err)
            if (Object.keys(fields).length) {
                const mapped = {}
                if (fields.title) mapped.title = fields.title
                if (fields.category) mapped.category = fields.category
                if (fields.description) mapped.description = fields.description
                if (fields.rate) mapped.price = fields.rate
                if (fields.durationHours) mapped.duration = fields.durationHours
                setErrors(mapped)
                setFormError('Please fix the highlighted fields.')
            } else {
                setFormError(message)
            }
            setBusy(false)
        }
    }

    return (
        <main className="page-content">
            <button className="back-link" onClick={() => navigate('/my-gigs')}>← Back to my gigs</button>
            <div className="create-gig-wrap">
                <h1 className="page-title">{editing ? 'Edit gig' : 'Create a new gig'}</h1>
                <p className="page-subtitle">
                    {editing ? 'Update your service details.' : 'Fill in the details below to list your service.'}
                </p>

                <form className="table-card" onSubmit={handleSubmit} style={{ padding: '32px', marginTop: '24px' }} noValidate>
                    {formError && <p className="error-msg" style={{ marginBottom: 16 }}>{formError}</p>}

                    <div className="field">
                        <label>Gig title</label>
                        <input
                            className={`input ${errors.title ? 'is-invalid' : ''}`}
                            placeholder="e.g. Modern logo design for your brand"
                            value={form.title}
                            onChange={e => set('title', e.target.value)}
                            maxLength={LIMITS.title}
                        />
                        {errors.title && <span className="field-error">{errors.title}</span>}
                        <span className="char-count">{form.title.length} / {LIMITS.title}</span>
                    </div>

                    <div className="two-col-fields">
                        <div className="field">
                            <label>Category</label>
                            <select className={`input ${errors.category ? 'is-invalid' : ''}`} value={form.category} onChange={e => set('category', e.target.value)}>
                                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                            </select>
                            {errors.category && <span className="field-error">{errors.category}</span>}
                        </div>
                        <div className="field">
                            <label>Price (R)</label>
                            <input
                                className={`input ${errors.price ? 'is-invalid' : ''}`}
                                type="number"
                                placeholder="e.g. 850"
                                min={LIMITS.rateMin}
                                step="1"
                                value={form.price}
                                onChange={e => set('price', e.target.value)}
                            />
                            {errors.price && <span className="field-error">{errors.price}</span>}
                        </div>
                    </div>

                    <div className="field">
                        <label>Duration (hours)</label>
                        <input
                            className={`input ${errors.duration ? 'is-invalid' : ''}`}
                            type="number"
                            placeholder="e.g. 3"
                            min={LIMITS.hoursMin}
                            max={LIMITS.hoursMax}
                            step="1"
                            value={form.duration}
                            onChange={e => set('duration', e.target.value)}
                        />
                        {errors.duration && <span className="field-error">{errors.duration}</span>}
                    </div>

                    <div className="field">
                        <label>Description</label>
                        <textarea
                            className={`textarea ${errors.description ? 'is-invalid' : ''}`}
                            placeholder="Describe your service in detail. What's included, what the client can expect..."
                            rows={6}
                            value={form.description}
                            onChange={e => set('description', e.target.value)}
                            maxLength={LIMITS.description}
                        />
                        {errors.description && <span className="field-error">{errors.description}</span>}
                        <span className="char-count">{form.description.length} / {LIMITS.description}</span>
                    </div>

                    <div className="field">
                        <label>Status</label>
                        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                            {['active', 'paused'].map(s => (
                                <label
                                    key={s}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
                                        padding: '12px 20px',
                                        border: `1.5px solid ${form.status === s ? 'var(--hh-purple, #6D28FF)' : 'var(--hh-border, #27324F)'}`,
                                        borderRadius: '8px',
                                        background: form.status === s ? 'rgba(109,40,255,0.08)' : 'transparent',
                                        color: 'var(--hh-text, #F5F7FF)', fontSize: '14px',
                                    }}
                                >
                                    <input
                                        type="radio"
                                        name="status"
                                        value={s}
                                        checked={form.status === s}
                                        onChange={() => set('status', s)}
                                        style={{ accentColor: 'var(--hh-purple, #6D28FF)' }}
                                    />
                                    {s === 'active' ? '🟢 Active — visible to clients' : '⏸ Paused — hidden from search'}
                                </label>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                        <button type="submit" className="btn-primary" disabled={busy}>
                            {busy ? 'Saving…' : editing ? 'Update gig' : 'Save gig'}
                        </button>
                        <button type="button" className="btn-ghost" disabled={busy} onClick={() => navigate('/my-gigs')}>Cancel</button>
                    </div>
                </form>
            </div>
        </main>
    )
}