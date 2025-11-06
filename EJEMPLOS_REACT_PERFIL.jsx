/**
 * EJEMPLOS REACT - Sistema de Perfil de Cliente
 *
 * Componentes React listos para usar en tu frontend
 * Incluye:
 * - Edición de campos individuales
 * - Subir imagen de perfil con preview
 * - Cambiar/establecer contraseña
 * - Componente completo de perfil
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/users';

// ========== COMPONENTE 1: Campo Editable Individual ==========

const CampoEditable = ({ label, campo, valor, onSave }) => {
  const [editando, setEditando] = useState(false);
  const [valorTemp, setValorTemp] = useState(valor);
  const [guardando, setGuardando] = useState(false);

  const guardar = async () => {
    setGuardando(true);

    try {
      const token = localStorage.getItem('authToken');

      await axios.put(
        `${API_URL}/profile`,
        { [campo]: valorTemp },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      onSave(campo, valorTemp);
      setEditando(false);
      alert(`${label} actualizado exitosamente`);

    } catch (error) {
      alert(error.response?.data?.message || 'Error al actualizar');
      setValorTemp(valor); // Revertir
    } finally {
      setGuardando(false);
    }
  };

  const cancelar = () => {
    setValorTemp(valor);
    setEditando(false);
  };

  return (
    <div className="mb-4 border-b pb-4">
      <label className="block text-sm font-bold text-gray-700 mb-2">
        {label}
      </label>

      {editando ? (
        <div className="flex gap-2 items-center">
          <input
            type={campo === 'birthDate' ? 'date' : 'text'}
            value={valorTemp || ''}
            onChange={(e) => setValorTemp(e.target.value)}
            className="flex-1 border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={guardando}
            maxLength={campo === 'dpi' ? 13 : undefined}
          />

          <button
            onClick={guardar}
            disabled={guardando}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {guardando ? 'Guardando...' : 'Guardar'}
          </button>

          <button
            onClick={cancelar}
            disabled={guardando}
            className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
          >
            Cancelar
          </button>
        </div>
      ) : (
        <div className="flex justify-between items-center">
          <span className="text-gray-800">
            {valor || <span className="text-gray-400 italic">No establecido</span>}
          </span>

          <button
            onClick={() => setEditando(true)}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Editar
          </button>
        </div>
      )}
    </div>
  );
};

// ========== COMPONENTE 2: Subir Imagen de Perfil ==========

const ImagenPerfilUpload = ({ imagenActual, onUpdate }) => {
  const [preview, setPreview] = useState(imagenActual);
  const [subiendo, setSubiendo] = useState(false);

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];

    if (!file) return;

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen es muy grande. Tamaño máximo: 5MB');
      return;
    }

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      alert('El archivo debe ser una imagen');
      return;
    }

    // Mostrar preview local
    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);

    // Subir a servidor
    setSubiendo(true);

    try {
      const token = localStorage.getItem('authToken');
      const formData = new FormData();
      formData.append('image', file);

      const response = await axios.put(`${API_URL}/profile/image`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      // Actualizar con URL de Cloudinary
      setPreview(response.data.profileImage);
      onUpdate(response.data.profileImage);

      alert('Imagen actualizada exitosamente');

      // Liberar URL local
      URL.revokeObjectURL(localPreview);

    } catch (error) {
      alert(error.response?.data?.message || 'Error al subir imagen');
      setPreview(imagenActual); // Revertir
    } finally {
      setSubiendo(false);
    }
  };

  return (
    <div className="text-center mb-6">
      <div className="relative inline-block">
        <img
          src={preview || '/default-avatar.png'}
          alt="Perfil"
          className="w-32 h-32 rounded-full object-cover border-4 border-gray-300 shadow-lg"
        />

        {subiendo && (
          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
            <div className="text-white text-sm">Subiendo...</div>
          </div>
        )}
      </div>

      <div className="mt-4">
        <label className="cursor-pointer bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 inline-block">
          {subiendo ? 'Subiendo...' : 'Cambiar Foto'}
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            disabled={subiendo}
          />
        </label>
      </div>

      <p className="text-xs text-gray-500 mt-2">
        JPG, PNG o GIF. Máximo 5MB.
      </p>
    </div>
  );
};

// ========== COMPONENTE 3: Cambiar/Establecer Contraseña ==========

const CambiarContrasenaForm = ({ tieneContrasena }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [guardando, setGuardando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validaciones
    if (newPassword.length < 8) {
      alert('La nueva contraseña debe tener al menos 8 caracteres');
      return;
    }

    if (newPassword !== confirmPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }

    setGuardando(true);

    try {
      const token = localStorage.getItem('authToken');

      const body = tieneContrasena
        ? { currentPassword, newPassword }
        : { newPassword };

      const response = await axios.post(`${API_URL}/change-password`, body, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      alert(response.data.message);

      // Limpiar formulario
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

    } catch (error) {
      if (error.response?.status === 401) {
        alert('La contraseña actual es incorrecta');
      } else {
        alert(error.response?.data?.message || 'Error al cambiar contraseña');
      }
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-bold mb-4">
        {tieneContrasena ? 'Cambiar Contraseña' : 'Establecer Contraseña'}
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {tieneContrasena && (
          <div>
            <label className="block text-sm font-bold mb-1">
              Contraseña Actual
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full border rounded px-3 py-2"
              required
              disabled={guardando}
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-bold mb-1">
            Nueva Contraseña
          </label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full border rounded px-3 py-2"
            required
            minLength={8}
            disabled={guardando}
          />
          <p className="text-xs text-gray-500 mt-1">
            Mínimo 8 caracteres
          </p>
        </div>

        <div>
          <label className="block text-sm font-bold mb-1">
            Confirmar Nueva Contraseña
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full border rounded px-3 py-2"
            required
            minLength={8}
            disabled={guardando}
          />
        </div>

        <button
          type="submit"
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:bg-gray-400"
          disabled={guardando}
        >
          {guardando
            ? 'Actualizando...'
            : tieneContrasena
            ? 'Cambiar Contraseña'
            : 'Establecer Contraseña'}
        </button>

        {!tieneContrasena && (
          <p className="text-sm text-blue-600 bg-blue-50 p-3 rounded">
            ℹ️ Te registraste con Google. Establece una contraseña para poder
            iniciar sesión también con tu email.
          </p>
        )}
      </form>
    </div>
  );
};

// ========== COMPONENTE 4: Perfil Completo ==========

const PerfilCliente = () => {
  const [perfil, setPerfil] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [tab, setTab] = useState('info'); // 'info' | 'seguridad'

  useEffect(() => {
    cargarPerfil();
  }, []);

  const cargarPerfil = async () => {
    setCargando(true);

    try {
      const token = localStorage.getItem('authToken');

      const response = await axios.get(`${API_URL}/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      setPerfil(response.data);

    } catch (error) {
      alert('Error al cargar perfil');
      console.error(error);
    } finally {
      setCargando(false);
    }
  };

  const actualizarCampo = (campo, valor) => {
    setPerfil({ ...perfil, [campo]: valor });
  };

  const actualizarImagen = (nuevaImagen) => {
    setPerfil({ ...perfil, profileImage: nuevaImagen });
  };

  if (cargando) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center">Cargando perfil...</div>
      </div>
    );
  }

  if (!perfil) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center text-red-600">Error al cargar perfil</div>
      </div>
    );
  }

  const tieneContrasena = !!perfil.password;

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg p-6 mb-6 shadow-lg">
        <h1 className="text-3xl font-bold">
          {perfil.firstName} {perfil.lastName}
        </h1>
        <p className="text-blue-100">{perfil.email}</p>
        <p className="text-sm text-blue-200 mt-1">
          {perfil.googleId ? '🔗 Cuenta vinculada con Google' : '📧 Cuenta con email'}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab('info')}
          className={`px-6 py-2 rounded-lg font-medium transition ${
            tab === 'info'
              ? 'bg-blue-600 text-white shadow'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          👤 Información Personal
        </button>

        <button
          onClick={() => setTab('seguridad')}
          className={`px-6 py-2 rounded-lg font-medium transition ${
            tab === 'seguridad'
              ? 'bg-blue-600 text-white shadow'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          🔐 Seguridad
        </button>
      </div>

      {/* Contenido */}
      {tab === 'info' ? (
        <div className="bg-white shadow rounded-lg p-6">
          {/* Imagen de Perfil */}
          <ImagenPerfilUpload
            imagenActual={perfil.profileImage}
            onUpdate={actualizarImagen}
          />

          <hr className="my-6" />

          {/* Campos Editables */}
          <div className="space-y-2">
            <CampoEditable
              label="Nombre"
              campo="firstName"
              valor={perfil.firstName}
              onSave={actualizarCampo}
            />

            <CampoEditable
              label="Apellido"
              campo="lastName"
              valor={perfil.lastName}
              onSave={actualizarCampo}
            />

            <CampoEditable
              label="Teléfono"
              campo="phone"
              valor={perfil.phone}
              onSave={actualizarCampo}
            />

            <CampoEditable
              label="Dirección en Rabinal"
              campo="address"
              valor={perfil.address}
              onSave={actualizarCampo}
            />

            <CampoEditable
              label="DPI (opcional)"
              campo="dpi"
              valor={perfil.dpi}
              onSave={actualizarCampo}
            />

            <CampoEditable
              label="Fecha de Nacimiento (opcional)"
              campo="birthDate"
              valor={perfil.birthDate}
              onSave={actualizarCampo}
            />
          </div>

          {/* Información no editable */}
          <hr className="my-6" />

          <div className="bg-gray-50 p-4 rounded">
            <h3 className="font-bold text-sm text-gray-600 mb-2">
              Información del Sistema
            </h3>
            <div className="text-sm text-gray-700 space-y-1">
              <p><strong>Email:</strong> {perfil.email} (no editable)</p>
              <p><strong>Rol:</strong> {perfil.role}</p>
              <p><strong>Miembro desde:</strong> {new Date(perfil.createdAt).toLocaleDateString('es-GT')}</p>
              <p><strong>Último acceso:</strong> {perfil.lastLogin ? new Date(perfil.lastLogin).toLocaleString('es-GT') : 'Nunca'}</p>
            </div>
          </div>
        </div>
      ) : (
        <CambiarContrasenaForm tieneContrasena={tieneContrasena} />
      )}
    </div>
  );
};

export default PerfilCliente;

// ========== EXPORTAR COMPONENTES INDIVIDUALES ==========

export {
  CampoEditable,
  ImagenPerfilUpload,
  CambiarContrasenaForm,
  PerfilCliente
};
