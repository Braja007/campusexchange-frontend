import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Listings from './pages/Listings';

const Stub = ({ name }) => <div className="page-container"><h1>{name}</h1><p>Coming soon</p></div>;

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/listings" element={<ProtectedRoute><Listings /></ProtectedRoute>} />
          <Route path="/listings/new" element={<ProtectedRoute><Stub name="Create Listing" /></ProtectedRoute>} />
          <Route path="/listings/:id" element={<ProtectedRoute><Stub name="Listing Detail" /></ProtectedRoute>} />
          <Route path="/listings/:id/edit" element={<ProtectedRoute><Stub name="Edit Listing" /></ProtectedRoute>} />
          <Route path="/my-listings" element={<ProtectedRoute><Stub name="My Listings" /></ProtectedRoute>} />
          <Route path="/offers" element={<ProtectedRoute><Stub name="Offers" /></ProtectedRoute>} />
          <Route path="/offers/:id" element={<ProtectedRoute><Stub name="Offer Detail" /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Stub name="Profile" /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute adminOnly><Stub name="Admin" /></ProtectedRoute>} />
          <Route path="/" element={<Navigate to="/listings" replace />} />
          <Route path="*" element={<Navigate to="/listings" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}