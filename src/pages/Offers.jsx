import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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

export default function Offers() {
    const { user } = useAuth();
    const [tab, setTab] = useState('received');
    const [received, setReceived] = useState([]);
    const [sent, setSent] = useState([]);
    const [loadedTabs, setLoadedTabs] = useState({ received: false, sent: false });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (loadedTabs.received && loadedTabs.sent) return;
        fetchOffers();
    }, [loadedTabs]);

    async function fetchOffers() {
        setLoading(true);
        setError('');
        try {
            // Fetch from both endpoints since they might return mixed results or the general endpoint doesn't exist
            const [sentRes, receivedRes] = await Promise.allSettled([
                api.get('/api/offers/sent'),
                api.get('/api/offers/received')
            ]);
            
            let allOffers = [];
            
            if (sentRes.status === 'fulfilled') {
                const data = sentRes.value.data?.data?.offers || sentRes.value.data?.data || [];
                allOffers = [...allOffers, ...data];
            }
            if (receivedRes.status === 'fulfilled') {
                const data = receivedRes.value.data?.data?.offers || receivedRes.value.data?.data || [];
                allOffers = [...allOffers, ...data];
            }
            
            // Deduplicate offers by _id in case backend returns the same offer in both endpoints
            const uniqueOffersMap = new Map();
            allOffers.forEach(o => {
                if (o && (o._id || o.id)) {
                    uniqueOffersMap.set(o._id || o.id, o);
                }
            });
            const uniqueOffers = Array.from(uniqueOffersMap.values());
            
            // Strictly filter on the frontend (exclude offers for deleted listings)
            const validOffers = uniqueOffers.filter(o => o.listing);
            const receivedOffers = validOffers.filter(o => (o.seller?._id || o.seller) === user?._id);
            const sentOffers = validOffers.filter(o => (o.buyer?._id || o.buyer) === user?._id);

            setReceived(receivedOffers);
            setSent(sentOffers);
            setLoadedTabs({ received: true, sent: true });
        } catch (err) {
            setError('Failed to load offers.');
        } finally {
            setLoading(false);
        }
    }

    const current = tab === 'received' ? received : sent;

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Offers</h1>
                <p>Manage your buying and selling negotiations</p>
            </div>

            <div className="tabs">
                <button
                    className={`tab-btn ${tab === 'received' ? 'active' : ''}`}
                    onClick={() => setTab('received')}
                >
                    Received
                    {received.length > 0 && <span className="tab-count">{received.length}</span>}
                </button>
                <button
                    className={`tab-btn ${tab === 'sent' ? 'active' : ''}`}
                    onClick={() => setTab('sent')}
                >
                    Sent
                    {sent.length > 0 && <span className="tab-count">{sent.length}</span>}
                </button>
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            {loading ? (
                <Loader text="Loading offers…" />
            ) : current.length === 0 ? (
                <div className="empty-state">
                    <h3>No {tab} offers</h3>
                    <p>
                        {tab === 'received'
                            ? 'When buyers make offers on your listings, they appear here.'
                            : 'Browse listings and make an offer to start negotiating.'}
                    </p>
                    {tab === 'sent' && (
                        <Link to="/listings" className="btn btn-primary">Browse Listings</Link>
                    )}
                </div>
            ) : (
                <div className="offers-list">
                    {current.map(offer => {
                        const listing = offer.listing;
                        const thumb = listing?.images?.[0];
                        const thumbUrl = typeof thumb === 'string' ? thumb : thumb?.url;
                        const otherParty = tab === 'received' ? offer.buyer : offer.seller;

                        return (
                            <Link to={`/offers/${offer._id}`} key={offer._id} className="offer-row">
                                {/* Listing thumb */}
                                <div className="offer-thumb">
                                    {thumbUrl
                                        ? <img src={thumbUrl} alt={listing?.title} />
                                        : <span>📦</span>
                                    }
                                </div>

                                {/* Listing info */}
                                <div className="offer-info">
                                    <p className="offer-listing-title">{listing?.title || 'Listing unavailable'}</p>
                                    <p className="offer-party">
                                        {tab === 'received' ? 'From' : 'To'}: <strong>{otherParty?.name || '—'}</strong>
                                    </p>
                                </div>

                                {/* Amounts */}
                                <div className="offer-amounts">
                                    <p className="offer-current-amount">
                                        ₹{offer.currentAmount?.toLocaleString('en-IN')}
                                    </p>
                                    {offer.currentAmount !== offer.initialAmount && (
                                        <p className="offer-initial-amount">
                                            started ₹{offer.initialAmount?.toLocaleString('en-IN')}
                                        </p>
                                    )}
                                </div>

                                {/* Status */}
                                <span className={`badge ${STATUS_BADGE[offer.status] || 'badge-muted'}`}>
                                    {offer.status}
                                </span>

                                {/* Time */}
                                <span className="offer-time">
                                    {new Date(offer.updatedAt || offer.createdAt).toLocaleDateString('en-IN', {
                                        day: 'numeric', month: 'short'
                                    })}
                                </span>

                                <span className="offer-arrow">→</span>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}