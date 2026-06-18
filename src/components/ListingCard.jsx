import { Link } from 'react-router-dom';
import '../styles/ListingCard.css';

const CONDITION_BADGE = {
    'new': 'badge-accent',
    'like-new': 'badge-success',
    'good': 'badge-success',
    'fair': 'badge-warning',
    'poor': 'badge-danger',
};

const SCAM_BADGE = {
    'low': null,
    'medium': 'badge-warning',
    'high': 'badge-danger',
};

export default function ListingCard({ listing }) {
    const {
        _id, id, title, price, condition, category,
        images, seller, status, scamRisk, createdAt
    } = listing;

    const listingId = _id || id;

    const firstImage = images?.[0];
    const thumbUrl = typeof firstImage === 'string' ? firstImage : (firstImage?.url || null);
    const sellerName = seller?.name || 'Unknown';
    const conditionClass = CONDITION_BADGE[condition] || 'badge-muted';
    const scamClass = SCAM_BADGE[scamRisk?.level];
    const isReserved = status === 'reserved';

    return (
        <Link to={`/listings/${listingId}`} className="listing-card">
            <div className="listing-card-image">
                {thumbUrl
                    ? <img src={thumbUrl} alt={title} loading="lazy" />
                    : <div className="listing-card-placeholder">📦</div>
                }
                {isReserved && <span className="listing-reserved-tag">Reserved</span>}
                {scamClass && (
                    <span className={`badge ${scamClass} listing-scam-badge`}>
                        {scamRisk.level === 'high' ? '⚠ High Risk' : '⚠ Medium Risk'}
                    </span>
                )}
            </div>

            <div className="listing-card-body">
                <div className="listing-card-meta">
                    <span className="listing-category">{category?.replace(/-/g, ' ')}</span>
                    <span className={`badge ${conditionClass}`}>{condition}</span>
                </div>

                <h3 className="listing-card-title">{title}</h3>

                <div className="listing-card-footer">
                    <span className="listing-price">₹{price?.toLocaleString('en-IN')}</span>
                    <span className="listing-seller">{sellerName}</span>
                </div>
            </div>
        </Link>
    );
}