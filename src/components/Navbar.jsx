import { useState } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Navbar.css';
import logo from '../assets/logo.png';

export default function Navbar() {
    const { user, isAdmin, isLoggedIn, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);

    function handleLogout() { logout(); navigate('/login'); setMobileOpen(false); }
    function closeMobile() { setMobileOpen(false); }

    const navLinks = (
        <>
            <NavLink to="/listings" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} onClick={closeMobile}>Browse</NavLink>
            <NavLink to="/my-listings" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} onClick={closeMobile}>My Listings</NavLink>
            <NavLink to="/offers" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} onClick={closeMobile}>Offers</NavLink>
            {isAdmin && (
                <NavLink to="/admin" className={({ isActive }) => isActive ? 'nav-link active nav-link-admin' : 'nav-link nav-link-admin'} onClick={closeMobile}>Admin</NavLink>
            )}
        </>
    );

    return (
        <nav className="navbar">
            <div className="navbar-inner">
                <Link to="/" className="navbar-brand" onClick={closeMobile}>
                    <img src={logo} alt="CampusExchange" className="brand-logo" />
                    <span className="brand-text">Campus<span className="brand-accent">Exchange</span></span>
                </Link>

                {isLoggedIn && (
                    <div className="navbar-links">
                        {navLinks}
                    </div>
                )}

                <div className="navbar-right">
                    {isLoggedIn ? (
                        <>
                            <NavLink to="/profile" className="nav-avatar" title={user?.name} onClick={closeMobile}>
                                {user?.avatar
                                    ? <img src={user.avatar} alt={user.name} />
                                    : <span className="avatar-initials">{user?.name?.[0]?.toUpperCase() || 'U'}</span>
                                }
                            </NavLink>
                            <button className="btn btn-ghost btn-sm desktop-logout-btn" onClick={handleLogout}>Logout</button>
                        </>
                    ) : (
                        <div className="auth-links">
                            <Link to="/login" className={`btn btn-sm ${location.pathname === '/login' ? 'btn-primary' : 'btn-ghost'}`}>Login</Link>
                            <Link to="/register" className={`btn btn-sm ${location.pathname === '/login' ? 'btn-ghost' : 'btn-primary'}`}>Register</Link>
                        </div>
                    )}

                    {isLoggedIn && (
                        <button
                            className={`navbar-toggle ${mobileOpen ? 'open' : ''}`}
                            onClick={() => setMobileOpen(prev => !prev)}
                            aria-label="Toggle menu"
                        >
                            <div className="hamburger">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                        </button>
                    )}
                </div>
            </div>

            {/* Mobile menu */}
            {isLoggedIn && (
                <div className={`mobile-nav-menu ${mobileOpen ? 'show' : ''}`}>
                    {navLinks}
                    <button className="btn btn-danger btn-sm mobile-logout-btn" onClick={handleLogout}>Logout</button>
                </div>
            )}
        </nav>
    );
}