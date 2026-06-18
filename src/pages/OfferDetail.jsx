import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Loader } from '../components/ProtectedRoute';
import '../styles/Offers.css';

const STATUS_BADGE = {
    pending: 'badge-warning',
    countered: 'badge-accent',
    accepted: 'badge-success',
    rejected: 'badge-danger',
    withdrawn: 'badge-muted',
    completed: 'badge-success',
};

const ACTION_LABELS = {
    offer: 'Made an offer',
    counter: 'Countered',
    accept: 'Accepted',
    reject: 'Rejected',
    withdraw: 'Withdrew',
    complete: 'Marked complete',
};

export default function OfferDetail() {
    const { id } = useParams();
    const { user } = useAuth();

    const [offer, setOffer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionLoading, setActionLoading] = useState('');
    const [actionMsg, setActionMsg] = useState({ type: '', text: '' });
    const [counterAmount, setCounterAmount] = useState('');
    const [counterNote, setCounterNote] = useState('');
    const [showCounter, setShowCounter] = useState(false);

    // Reviews State
    const [reviews, setReviews] = useState([]);
    const [hasReviewed, setHasReviewed] = useState(false);
    const [reviewForm, setReviewForm] = useState({ rating: 5, feedback: '' });
    const [reviewLoading, setReviewLoading] = useState(false);
    const [reviewMsg, setReviewMsg] = useState({ type: '', text: '' });

    useEffect(() => { fetchOffer(); }, [id]);

    async function fetchOffer() {
        setLoading(true);
        setError('');
        try {
            const res = await api.get(`/api/offers/${id}`);
            const data = res.data?.data?.offer ?? res.data?.data;
            
            // Fetch fresh listing data to prevent stale status bugs where the offer contains cached listing data
            if (data && data.listing && (data.listing._id || data.listing.id)) {
                try {
                    const listingId = data.listing._id || data.listing.id;
                    const listingRes = await api.get(`/api/listings/${listingId}`);
                    const freshListing = listingRes.data?.data?.listing || listingRes.data?.data;
                    if (freshListing) {
                        data.listing = { ...data.listing, ...freshListing };
                    }
                } catch (e) {
                    console.error('Failed to fetch fresh listing data:', e);
                }
            }

            setOffer(data);
            
            // Fetch reviews if transaction is completed
            if (data.status === 'accepted') {
                try {
                    const revRes = await api.get(`/api/reviews/offer/${id}`);
                    setReviews(revRes.data?.data?.reviews || []);
                    setHasReviewed(revRes.data?.data?.hasReviewed || false);
                } catch (e) {
                    console.error('Failed to fetch reviews:', e);
                }
            }
        } catch (err) {
            console.error('Offer fetch error:', err);
            setError(err.response?.data?.message || 'Offer not found.');
        } finally {
            setLoading(false);
        }
    }

    async function handleAction(action) {
        setActionLoading(action);
        setActionMsg({ type: '', text: '' });
        try {
            await api.post(`/api/offers/${id}/${action}`, {});
            await fetchOffer(); // refresh offer state
            setActionMsg({ type: 'success', text: `Offer ${action}ed successfully.` });
        } catch (err) {
            setActionMsg({ type: 'error', text: err.response?.data?.message || `Failed to ${action} offer.` });
        } finally {
            setActionLoading('');
        }
    }

    async function handleCounter(e) {
        e.preventDefault();
        if (!counterAmount || Number(counterAmount) <= 0) {
            setActionMsg({ type: 'error', text: 'Enter a valid counter amount.' });
            return;
        }
        setActionLoading('counter');
        setActionMsg({ type: '', text: '' });
        try {
            await api.post(`/api/offers/${id}/counter`, {
                amount: Number(counterAmount),
                counterAmount: Number(counterAmount),
                note: counterNote.trim() || undefined,
            });
            await fetchOffer();
            setCounterAmount('');
            setCounterNote('');
            setShowCounter(false);
            setActionMsg({ type: 'success', text: 'Counter offer sent.' });
        } catch (err) {
            setActionMsg({ type: 'error', text: err.response?.data?.message || 'Failed to counter.' });
        } finally {
            setActionLoading('');
        }
    }

    async function submitReview(e) {
        e.preventDefault();
        setReviewLoading(true);
        setReviewMsg({ type: '', text: '' });
        try {
            await api.post('/api/reviews', {
                offerId: id,
                rating: reviewForm.rating,
                feedback: reviewForm.feedback.trim() || undefined,
            });
            setReviewMsg({ type: 'success', text: 'Review submitted successfully.' });
            setHasReviewed(true);
            
            // Refresh reviews to show the newly added one
            const revRes = await api.get(`/api/reviews/offer/${id}`);
            setReviews(revRes.data?.data?.reviews || []);
        } catch (err) {
            setReviewMsg({ type: 'error', text: err.response?.data?.message || 'Failed to submit review.' });
        } finally {
            setReviewLoading(false);
        }
    }

    if (loading) return <Loader text="Loading offer…" />;
    if (error) return (
        <div className="page-container">
            <div className="alert alert-error">{error}</div>
            <Link to="/offers" className="btn btn-ghost btn-sm">← Back to offers</Link>
        </div>
    );
    if (!offer) return null;

    const myId = user?._id;
    const isBuyer = (offer.buyer?._id || offer.buyer) === myId;
    const isSeller = (offer.seller?._id || offer.seller) === myId;

    // Mirror your backend isMyTurn logic
    const lastActor = offer.history?.[offer.history.length - 1]?.by;
    const lastActorId = lastActor?._id || lastActor;
    const isMyTurn = lastActorId !== myId;
    const isActive = ['pending', 'countered'].includes(offer.status);

    const listing = offer.listing;
    const thumb = listing?.images?.[0];
    const thumbUrl = typeof thumb === 'string' ? thumb : thumb?.url;

    return (
        <div className="page-container">
            <Link to="/offers" className="back-link">← Back to offers</Link>

            <div className="offer-detail-layout">
                {/* ── Left: Listing info + Actions ── */}
                <div className="offer-detail-left">
                    {/* Listing card */}
                    <div className="card offer-listing-card">
                        <div className="offer-listing-thumb">
                            {thumbUrl
                                ? <img src={thumbUrl} alt={listing?.title} />
                                : <span>📦</span>
                            }
                        </div>
                        <div>
                            <p className="offer-listing-name">{listing?.title}</p>
                            <p className="offer-listing-price">
                                Listed at ₹{listing?.price?.toLocaleString('en-IN')}
                            </p>
                            <Link to={`/listings/${listing?._id}`} className="btn btn-ghost btn-sm" style={{ marginTop: '0.5rem' }}>
                                View Listing
                            </Link>
                        </div>
                    </div>

                    {/* Offer summary */}
                    <div className="card offer-summary-card">
                        <div className="offer-summary-row">
                            <span>Status</span>
                            <span className={`badge ${STATUS_BADGE[offer.status] || 'badge-muted'}`}>
                                {offer.status}
                            </span>
                        </div>
                        <div className="offer-summary-row">
                            <span>Initial Offer</span>
                            <strong>₹{offer.initialAmount?.toLocaleString('en-IN')}</strong>
                        </div>
                        <div className="offer-summary-row">
                            <span>Current Offer</span>
                            <strong className="offer-current-price">
                                ₹{offer.currentAmount?.toLocaleString('en-IN')}
                            </strong>
                        </div>
                        <div className="offer-summary-row">
                            <span>Buyer</span>
                            <span>{offer.buyer?.name}</span>
                        </div>
                        <div className="offer-summary-row">
                            <span>Seller</span>
                            <span>{offer.seller?.name}</span>
                        </div>
                        {offer.expiresAt && (
                            <div className="offer-summary-row">
                                <span>Expires</span>
                                <span>{new Date(offer.expiresAt).toLocaleDateString('en-IN', {
                                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                                })}</span>
                            </div>
                        )}
                    </div>

                    {/* Action buttons */}
                    {isActive && (
                        <div className="card offer-actions-card">
                            <p className="offer-turn-label">
                                {isMyTurn ? '🟢 Your turn to respond' : '⏳ Waiting for other party…'}
                            </p>

                            {actionMsg.text && (
                                <div className={`alert alert-${actionMsg.type === 'error' ? 'error' : 'success'}`}>
                                    {actionMsg.text}
                                </div>
                            )}

                            {isMyTurn && (
                                <div className="offer-action-btns">
                                    {/* Universal actions when it's your turn */}
                                    <button
                                        className="btn btn-success"
                                        onClick={() => handleAction('accept')}
                                        disabled={!!actionLoading}
                                    >
                                        {actionLoading === 'accept' ? 'Accepting…' : '✓ Accept'}
                                    </button>
                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => setShowCounter(prev => !prev)}
                                        disabled={!!actionLoading}
                                    >
                                        ↕ Counter
                                    </button>

                                    {/* Seller can reject (Buyer has withdraw button below) */}
                                    {isSeller && (
                                        <button
                                            className="btn btn-danger"
                                            onClick={() => handleAction('reject')}
                                            disabled={!!actionLoading}
                                        >
                                            {actionLoading === 'reject' ? 'Rejecting…' : '✕ Reject'}
                                        </button>
                                    )}

                                    {/* Counter form */}
                                    {showCounter && (
                                        <form className="counter-form" onSubmit={handleCounter}>
                                            <div className="offer-input-row">
                                                <span className="offer-rupee">₹</span>
                                                <input
                                                    type="number"
                                                    placeholder={`Max ₹${listing?.price?.toLocaleString('en-IN')}`}
                                                    value={counterAmount}
                                                    onChange={e => setCounterAmount(e.target.value)}
                                                    min="1"
                                                    max={listing?.price}
                                                    disabled={!!actionLoading}
                                                />
                                                <button
                                                    type="submit"
                                                    className="btn btn-primary"
                                                    disabled={!!actionLoading}
                                                >
                                                    {actionLoading === 'counter' ? 'Sending…' : 'Send Counter'}
                                                </button>
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="Add a note (optional) — e.g. best price, urgent sale…"
                                                value={counterNote}
                                                onChange={e => setCounterNote(e.target.value)}
                                                style={{ marginTop: '0.5rem', width: '100%' }}
                                                disabled={!!actionLoading}
                                            />
                                        </form>
                                    )}
                                </div>
                            )}

                            {/* Buyer can always withdraw */}
                            {isBuyer && (
                                <button
                                    className="btn btn-ghost btn-sm"
                                    style={{ marginTop: '0.75rem' }}
                                    onClick={() => handleAction('withdraw')}
                                    disabled={!!actionLoading}
                                >
                                    {actionLoading === 'withdraw' ? 'Withdrawing…' : 'Withdraw Offer'}
                                </button>
                            )}
                        </div>
                    )}

                    {/* Accepted — seller */}
                    {offer.status === 'accepted' && isSeller && (
                        <div className="card offer-actions-card">
                            {listing?.status === 'sold' ? (
                                <p className="form-hint" style={{ color: 'green' }}>
                                    ✅ Listing is marked as sold. Transaction complete!
                                </p>
                            ) : (
                                <>
                                    <p className="form-hint" style={{ marginBottom: '0.75rem' }}>
                                        Offer accepted! To complete the transaction after exchanging the item, mark the listing as sold.
                                    </p>
                                    {actionMsg.text && actionLoading === 'sold' && (
                                        <div className={`alert alert-${actionMsg.type === 'error' ? 'error' : 'success'}`}>
                                            {actionMsg.text}
                                        </div>
                                    )}
                                    {actionLoading === 'confirmSold' ? (
                                        <div className="alert alert-warning" style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            <span style={{ fontWeight: 500 }}>Mark this listing as sold and complete the transaction?</span>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button 
                                                    className="btn btn-success btn-sm"
                                                    onClick={async () => {
                                                        setActionLoading('sold');
                                                        try {
                                                            await api.patch(`/api/listings/${listing._id}/sold`);
                                                            await fetchOffer();
                                                        } catch (err) {
                                                            setActionMsg({ type: 'error', text: err.response?.data?.message || 'Failed to mark as sold.' });
                                                            setActionLoading('');
                                                        }
                                                    }}
                                                >
                                                    Yes, Mark as Sold
                                                </button>
                                                <button 
                                                    className="btn btn-ghost btn-sm"
                                                    onClick={() => setActionLoading('')}
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            className="btn btn-success"
                                            onClick={() => setActionLoading('confirmSold')}
                                            disabled={!!actionLoading}
                                        >
                                            {actionLoading === 'sold' ? 'Processing…' : '✓ Mark as Sold'}
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {/* Accepted — buyer */}
                    {offer.status === 'accepted' && isBuyer && (
                        <div className="card offer-actions-card">
                            {listing.status === 'sold' ? (
                                <p className="form-hint" style={{ color: 'green' }}>
                                    ✅ Listing is marked as sold. Transaction complete!
                                </p>
                            ) : (
                                <p className="form-hint">
                                    🎉 Your offer was accepted! Contact the seller to arrange the exchange.
                                </p>
                            )}
                        </div>
                    )}

                    {/* Closed states */}
                    {['rejected', 'withdrawn', 'completed'].includes(offer.status) && (
                        <div className="card offer-actions-card">
                            <p className="form-hint">
                                {offer.status === 'rejected' && '❌ This offer was rejected.'}
                                {offer.status === 'withdrawn' && '↩ This offer was withdrawn by the buyer.'}
                                {offer.status === 'completed' && '✅ This transaction is complete.'}
                            </p>
                        </div>
                    )}
                </div>

                {/* ── Right: Negotiation history ── */}
                <div className="offer-detail-right">
                    <h2 className="history-title">Negotiation History</h2>

                    <div className="history-thread">
                        {offer.history?.length === 0 ? (
                            <p className="history-empty">No history yet.</p>
                        ) : (
                            offer.history.map((entry, i) => {
                                const isMe = (entry.by?._id || entry.by) === myId;
                                return (
                                    <div key={i} className={`history-entry ${isMe ? 'history-me' : 'history-them'}`}>
                                        <div className="history-bubble">
                                            <div className="history-action">
                                                {ACTION_LABELS[entry.action] || entry.action}
                                                {entry.amount && (
                                                    <strong> — ₹{entry.amount?.toLocaleString('en-IN')}</strong>
                                                )}
                                            </div>
                                            {entry.note && (
                                                <p className="history-note">{entry.note}</p>
                                            )}
                                            <div className="history-meta">
                                                <span>{entry.by?.name || (isMe ? 'You' : 'Other party')}</span>
                                                <span>{new Date(entry.at).toLocaleDateString('en-IN', {
                                                    day: 'numeric', month: 'short',
                                                    hour: '2-digit', minute: '2-digit'
                                                })}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                    
                    {/* ── Reviews Section ── */}
                    {offer.status === 'accepted' && listing.status === 'sold' && (
                        <div className="reviews-section" style={{ marginTop: '2rem' }}>
                            <h2 className="history-title">Transaction Reviews</h2>
                            
                            {!hasReviewed && (
                                <form onSubmit={submitReview} className="card offer-actions-card" style={{ marginBottom: '1.5rem' }}>
                                    <p style={{ fontWeight: '500', marginBottom: '1rem' }}>Leave a Review for this Transaction</p>
                                    
                                    <div className="form-group">
                                        <label>Rating</label>
                                        <div style={{ display: 'flex', gap: '0.5rem', fontSize: '1.5rem', cursor: 'pointer' }}>
                                            {[1, 2, 3, 4, 5].map(star => (
                                                <span 
                                                    key={star} 
                                                    onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                                                    style={{ color: star <= reviewForm.rating ? '#ffd700' : '#ddd' }}
                                                >
                                                    ★
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    <div className="form-group">
                                        <label>Feedback (Optional)</label>
                                        <textarea 
                                            rows="3" 
                                            placeholder="How was your experience?"
                                            value={reviewForm.feedback}
                                            onChange={e => setReviewForm({ ...reviewForm, feedback: e.target.value })}
                                        />
                                    </div>
                                    
                                    {reviewMsg.text && (
                                        <div className={`alert alert-${reviewMsg.type === 'error' ? 'error' : 'success'}`} style={{ marginBottom: '1rem' }}>
                                            {reviewMsg.text}
                                        </div>
                                    )}
                                    
                                    <button type="submit" className="btn btn-primary" disabled={reviewLoading}>
                                        {reviewLoading ? 'Submitting…' : 'Submit Review'}
                                    </button>
                                </form>
                            )}

                            <div className="reviews-list">
                                {reviews.length === 0 ? (
                                    <p className="history-empty" style={{marginTop: '0'}}>No reviews yet.</p>
                                ) : (
                                    reviews.map((rev) => (
                                        <div key={rev._id} className="card" style={{ marginBottom: '1rem', padding: '1rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                    {rev.reviewer?.avatar ? (
                                                        <img src={rev.reviewer.avatar} alt="Avatar" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                                                    ) : (
                                                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>👤</div>
                                                    )}
                                                    <div>
                                                        <p style={{ fontWeight: '500', margin: '0' }}>{rev.reviewer?.name}</p>
                                                        <p style={{ fontSize: '0.8rem', color: '#666', margin: '0' }}>{rev.role === 'buyer' ? 'Buyer' : 'Seller'}</p>
                                                    </div>
                                                </div>
                                                <div style={{ color: '#ffd700', fontSize: '1.2rem' }}>
                                                    {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                                                </div>
                                            </div>
                                            {rev.feedback && <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.95rem' }}>"{rev.feedback}"</p>}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}