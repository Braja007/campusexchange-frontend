import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Listings from './pages/Listings';
import ListingDetail from './pages/ListingDetail';
import CreateListing from './pages/CreateListing';
import EditListing from './pages/EditListing';
import MyListings from './pages/MyListings';
import Offers from './pages/Offers';
import OfferDetail from './pages/OfferDetail';
import Profile from './pages/Profile';
import PublicProfile from './pages/PublicProfile';

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
          <Route path="/listings/new" element={<ProtectedRoute><CreateListing /></ProtectedRoute>} />
          <Route path="/listings/:id" element={<ProtectedRoute><ListingDetail /></ProtectedRoute>} />
          <Route path="/listings/:id/edit" element={<ProtectedRoute><EditListing /></ProtectedRoute>} />
          <Route path="/my-listings" element={<ProtectedRoute><MyListings /></ProtectedRoute>} />
          <Route path="/offers" element={<ProtectedRoute><Offers /></ProtectedRoute>} />
          <Route path="/offers/:id" element={<ProtectedRoute><OfferDetail /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/users/:id" element={<ProtectedRoute><PublicProfile /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute adminOnly><Stub name="Admin" /></ProtectedRoute>} />
          <Route path="/" element={<Navigate to="/listings" replace />} />
          <Route path="*" element={<Navigate to="/listings" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}