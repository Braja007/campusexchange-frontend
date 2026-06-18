import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import ListingCard from '../components/ListingCard';
import { Loader } from '../components/ProtectedRoute';
import '../styles/Listings.css';

const CATEGORIES = ['books', 'electronics', 'calculators', 'cycles', 'hostel-essentials', 'lab-equipment', 'clothing', 'sports', 'other'];
const CONDITIONS = ['new', 'like-new', 'good', 'fair', 'poor'];
const SORT_OPTIONS = [
    { value: '-createdAt', label: 'Newest first' },
    { value: 'createdAt', label: 'Oldest first' },
    { value: 'price', label: 'Price: low to high' },
    { value: '-price', label: 'Price: high to low' },
];

export default function Listings() {
    const [searchParams, setSearchParams] = useSearchParams();

    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [pagination, setPagination] = useState({});

    // Filter state — read from URL on mount
    const [query, setQuery] = useState(searchParams.get('q') || '');
    const [category, setCategory] = useState(searchParams.get('category') || '');
    const [condition, setCondition] = useState(searchParams.get('condition') || '');
    const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
    const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
    const [sort, setSort] = useState(searchParams.get('sort') || '-createdAt');
    const [page, setPage] = useState(Number(searchParams.get('page')) || 1);

    const fetchListings = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const params = { page, limit: 12, sort };
            if (query) params.q = query;
            if (category) params.category = category;
            if (condition) params.condition = condition;
            if (minPrice) params.minPrice = minPrice;
            if (maxPrice) params.maxPrice = maxPrice;

            const res = await api.get('/api/listings', { params });
            setListings(res.data?.data?.listings || []);
            setPagination(res.data?.data?.pagination || {});
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load listings.');
        } finally {
            setLoading(false);
        }
    }, [query, category, condition, minPrice, maxPrice, sort, page]);

    useEffect(() => {
        fetchListings();
    }, [fetchListings]);

    // Sync filters to URL
    useEffect(() => {
        const params = {};
        if (query) params.q = query;
        if (category) params.category = category;
        if (condition) params.condition = condition;
        if (minPrice) params.minPrice = minPrice;
        if (maxPrice) params.maxPrice = maxPrice;
        if (sort) params.sort = sort;
        if (page > 1) params.page = page;
        setSearchParams(params, { replace: true });
    }, [query, category, condition, minPrice, maxPrice, sort, page]);

    function handleSearch(e) {
        e.preventDefault();
        setPage(1);
        fetchListings();
    }

    function handleFilterChange(setter) {
        return (e) => { setter(e.target.value); setPage(1); };
    }

    function clearFilters() {
        setQuery(''); setCategory(''); setCondition('');
        setMinPrice(''); setMaxPrice(''); setSort('-createdAt'); setPage(1);
    }

    const hasFilters = query || category || condition || minPrice || maxPrice;

    return (
        <div className="page-container">
            <div className="listings-header">
                <div className="page-header" style={{ marginBottom: 0 }}>
                    <h1>Browse Listings</h1>
                    <p>Buy and sell second-hand items on campus</p>
                </div>
                <Link to="/listings/new" className="btn btn-primary">+ New Listing</Link>
            </div>

            {/* Search bar */}
            <form className="search-bar" onSubmit={handleSearch}>
                <input
                    type="text"
                    placeholder="Search anything — try 'cheap cycle' or 'MTech books'"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
                <button type="submit" className="btn btn-primary">Search</button>
            </form>

            {/* Filters row */}
            <div className="filters-row">
                <select value={category} onChange={handleFilterChange(setCategory)}>
                    <option value="">All Categories</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/-/g, ' ')}</option>)}
                </select>

                <select value={condition} onChange={handleFilterChange(setCondition)}>
                    <option value="">Any Condition</option>
                    {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>

                <input
                    type="number"
                    placeholder="Min ₹"
                    value={minPrice}
                    onChange={handleFilterChange(setMinPrice)}
                    style={{ width: '100px' }}
                />
                <input
                    type="number"
                    placeholder="Max ₹"
                    value={maxPrice}
                    onChange={handleFilterChange(setMaxPrice)}
                    style={{ width: '100px' }}
                />

                <select value={sort} onChange={handleFilterChange(setSort)}>
                    {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>

                {hasFilters && (
                    <button className="btn btn-ghost btn-sm" onClick={clearFilters}>✕ Clear</button>
                )}
            </div>

            {/* Results */}
            {error && <div className="alert alert-error">{error}</div>}

            {loading ? (
                <Loader text="Finding listings…" />
            ) : listings.length === 0 ? (
                <div className="empty-state">
                    <h3>No listings found</h3>
                    <p>{hasFilters ? 'Try adjusting your filters or search query.' : 'Be the first to post something!'}</p>
                    <Link to="/listings/new" className="btn btn-primary">Create Listing</Link>
                </div>
            ) : (
                <>
                    <div className="listings-meta">
                        <span>{pagination.total || listings.length} results</span>
                    </div>
                    <div className="listings-grid">
                        {listings.map(listing => (
                            <ListingCard key={listing._id || listing.id} listing={listing} />
                        ))}
                    </div>

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="pagination">
                            <button
                                className="btn btn-ghost btn-sm"
                                disabled={!pagination.hasPrevPage}
                                onClick={() => setPage(p => p - 1)}
                            >
                                ← Prev
                            </button>
                            <span className="page-info">Page {pagination.page} of {pagination.totalPages}</span>
                            <button
                                className="btn btn-ghost btn-sm"
                                disabled={!pagination.hasNextPage}
                                onClick={() => setPage(p => p + 1)}
                            >
                                Next →
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}