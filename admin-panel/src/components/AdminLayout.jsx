import { Navigate, Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Home, LogOut, FileText, Image as ImageIcon, Globe } from 'lucide-react';

export default function AdminLayout() {
  const { isAuthenticated, loading, logout } = useAuth();
  const location = useLocation();

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#F4F7F6] font-['Montserrat']">Cargando...</div>;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const navItems = [
    { name: 'Propiedades', path: '/admin/propiedades', icon: Home },
    { name: 'Fondo Principal', path: '/admin/fondo', icon: ImageIcon },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F4F7F6] font-['Montserrat']">
      <aside className="w-full md:w-64 bg-[#001F3F] text-white flex flex-col shadow-xl z-10">
        <div className="p-6 border-b border-white/10 flex items-center space-x-3">
          <img src="/imagenes/MARBAS.png" alt="Logo" className="h-10" />
          <h1 className="text-xl font-bold tracking-widest text-white">MARBAS ADMIN</h1>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all font-bold ${isActive
                  ? 'bg-[#FDC830] text-[#001F3F] shadow-md'
                  : 'text-gray-300 hover:bg-[#00152B] hover:text-[#FDC830]'
                  }`}
              >
                <Icon size={20} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10 space-y-2">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-3 px-4 py-3 w-full rounded-lg text-gray-300 hover:bg-[#FDC830] hover:text-[#001F3F] transition-all font-bold"
          >
            <Globe size={20} />
            <span>Ver Web</span>
          </a>
          <button
            onClick={logout}
            className="flex items-center space-x-3 px-4 py-3 w-full rounded-lg text-gray-300 hover:bg-[#FF6B6B] hover:text-white transition-all font-bold"
          >
            <LogOut size={20} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[#F4F7F6] p-4 md:p-8">
        <Outlet />
      </main>
    </div>
  );
}
