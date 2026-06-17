import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Navbar.css';
import logo from '../assets/logo.png';

export default function Navbar() {
    const { user, isAdmin, isLoggedIn, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    function handleLogout() { logout(); navigate('/login'); }

    return (
        <nav className="navbar">
            <div className="navbar-inner">
                <Link to="/" className="navbar-brand">
                    <img src={logo} alt="CampusExchange" className="brand-logo" />
                    <span className="brand-text">Campus<span className="brand-accent">Exchange</span></span>
                </Link>

                {isLoggedIn && (
                    <div className="navbar-links">
                        <NavLink to="/listings" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Browse</NavLink>
                        <NavLink to="/my-listings" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>My Listings</NavLink>
                        <NavLink to="/offers" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Offers</NavLink>
                        {isAdmin && (
                            <NavLink to="/admin" className={({ isActive }) => isActive ? 'nav-link active nav-link-admin' : 'nav-link nav-link-admin'}>Admin</NavLink>
                        )}
                    </div>
                )}

                <div className="navbar-right">
                    {isLoggedIn ? (
                        <>
                            <NavLink to="/profile" className="nav-avatar" title={user?.name}>
                                {user?.avatar
                                    ? <img src={user.avatar} alt={user.name} />
                                    : <span className="avatar-initials">{user?.name?.[0]?.toUpperCase() || 'U'}</span>
                                }
                            </NavLink>
                            <button className="btn btn-ghost btn-sm" onClick={handleLogout}>Logout</button>
                        </>
                    ) : (
                        <div className="auth-links">
                            <Link to="/login" className={`btn btn-sm ${location.pathname === '/login' ? 'btn-primary' : 'btn-ghost'}`}>Login</Link>
                            <Link to="/register" className={`btn btn-sm ${location.pathname === '/login' ? 'btn-ghost' : 'btn-primary'}`}>Register</Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}