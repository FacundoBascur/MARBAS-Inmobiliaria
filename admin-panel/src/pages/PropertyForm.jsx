import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { UploadCloud } from 'lucide-react';
import api from '../services/api';

export default function PropertyForm() {
  const { id } = useParams();
  const isEditing = !!id;
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    price: '',
    location: '',
    bedrooms: '',
    bathroom: '',
    meters: '',
    description: '',
    tour: '0',
    latitude: '',
    longitude: ''
  });

  const [files, setFiles] = useState({
    foto_principal: null,
    photo_360: [],
    fotos_galeria: []
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [hasTourImages, setHasTourImages] = useState(false);

  useEffect(() => {
    if (isEditing) {
      const fetchProperty = async () => {
        try {
          const res = await api.get('/propiedades'); 
          const prop = res.data.find(p => p.id === parseInt(id));
          if (prop) {
            setHasTourImages(Array.isArray(prop.photo_360) && prop.photo_360.length > 0);
            setFormData({
              title: prop.title || '',
              price: prop.price || '',
              location: prop.location || '',
              bedrooms: prop.bedrooms || '',
              bathroom: prop.bathroom || '',
              meters: prop.meters || '',
              description: prop.description || '',
              tour: prop.tour !== undefined ? String(prop.tour) : '0',
              latitude: prop.latitude || '',
              longitude: prop.longitude || ''
            });
          } else {
            setError("Propiedad no encontrada");
          }
        } catch (err) {
          setError("Error al cargar datos");
        }
      };
      fetchProperty();
    }
  }, [id, isEditing]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const { name, files: selectedFiles } = e.target;
    if (name === 'foto_principal') {
      setFiles(prev => ({ ...prev, [name]: selectedFiles[0] }));
    } else {
      setFiles(prev => ({ ...prev, [name]: Array.from(selectedFiles) }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      if (isEditing) {
        await api.put(`/propiedades/${id}`, formData);
      } else {
        const data = new FormData();
        Object.keys(formData).forEach(key => {
          data.append(key, formData[key]);
        });
        
        if (files.foto_principal) {
          data.append('foto_principal', files.foto_principal);
        }
        files.photo_360.forEach(file => {
          data.append('photo_360', file);
        });
        files.fotos_galeria.forEach(file => {
          data.append('fotos_galeria', file);
        });

        await api.post('/propiedades', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      setSuccess(true);
      setTimeout(() => {
        navigate('/admin/propiedades');
      }, 1500);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Error al guardar la propiedad');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full p-3 border border-[#ccc] rounded-lg outline-none focus:border-[#FDC830] focus:shadow-[0_0_5px_rgba(253,200,48,0.5)] transition-all font-['Montserrat']";
  const labelClass = "block text-sm font-bold text-[#001F3F] mb-2";

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-[12px] shadow-[0_4px_15px_rgba(0,0,0,0.05)] p-8 font-['Montserrat']">
      <h2 className="text-3xl font-bold text-[#001F3F] mb-8 text-center border-b pb-4">
        {isEditing ? 'Editar Propiedad' : 'Cargar Nueva Propiedad'}
      </h2>

      {error && (
        <div className="mb-8 bg-red-50 border-l-4 border-[#FF6B6B] p-4 text-[#FF6B6B] font-bold rounded-r-md">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-8 bg-[#f0fdf4] border-l-4 border-[#22c55e] p-4 text-[#15803d] font-bold rounded-r-md flex items-center justify-between shadow-sm">
          <span>¡Datos actualizados con éxito! Redirigiendo...</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="col-span-full">
            <label className={labelClass}>Título de la Propiedad</label>
            <input
              type="text"
              name="title"
              required
              className={inputClass}
              placeholder="Ej: Casa céntrica con patio"
              value={formData.title}
              onChange={handleInputChange}
            />
          </div>

          <div>
            <label className={labelClass}>Precio (USD)</label>
            <input
              type="number"
              name="price"
              required
              className={inputClass}
              placeholder="Ej: 150000"
              value={formData.price}
              onChange={handleInputChange}
            />
          </div>

          <div>
            <label className={labelClass}>Ubicación</label>
            <input
              type="text"
              name="location"
              required
              className={inputClass}
              placeholder="Ej: General Roca, Río Negro"
              value={formData.location}
              onChange={handleInputChange}
            />
          </div>

          <div>
            <label className={labelClass}>Latitud</label>
            <input
              type="text"
              name="latitude"
              placeholder="Ej: -39.0275"
              className={inputClass}
              value={formData.latitude}
              onChange={handleInputChange}
            />
          </div>

          <div>
            <label className={labelClass}>Longitud</label>
            <input
              type="text"
              name="longitude"
              placeholder="Ej: -67.5804"
              className={inputClass}
              value={formData.longitude}
              onChange={handleInputChange}
            />
          </div>

          <div>
            <label className={labelClass}>Dormitorios</label>
            <input
              type="number"
              name="bedrooms"
              className={inputClass}
              placeholder="Ej: 3"
              value={formData.bedrooms}
              onChange={handleInputChange}
            />
          </div>

          <div>
            <label className={labelClass}>Baños</label>
            <input
              type="number"
              name="bathroom"
              className={inputClass}
              placeholder="Ej: 2"
              value={formData.bathroom}
              onChange={handleInputChange}
            />
          </div>

          <div className="col-span-full">
            <label className={labelClass}>Metros Cuadrados (m²)</label>
            <input
              type="number"
              name="meters"
              className={inputClass}
              placeholder="Ej: 150"
              value={formData.meters}
              onChange={handleInputChange}
            />
          </div>

          <div>
            <label className={labelClass}>¿Incluye Tour 360?</label>
            <select
              name="tour"
              className={inputClass}
              value={formData.tour}
              onChange={handleInputChange}
              disabled={isEditing && !hasTourImages}
            >
              <option value="0">No</option>
              <option value="1">Sí</option>
            </select>
            {isEditing && !hasTourImages && (
              <p className="text-xs text-gray-500 mt-1 font-semibold">
                * No se subieron imágenes 360 al crear la propiedad.
              </p>
            )}
          </div>

          <div className="col-span-full">
            <label className={labelClass}>Descripción</label>
            <textarea
              name="description"
              rows="5"
              className={inputClass}
              placeholder="Describe los detalles de la propiedad..."
              value={formData.description}
              onChange={handleInputChange}
            ></textarea>
          </div>

          {!isEditing && (
            <>
              <div className="col-span-full border-t border-gray-200 pt-6 mt-4">
                <h3 className="text-xl font-bold text-[#001F3F] mb-6 flex items-center">
                  <UploadCloud className="mr-2 text-[#FDC830]" /> Carga de Imágenes
                </h3>
              </div>

              <div className="col-span-full bg-[#F4F7F6] p-6 rounded-lg border border-dashed border-gray-300">
                <label className={labelClass}>Foto Principal (Portada)</label>
                <input
                  type="file"
                  name="foto_principal"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:font-bold file:bg-[#001F3F] file:text-[#FDC830] hover:file:bg-[#00152B] cursor-pointer"
                />
              </div>

              <div className="col-span-full bg-[#F4F7F6] p-6 rounded-lg border border-dashed border-gray-300">
                <label className={labelClass}>Fotos Galería (Múltiples)</label>
                <input
                  type="file"
                  name="fotos_galeria"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:font-bold file:bg-[#001F3F] file:text-[#FDC830] hover:file:bg-[#00152B] cursor-pointer"
                />
              </div>

              {formData.tour === '1' && (
                <div className="col-span-full bg-[#eef2f5] p-6 rounded-lg border-l-4 border-[#FF6B6B]">
                  <label className="block text-sm font-bold text-[#FF6B6B] mb-2">Tour 360 (Imágenes Esféricas)</label>
                  <input
                    type="file"
                    name="photo_360"
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:font-bold file:bg-[#FF6B6B] file:text-white hover:file:bg-[#cc0000] cursor-pointer"
                  />
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex justify-end space-x-4 pt-8 border-t border-gray-200 mt-8">
          <button
            type="button"
            onClick={() => navigate('/admin/propiedades')}
            className="px-8 py-3 bg-[#6c757d] text-white rounded-lg hover:bg-[#5a6268] transition-colors font-bold shadow-md"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 bg-[#001F3F] text-[#FDC830] rounded-lg hover:bg-[#FDC830] hover:text-[#001F3F] transition-colors font-bold shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? 'Guardando...' : (isEditing ? 'Actualizar Datos' : 'Guardar Propiedad')}
          </button>
        </div>
      </form>
    </div>
  );
}
