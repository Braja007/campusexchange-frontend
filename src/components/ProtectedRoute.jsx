import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({ children, adminOnly = false }) {
    const { isLoggedIn, isAdmin } = useAuth();
    const token = localStorage.getItem('token');
    let localUser = null;
    try {
        localUser = JSON.parse(localStorage.getItem('user'));
    } catch (e) { }

    const isActuallyLoggedIn = isLoggedIn || (!!token && !!localUser);
    const isActuallyAdmin = isAdmin || localUser?.role === 'admin';

    if (!isActuallyLoggedIn) return <Navigate to="/login" replace />;
    if (adminOnly && !isActuallyAdmin) return <Navigate to="/" replace />;
    return children;
}

export function Loader({ text = 'Loading...' }) {
    return (
        <div className="loader-wrap">
            <div style={{ textAlign: 'center' }}>
                <div className="spinner" />
                {text && <p style={{ marginTop: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>{text}</p>}
            </div>
        </div>
    );
}