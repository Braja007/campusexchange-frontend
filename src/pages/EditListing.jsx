import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Loader } from '../components/ProtectedRoute';
import '../styles/ListingForm.css';

const CATEGORIES = ['books', 'electronics', 'calculators', 'cycles', 'hostel-essentials', 'lab-equipment', 'clothing', 'sports', 'other'];
const CONDITIONS = ['new', 'like-new', 'good', 'fair', 'poor'];

export default function EditListing() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [form, setForm] = useState({ title: '', description: '', category: '', condition: '', price: '', tags: '' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (!id || id === 'undefined') {
            navigate('/listings', { replace: true });
            return;
        }

        async function fetchListing() {
            try {
                const res = await api.get(`/api/listings/${id}`);
                const l = res.data?.data?.listing || res.data?.data;
                setForm({
                    title: l.title || '',
                    description: l.description || '',
                    category: l.category || '',
                    condition: l.condition || '',
                    price: l.price ?? '',
                    tags: l.tags?.join(', ') || '',
                });
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to load listing.');
            } finally {
                setLoading(false);
            }
        }
        fetchListing();
    }, [id]);

    function handleChange(e) {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
        if (error) setError('');
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setSaving(true); setError(''); setSuccess('');
        try {
            const payload = {
                title: form.title.trim(),
                description: form.description.trim(),
                category: form.category,
                condition: form.condition,
                price: Number(form.price),
                tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
            };
            await api.patch(`/api/listings/${id}`, payload);
            setSuccess('Listing updated successfully!');
            setTimeout(() => navigate(`/listings/${id}`), 1200);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update listing.');
        } finally {
            setSaving(false);
        }
    }

    if (loading) return <Loader text="Loading listing…" />;

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Edit Listing</h1>
                <p>Update your listing details</p>
            </div>

            <div className="form-card card">
                {error && <div className="alert alert-error">{error}</div>}
                {success && <div className="alert alert-success">{success}</div>}

                <form onSubmit={handleSubmit} noValidate>
                    <div className="form-group">
                        <label>Title *</label>
                        <input name="title" value={form.title} onChange={handleChange} />
                    </div>

                    <div className="form-group">
                        <label>Description *</label>
                        <textarea name="description" rows={4} value={form.description} onChange={handleChange} />
                    </div>

                    <div className="form-row-3">
                        <div className="form-group">
                            <label>Category</label>
                            <select name="category" value={form.category} onChange={handleChange}>
                                <option value="">Select…</option>
                                {CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/-/g, ' ')}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Condition *</label>
                            <select name="condition" value={form.condition} onChange={handleChange}>
                                <option value="">Select…</option>
                                {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Price (₹) *</label>
                            <input name="price" type="number" min="0" value={form.price} onChange={handleChange} />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Tags</label>
                        <input name="tags" placeholder="comma separated" value={form.tags} onChange={handleChange} />
                    </div>

                    <div className="form-actions">
                        <button type="button" className="btn btn-ghost" onClick={() => navigate(`/listings/${id}`)}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={saving}>
                            {saving ? 'Saving…' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}