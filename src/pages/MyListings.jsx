import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Loader } from '../components/ProtectedRoute';
import '../styles/MyListings.css';

const TABS = ['active', 'reserved', 'sold', 'flagged'];

const STATUS_BADGE = {
    active: 'badge-success',
    reserved: 'badge-warning',
    sold: 'badge-muted',
    flagged: 'badge-danger',
};

export default function MyListings() {
    const { user } = useAuth();

    const [tab, setTab] = useState('active');
    const [listings, setListings] = useState({ active: [], reserved: [], sold: [], flagged: [] });
    const [loaded, setLoaded] = useState({ active: false, reserved: false, sold: false, flagged: false });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (loaded[tab]) return;
        fetchTab(tab);
    }, [tab]);

    async function fetchTab(status) {
        setLoading(true);
        setError('');
        try {
            const res = await api.get('/api/listings', {
                params: { seller: user._id, status, limit: 50 },
            });
            const data = res.data?.data?.listings || [];
            
            // The backend now correctly filters, but we keep a light filter just in case
            const filteredData = data.filter(listing => listing.status === status);
            setListings(prev => ({ ...prev, [status]: filteredData }));
            setLoaded(prev => ({ ...prev, [status]: true }));
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load listings.');
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete(id) {
        if (!window.confirm('Delete this listing? This cannot be undone.')) return;
        try {
            await api.delete(`/api/listings/${id}`);
            const targetId = String(id);
            setListings(prev => ({
                ...prev,
                [tab]: prev[tab].filter(l => String(l._id || l.id) !== targetId),
            }));
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete.');
        }
    }

    async function handleMarkSold(id) {
        if (!window.confirm('Mark this listing as sold?')) return;
        try {
            await api.patch(`/api/listings/${id}/sold`);
            const targetId = String(id);
            const listing = listings.active.find(l => String(l._id || l.id) === targetId);
            setListings(prev => ({
                ...prev,
                active: prev.active.filter(l => String(l._id || l.id) !== targetId),
                sold: listing ? [...prev.sold, { ...listing, status: 'sold' }] : prev.sold,
            }));
            setLoaded(prev => ({ ...prev, sold: false }));
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to mark as sold.');
        }
    }

    const current = listings[tab];

    return (
        <div className="page-container">
            <div className="listings-header">
                <div className="page-header" style={{ marginBottom: 0 }}>
                    <h1>My Listings</h1>
                    <p>Manage everything you've posted</p>
                </div>
                <Link to="/listings/new" className="btn btn-primary">+ New Listing</Link>
            </div>

            {/* Tabs */}
            <div className="tabs">
                {TABS.map(t => (
                    <button
                        key={t}
                        className={`tab-btn ${tab === t ? 'active' : ''}`}
                        onClick={() => setTab(t)}
                    >
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                        {listings[t].length > 0 && (
                            <span className="tab-count">{listings[t].length}</span>
                        )}
                    </button>
                ))}
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            {loading ? (
                <Loader text={`Loading ${tab} listings…`} />
            ) : current.length === 0 ? (
                <div className="empty-state">
                    <h3>No {tab} listings</h3>
                    <p>
                        {tab === 'active'
                            ? "You haven't posted anything yet."
                            : `Nothing in ${tab} right now.`}
                    </p>
                    {tab === 'active' && (
                        <Link to="/listings/new" className="btn btn-primary">
                            Create your first listing
                        </Link>
                    )}
                </div>
            ) : (
                <div className="my-listings-table">
                    <div className="table-header">
                        <span>Item</span>
                        <span>Price</span>
                        <span>Status</span>
                        <span>Views</span>
                        <span>Actions</span>
                    </div>

                    {current.map(listing => {
                        const thumb = listing.images?.[0];
                        const thumbUrl = typeof thumb === 'string' ? thumb : thumb?.url;

                        return (
                            <div key={listing._id} className="table-row">
                                {/* Item */}
                                <div className="table-item">
                                    <div className="table-thumb">
                                        {thumbUrl
                                            ? <img src={thumbUrl} alt={listing.title} />
                                            : <span>📦</span>
                                        }
                                    </div>
                                    <div className="table-item-info">
                                        <p className="table-title">{listing.title}</p>
                                        <p className="table-category">
                                            {listing.category?.replace(/-/g, ' ')}
                                        </p>
                                    </div>
                                </div>

                                {/* Price */}
                                <span className="table-price">
                                    ₹{listing.price?.toLocaleString('en-IN')}
                                </span>

                                {/* Status */}
                                <span className={`badge ${STATUS_BADGE[listing.status] || 'badge-muted'}`}>
                                    {listing.status}
                                </span>

                                {/* Views */}
                                <span className="table-views">👁 {listing.views || 0}</span>

                                {/* Actions */}
                                <div className="table-actions">
                                    <Link to={`/listings/${listing._id}`} className="btn btn-ghost btn-sm">
                                        View
                                    </Link>
                                    <Link to={`/listings/${listing._id}/edit`} className="btn btn-secondary btn-sm">
                                        Edit
                                    </Link>
                                    {listing.status === 'active' && (
                                        <button
                                            className="btn btn-success btn-sm"
                                            onClick={() => handleMarkSold(listing._id)}
                                        >
                                            Sold
                                        </button>
                                    )}
                                    <button
                                        className="btn btn-danger btn-sm"
                                        onClick={() => handleDelete(listing._id)}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}