import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import AdminLayout from './components/AdminLayout';
import PropertyList from './pages/PropertyList';
import PropertyForm from './pages/PropertyForm';
import HeroImages from './pages/HeroImages';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/admin/propiedades" replace />} />
          <Route path="/login" element={<Login />} />
          
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="propiedades" replace />} />
            <Route path="propiedades" element={<PropertyList />} />
            <Route path="propiedades/nueva" element={<PropertyForm />} />
            <Route path="propiedades/editar/:id" element={<PropertyForm />} />
            <Route path="fondo" element={<HeroImages />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
