import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Auth.css';
import logo from '../assets/logo.png';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', collegeId: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError('');
  }

  function validate() {
    if (form.name.trim().length < 2) return 'Name must be at least 2 characters.';
    if (!form.email.endsWith('nits.ac.in')) return 'Only @nits.ac.in email addresses are allowed.';
    if (!form.collegeId.trim()) return 'College ID is required.';
    if (form.password.length < 6) return 'Password must be at least 6 characters.';
    if (form.password !== form.confirmPassword) return 'Passwords do not match.';
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    setLoading(true);
    try {
      await register({ name: form.name.trim(), email: form.email.trim().toLowerCase(), collegeId: form.collegeId.trim(), password: form.password });
      navigate('/listings', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally { setLoading(false); }
  }

  return (
    <div className="auth-page">
      <div className="auth-card auth-card-wide">
        <div className="auth-header">
          <img src={logo} alt="CampusExchange" className="auth-logo-img" />
          <h1>Create account</h1>
          <p>Join the NITS campus marketplace</p>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-row">
            <div className="form-group">
              <label>Full Name</label>
              <input name="name" placeholder="eg. John Doe" value={form.name} onChange={handleChange} disabled={loading} />
            </div>
            <div className="form-group">
              <label>College ID</label>
              <input name="collegeId" placeholder="eg. 24EC082" value={form.collegeId} onChange={handleChange} disabled={loading} />
            </div>
          </div>
          <div className="form-group">
            <label>College Email</label>
            <input name="email" type="email" placeholder="name@nits.ac.in" value={form.email} onChange={handleChange} disabled={loading} />
            <span className="form-hint">@nits.ac.in and department subdomains accepted</span>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Password</label>
              <input name="password" type="password" placeholder="Min 6 characters" value={form.password} onChange={handleChange} disabled={loading} />
            </div>
            <div className="form-group">
              <label>Confirm Password</label>
              <input name="confirmPassword" type="password" placeholder="Repeat password" value={form.confirmPassword} onChange={handleChange} disabled={loading} />
            </div>
          </div>
          <button type="submit" className="btn btn-primary btn-full auth-submit-btn" disabled={loading}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>
        <p className="auth-footer">Already have an account? <Link to="/login">Sign in</Link></p>
      </div>
    </div>
  );
}