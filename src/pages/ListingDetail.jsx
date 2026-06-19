import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Loader } from '../components/ProtectedRoute';
import { useModal } from '../context/ModalContext';
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
    const navigate = useNavigate();
    const { user } = useAuth();
    const { confirmDialog, alertDialog } = useModal();

    const [listing, setListing] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeImg, setActiveImg] = useState(0);
    const [isZoomed, setIsZoomed] = useState(false);

    // Offer state
    const [offerAmount, setOfferAmount] = useState('');
    const [offerLoading, setOfferLoading] = useState(false);
    const [offerMsg, setOfferMsg] = useState({ type: '', text: '' });

    // Wishlist state
    const [wishlisted, setWishlisted] = useState(false);
    const [wishLoading, setWishLoading] = useState(false);

    // Delete state
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Report state
    const [showReport, setShowReport] = useState(false);
    const [reportForm, setReportForm] = useState({ reason: 'spam', description: '' });
    const [reportLoading, setReportLoading] = useState(false);
    const [reportMsg, setReportMsg] = useState({ type: '', text: '' });

    useEffect(() => {
        if (!id || id === 'undefined') {
            navigate('/listings', { replace: true });
            return;
        }

        async function fetchListing() {
            try {
                const res = await api.get(`/api/listings/${id}`);
                const data = res.data?.data?.listing || res.data?.data;

                // Track owner views locally to subtract from total
                const isOwner = user?._id === (data.seller?._id || data.seller);
                if (isOwner) {
                    const localKey = `my_views_${data._id}`;
                    const currentMyViews = parseInt(localStorage.getItem(localKey) || '0');
                    localStorage.setItem(localKey, currentMyViews + 1);
                    data.views = Math.max(0, (data.views || 0) - (currentMyViews + 1));
                }

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

    async function handleReport(e) {
        e.preventDefault();
        setReportLoading(true);
        setReportMsg({ type: '', text: '' });
        try {
            await api.post('/api/reports', {
                listingId: id,
                reason: reportForm.reason,
                description: reportForm.description
            });
            setReportMsg({ type: 'success', text: 'Report submitted. Our team will review it.' });
            setTimeout(() => {
                setShowReport(false);
                setReportMsg({ type: '', text: '' });
                setReportForm({ reason: 'spam', description: '' });
            }, 3000);
        } catch (err) {
            setReportMsg({ type: 'error', text: err.response?.data?.message || 'Failed to submit report.' });
        } finally {
            setReportLoading(false);
        }
    }

    async function handleMarkSold() {
        const isConfirmed = await confirmDialog('Mark this listing as sold?');
        if (!isConfirmed) return;
        try {
            await api.patch(`/api/listings/${id}/sold`);
            setListing(prev => ({ ...prev, status: 'sold' }));
        } catch (err) {
            await alertDialog(err.response?.data?.message || 'Failed to mark as sold.');
        }
    }

    async function handleDelete() {
        const isConfirmed = await confirmDialog('Delete this listing? This cannot be undone.');
        if (!isConfirmed) return;
        setDeleteLoading(true);
        try {
            await api.delete(`/api/listings/${id}`);
            navigate('/my-listings', { replace: true });
        } catch (err) {
            await alertDialog(err.response?.data?.message || 'Failed to delete.');
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

            {/* Zoom Overlay */}
            {isZoomed && images.length > 0 && (
                <div className="image-zoom-overlay" onClick={() => setIsZoomed(false)}>
                    <div className="image-zoom-content" onClick={e => e.stopPropagation()}>
                        <button className="image-zoom-close" onClick={() => setIsZoomed(false)}>×</button>
                        <img src={images[activeImg]?.url || images[activeImg]} alt={listing.title} />
                    </div>
                </div>
            )}

            <div className="detail-layout">
                {/* ── Left: Images ── */}
                <div className="detail-images">
                    <div className="detail-main-image" onClick={() => setIsZoomed(true)}>
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
                        <Link to={`/users/${listing.seller?._id}`} className="btn btn-ghost btn-sm seller-profile-btn">
                            View Profile
                        </Link>
                    </div>

                    <div className="divider" />

                    {/* Actions */}
                    {isOwner ? (
                        <div className="seller-actions">
                            <Link to={`/listings/${id}/edit`} className="btn btn-secondary">Edit</Link>
                            {['active', 'reserved'].includes(listing.status) && (
                                <button className="btn btn-success" onClick={handleMarkSold} disabled={!!deleteLoading}>
                                    Mark as Sold
                                </button>
                            )}
                            <button className="btn btn-danger" onClick={handleDelete} disabled={!!deleteLoading}>
                                {deleteLoading ? 'Processing…' : 'Delete'}
                            </button>
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

                            {/* Report Action */}
                            <div className="report-action">
                                {!showReport ? (
                                    <button
                                        className="btn btn-ghost btn-sm"
                                        onClick={() => setShowReport(true)}
                                    >
                                        🚩 Report Listing
                                    </button>
                                ) : (
                                    <form className="report-form" onSubmit={handleReport}>
                                        <h4>Report Listing</h4>
                                        <div className="form-group">
                                            <label>Reason</label>
                                            <select
                                                value={reportForm.reason}
                                                onChange={e => setReportForm({ ...reportForm, reason: e.target.value })}
                                                disabled={reportLoading}
                                                className="form-input"
                                            >
                                                <option value="spam">Spam / Deceptive</option>
                                                <option value="scam">Scam / Fraudulent</option>
                                                <option value="inappropriate">Inappropriate Content</option>
                                                <option value="duplicate">Duplicate Listing</option>
                                                <option value="wrong-category">Wrong Category</option>
                                                <option value="other">Other</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>Note (Optional)</label>
                                            <textarea
                                                className="form-input"
                                                placeholder="Provide more details..."
                                                value={reportForm.description}
                                                onChange={e => setReportForm({ ...reportForm, description: e.target.value })}
                                                disabled={reportLoading}
                                                rows="2"
                                                maxLength="500"
                                            />
                                        </div>
                                        {reportMsg.text && (
                                            <div className={`alert alert-${reportMsg.type === 'error' ? 'error' : 'success'}`}>
                                                {reportMsg.text}
                                            </div>
                                        )}
                                        <div className="report-form-actions">
                                            <button type="submit" className="btn btn-danger btn-sm" disabled={reportLoading}>
                                                {reportLoading ? 'Submitting…' : 'Submit Report'}
                                            </button>
                                            <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setShowReport(false); setReportMsg({ type: '', text: '' }); }} disabled={reportLoading}>
                                                Cancel
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}