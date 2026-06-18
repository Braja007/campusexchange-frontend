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

    useEffect(() => { fetchOffer(); }, [id]);

    async function fetchOffer() {
        setLoading(true);
        setError('');
        try {
            const res = await api.get(`/api/offers/${id}`);
            const data = res.data?.data?.offer || res.data?.data;
            setOffer(data);
        } catch (err) {
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
    const isMyTurn = lastActor !== myId;
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
                            <p className="form-hint">
                                🎉 Offer accepted! Contact the buyer to arrange the exchange.
                            </p>
                        </div>
                    )}

                    {/* Accepted — buyer */}
                    {offer.status === 'accepted' && isBuyer && (
                        <div className="card offer-actions-card">
                            <p className="form-hint">
                                🎉 Your offer was accepted! Contact the seller to arrange the exchange.
                            </p>
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
                </div>
            </div>
        </div>
    );
}