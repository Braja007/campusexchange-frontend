import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Loader } from '../components/ProtectedRoute';
import ListingCard from '../components/ListingCard';
import '../styles/Profile.css';

export default function Profile() {
    const { user, refreshUser } = useAuth();

    const [tab, setTab] = useState('profile');
    const [wishlist, setWishlist] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [wishLoading, setWishLoading] = useState(false);
    const [reviewLoading, setReviewLoading] = useState(false);

    // Edit profile state
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({ name: '' });
    const [avatar, setAvatar] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [saving, setSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState({ type: '', text: '' });

    // Init form with current user
    useEffect(() => {
        if (user) setForm({ name: user.name || '' });
    }, [user]);

    // Fetch wishlist when tab switches
    useEffect(() => {
        if (tab === 'wishlist' && wishlist.length === 0) fetchWishlist();
        if (tab === 'reviews' && reviews.length === 0) fetchReviews();
    }, [tab]);

    async function fetchWishlist() {
        setWishLoading(true);
        try {
            const res = await api.get('/api/users/wishlist');
            const data = res.data?.data?.wishlist || res.data?.data || [];
            setWishlist(Array.isArray(data) ? data : []);
        } catch {
            setWishlist([]);
        } finally {
            setWishLoading(false);
        }
    }

    async function fetchReviews() {
        setReviewLoading(true);
        try {
            const res = await api.get(`/api/reviews/user/${user._id}`);
            const data = res.data?.data?.reviews || res.data?.data || [];
            setReviews(Array.isArray(data) ? data : []);
        } catch {
            setReviews([]);
        } finally {
            setReviewLoading(false);
        }
    }

    function handleAvatarChange(e) {
        const file = e.target.files[0];
        if (!file) return;
        setAvatar(file);
        setAvatarPreview(URL.createObjectURL(file));
    }

    async function handleSave(e) {
        e.preventDefault();
        if (!form.name.trim() || form.name.trim().length < 2) {
            setSaveMsg({ type: 'error', text: 'Name must be at least 2 characters.' });
            return;
        }
        setSaving(true);
        setSaveMsg({ type: '', text: '' });
        try {
            const fd = new FormData();
            fd.append('name', form.name.trim());
            if (avatar) fd.append('avatar', avatar);

            await api.patch('/api/users/profile', fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            await refreshUser();
            setSaveMsg({ type: 'success', text: 'Profile updated successfully!' });
            setEditing(false);
            setAvatar(null);
            setAvatarPreview(null);
        } catch (err) {
            setSaveMsg({ type: 'error', text: err.response?.data?.message || 'Failed to update profile.' });
        } finally {
            setSaving(false);
        }
    }

    async function handleRemoveWishlist(listingId) {
        try {
            await api.post(`/api/users/wishlist/${listingId}`);
            setWishlist(prev => prev.filter(item => (item._id || item) !== listingId));
        } catch { }
    }

    if (!user) return <Loader text="Loading profile…" />;

    const avatarUrl = avatarPreview || user.avatar || null;

    return (
        <div className="page-container">
            <div className="profile-layout">

                {/* ── Left: Avatar + quick info ── */}
                <div className="profile-sidebar">
                    <div className="profile-avatar-wrap">
                        {avatarUrl
                            ? <img src={avatarUrl} alt={user.name} className="profile-avatar-img" />
                            : <div className="profile-avatar-placeholder">
                                {user.name?.[0]?.toUpperCase()}
                            </div>
                        }
                        {editing && (
                            <label className="avatar-upload-btn" title="Change avatar">
                                📷
                                <input
                                    type="file"
                                    accept="image/*"
                                    hidden
                                    onChange={handleAvatarChange}
                                />
                            </label>
                        )}
                    </div>

                    <h2 className="profile-name">{user.name}</h2>
                    <p className="profile-email">{user.email}</p>
                    <p className="profile-college-id">ID: {user.collegeId}</p>

                    <div className="profile-rating">
                        <span className="rating-stars">⭐</span>
                        <span className="rating-value">
                            {user.rating?.average
                                ? user.rating.average.toFixed(1)
                                : 'No ratings'}
                        </span>
                        {user.rating?.count > 0 && (
                            <span className="rating-count">({user.rating.count} reviews)</span>
                        )}
                    </div>

                    <div className="profile-role-badge">
                        <span className={`badge ${user.role === 'admin' ? 'badge-warning' : 'badge-accent'}`}>
                            {user.role}
                        </span>
                    </div>
                </div>

                {/* ── Right: Tabs ── */}
                <div className="profile-content">
                    <div className="tabs">
                        <button
                            className={`tab-btn ${tab === 'profile' ? 'active' : ''}`}
                            onClick={() => setTab('profile')}
                        >
                            Profile
                        </button>
                        <button
                            className={`tab-btn ${tab === 'wishlist' ? 'active' : ''}`}
                            onClick={() => setTab('wishlist')}
                        >
                            Wishlist
                            {wishlist.length > 0 && (
                                <span className="tab-count">{wishlist.length}</span>
                            )}
                        </button>
                        <button
                            className={`tab-btn ${tab === 'reviews' ? 'active' : ''}`}
                            onClick={() => setTab('reviews')}
                        >
                            Reviews
                            {reviews.length > 0 && (
                                <span className="tab-count">{reviews.length}</span>
                            )}
                        </button>
                    </div>

                    {/* ── Profile Tab ── */}
                    {tab === 'profile' && (
                        <div className="card profile-card">
                            <div className="profile-card-header">
                                <h3>Account Details</h3>
                                {!editing && (
                                    <button
                                        className="btn btn-secondary btn-sm"
                                        onClick={() => { setEditing(true); setSaveMsg({ type: '', text: '' }); }}
                                    >
                                        Edit
                                    </button>
                                )}
                            </div>

                            {saveMsg.text && (
                                <div className={`alert alert-${saveMsg.type === 'error' ? 'error' : 'success'}`}>
                                    {saveMsg.text}
                                </div>
                            )}

                            {editing ? (
                                <form onSubmit={handleSave} noValidate>
                                    <div className="form-group">
                                        <label>Full Name</label>
                                        <input
                                            type="text"
                                            value={form.name}
                                            onChange={e => setForm({ name: e.target.value })}
                                            disabled={saving}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Email</label>
                                        <input type="email" value={user.email} disabled />
                                        <span className="form-hint">Email cannot be changed</span>
                                    </div>

                                    <div className="form-group">
                                        <label>College ID</label>
                                        <input type="text" value={user.collegeId} disabled />
                                        <span className="form-hint">College ID cannot be changed</span>
                                    </div>

                                    <div className="profile-form-actions">
                                        <button
                                            type="button"
                                            className="btn btn-ghost"
                                            onClick={() => {
                                                setEditing(false);
                                                setForm({ name: user.name });
                                                setAvatar(null);
                                                setAvatarPreview(null);
                                                setSaveMsg({ type: '', text: '' });
                                            }}
                                            disabled={saving}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="btn btn-primary"
                                            disabled={saving}
                                        >
                                            {saving ? 'Saving…' : 'Save Changes'}
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div className="profile-info-list">
                                    <div className="profile-info-row">
                                        <span>Full Name</span>
                                        <strong>{user.name}</strong>
                                    </div>
                                    <div className="profile-info-row">
                                        <span>Email</span>
                                        <strong>{user.email}</strong>
                                    </div>
                                    <div className="profile-info-row">
                                        <span>College ID</span>
                                        <strong>{user.collegeId}</strong>
                                    </div>
                                    <div className="profile-info-row">
                                        <span>Role</span>
                                        <strong>{user.role}</strong>
                                    </div>
                                    <div className="profile-info-row">
                                        <span>Rating</span>
                                        <strong>
                                            {user.rating?.average
                                                ? `⭐ ${user.rating.average.toFixed(1)} (${user.rating.count} reviews)`
                                                : 'No ratings yet'}
                                        </strong>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Wishlist Tab ── */}
                    {tab === 'wishlist' && (
                        <div>
                            {wishLoading ? (
                                <Loader text="Loading wishlist…" />
                            ) : wishlist.length === 0 ? (
                                <div className="empty-state">
                                    <h3>Your wishlist is empty</h3>
                                    <p>Browse listings and heart the ones you like.</p>
                                    <Link to="/listings" className="btn btn-primary">Browse Listings</Link>
                                </div>
                            ) : (
                                <>
                                    <p className="wishlist-count">{wishlist.length} saved item{wishlist.length !== 1 ? 's' : ''}</p>
                                    <div className="wishlist-grid">
                                        {wishlist.map(item => {
                                            const listing = item._id ? item : null;
                                            if (!listing) return null;
                                            return (
                                                <div key={listing._id} className="wishlist-item">
                                                    <ListingCard listing={listing} />
                                                    <button
                                                        className="btn btn-danger btn-sm wishlist-remove-btn"
                                                        onClick={() => handleRemoveWishlist(listing._id)}
                                                    >
                                                        ♥ Remove
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* ── Reviews Tab ── */}
                    {tab === 'reviews' && (
                        <div>
                            {reviewLoading ? (
                                <Loader text="Loading reviews…" />
                            ) : reviews.length === 0 ? (
                                <div className="empty-state">
                                    <h3>No reviews yet</h3>
                                    <p>Reviews appear here after completed transactions.</p>
                                </div>
                            ) : (
                                <div className="reviews-list">
                                    {reviews.map(review => (
                                        <div key={review._id} className="card review-card">
                                            <div className="review-header">
                                                <div className="review-avatar">
                                                    {review.reviewer?.avatar
                                                        ? <img src={review.reviewer.avatar} alt={review.reviewer.name} />
                                                        : <span>{review.reviewer?.name?.[0]?.toUpperCase()}</span>
                                                    }
                                                </div>
                                                <div>
                                                    <p className="review-author">{review.reviewer?.name}</p>
                                                    <p className="review-role">as {review.role}</p>
                                                </div>
                                                <div className="review-rating">
                                                    {'⭐'.repeat(review.rating)}
                                                    <span className="review-rating-num">{review.rating}/5</span>
                                                </div>
                                            </div>
                                            {review.feedback && (
                                                <p className="review-feedback">"{review.feedback}"</p>
                                            )}
                                            <p className="review-date">
                                                {new Date(review.createdAt).toLocaleDateString('en-IN', {
                                                    day: 'numeric', month: 'short', year: 'numeric',
                                                })}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}