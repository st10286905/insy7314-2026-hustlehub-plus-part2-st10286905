import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { listGigs, gigCategories } from '../api/gigs'
import { useAsync } from '../lib/useAsync'
import CategoryArt from '../components/CategoryArt'

const CATEGORY_COLORS = {
    Design: '#A855F7', Development: '#26A9FF', Writing: '#19E58A',
    Marketing: '#FFC400', Other: '#B9BDE0',
}

const ALL_CATEGORIES = ['Development', 'Design', 'Writing', 'Marketing', 'Other']

const SORTS = [
    { value: 'newest', label: 'Newest first' },
    { value: 'price_asc', label: 'Price: low to high' },
    { value: 'price_desc', label: 'Price: high to low' },
]

export default function BrowseGigsPage() {
    const navigate = useNavigate()
    const [params, setParams] = useSearchParams()

    const applied = useMemo(() => ({
        search: params.get('search') || '',
        category: (params.get('category') || '').split(',').filter(c => ALL_CATEGORIES.includes(c)),
        minPrice: params.get('minRate') || '',
        maxPrice: params.get('maxRate') || '',
        sort: SORTS.some(s => s.value === params.get('sort')) ? params.get('sort') : 'newest',
        page: Math.max(1, Number(params.get('page')) || 1),
    }), [params])

    const [draft, setDraft] = useState({
        search: applied.search,
        category: applied.category,
        minPrice: applied.minPrice,
        maxPrice: applied.maxPrice,
    })

    useEffect(() => {
        setDraft({
            search: applied.search,
            category: applied.category,
            minPrice: applied.minPrice,
            maxPrice: applied.maxPrice,
        })
    }, [applied.search, applied.category.join(','), applied.minPrice, applied.maxPrice])

    function update(patch) {
        const next = { ...applied, ...patch }
        const p = new URLSearchParams()
        if (next.search) p.set('search', next.search)
        if (next.category.length) p.set('category', next.category.join(','))
        if (next.minPrice) p.set('minRate', next.minPrice)
        if (next.maxPrice) p.set('maxRate', next.maxPrice)
        if (next.sort !== 'newest') p.set('sort', next.sort)
        if (next.page > 1) p.set('page', String(next.page))
        setParams(p)
    }

    function toggleCat(cat) {
        setDraft(d => ({
            ...d,
            category: d.category.includes(cat) ? d.category.filter(c => c !== cat) : [...d.category, cat],
        }))
    }
    function applyFilters() {
        update({ search: draft.search.trim(), category: draft.category, minPrice: draft.minPrice, maxPrice: draft.maxPrice, page: 1 })
    }
    function clearAll() {
        setDraft({ search: '', category: [], minPrice: '', maxPrice: '' })
        setParams(new URLSearchParams())
    }

    const gigs = useAsync(() => listGigs({
        search: applied.search || undefined,
        category: applied.category.join(',') || undefined,
        minRate: applied.minPrice || undefined,
        maxRate: applied.maxPrice || undefined,
        sort: applied.sort,
        page: applied.page,
        limit: 6,
    }), [params.toString()])

    const cats = useAsync(() => gigCategories({ search: applied.search || undefined }), [applied.search])

    const counts = Object.fromEntries((cats.data?.data || []).map(c => [c.category, c.count]))
    const gigList = gigs.data?.data || []
    const total = gigs.data?.meta?.total ?? 0
    const totalPages = gigs.data?.meta?.totalPages ?? 1

    return (
        <main className="page-content">
            <h1 className="page-title">Find the right <span className="text-purple">service</span></h1>
            <p className="page-subtitle">Browse talented freelancers and get your projects done.</p>

            <div className="search-bar-row">
                <div className="search-wrap">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#B9BDE0" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
                    <input
                        className="search-input"
                        placeholder="What service do you need?"
                        value={draft.search}
                        onChange={e => setDraft(d => ({ ...d, search: e.target.value }))}
                        onKeyDown={e => e.key === 'Enter' && update({ search: draft.search.trim(), page: 1 })}
                    />
                </div>
                <button className="btn-primary search-btn" onClick={() => update({ search: draft.search.trim(), page: 1 })}>Search</button>
            </div>

            <div className="browse-layout">
                <aside className="filters-panel">
                    <h3 className="filters-heading">Filters</h3>
                    <div className="filter-section">
                        <p className="filter-label">Category</p>
                        {ALL_CATEGORIES.map(cat => (
                            <label key={cat} className="filter-check">
                                <input type="checkbox" checked={draft.category.includes(cat)} onChange={() => toggleCat(cat)} />
                                <span>{cat}</span>
                                <span className="filter-count">{counts[cat] ?? '–'}</span>
                            </label>
                        ))}
                    </div>
                    <div className="filter-section">
                        <p className="filter-label">Price range (R)</p>
                        <div className="price-range-row">
                            <div className="price-input-wrap">
                                <span className="price-prefix">R</span>
                                <input className="price-input" placeholder="0" value={draft.minPrice} onChange={e => setDraft(d => ({ ...d, minPrice: e.target.value }))} />
                            </div>
                            <div className="price-input-wrap">
                                <span className="price-prefix">R</span>
                                <input className="price-input" placeholder="5 000" value={draft.maxPrice} onChange={e => setDraft(d => ({ ...d, maxPrice: e.target.value }))} />
                            </div>
                        </div>
                    </div>
                    <button className="btn-primary w-full" onClick={applyFilters}>Apply filters</button>
                    <button className="btn-ghost w-full mt-2" onClick={clearAll}>Clear all</button>
                </aside>

                <section className="gigs-section">
                    <div className="gigs-results-header">
                        <span className="results-count">
                            {gigs.loading && !gigs.data ? 'Loading…' : `${total} services found`}
                        </span>
                        <div className="sort-wrap">
                            <span className="sort-label">Sort by</span>
                            <select className="sort-select" value={applied.sort} onChange={e => update({ sort: e.target.value, page: 1 })}>
                                {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                            </select>
                        </div>
                    </div>

                    {gigs.error ? (
                        <p className="error-msg">Failed to load gigs: {gigs.error.message}</p>
                    ) : gigs.loading && !gigs.data ? (
                        <div className="gigs-grid">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="gig-card skeleton-card" style={{ height: 280 }} />
                            ))}
                        </div>
                    ) : gigList.length === 0 ? (
                        <div className="empty-state">
                            <p>No services match your search. Try different keywords or clear your filters.</p>
                            <button className="btn-ghost" onClick={clearAll}>Clear all filters</button>
                        </div>
                    ) : (
                        <div className="gigs-grid">
                            {gigList.map(gig => (
                                <div
                                    key={gig.id}
                                    className="gig-card"
                                    onClick={() => navigate(`/gigs/${gig.id}`)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <div className="gig-card-image">
                                        <span
                                            className="gig-category-badge"
                                            style={{
                                                background: (CATEGORY_COLORS[gig.category] || '#B9BDE0') + '22',
                                                color: CATEGORY_COLORS[gig.category] || '#B9BDE0',
                                                border: `1px solid ${(CATEGORY_COLORS[gig.category] || '#B9BDE0')}55`,
                                            }}
                                        >
                                            {gig.category}
                                        </span>
                                        <CategoryArt category={gig.category} className="gig-category-art" />
                                    </div>
                                    <div className="gig-card-body">
                                        <h3 className="gig-title">{gig.title}</h3>
                                        <p className="gig-desc">{gig.description?.replace(/<[^>]+>/g, '').slice(0, 90)}</p>
                                        <div className="gig-card-footer">
                                            <div className="gig-freelancer">
                                                <div className="avatar-sm">
                                                    {(gig.freelancer?.name || '?').split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()}
                                                </div>
                                                <span>{gig.freelancer?.name || 'Freelancer'}</span>
                                            </div>
                                            <div className="gig-meta-right">
                                                <span className="gig-duration">⏱ {gig.durationHours} {gig.durationHours === 1 ? 'hour' : 'hours'}</span>
                                                <span className="gig-price">R{Number(gig.rate).toLocaleString('en-ZA')}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {!gigs.error && gigList.length > 0 && (
                        <div className="pagination">
                            <button className="page-btn" disabled={applied.page <= 1} onClick={() => update({ page: applied.page - 1 })}>‹</button>
                            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(n => (
                                <button key={n} className={`page-btn ${n === applied.page ? 'active' : ''}`} onClick={() => update({ page: n })}>{n}</button>
                            ))}
                            <button className="page-btn" disabled={applied.page >= totalPages} onClick={() => update({ page: applied.page + 1 })}>›</button>
                            <span className="pagination-info">Showing {gigList.length} of {total} services</span>
                        </div>
                    )}
                </section>
            </div>
        </main>
    )
}