import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { UploadCloud, Trash2, Image as ImageIcon } from 'lucide-react';
import api from '../services/api';

const UPLOADS_BASE = import.meta.env.VITE_UPLOADS_URL || 'http://localhost:3000';

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
    longitude: '',
    operation_type: 'En Venta',
    currency: 'USD'
  });

  const [files, setFiles] = useState({
    foto_principal: null,
    photo_360: [],
    fotos_galeria: []
  });

  // Estados para las imágenes actuales
  const [currentImage, setCurrentImage] = useState('');
  const [currentGalery, setCurrentGalery] = useState([]);
  const [current360, setCurrent360] = useState([]);
  const [imagenesAEliminar, setImagenesAEliminar] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [hasTourImages, setHasTourImages] = useState(false);

  useEffect(() => {
    if (isEditing) {
      const fetchProperty = async () => {
        try {
          const res = await api.get(`/propiedades/${id}`);
          const prop = res.data;
          if (prop) {
            setHasTourImages(Array.isArray(prop.photo_360) && prop.photo_360.length > 0);

            setCurrentImage(prop.image || '');
            setCurrentGalery(Array.isArray(prop.galery) ? prop.galery : []);
            setCurrent360(Array.isArray(prop.photo_360) ? prop.photo_360 : []);

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
              longitude: prop.longitude || '',
              operation_type: prop.operation_type || 'En Venta',
              currency: prop.currency || 'USD'
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

  const handleEliminarImagen = (imagePath) => {
    setImagenesAEliminar(prev => [...prev, imagePath]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const data = new FormData();

      // Agregar campos de texto
      Object.keys(formData).forEach(key => {
        data.append(key, formData[key]);
      });

      // Agregar archivos nuevos
      if (files.foto_principal) {
        data.append('foto_principal', files.foto_principal);
      }
      files.photo_360.forEach(file => {
        data.append('photo_360', file);
      });
      files.fotos_galeria.forEach(file => {
        data.append('fotos_galeria', file);
      });

      // Si es edición, enviar las fotos a eliminar
      if (isEditing) {
        data.append('imagenes_a_eliminar', JSON.stringify(imagenesAEliminar));
        
        await api.put(`/propiedades/${id}`, data);
      } else {
        await api.post('/propiedades', data);
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

  // Helper para renderizar miniaturas
  const renderThumbnail = (imagePath, title, isPortada = false) => {
    if (imagenesAEliminar.includes(imagePath)) return null;

    // Normalizar la URL quitando trailing slash
    const base = UPLOADS_BASE.replace(/\/$/, '');
    const imgUrl = `${base}/${imagePath}`;

    return (
      <div key={imagePath} className="relative group rounded-xl overflow-hidden border border-gray-200 shadow-sm h-32 w-full">
        <img src={imgUrl} alt="miniatura" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <button
            type="button"
            onClick={() => handleEliminarImagen(imagePath)}
            className="bg-red-500 hover:bg-red-600 text-white rounded-full p-2 transition shadow-md"
            title="Eliminar imagen"
          >
            <Trash2 size={16} />
          </button>
        </div>
        <p className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] px-2 py-1 truncate font-bold text-center">
          {title} {isPortada && "(Portada)"}
        </p>
      </div>
    );
  };

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
            <label className={labelClass}>Tipo de Operación</label>
            <select
              name="operation_type"
              className={inputClass}
              value={formData.operation_type}
              onChange={handleInputChange}
            >
              <option value="En Venta">En Venta</option>
              <option value="En Alquiler">En Alquiler</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Moneda</label>
            <select
              name="currency"
              className={inputClass}
              value={formData.currency}
              onChange={handleInputChange}
            >
              <option value="USD">USD</option>
              <option value="ARS">ARS</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Precio</label>
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
            >
              <option value="0">No</option>
              <option value="1">Sí</option>
            </select>
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

          {/* --- SECCIÓN DE IMÁGENES ACTUALES (SOLO EDICIÓN) --- */}
          {isEditing && (
            <div className="col-span-full border-t border-gray-200 pt-6 mt-4">
              <h3 className="text-xl font-bold text-[#001F3F] mb-4 flex items-center">
                <ImageIcon className="mr-2 text-[#001F3F]" /> Imágenes Actuales
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Tocá el icono de la papelera para eliminar una imagen. Los cambios se aplicarán al guardar.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {currentImage && renderThumbnail(currentImage, "Principal", true)}
                {currentGalery.map((img, i) => renderThumbnail(img, `Galería ${i + 1}`))}
                {current360.map((img, i) => renderThumbnail(img, `360° ${i + 1}`))}
              </div>

              {(!currentImage && currentGalery.length === 0 && current360.length === 0) || (
                [currentImage, ...currentGalery, ...current360].every(img => imagenesAEliminar.includes(img))
              ) ? (
                <div className="text-center py-6 text-gray-400 bg-gray-50 rounded-lg border border-dashed">
                  No quedarán imágenes guardadas.
                </div>
              ) : null}
            </div>
          )}

          {/* --- SECCIÓN DE CARGA DE NUEVAS IMÁGENES --- */}
          <div className="col-span-full border-t border-gray-200 pt-6 mt-4">
            <h3 className="text-xl font-bold text-[#001F3F] mb-6 flex items-center">
              <UploadCloud className="mr-2 text-[#FDC830]" /> {isEditing ? 'Agregar Nuevas Imágenes' : 'Carga de Imágenes'}
            </h3>
          </div>

          <div className="col-span-full bg-[#F4F7F6] p-6 rounded-lg border border-dashed border-gray-300">
            <label className={labelClass}>
              {isEditing ? 'Reemplazar Foto Principal (Portada)' : 'Foto Principal (Portada)'}
            </label>
            <input
              type="file"
              name="foto_principal"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:font-bold file:bg-[#001F3F] file:text-[#FDC830] hover:file:bg-[#00152B] cursor-pointer"
            />
            {isEditing && files.foto_principal && (
              <p className="text-xs text-green-600 mt-2 font-bold">✓ Se reemplazará la portada actual.</p>
            )}
          </div>

          <div className="col-span-full bg-[#F4F7F6] p-6 rounded-lg border border-dashed border-gray-300">
            <label className={labelClass}>
              {isEditing ? 'Agregar Fotos a la Galería' : 'Fotos Galería (Múltiples)'}
            </label>
            <input
              type="file"
              name="fotos_galeria"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:font-bold file:bg-[#001F3F] file:text-[#FDC830] hover:file:bg-[#00152B] cursor-pointer"
            />
            {files.fotos_galeria.length > 0 && (
              <p className="text-xs text-green-600 mt-2 font-bold">✓ {files.fotos_galeria.length} archivo(s) seleccionado(s) para la galería.</p>
            )}
          </div>

          {formData.tour === '1' && (
            <div className="col-span-full bg-[#eef2f5] p-6 rounded-lg border-l-4 border-[#FF6B6B]">
              <label className="block text-sm font-bold text-[#FF6B6B] mb-2">
                {isEditing ? 'Agregar Imágenes para Tour 360' : 'Tour 360 (Imágenes Esféricas)'}
              </label>
              <input
                type="file"
                name="photo_360"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:font-bold file:bg-[#FF6B6B] file:text-white hover:file:bg-[#cc0000] cursor-pointer"
              />
              {files.photo_360.length > 0 && (
                <p className="text-xs text-green-600 mt-2 font-bold">✓ {files.photo_360.length} archivo(s) 360 seleccionado(s).</p>
              )}
            </div>
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
            {loading ? 'Guardando...' : (isEditing ? 'Actualizar Propiedad' : 'Guardar Propiedad')}
          </button>
        </div>
      </form>
    </div>
  );
}
