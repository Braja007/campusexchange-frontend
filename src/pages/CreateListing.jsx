import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import '../styles/ListingForm.css';

const CATEGORIES = ['books', 'electronics', 'calculators', 'cycles', 'hostel-essentials', 'lab-equipment', 'clothing', 'sports', 'other'];
const CONDITIONS = ['new', 'like-new', 'good', 'fair', 'poor'];

export default function CreateListing() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        title: '', description: '', category: '', condition: '', price: '', tags: '',
    });
    const [images, setImages] = useState([]);
    const [previews, setPreviews] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);

    // AI generate fields
    const [aiItem, setAiItem] = useState('');
    const [showAiBox, setShowAiBox] = useState(false);

    function handleChange(e) {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
        if (error) setError('');
    }

    function handleImages(e) {
        const files = Array.from(e.target.files).slice(0, 5);
        setImages(files);
        setPreviews(files.map(f => URL.createObjectURL(f)));
    }

    function removeImage(i) {
        setImages(prev => prev.filter((_, idx) => idx !== i));
        setPreviews(prev => prev.filter((_, idx) => idx !== i));
    }

    async function handleAiGenerate() {
        if (!aiItem.trim()) return;
        if (!form.condition || !form.price) {
            setError('Fill in Condition and Price before generating with AI.');
            return;
        }
        setAiLoading(true);
        setError('');
        try {
            const res = await api.post('/api/listings/generate', {
                item: aiItem.trim(),
                condition: form.condition,
                price: Number(form.price),
            });
            
            let generated = res.data?.data || res.data;
            
            // Handle if the API returned a string (e.g. markdown JSON block)
            if (typeof generated === 'string') {
                try {
                    const jsonStr = generated.replace(/```json/gi, '').replace(/```/g, '').trim();
                    generated = JSON.parse(jsonStr);
                } catch (e) {
                    console.error("Could not parse AI response", e);
                }
            }

            // Sometimes the data might be nested depending on backend response
            if (generated && typeof generated === 'object') {
                if (generated.generated) generated = generated.generated;
                if (generated.listing) generated = generated.listing;
            }

            setForm(prev => ({
                ...prev,
                title: generated.title || prev.title,
                description: generated.description || prev.description,
                category: generated.category || prev.category,
                tags: Array.isArray(generated.tags) 
                    ? generated.tags.join(', ') 
                    : (typeof generated.tags === 'string' ? generated.tags : prev.tags),
            }));
            
            setShowAiBox(false);
            setAiItem('');
        } catch (err) {
            setError(err.response?.data?.message || 'AI generation failed. Fill manually.');
        } finally {
            setAiLoading(false);
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (!form.title || !form.description || !form.condition || !form.price) {
            setError('Title, description, condition and price are required.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const fd = new FormData();
            fd.append('title', form.title.trim());
            fd.append('description', form.description.trim());
            fd.append('condition', form.condition);
            fd.append('price', form.price);
            if (form.category) fd.append('category', form.category);
            if (form.tags) {
                form.tags.split(',').map(t => t.trim()).filter(Boolean)
                    .forEach(t => fd.append('tags[]', t));
            }
            images.forEach(img => fd.append('images', img));

            const res = await api.post('/api/listings', fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            const created = res.data?.data?.listing || res.data?.data;
            
            if (created.status === 'flagged') {
                alert('Warning: Your listing was flagged for review due to suspicious content (like an unrealistically low price). It will not be public until an admin approves it.');
            }
            
            navigate(`/listings/${created._id}`);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create listing.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Create Listing</h1>
                <p>List your item for sale on campus</p>
            </div>

            <div className="form-card card">
                {error && <div className="alert alert-error">{error}</div>}

                {/* AI Generator */}
                <div className="ai-box">
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setShowAiBox(prev => !prev)}
                    >
                        ✨ {showAiBox ? 'Hide AI Generator' : 'Generate with AI'}
                    </button>

                    {showAiBox && (
                        <div className="ai-inputs-container">
                            <div className="ai-input-row">
                                <input
                                    placeholder="Describe your item — e.g. 'MTech ML textbook by Bishop'"
                                    value={aiItem}
                                    onChange={e => setAiItem(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleAiGenerate()}
                                    style={{ flex: 1 }}
                                />
                            </div>
                            <div className="ai-input-row" style={{ marginTop: '10px' }}>
                                <select 
                                    name="condition" 
                                    value={form.condition} 
                                    onChange={handleChange}
                                    style={{ flex: 1 }}
                                >
                                    <option value="">Condition *</option>
                                    {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                                <input 
                                    name="price" 
                                    type="number" 
                                    min="0" 
                                    placeholder="Price (₹) *" 
                                    value={form.price} 
                                    onChange={handleChange}
                                    style={{ flex: 1 }}
                                />
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={handleAiGenerate}
                                    disabled={aiLoading || !aiItem.trim()}
                                >
                                    {aiLoading ? 'Generating…' : 'Generate'}
                                </button>
                            </div>
                        </div>
                    )}
                    <p className="form-hint">AI fills title, description and tags. Enter condition and price before generating.</p>
                </div>

                <div className="divider" />

                <form onSubmit={handleSubmit} noValidate>
                    <div className="form-group">
                        <label>Title *</label>
                        <input name="title" placeholder="e.g. Engineering Mathematics by Kreyszig" value={form.title} onChange={handleChange} />
                    </div>

                    <div className="form-group">
                        <label>Description *</label>
                        <textarea name="description" rows={4} placeholder="Describe condition, edition, what's included…" value={form.description} onChange={handleChange} />
                    </div>

                    <div className="form-row-3">
                        <div className="form-group">
                            <label>Category</label>
                            <select name="category" value={form.category} onChange={handleChange}>
                                <option value="">Auto-detect</option>
                                {CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/-/g, ' ')}</option>)}
                            </select>
                            <span className="form-hint">Leave blank — AI will classify</span>
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
                            <input name="price" type="number" min="0" placeholder="0" value={form.price} onChange={handleChange} />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Tags</label>
                        <input name="tags" placeholder="mtech, ml, textbook, 2nd edition (comma separated)" value={form.tags} onChange={handleChange} />
                        <span className="form-hint">Helps buyers find your listing</span>
                    </div>

                    {/* Image Upload */}
                    <div className="form-group">
                        <label>Images (max 5)</label>
                        <div className="image-upload-area" onClick={() => document.getElementById('img-input').click()}>
                            <input id="img-input" type="file" accept="image/*" multiple hidden onChange={handleImages} />
                            <span className="upload-icon">🖼</span>
                            <p>Click to upload images</p>
                            <span className="form-hint">Max 5MB each · JPG, PNG, WEBP</span>
                        </div>

                        {previews.length > 0 && (
                            <div className="image-previews">
                                {previews.map((src, i) => (
                                    <div key={i} className="preview-item">
                                        <img src={src} alt={`preview ${i + 1}`} />
                                        <button type="button" className="preview-remove" onClick={() => removeImage(i)}>✕</button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="form-actions">
                        <button type="button" className="btn btn-ghost" onClick={() => navigate(-1)}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Creating…' : 'Create Listing'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}