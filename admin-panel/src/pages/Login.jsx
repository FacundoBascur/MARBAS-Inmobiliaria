import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await login(usuario, password);
    
    if (result.success) {
      navigate('/admin/propiedades');
    } else {
      setError(result.error);
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#001F3F] m-0">
      <div className="bg-white rounded-[12px] p-[3rem] w-[90%] max-w-[400px] shadow-[0_10px_25px_rgba(0,0,0,0.5)]">
        
        <div className="text-center mb-8">
          <img 
            src="/imagenes/MARBAS.png" 
            alt="Marbas Logo" 
            className="h-[80px] mx-auto mb-4"
          />
          <h2 className="text-[#001F3F] text-[24px] font-bold mb-2">Acceso Privado</h2>
          <p className="text-[#666] text-[0.9rem] leading-tight">
            Ingresá tus credenciales para gestionar el catálogo.
          </p>
        </div>

        {error && (
          <div className="mb-[15px] bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative text-center text-sm font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-[1.5rem]">
          <div className="flex flex-col">
            <label className="text-[#001F3F] font-bold mb-[5px] text-[16px]">
              Usuario / Email
            </label>
            <input
              type="text"
              required
              className="w-full p-[12px] border border-[#ccc] rounded-[6px] outline-none focus:border-[#FDC830] focus:shadow-[0_0_5px_rgba(253,200,48,0.5)] transition-all font-['Montserrat'] text-[16px]"
              placeholder="admin@ejemplo.com"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
            />
          </div>

          <div className="flex flex-col">
            <label className="text-[#001F3F] font-bold mb-[5px] text-[16px]">
              Contraseña
            </label>
            <input
              type="password"
              required
              className="w-full p-[12px] border border-[#ccc] rounded-[6px] outline-none focus:border-[#FDC830] focus:shadow-[0_0_5px_rgba(253,200,48,0.5)] transition-all font-['Montserrat'] text-[16px]"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full p-[15px] border-none rounded-[6px] font-bold text-[1.1rem] text-[#FDC830] bg-[#001F3F] hover:bg-[#FDC830] hover:text-[#001F3F] cursor-pointer transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Ingresando...' : 'Ingresar al Panel'}
          </button>
        </form>

        <div className="text-center mt-[1.5rem]">
          <a 
            href="http://129.80.48.0/"  
            className="text-[#FDC830] font-bold text-[0.9rem] no-underline hover:text-[#001F3F] transition-colors"
          >
            ← Volver a la web
          </a>
        </div>

      </div>
    </div>
  );
}
