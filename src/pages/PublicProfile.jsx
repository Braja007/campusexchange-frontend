import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { Loader } from '../components/ProtectedRoute';
import '../styles/Profile.css';

export default function PublicProfile() {
    const { id } = useParams();
    const [profile, setProfile] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        async function fetchProfileData() {
            setLoading(true);
            try {
                // Fetch public profile and reviews in parallel
                const [profileRes, reviewsRes] = await Promise.allSettled([
                    api.get(`/api/users/${id}`),
                    api.get(`/api/reviews/user/${id}`)
                ]);

                if (profileRes.status === 'fulfilled') {
                    const data = profileRes.value.data?.data?.user || profileRes.value.data?.data;
                    setProfile(data);
                } else {
                    setError('User profile not found.');
                }

                if (reviewsRes.status === 'fulfilled') {
                    const data = reviewsRes.value.data?.data?.reviews || reviewsRes.value.data?.data || [];
                    setReviews(Array.isArray(data) ? data : []);
                }
            } catch (err) {
                setError('Failed to load profile.');
            } finally {
                setLoading(false);
            }
        }
        fetchProfileData();
    }, [id]);

    if (loading) return <Loader text="Loading profile…" />;
    if (error) return (
        <div className="page-container">
            <div className="alert alert-error">{error}</div>
            <Link to="/listings" className="btn btn-ghost btn-sm">← Back to listings</Link>
        </div>
    );
    if (!profile) return null;

    const avatarUrl = profile.avatar || null;

    return (
        <div className="page-container">
            <Link to="/listings" className="back-link">← Back to listings</Link>
            <div className="profile-layout" style={{ marginTop: '1rem' }}>
                
                {/* ── Left: Avatar + quick info ── */}
                <div className="profile-sidebar">
                    <div className="profile-avatar-wrap" style={{ cursor: 'default' }}>
                        {avatarUrl
                            ? <img src={avatarUrl} alt={profile.name} className="profile-avatar-img" />
                            : <div className="profile-avatar-placeholder">
                                {profile.name?.[0]?.toUpperCase()}
                            </div>
                        }
                    </div>

                    <h2 className="profile-name">{profile.name}</h2>
                    {profile.email && <p className="profile-email">{profile.email}</p>}
                    {profile.collegeId && <p className="profile-college-id">ID: {profile.collegeId}</p>}
                    
                    <div className="profile-rating">
                        <span className="rating-stars">⭐</span>
                        <span className="rating-value">
                            {profile.rating?.average
                                ? profile.rating.average.toFixed(1)
                                : 'No ratings'}
                        </span>
                        {profile.rating?.count > 0 && (
                            <span className="rating-count">({profile.rating.count} reviews)</span>
                        )}
                    </div>
                </div>

                {/* ── Right: Reviews ── */}
                <div className="profile-content">
                    <h3 style={{ marginBottom: '1rem' }}>Reviews</h3>
                    {reviews.length === 0 ? (
                        <div className="empty-state">
                            <h3>No reviews yet</h3>
                            <p>This user hasn't received any reviews yet.</p>
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
            </div>
        </div>
    );
}
