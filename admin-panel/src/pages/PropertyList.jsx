import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, MapPin, BedDouble, Bath, Maximize } from 'lucide-react';
import api from '../services/api';

export default function PropertyList() {
  const [propiedades, setPropiedades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPropiedades = async () => {
    try {
      const res = await api.get('/propiedades');
      setPropiedades(res.data);
    } catch (err) {
      setError('Error al cargar propiedades');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPropiedades();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta propiedad?')) {
      try {
        await api.delete(`/propiedades/${id}`);
        setPropiedades(propiedades.filter(p => p.id !== id));
      } catch (err) {
        alert('Error al eliminar la propiedad');
      }
    }
  };

  const API_URL = 'http://localhost:3000/'; 

  if (loading) return <div className="text-center py-10 font-bold text-[#001F3F]">Cargando propiedades...</div>;
  if (error) return <div className="text-[#FF6B6B] font-bold p-4 bg-red-50 rounded-lg">{error}</div>;

  return (
    <div className="font-['Montserrat']">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <h2 className="text-3xl font-bold text-[#001F3F]">Tus Propiedades</h2>
        <Link
          to="/admin/propiedades/nueva"
          className="flex items-center space-x-2 bg-[#001F3F] text-[#FDC830] px-6 py-3 rounded-lg hover:bg-[#FDC830] hover:text-[#001F3F] transition-all font-bold shadow-md"
        >
          <Plus size={20} />
          <span>Nueva Propiedad</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {propiedades.map((prop) => (
          <div key={prop.id} className="bg-white rounded-[12px] shadow-[0_4px_15px_rgba(0,0,0,0.05)] overflow-hidden hover:shadow-[0_10px_25px_rgba(0,0,0,0.1)] transition-all flex flex-col">
            <div className="h-56 overflow-hidden bg-gray-100 relative">
              {prop.image ? (
                <img 
                  src={`${API_URL}${prop.image}`} 
                  alt={prop.title} 
                  className="w-full h-full object-cover transition-transform hover:scale-105 duration-500"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 bg-[#F4F7F6]">Sin imagen</div>
              )}
              <div className="absolute top-4 right-4 bg-[#FDC830] text-[#001F3F] px-3 py-1 font-bold rounded-md text-sm shadow-md">
                USD {prop.price?.toLocaleString()}
              </div>
            </div>
            
            <div className="p-6 flex-1 flex flex-col">
              <h3 className="text-lg font-bold text-[#001F3F] line-clamp-2 mb-3 leading-snug">{prop.title}</h3>
              
              <div className="flex items-center text-[#666] mb-4 text-sm font-medium">
                <MapPin size={16} className="mr-2 flex-shrink-0 text-[#001F3F]" />
                <span className="line-clamp-1">{prop.location}</span>
              </div>

              <div className="mt-auto pt-4 border-t border-gray-100 flex justify-between items-center">
                <div className="flex space-x-4 text-sm text-[#001F3F] font-bold">
                  <div className="flex items-center" title="Habitaciones">
                    <BedDouble size={16} className="mr-1" /> {prop.bedrooms}
                  </div>
                  <div className="flex items-center" title="Baños">
                    <Bath size={16} className="mr-1" /> {prop.bathroom}
                  </div>
                  <div className="flex items-center" title="Metros">
                    <Maximize size={16} className="mr-1" /> {prop.meters}
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Link
                    to={`/admin/propiedades/editar/${prop.id}`}
                    className="p-2 bg-[#FDC830] text-[#001F3F] hover:bg-[#e0a800] rounded-lg transition-colors shadow-sm"
                    title="Editar"
                  >
                    <Edit size={18} />
                  </Link>
                  <button
                    onClick={() => handleDelete(prop.id)}
                    className="p-2 bg-[#FF6B6B] text-white hover:bg-[#cc0000] rounded-lg transition-colors shadow-sm"
                    title="Eliminar"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {propiedades.length === 0 && (
          <div className="col-span-full text-center py-16 bg-white rounded-[12px] shadow-[0_4px_15px_rgba(0,0,0,0.05)]">
            <p className="text-[#666] text-lg font-medium">No tienes propiedades cargadas aún.</p>
          </div>
        )}
      </div>
    </div>
  );
}
