import { useState, useEffect, useCallback } from 'react';
import { Trash2, Upload, ImageIcon, AlertCircle, CheckCircle } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const UPLOADS_BASE = import.meta.env.VITE_UPLOADS_URL || 'http://localhost:3000';

// Leer el token directamente de localStorage
const getToken = () => localStorage.getItem('token');

export default function HeroImages() {
  const [imagenes, setImagenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subiendo, setSubiendo] = useState(false);
  const [progreso, setProgreso] = useState({ actual: 0, total: 0 });
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  const [archivosSeleccionados, setArchivosSeleccionados] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [dragOver, setDragOver] = useState(false);

  const mostrarExito = (msg) => {
    setExito(msg);
    setTimeout(() => setExito(''), 3500);
  };

  const mostrarError = (msg) => {
    setError(msg);
    setTimeout(() => setError(''), 4500);
  };

  const cargarImagenes = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/hero-imagenes`);
      const data = await res.json();
      setImagenes(Array.isArray(data) ? data : []);
    } catch {
      mostrarError('No se pudieron cargar las imágenes.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarImagenes();
  }, [cargarImagenes]);

  const procesarArchivos = (files) => {
    const validos = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (validos.length === 0) {
      mostrarError('Solo se permiten archivos de imagen (JPG, PNG, WEBP, etc.)');
      return;
    }
    if (validos.length < files.length) {
      mostrarError(`Se ignoraron ${files.length - validos.length} archivo(s) que no son imágenes.`);
    }

    setArchivosSeleccionados(validos);

    // Generar previews
    const readers = validos.map(file => {
      return new Promise(resolve => {
        const reader = new FileReader();
        reader.onload = (e) => resolve({ name: file.name, src: e.target.result });
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readers).then(setPreviews);
  };

  const onFileChange = (e) => procesarArchivos(e.target.files);

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    procesarArchivos(e.dataTransfer.files);
  };

  const cancelarSeleccion = () => {
    setArchivosSeleccionados([]);
    setPreviews([]);
  };

  const quitarArchivo = (index) => {
    const nuevosArchivos = archivosSeleccionados.filter((_, i) => i !== index);
    const nuevosPreviews = previews.filter((_, i) => i !== index);
    setArchivosSeleccionados(nuevosArchivos);
    setPreviews(nuevosPreviews);
  };

  const subirImagenes = async () => {
    if (archivosSeleccionados.length === 0) return;
    const token = getToken();
    if (!token) {
      mostrarError('Tu sesión expiró. Cerrá sesión y volvé a ingresar.');
      return;
    }

    setSubiendo(true);
    setProgreso({ actual: 0, total: archivosSeleccionados.length });

    let exitosas = 0;
    let fallidas = 0;

    for (let i = 0; i < archivosSeleccionados.length; i++) {
      const archivo = archivosSeleccionados[i];
      setProgreso({ actual: i + 1, total: archivosSeleccionados.length });

      const formData = new FormData();
      formData.append('imagen', archivo);
      formData.append('orden', imagenes.length + i);

      try {
        const res = await fetch(`${API_BASE}/hero-imagenes`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        if (res.ok) {
          exitosas++;
        } else {
          const err = await res.json().catch(() => ({}));
          console.error(`Error subiendo ${archivo.name}:`, err);
          fallidas++;
        }
      } catch (err) {
        console.error(`Error de red con ${archivo.name}:`, err);
        fallidas++;
      }
    }

    setSubiendo(false);
    cancelarSeleccion();
    await cargarImagenes();

    if (fallidas === 0) {
      mostrarExito(`${exitosas} imagen${exitosas !== 1 ? 'es' : ''} subida${exitosas !== 1 ? 's' : ''} exitosamente al slideshow.`);
    } else if (exitosas > 0) {
      mostrarExito(`${exitosas} imágenes subidas. ${fallidas} fallaron — revisá el tamaño de los archivos.`);
    } else {
      mostrarError('No se pudo subir ninguna imagen. Revisá que el archivo no supere 10MB.');
    }
  };

  const eliminarImagen = async (id) => {
    if (!window.confirm('¿Eliminar esta imagen del slideshow?')) return;
    const token = getToken();

    try {
      const res = await fetch(`${API_BASE}/hero-imagenes/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error();
      setImagenes(prev => prev.filter(img => img.id !== id));
      mostrarExito('Imagen eliminada del slideshow.');
    } catch {
      mostrarError('No se pudo eliminar la imagen.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#001F3F] tracking-tight">Fondo Principal</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Las imágenes que cargues acá se mostrarán como slideshow automático en el fondo de la página principal.
        </p>
      </div>

      {/* Alertas */}
      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          <AlertCircle size={18} className="shrink-0" /> {error}
        </div>
      )}
      {exito && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">
          <CheckCircle size={18} className="shrink-0" /> {exito}
        </div>
      )}

      {/* Zona de subida */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-[#001F3F] mb-4 flex items-center gap-2">
          <Upload size={20} /> Agregar imágenes al slideshow
        </h2>

        {/* Drop zone — solo visible cuando no hay archivos seleccionados */}
        {previews.length === 0 && (
          <div
            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${dragOver ? 'border-[#FDC830] bg-yellow-50' : 'border-gray-200 hover:border-[#001F3F] hover:bg-gray-50'
              }`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => document.getElementById('hero-file-input').click()}
          >
            <ImageIcon size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">Arrastrá imágenes o hacé clic para seleccionar</p>
            <p className="text-gray-400 text-sm mt-1">Podés seleccionar <strong>varias a la vez</strong> — JPG, PNG, WEBP — máx. 10MB por imagen</p>
            <input
              id="hero-file-input"
              type="file"
              accept="image/*"
              multiple
              onChange={onFileChange}
              className="hidden"
            />
          </div>
        )}

        {/* Grid de previews */}
        {previews.length > 0 && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500 font-medium">
              {previews.length} imagen{previews.length !== 1 ? 'es' : ''} seleccionada{previews.length !== 1 ? 's' : ''}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {previews.map((p, i) => (
                <div key={i} className="relative group rounded-xl overflow-hidden border border-gray-100 shadow-sm h-32">
                  <img src={p.src} alt={p.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      onClick={() => quitarArchivo(i)}
                      className="bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 transition"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <p className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] px-2 py-1 truncate">
                    {p.name}
                  </p>
                </div>
              ))}

              {/* Botón para agregar más */}
              <div
                className="border-2 border-dashed border-gray-200 rounded-xl h-32 flex flex-col items-center justify-center cursor-pointer hover:border-[#001F3F] hover:bg-gray-50 transition"
                onClick={() => document.getElementById('hero-file-input').click()}
              >
                <Upload size={20} className="text-gray-400 mb-1" />
                <span className="text-gray-400 text-xs">Agregar más</span>
                <input
                  id="hero-file-input"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={onFileChange}
                  className="hidden"
                />
              </div>
            </div>

            {/* Barra de progreso durante la subida */}
            {subiendo && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Subiendo imagen {progreso.actual} de {progreso.total}...</span>
                  <span>{Math.round((progreso.actual / progreso.total) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-[#FDC830] h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${(progreso.actual / progreso.total) * 100}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={subirImagenes}
                disabled={subiendo}
                className="flex items-center gap-2 bg-[#001F3F] text-[#FDC830] px-6 py-2.5 rounded-lg font-bold hover:bg-[#002f5c] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Upload size={18} />
                {subiendo ? `Subiendo ${progreso.actual}/${progreso.total}...` : `Subir ${previews.length} imagen${previews.length !== 1 ? 'es' : ''}`}
              </button>
              <button
                onClick={cancelarSeleccion}
                disabled={subiendo}
                className="px-6 py-2.5 rounded-lg font-bold border border-gray-200 text-gray-500 hover:bg-gray-50 transition disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Grilla de imágenes actuales */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-[#001F3F] mb-1 flex items-center gap-2">
          <ImageIcon size={20} /> Imágenes activas en el slideshow
        </h2>
        <p className="text-gray-400 text-sm mb-5">
          {imagenes.length === 0
            ? 'No hay imágenes cargadas. Se usará la imagen por defecto.'
            : `${imagenes.length} imagen${imagenes.length !== 1 ? 'es' : ''} en el slideshow`}
        </p>

        {loading ? (
          <div className="text-center text-gray-400 py-10">Cargando imágenes...</div>
        ) : imagenes.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <ImageIcon size={48} className="mx-auto mb-3 opacity-30" />
            <p>Aún no hay imágenes en el slideshow.</p>
            <p className="text-sm mt-1">Subí imágenes arriba para empezar.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {imagenes.map((img, index) => (
              <div key={img.id} className="relative group rounded-xl overflow-hidden border border-gray-100 shadow-sm h-44">
                <img
                  src={`${UPLOADS_BASE}/${img.url}`}
                  alt={`Hero ${index + 1}`}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                  <button
                    onClick={() => eliminarImagen(img.id)}
                    className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-bold text-sm transition"
                  >
                    <Trash2 size={15} /> Eliminar
                  </button>
                </div>
                <div className="absolute top-2 left-2 bg-[#001F3F]/80 text-[#FDC830] text-xs font-bold px-2 py-1 rounded-md">
                  #{index + 1}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700 flex gap-3">
        <AlertCircle size={18} className="shrink-0 mt-0.5" />
        <div>
          <strong>¿Cómo funciona el slideshow?</strong>
          <p className="mt-1 text-blue-600">
            Las imágenes rotan automáticamente cada 5 segundos con una transición suave. Si no hay imágenes cargadas, se usa la imagen por defecto.
          </p>
        </div>
      </div>
    </div>
  );
}
