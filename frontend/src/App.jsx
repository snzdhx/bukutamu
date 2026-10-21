import { Navigate, Route, Routes } from 'react-router-dom';
import AdminLayout from './components/AdminLayout.jsx';
import Home from './pages/Home.jsx';
import BukuTamu from './pages/BukuTamu.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Responden from './pages/Responden.jsx';
import GalleryAdmin from './pages/GalleryAdmin.jsx';
import UbahPassword from './pages/UbahPassword.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/buku-tamu" element={<BukuTamu />} />
      <Route path="/admin/login" element={<Login />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="responden" element={<Responden />} />
        <Route path="gallery" element={<GalleryAdmin />} />
        <Route path="ubah-password" element={<UbahPassword />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}