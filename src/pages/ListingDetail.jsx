import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Loader } from '../components/ProtectedRoute';
import '../styles/ListingDetail.css';

const SCAM_CONFIG = {
    low: { class: 'badge-success', label: 'Low Risk' },
    medium: { class: 'badge-warning', label: 'Medium Risk ⚠' },
    high: { class: 'badge-danger', label: 'High Risk ⚠' },
};

const CONDITION_CONFIG = {
    'new': 'badge-accent',
    'like-new': 'badge-success',
    'good': 'badge-success',
    'fair': 'badge-warning',
    'poor': 'badge-danger',
};

export default function ListingDetail() {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [listing, setListing] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeImg, setActiveImg] = useState(0);

    // Offer state
    const [offerAmount, setOfferAmount] = useState('');
    const [offerLoading, setOfferLoading] = useState(false);
    const [offerMsg, setOfferMsg] = useState({ type: '', text: '' });

    // Wishlist state
    const [wishlisted, setWishlisted] = useState(false);
    const [wishLoading, setWishLoading] = useState(false);

    // Delete state
    const [deleteLoading, setDeleteLoading] = useState(false);

    useEffect(() => {
        if (!id || id === 'undefined') {
            navigate('/listings', { replace: true });
            return;
        }

        async function fetchListing() {
            try {
                const res = await api.get(`/api/listings/${id}`);
                const data = res.data?.data?.listing || res.data?.data;
                setListing(data);
            } catch (err) {
                setError(err.response?.data?.message || 'Listing not found.');
            } finally {
                setLoading(false);
            }
        }
        fetchListing();
    }, [id]);

    // Check wishlist status
    useEffect(() => {
        async function checkWishlist() {
            try {
                const res = await api.get('/api/users/wishlist');
                const wishlist = res.data?.data?.wishlist || [];
                setWishlisted(wishlist.some(item => (item._id || item) === id));
            } catch { }
        }
        if (user) checkWishlist();
    }, [id, user]);

    async function handleOffer(e) {
        e.preventDefault();
        if (!offerAmount || Number(offerAmount) <= 0) {
            setOfferMsg({ type: 'error', text: 'Enter a valid offer amount.' });
            return;
        }
        setOfferLoading(true);
        setOfferMsg({ type: '', text: '' });
        try {
            await api.post('/api/offers', { listingId: id, amount: Number(offerAmount) });
            setOfferMsg({ type: 'success', text: 'Offer sent! Check your offers page.' });
            setOfferAmount('');
        } catch (err) {
            setOfferMsg({ type: 'error', text: err.response?.data?.message || 'Failed to send offer.' });
        } finally {
            setOfferLoading(false);
        }
    }

    async function handleWishlist() {
        setWishLoading(true);
        try {
            await api.post(`/api/users/wishlist/${id}`);
            setWishlisted(prev => !prev);
        } catch { }
        finally { setWishLoading(false); }
    }

    async function handleMarkSold() {
        if (!window.confirm('Mark this listing as sold?')) return;
        try {
            await api.patch(`/api/listings/${id}/sold`);
            setListing(prev => ({ ...prev, status: 'sold' }));
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to mark as sold.');
        }
    }

    async function handleDelete() {
        if (!window.confirm('Delete this listing? This cannot be undone.')) return;
        setDeleteLoading(true);
        try {
            await api.delete(`/api/listings/${id}`);
            navigate('/my-listings', { replace: true });
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete.');
            setDeleteLoading(false);
        }
    }

    if (loading) return <Loader text="Loading listing…" />;
    if (error) return (
        <div className="page-container">
            <div className="alert alert-error">{error}</div>
            <Link to="/listings" className="btn btn-ghost btn-sm">← Back to listings</Link>
        </div>
    );
    if (!listing) return null;

    const isOwner = user?._id === (listing.seller?._id || listing.seller);
    const isSoldOut = listing.status === 'sold' || listing.status === 'reserved';
    const images = listing.images || [];
    const scam = SCAM_CONFIG[listing.scamRisk?.level] || SCAM_CONFIG.low;

    return (
        <div className="page-container">
            <Link to="/listings" className="back-link">← Back to listings</Link>

            <div className="detail-layout">
                {/* ── Left: Images ── */}
                <div className="detail-images">
                    <div className="detail-main-image">
                        {images.length > 0
                            ? <img src={images[activeImg]?.url || images[activeImg]} alt={listing.title} />
                            : <div className="detail-placeholder">📦</div>
                        }
                        {listing.status !== 'active' && (
                            <div className="detail-status-overlay">{listing.status.toUpperCase()}</div>
                        )}
                    </div>
                    {images.length > 1 && (
                        <div className="detail-thumbnails">
                            {images.map((img, i) => (
                                <button
                                    key={i}
                                    className={`thumb-btn ${activeImg === i ? 'active' : ''}`}
                                    onClick={() => setActiveImg(i)}
                                >
                                    <img src={img?.url || img} alt={`${listing.title} ${i + 1}`} />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* ── Right: Info ── */}
                <div className="detail-info">
                    <div className="detail-badges">
                        <span className="listing-category">{listing.category?.replace(/-/g, ' ')}</span>
                        <span className={`badge ${CONDITION_CONFIG[listing.condition] || 'badge-muted'}`}>
                            {listing.condition}
                        </span>
                        <span className={`badge ${SCAM_CONFIG[listing.scamRisk?.level]?.class || 'badge-success'}`}>
                            {listing.scamRisk?.level === 'high' ? '⚠ High Risk' : listing.scamRisk?.level === 'medium' ? '⚠ Medium Risk' : '✓ Safe'}
                        </span>
                        {listing.aiAssisted && (
                            <span className="badge badge-accent">✨ AI Generated</span>
                        )}
                    </div>

                    <h1 className="detail-title">{listing.title}</h1>
                    <div className="detail-price">₹{listing.price?.toLocaleString('en-IN')}</div>

                    <p className="detail-description">{listing.description}</p>

                    {listing.tags?.length > 0 && (
                        <div className="detail-tags">
                            {listing.tags.map(tag => (
                                <span key={tag} className="tag">#{tag}</span>
                            ))}
                        </div>
                    )}

                    <div className="divider" />

                    {/* Seller info */}
                    <div className="detail-seller">
                        <div className="seller-avatar">
                            {listing.seller?.avatar
                                ? <img src={listing.seller.avatar} alt={listing.seller.name} />
                                : <span>{listing.seller?.name?.[0]?.toUpperCase()}</span>
                            }
                        </div>
                        <div>
                            <p className="seller-name">{listing.seller?.name}</p>
                            <p className="seller-rating">
                                ⭐ {listing.seller?.rating?.average?.toFixed(1) || 'No ratings yet'}
                                {listing.seller?.rating?.count > 0 && ` (${listing.seller.rating.count})`}
                            </p>
                        </div>
                        <Link to={`/users/${listing.seller?._id}`} className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }}>
                            View Profile
                        </Link>
                    </div>

                    <div className="divider" />

                    {/* Actions */}
                    {isOwner ? (
                        <div className="owner-actions" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                            {deleteLoading === 'confirmSold' ? (
                                <div className="alert alert-warning" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                    <span style={{ fontWeight: 500 }}>Mark this listing as sold?</span>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button 
                                            className="btn btn-success btn-sm"
                                            onClick={async () => {
                                                setDeleteLoading('sold');
                                                try {
                                                    await api.patch(`/api/listings/${id}/sold`);
                                                    setListing(prev => ({ ...prev, status: 'sold' }));
                                                } catch (err) {
                                                    setError(err.response?.data?.message || 'Failed to mark as sold.');
                                                } finally {
                                                    setDeleteLoading('');
                                                }
                                            }}
                                        >
                                            Yes, Mark as Sold
                                        </button>
                                        <button className="btn btn-ghost btn-sm" onClick={() => setDeleteLoading('')}>Cancel</button>
                                    </div>
                                </div>
                            ) : deleteLoading === 'confirmDelete' ? (
                                <div className="alert alert-danger" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                    <span style={{ fontWeight: 500 }}>Delete this listing? This cannot be undone.</span>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button 
                                            className="btn btn-danger btn-sm"
                                            onClick={async () => {
                                                setDeleteLoading('deleting');
                                                try {
                                                    await api.delete(`/api/listings/${id}`);
                                                    navigate('/my-listings', { replace: true });
                                                } catch (err) {
                                                    setError(err.response?.data?.message || 'Failed to delete.');
                                                    setDeleteLoading('');
                                                }
                                            }}
                                        >
                                            Yes, Delete
                                        </button>
                                        <button className="btn btn-ghost btn-sm" onClick={() => setDeleteLoading('')}>Cancel</button>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <Link to={`/listings/${id}/edit`} className="btn btn-secondary">Edit</Link>
                                    {['active', 'reserved'].includes(listing.status) && (
                                        <button className="btn btn-success" onClick={() => setDeleteLoading('confirmSold')}>Mark as Sold</button>
                                    )}
                                    <button className="btn btn-danger" onClick={() => setDeleteLoading('confirmDelete')} disabled={!!deleteLoading}>
                                        {deleteLoading === 'deleting' ? 'Deleting…' : deleteLoading === 'sold' ? 'Processing…' : 'Delete'}
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="buyer-actions">
                            {/* Wishlist */}
                            <button
                                className={`btn ${wishlisted ? 'btn-danger' : 'btn-ghost'}`}
                                onClick={handleWishlist}
                                disabled={wishLoading}
                            >
                                {wishlisted ? '♥ Wishlisted' : '♡ Wishlist'}
                            </button>

                            {/* Offer form */}
                            {!isSoldOut ? (
                                <form className="offer-form" onSubmit={handleOffer}>
                                    <div className="offer-input-row">
                                        <span className="offer-rupee">₹</span>
                                        <input
                                            type="number"
                                            placeholder={`Max ₹${listing.price?.toLocaleString('en-IN')}`}
                                            value={offerAmount}
                                            onChange={e => { setOfferAmount(e.target.value); setOfferMsg({ type: '', text: '' }); }}
                                            min="1"
                                            max={listing.price}
                                            disabled={offerLoading}
                                        />
                                        <button type="submit" className="btn btn-primary" disabled={offerLoading}>
                                            {offerLoading ? 'Sending…' : 'Send Offer'}
                                        </button>
                                    </div>
                                    {offerMsg.text && (
                                        <div className={`alert alert-${offerMsg.type === 'error' ? 'error' : 'success'}`}>
                                            {offerMsg.text}
                                        </div>
                                    )}
                                </form>
                            ) : (
                                <div className="alert alert-warning">
                                    This listing is {listing.status} — no longer available for offers.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}