import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { Loader } from '../components/ProtectedRoute';
import { useModal } from '../context/ModalContext';
import '../styles/Admin.css';

const TABS = ['stats', 'reports', 'listings', 'users'];

export default function AdminPanel() {
    const { confirmDialog } = useModal();
    const [tab, setTab] = useState('stats');

    // Stats
    const [stats, setStats] = useState(null);
    const [statsLoading, setStatsLoading] = useState(false);

    // Reports
    const [reports, setReports] = useState([]);
    const [reportsLoading, setReportsLoading] = useState(false);
    const [reportsLoaded, setReportsLoaded] = useState(false);

    // Listings
    const [listings, setListings] = useState([]);
    const [listingsLoading, setListingsLoading] = useState(false);
    const [listingsLoaded, setListingsLoaded] = useState(false);
    const [listingFilter, setListingFilter] = useState('flagged');

    // Users
    const [users, setUsers] = useState([]);
    const [usersLoading, setUsersLoading] = useState(false);
    const [usersLoaded, setUsersLoaded] = useState(false);

    const [actionMsg, setActionMsg] = useState({ type: '', text: '' });

    // Fetch stats on mount
    useEffect(() => {
        fetchStats();
    }, []);

    useEffect(() => {
        if (tab === 'reports' && !reportsLoaded) fetchReports();
        if (tab === 'listings') fetchListings(listingFilter);
        if (tab === 'users' && !usersLoaded) fetchUsers();
    }, [tab]);

    useEffect(() => {
        if (tab === 'listings') fetchListings(listingFilter);
    }, [listingFilter]);

    async function fetchStats() {
        setStatsLoading(true);
        try {
            const res = await api.get('/api/admin/stats');
            const data = res.data?.data || res.data;
            setStats(data);
        } catch {
            setStats(null);
        } finally {
            setStatsLoading(false);
        }
    }

    async function fetchReports() {
        setReportsLoading(true);
        try {
            const res = await api.get('/api/admin/reports', {
                params: { status: 'pending', limit: 50 },
            });
            const data = res.data?.data?.reports || res.data?.data || [];
            setReports(Array.isArray(data) ? data : []);
            setReportsLoaded(true);
        } catch {
            setReports([]);
        } finally {
            setReportsLoading(false);
        }
    }

    async function fetchListings(status = 'flagged') {
        setListingsLoading(true);
        try {
            const res = await api.get('/api/admin/listings', {
                params: { status, limit: 50 },
            });
            const data = res.data?.data?.listings || res.data?.data || [];
            setListings(Array.isArray(data) ? data : []);
            setListingsLoaded(true);
        } catch {
            setListings([]);
        } finally {
            setListingsLoading(false);
        }
    }

    async function fetchUsers() {
        setUsersLoading(true);
        try {
            const res = await api.get('/api/admin/users', { params: { limit: 50 } });
            const data = res.data?.data?.users || res.data?.data || [];
            setUsers(Array.isArray(data) ? data : []);
            setUsersLoaded(true);
        } catch {
            setUsers([]);
        } finally {
            setUsersLoading(false);
        }
    }

    function showMsg(type, text) {
        setActionMsg({ type, text });
        setTimeout(() => setActionMsg({ type: '', text: '' }), 3000);
    }

    // ── Report actions ──
    async function handleReport(reportId, status, actionTaken) {
        const isConfirmed = await confirmDialog(`Are you sure you want to perform this action?`);
        if (!isConfirmed) return;
        
        try {
            await api.patch(`/api/admin/reports/${reportId}`, { status, actionTaken });
            setReports(prev => prev.filter(r => r._id !== reportId));
            showMsg('success', `Report ${status}.`);
        } catch (err) {
            showMsg('error', err.response?.data?.message || 'Action failed.');
        }
    }

    // ── Listing actions ──
    async function handleListingStatus(listingId, status) {
        try {
            await api.patch(`/api/admin/listings/${listingId}`, { status });
            setListings(prev => prev.filter(l => l._id !== listingId));
            showMsg('success', `Listing marked as ${status}.`);
        } catch (err) {
            showMsg('error', err.response?.data?.message || 'Action failed.');
        }
    }

    // ── User actions ──
    async function handleUserAction(userId, payload) {
        try {
            await api.patch(`/api/admin/users/${userId}`, payload);
            await fetchUsers();
            showMsg('success', 'User updated.');
        } catch (err) {
            showMsg('error', err.response?.data?.message || 'Action failed.');
        }
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Admin Panel</h1>
                <p>Manage reports, listings and users</p>
            </div>

            {actionMsg.text && (
                <div className={`alert alert-${actionMsg.type === 'error' ? 'error' : 'success'}`}
                    style={{ marginBottom: '1.5rem' }}>
                    {actionMsg.text}
                </div>
            )}

            <div className="tabs">
                {TABS.map(t => (
                    <button
                        key={t}
                        className={`tab-btn ${tab === t ? 'active' : ''}`}
                        onClick={() => setTab(t)}
                    >
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                        {t === 'reports' && reports.length > 0 && (
                            <span className="tab-count">{reports.length}</span>
                        )}
                    </button>
                ))}
            </div>

            {/* ── Stats Tab ── */}
            {tab === 'stats' && (
                statsLoading ? <Loader text="Loading stats…" /> :
                    !stats ? (
                        <div className="empty-state">
                            <h3>Stats unavailable</h3>
                            <p>Could not load platform statistics.</p>
                        </div>
                    ) : (
                        <div>
                            <div className="stats-grid">
                                <div className="stat-card">
                                    <span className="stat-icon">👤</span>
                                    <div>
                                        <p className="stat-value">{stats.totalUsers ?? stats.users?.total ?? '—'}</p>
                                        <p className="stat-label">Total Users</p>
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <span className="stat-icon">📦</span>
                                    <div>
                                        <p className="stat-value">{stats.totalListings ?? stats.listings?.total ?? '—'}</p>
                                        <p className="stat-label">Total Listings</p>
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <span className="stat-icon">🤝</span>
                                    <div>
                                        <p className="stat-value">{stats.totalOffers ?? stats.offers?.total ?? '—'}</p>
                                        <p className="stat-label">Total Offers</p>
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <span className="stat-icon">🚩</span>
                                    <div>
                                        <p className="stat-value">{stats.pendingReports ?? stats.reports?.pending ?? '—'}</p>
                                        <p className="stat-label">Pending Reports</p>
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <span className="stat-icon">⚠️</span>
                                    <div>
                                        <p className="stat-value">{stats.flaggedListings ?? stats.listings?.flagged ?? '—'}</p>
                                        <p className="stat-label">Flagged Listings</p>
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <span className="stat-icon">✅</span>
                                    <div>
                                        <p className="stat-value">{stats.completedOffers ?? stats.listings?.sold ?? '—'}</p>
                                        <p className="stat-label">Completed Transactions</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
            )}

            {/* ── Reports Tab ── */}
            {tab === 'reports' && (
                reportsLoading ? <Loader text="Loading reports…" /> :
                    reports.length === 0 ? (
                        <div className="empty-state">
                            <h3>No pending reports</h3>
                            <p>All reports have been reviewed.</p>
                        </div>
                    ) : (
                        <div className="admin-list">
                            {reports.map(report => (
                                <div key={report._id} className="admin-card card">
                                    <div className="admin-card-top">
                                        <div>
                                            <p className="admin-card-title">
                                                {report.listing ? (
                                                    <Link to={`/listings/${report.listing._id || report.listing}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                                                        {report.listing.title || 'Listing unavailable'}
                                                    </Link>
                                                ) : (
                                                    'Listing unavailable'
                                                )}
                                            </p>
                                            <p className="admin-card-sub">
                                                Reported by <strong>{report.reporter?.name || '—'}</strong>
                                                {' · '}
                                                <span className="badge badge-warning">{report.reason}</span>
                                            </p>
                                            {report.description && (
                                                <p className="admin-card-desc">"{report.description}"</p>
                                            )}
                                        </div>
                                        <span className={`badge badge-warning`}>{report.status}</span>
                                    </div>

                                    <div className="admin-card-actions">
                                        <button
                                            className="btn btn-danger btn-sm"
                                            onClick={() => handleReport(report._id, 'resolved', 'listing-removed')}
                                        >
                                            Remove Listing
                                        </button>
                                        <button
                                            className="btn btn-ghost btn-sm"
                                            onClick={() => handleReport(report._id, 'dismissed', 'dismissed')}
                                        >
                                            Dismiss
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
            )}

            {/* ── Listings Tab ── */}
            {tab === 'listings' && (
                <div>
                    <div className="admin-filter-row">
                        <select
                            value={listingFilter}
                            onChange={e => setListingFilter(e.target.value)}
                        >
                            <option value="flagged">Flagged</option>
                            <option value="active">Active</option>
                            <option value="reserved">Reserved</option>
                            <option value="sold">Sold</option>
                        </select>
                    </div>

                    {listingsLoading ? <Loader text="Loading listings…" /> :
                        listings.length === 0 ? (
                            <div className="empty-state">
                                <h3>No {listingFilter} listings</h3>
                                <p>Nothing to show here.</p>
                            </div>
                        ) : (
                            <div className="admin-list">
                                {listings.map(listing => {
                                    const thumb = listing.images?.[0];
                                    const thumbUrl = typeof thumb === 'string' ? thumb : thumb?.url;

                                    return (
                                        <div key={listing._id} className="admin-card card">
                                            <div className="admin-card-top">
                                                <div className="admin-card-left">
                                                    <Link to={`/listings/${listing._id}`} className="admin-thumb" style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
                                                        {thumbUrl
                                                            ? <img src={thumbUrl} alt={listing.title} />
                                                            : <span>📦</span>
                                                        }
                                                    </Link>
                                                    <div>
                                                        <p className="admin-card-title">
                                                            <Link to={`/listings/${listing._id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                                                                {listing.title}
                                                            </Link>
                                                        </p>
                                                        <p className="admin-card-sub">
                                                            by <strong>{listing.seller?.name || '—'}</strong>
                                                            {' · '}
                                                            ₹{listing.price?.toLocaleString('en-IN')}
                                                            {' · '}
                                                            <span className="badge badge-muted">{listing.category}</span>
                                                        </p>
                                                        {listing.scamRisk?.level !== 'low' && (
                                                            <p className="admin-card-desc">
                                                                ⚠ Scam risk: {listing.scamRisk?.level} — {listing.scamRisk?.reason}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                <span className={`badge ${listing.status === 'flagged'
                                                    ? 'badge-danger'
                                                    : 'badge-success'}`}>
                                                    {listing.status}
                                                </span>
                                            </div>

                                            {listing.status !== 'sold' && listing.status !== 'reserved' && (
                                                <div className="admin-card-actions">
                                                    {listing.status === 'flagged' ? (
                                                        <button
                                                            className="btn btn-success btn-sm"
                                                            onClick={() => handleListingStatus(listing._id, 'active')}
                                                        >
                                                            Restore
                                                        </button>
                                                    ) : (
                                                        <button
                                                            className="btn btn-warning btn-sm"
                                                            onClick={() => handleListingStatus(listing._id, 'flagged')}
                                                        >
                                                            Flag
                                                        </button>
                                                    )}
                                                    <button
                                                        className="btn btn-danger btn-sm"
                                                        onClick={async () => {
                                                            const isConfirmed = await confirmDialog('Delete this listing permanently?');
                                                            if (!isConfirmed) return;
                                                            try {
                                                                await api.delete(`/api/listings/${listing._id}`);
                                                                setListings(prev => prev.filter(l => l._id !== listing._id));
                                                                showMsg('success', 'Listing deleted.');
                                                            } catch (err) {
                                                                showMsg('error', err.response?.data?.message || 'Delete failed.');
                                                            }
                                                        }}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                </div>
            )}

            {/* ── Users Tab ── */}
            {tab === 'users' && (
                usersLoading ? <Loader text="Loading users…" /> :
                    users.length === 0 ? (
                        <div className="empty-state">
                            <h3>No users found</h3>
                        </div>
                    ) : (
                        <div className="admin-list">
                            {users.map(u => (
                                <div key={u._id} className="admin-card card">
                                    <div className="admin-card-top">
                                        <div className="admin-card-left">
                                            <div className="admin-user-avatar">
                                                {u.avatar
                                                    ? <img src={u.avatar} alt={u.name} />
                                                    : <span>{u.name?.[0]?.toUpperCase()}</span>
                                                }
                                            </div>
                                            <div>
                                                <p className="admin-card-title">{u.name}</p>
                                                <p className="admin-card-sub">{u.email} · ID: {u.collegeId}</p>
                                                <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.3rem' }}>
                                                    <span className={`badge ${u.role === 'admin'
                                                        ? 'badge-warning'
                                                        : 'badge-accent'}`}>
                                                        {u.role}
                                                    </span>
                                                    {!u.isActive && (
                                                        <span className="badge badge-danger">Banned</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="admin-card-actions">
                                        {u.isActive ? (
                                            <button
                                                className="btn btn-danger btn-sm"
                                                onClick={() => handleUserAction(u._id, { isActive: false })}
                                            >
                                                Ban User
                                            </button>
                                        ) : (
                                            <button
                                                className="btn btn-success btn-sm"
                                                onClick={() => handleUserAction(u._id, { isActive: true })}
                                            >
                                                Unban User
                                            </button>
                                        )}
                                        {u.role !== 'admin' ? (
                                            <button
                                                className="btn btn-secondary btn-sm"
                                                onClick={() => handleUserAction(u._id, { role: 'admin' })}
                                            >
                                                Promote to Admin
                                            </button>
                                        ) : (
                                            <button
                                                className="btn btn-ghost btn-sm"
                                                onClick={() => handleUserAction(u._id, { role: 'student' })}
                                            >
                                                Demote to Student
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
            )}
        </div>
    );
}