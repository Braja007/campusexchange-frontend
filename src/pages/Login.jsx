import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Auth.css';
import logo from '../assets/logo.png';

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname || '/listings';
    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    function handleChange(e) {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
        if (error) setError('');
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (!form.email || !form.password) { setError('Both fields are required.'); return; }
        setLoading(true);
        try {
            await login(form.email.trim().toLowerCase(), form.password);
            navigate(from, { replace: true });
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Check your credentials.');
        } finally { setLoading(false); }
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-header">
                    <img src={logo} alt="CampusExchange" className="auth-logo-img" />
                    <h1>Welcome back</h1>
                    <p>Sign in with your college email id</p>
                </div>
                {error && <div className="alert alert-error">{error}</div>}
                <form onSubmit={handleSubmit} noValidate>
                    <div className="form-group">
                        <label htmlFor="email">College Email</label>
                        <input id="email" name="email" type="email" placeholder="you@nits.ac.in" value={form.email} onChange={handleChange} disabled={loading} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input id="password" name="password" type="password" placeholder="Enter your password" value={form.password} onChange={handleChange} disabled={loading} />
                    </div>
                    <button type="submit" className="btn btn-primary btn-full auth-submit-btn" disabled={loading}>
                        {loading ? 'Signing in…' : 'Sign in'}
                    </button>
                </form>
                <p className="auth-footer">Don't have an account? <Link to="/register">Register here</Link></p>
            </div>
        </div>
    );
}