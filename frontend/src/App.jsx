import { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Home, LayoutDashboard, Layers, ArrowLeftRight, Trophy, Shield, LogOut, User as UserIcon, QrCode, ScanLine, SearchX, Calendar } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { Scanner } from '@yudiel/react-qr-scanner';

// --- Auth Context ---
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'; // Ajusta esto si el backend está en otro puerto

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (correo, password) => {
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo, password })
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
        return { success: true };
      }
      return { success: false, message: 'Credenciales inválidas' };
    } catch (e) {
      console.error(e);
      return { success: false, message: 'Error de conexión con el servidor' };
    }
  };

  const register = async (correo, usuario, celular, password) => {
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo, usuario, celular, password })
      });
      if (res.ok) {
        return await login(correo, password);
      }
      const errorData = await res.json();
      return { success: false, message: errorData.message || 'El correo/usuario ya está en uso o es inválido' };
    } catch (e) {
      console.error(e);
      return { success: false, message: 'Error de conexión con el servidor' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  // Función temporal para entrar como admin sin backend activo
  const simulateLoginAdmin = () => {
    const fakeAdmin = { correo: 'admin@goalbum.com', rol: 'admin', _id: 'admin_123' };
    localStorage.setItem('token', 'fake-admin-token');
    localStorage.setItem('user', JSON.stringify(fakeAdmin));
    setUser(fakeAdmin);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, simulateLoginAdmin, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// --- Protected Route Components ---
const ProtectedRoute = ({ children, roles }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.some(r => r.toLowerCase() === user.rol.toLowerCase())) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// --- Navigation ---
function Navigation() {
  const { user, logout } = useAuth();
  const [pendingTrades, setPendingTrades] = useState(0);

  useEffect(() => {
    const fetchTrades = async () => {
      const token = localStorage.getItem('token');
      if (token && user) {
        try {
          const res = await fetch(`${API_URL}/trades/me`, { headers: { 'Authorization': `Bearer ${token}` } });
          if (res.ok) {
            const trades = await res.json();
            const pending = trades.filter(t => t.status === 'PENDING' && t.userB._id === user.userId).length;
            setPendingTrades(pending);
          }
        } catch (e) { }
      }
    };
    if (user) {
      fetchTrades();
      const interval = setInterval(fetchTrades, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  if (!user) return null;

  const isAdmin = user.rol.toLowerCase() === 'admin' || user.rol.toLowerCase() === 'superadmin';

  const APP_ENV = import.meta.env.VITE_APP_ENV || '';
  const showEnvBadge = APP_ENV && APP_ENV.toUpperCase() !== 'PROD' && APP_ENV.toUpperCase() !== 'PRODUCTION';
  const envColors = { TEST: { bg: '#ff9800', text: '#000' }, DEV: { bg: '#00bcd4', text: '#000' }, STAGING: { bg: '#9c27b0', text: '#fff' }, QA: { bg: '#e91e63', text: '#fff' } };
  const envStyle = envColors[APP_ENV?.toUpperCase()] || { bg: '#ff9800', text: '#000' };

  return (
    <>
      {showEnvBadge && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999, background: envStyle.bg, color: envStyle.text, textAlign: 'center', padding: '0.2rem 0', fontSize: '0.7rem', fontWeight: 'bold', letterSpacing: '0.1rem' }}>
          ⚠️ AMBIENTE: {APP_ENV.toUpperCase()}
        </div>
      )}
      <div className="nav-bar">
      <NavLink to="/" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
        <Home size={24} />
        <span>Inicio</span>
      </NavLink>
      <NavLink to="/collection" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
        <Layers size={24} />
        <span>Láminas</span>
      </NavLink>
      <NavLink to="/trade" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'} style={{ position: 'relative' }}>
        <ArrowLeftRight size={24} />
        <span>Cambios</span>
        {pendingTrades > 0 && <span style={{ position: 'absolute', top: '5px', right: '15px', background: 'red', borderRadius: '50%', width: '12px', height: '12px' }}></span>}
      </NavLink>

      {/* Vista solo para admins */}
      {isAdmin && (
        <>
          <NavLink to="/admin/stickers" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'} style={{ color: '#ffd700' }}>
            <Shield size={24} />
            <span>Admin Láminas</span>
          </NavLink>
          <NavLink to="/admin/users" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'} style={{ color: '#00dcff' }}>
            <UserIcon size={24} />
            <span>Admin Usuarios</span>
          </NavLink>
        </>
      )}

      <NavLink to="/profile" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
        <UserIcon size={24} />
        <span>Mi Perfil</span>
      </NavLink>

      <button onClick={logout} className="nav-item" style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0 }}>
        <LogOut size={24} />
        <span>Salir ({user?.usuario?.toUpperCase() || 'SESIÓN'})</span>
      </button>
    </div>
    </>
  );
}

// --- Views ---
const Login = () => {
  const { login, register, simulateLoginAdmin } = useAuth();
  const navigate = useNavigate();
  const [isRegistering, setIsRegistering] = useState(false);
  const [correo, setCorreo] = useState('');
  const [usuario, setUsuario] = useState('');
  const [celular, setCelular] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const TERMS_URL = import.meta.env.VITE_TERMS_URL || '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    let result;
    if (isRegistering) {
      if (!acceptedTerms) {
        setError('Debes aceptar los Términos y Condiciones para registrarte.');
        return;
      }
      result = await register(correo, usuario || correo.split('@')[0], celular, password);
    } else {
      result = await login(correo, password);
    }

    if (result.success) {
      navigate('/');
    } else {
      setError(result.message);
    }
  };

  const handleSimulate = () => {
    simulateLoginAdmin();
    navigate('/');
  };

  const APP_VERSION = import.meta.env.VITE_APP_VERSION || '1.0.0';
  const APP_OWNER = import.meta.env.VITE_APP_OWNER || 'camilonavarro14';

  return (
    <div className="animate-slide-up" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh', justifyContent: 'center' }}>
      <Trophy size={60} color="var(--primary)" style={{ marginBottom: '1rem' }} />
      <h1 className="title">{import.meta.env.VITE_APP_NAME || 'Goalbum'}</h1>
      <p className="subtitle">{isRegistering ? 'Crea tu cuenta' : 'Inicia sesión en tu cuenta'}</p>

      <form onSubmit={handleSubmit} className="glass-panel" style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2rem' }}>
        {error && <p style={{ color: '#ff4d4d', textAlign: 'center', fontSize: '0.9rem', margin: 0 }}>{error}</p>}

        {isRegistering && (
          <>
            <div className="input-group">
              <label>Nombre de Usuario <span style={{color: 'var(--primary)'}}>*</span></label>
              <input type="text" value={usuario} onChange={(e) => setUsuario(e.target.value)} className="input-field" placeholder="Tu username" required={isRegistering} />
            </div>
            <div className="input-group">
              <label>Número de Celular <span style={{color: 'var(--primary)'}}>*</span></label>
              <input type="tel" value={celular} onChange={(e) => setCelular(e.target.value)} className="input-field" placeholder="3001234567" required={isRegistering} />
            </div>
          </>
        )}

        <div className="input-group">
          <label>Correo Electrónico <span style={{color: 'var(--primary)'}}>*</span></label>
          <input type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} className="input-field" placeholder="correo@ejemplo.com" required />
        </div>
        <div className="input-group">
          <label>Contraseña <span style={{color: 'var(--primary)'}}>*</span></label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-field" placeholder="******" required />
        </div>

        {isRegistering && (
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              style={{ transform: 'scale(1.3)', marginTop: '0.15rem', flexShrink: 0 }}
            />
            <span>
              Acepto los{' '}
              {TERMS_URL ? (
                <a href={TERMS_URL} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} style={{ color: 'var(--primary)', textDecoration: 'underline' }}>
                  Términos y Condiciones
                </a>
              ) : (
                <span style={{ color: 'var(--primary)' }}>Términos y Condiciones</span>
              )}
              {' '}de uso de la plataforma.
            </span>
          </label>
        )}

        <button type="submit" className="btn" style={{ marginTop: '1rem' }}>
          {isRegistering ? 'Registrarse' : 'Entrar'}
        </button>

        <p style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)', cursor: 'pointer', margin: 0, marginTop: '0.5rem' }} onClick={() => setIsRegistering(!isRegistering)}>
          {isRegistering ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
        </p>

      </form>

      <div style={{ marginTop: '2rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', margin: 0 }}>
          &copy; {new Date().getFullYear()} {APP_OWNER} &mdash; Todos los derechos reservados
        </p>
        <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.7rem', marginTop: '0.25rem' }}>v{APP_VERSION}</p>
      </div>
    </div>
  );
};

const StickerAdminDashboard = () => {
  const [stickers, setStickers] = useState([]);
  const [stickerSearch, setStickerSearch] = useState('');
  const [stickerRareza, setStickerRareza] = useState('');

  const fetchStickers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/stickers`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStickers(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchStickers();
  }, []);

  const downloadTemplate = () => {
    const csvContent = "numero,nombre,equipo,rareza\nARG1,Lionel Messi,Argentina,DORADA\nBRA1,Neymar Jr,Brasil,COMUN\nCOL1,Luis Diaz,Colombia,EXTRA\n";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'plantilla_goalbum_pruebas.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target.result;
      const lines = text.split('\n');
      const parsedStickers = [];

      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const cols = lines[i].split(',');
        if (cols.length >= 3) {
          parsedStickers.push({
            numero: cols[0]?.trim(),
            nombre: cols[1]?.trim(),
            equipo: cols[2]?.trim(),
            rareza: cols[3]?.trim()?.toUpperCase() || 'COMUN'
          });
        }
      }

      if (parsedStickers.length > 0) {
        try {
          const token = localStorage.getItem('token');
          const res = await fetch(`${API_URL}/stickers/bulk`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(parsedStickers)
          });
          const data = await res.json();
          if (data.success) {
            alert(`¡Éxito! Se insertaron ${data.count} láminas nuevas exitosamente.`);
            fetchStickers();
          } else {
            alert('Error al subir láminas: ' + data.message);
          }
        } catch (err) {
          console.error(err);
          alert('Hubo un error de conexión con el servidor al subir CSV');
        }
      } else {
        alert("El archivo CSV está vacío o tiene formato inválido.");
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="animate-slide-up">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <Shield color="#ffd700" size={30} />
        <h1 className="title" style={{ margin: 0 }}>Administración de Láminas</h1>
      </div>
      
      <div className="glass-panel" style={{ marginTop: '1.5rem', borderColor: 'rgba(255, 215, 0, 0.3)' }}>
        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '8px', border: '1px dashed #ffd700', position: 'relative', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <h3 style={{ margin: 0, color: '#ffd700' }}>Carga Masiva (CSV)</h3>
            <p style={{ margin: '0.5rem 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Sube el archivo con el catálogo maestro de láminas.</p>
            <input type="file" accept=".csv" onChange={handleFileUpload} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '50%', opacity: 0, cursor: 'pointer' }} title="Subir CSV de Láminas" />
          </div>
          <button onClick={downloadTemplate} className="btn btn-secondary" style={{ width: 'fit-content' }}>
            Descargar Plantilla CSV
          </button>
        </div>
      </div>

      <div className="glass-panel" style={{ marginTop: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <h3>Catálogo Registrado ({stickers.length})</h3>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <select
              value={stickerRareza}
              onChange={e => setStickerRareza(e.target.value)}
              className="input-field"
              style={{ fontSize: '0.8rem', padding: '0.4rem' }}
            >
              <option value="">Todas</option>
              <option value="COMUN">Común</option>
              <option value="DORADA">Dorada</option>
              <option value="EXTRA">Extra</option>
            </select>
            <input
              type="text"
              placeholder="Buscar..."
              value={stickerSearch}
              onChange={(e) => setStickerSearch(e.target.value)}
              className="input-field"
              style={{ maxWidth: '150px', fontSize: '0.8rem', padding: '0.4rem' }}
            />
          </div>
        </div>
        <div style={{ marginTop: '1rem', maxHeight: '500px', overflowY: 'auto' }}>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <th style={{ padding: '0.5rem' }}>Nº</th>
                <th style={{ padding: '0.5rem' }}>Nombre</th>
                <th style={{ padding: '0.5rem' }}>Equipo</th>
              </tr>
            </thead>
            <tbody>
              {stickers
                .filter(s => (stickerRareza ? s.rareza === stickerRareza : true))
                .filter(s => s.nombre.toLowerCase().includes(stickerSearch.toLowerCase()) || s.numero.toLowerCase().includes(stickerSearch.toLowerCase()) || s.equipo.toLowerCase().includes(stickerSearch.toLowerCase()))
                .map(s => {
                  let rarezaColor = 'white';
                  if (s.rareza === 'DORADA') rarezaColor = '#ffd700';
                  if (s.rareza === 'EXTRA') rarezaColor = '#ff4d4d';
                  return (
                    <tr key={s._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '0.5rem', fontWeight: 'bold' }}>{s.numero}</td>
                      <td style={{ padding: '0.5rem' }}>{s.nombre}</td>
                      <td style={{ padding: '0.5rem', color: 'var(--text-secondary)' }}>
                        {s.equipo}
                        <span style={{ fontSize: '0.7rem', color: rarezaColor, marginLeft: '0.4rem', border: `1px solid ${rarezaColor}`, padding: '0.1rem 0.3rem', borderRadius: '4px' }}>
                          {s.rareza}
                        </span>
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const UserAdminDashboard = () => {
  const { logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  const fetchUsers = async (page = 1, search = '') => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/users?page=${page}&search=${search}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
        setTotalPages(data.totalPages || 1);
        setTotalUsers(data.total || 0);
      } else {
        if (res.status === 401 || res.status === 403) logout();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers(currentPage, searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [currentPage, searchTerm]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleRoleChange = async (userId, newRol) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/users/${userId}`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ rol: newRol })
      });
      if (res.ok) {
        setUsers(users.map(u => u._id === userId ? { ...u, rol: newRol } : u));
        alert(`Rol actualizado a ${newRol}`);
      } else {
        alert("Error al actualizar rol");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar este usuario permanentemente?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchUsers(currentPage, searchTerm);
      } else {
        alert("Error al eliminar usuario. Puede que necesites permisos de SUPERADMIN.");
      }
    } catch (error) {
      console.error('Error deleting user', error);
    }
  };

  return (
    <div className="animate-slide-up">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <UserIcon color="#00dcff" size={30} />
        <h1 className="title" style={{ margin: 0 }}>Gestión de Usuarios</h1>
      </div>

      <div className="glass-panel" style={{ marginTop: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <h3>Usuarios Registrados ({totalUsers})</h3>
          <input
            type="text"
            placeholder="Buscar por nombre o correo..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="input-field"
            style={{ maxWidth: '300px' }}
          />
        </div>

        {loading && users.length === 0 ? <p style={{ marginTop: '1rem' }}>Cargando usuarios...</p> : (
          <div style={{ marginTop: '1rem', overflowX: 'auto' }}>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <th style={{ padding: '0.5rem' }}>Correo</th>
                  <th style={{ padding: '0.5rem' }}>Username</th>
                  <th style={{ padding: '0.5rem' }}>Celular</th>
                  <th style={{ padding: '0.5rem' }}>Rol</th>
                  <th style={{ padding: '0.5rem' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '0.5rem' }}>{u.correo}</td>
                    <td style={{ padding: '0.5rem', color: 'var(--text-secondary)' }}>{u.usuario}</td>
                    <td style={{ padding: '0.5rem' }}>{u.celular || 'N/A'}</td>
                    <td style={{ padding: '0.5rem' }}>
                      <select 
                        value={u.rol} 
                        onChange={(e) => handleRoleChange(u._id, e.target.value)}
                        className="input-field"
                        style={{ padding: '0.2rem', fontSize: '0.8rem', width: 'auto', background: u.rol.toLowerCase() === 'admin' ? 'rgba(255,215,0,0.1)' : 'rgba(255,255,255,0.05)', color: u.rol.toLowerCase() === 'admin' ? '#ffd700' : 'white', borderColor: 'transparent' }}
                      >
                        <option value="user">USER</option>
                        <option value="admin">ADMIN</option>
                      </select>
                    </td>
                    <td style={{ padding: '0.5rem' }}>
                      <button onClick={() => handleDelete(u._id)} style={{ background: '#ff4d4d', color: 'white', border: 'none', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1.5rem' }}>
                <button
                  className="btn btn-secondary"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  style={{ padding: '0.3rem 0.8rem' }}
                >
                  Anterior
                </button>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Página {currentPage} de {totalPages}</span>
                <button
                  className="btn btn-secondary"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  style={{ padding: '0.3rem 0.8rem' }}
                >
                  Siguiente
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// --- Original Pages ---
const Dashboard = () => {
  const { user } = useAuth();
  const [totalStickers, setTotalStickers] = useState(0);
  const [ownedStickers, setOwnedStickers] = useState(0);
  const [loading, setLoading] = useState(true);

  // QR States
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrType, setQrType] = useState('');
  const [qrPayload, setQrPayload] = useState('');

  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const token = localStorage.getItem('token');
        const [resCatalog, resMyCol] = await Promise.all([
          fetch(`${API_URL}/stickers`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${API_URL}/collections/me`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        if (resCatalog.ok && resMyCol.ok) {
          const catalogData = await resCatalog.json();
          const myColData = await resMyCol.json();

          setTotalStickers(catalogData.length);
          // Contamos solo stickers unicos que tiene el usuario
          setOwnedStickers(myColData.length);
        }
      } catch (e) {
        console.error('Error fetching progress', e);
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, []);

  const handleGenerateQR = async (type) => { // 'REPE' o 'FALT'
    try {
      const token = localStorage.getItem('token');
      const resMyCol = await fetch(`${API_URL}/collections/me`, { headers: { 'Authorization': `Bearer ${token}` } });
      const myColData = await resMyCol.json();

      const resCatalog = await fetch(`${API_URL}/stickers`, { headers: { 'Authorization': `Bearer ${token}` } });
      const catalogData = await resCatalog.json();

      let ids = [];
      if (type === 'REPE') {
        ids = myColData.filter(i => i.cantidad > 1).map(i => i.stickerId.numero);
      } else {
        const obtainedMap = {};
        myColData.forEach(c => obtainedMap[c.stickerId.numero] = c.cantidad);
        ids = catalogData.filter(c => !obtainedMap[c.numero]).map(c => c.numero);
      }

      if (ids.length === 0) {
        alert(type === 'REPE' ? 'No tienes láminas repetidas para ofrecer.' : '¡No te falta ninguna lámina!');
        return;
      }

      const payload = {
        userEmail: user.correo.split('@')[0],
        type: type,
        stickers: ids
      };

      setQrPayload(JSON.stringify(payload));
      setQrType(type === 'REPE' ? 'Mis Repetidas' : 'Mis Faltantes');
      setQrModalOpen(true);
    } catch (e) {
      console.error(e);
      alert('Error calculando inventario para QR');
    }
  };

  const handleScan = async (detectedCodes) => {
    if (!detectedCodes || detectedCodes.length === 0) return;
    const text = detectedCodes[0].rawValue;
    setScannerOpen(false);

    try {
      const data = JSON.parse(text);
      if (!data.type || !data.stickers) throw new Error("QR de origen desconocido");

      const token = localStorage.getItem('token');
      const resMyCol = await fetch(`${API_URL}/collections/me`, { headers: { 'Authorization': `Bearer ${token}` } });
      const myColData = await resMyCol.json();

      const meSobra = myColData.filter(i => i.cantidad > 1).map(i => i.stickerId.numero);

      const resCatalog = await fetch(`${API_URL}/stickers`, { headers: { 'Authorization': `Bearer ${token}` } });
      const catalogData = await resCatalog.json();
      const meFalta = catalogData.filter(c => !myColData.find(m => m.stickerId.numero === c.numero)).map(c => c.numero);

      let matches = [];
      if (data.type === 'REPE') {
        // El código nos está entregando repetidas de un amigo. Miremos si a mi me faltan.
        matches = data.stickers.filter(s => meFalta.includes(s));
      } else if (data.type === 'FALT') {
        // El código nos dice qué láminas le faltan al amigo. Miremos si me sobran.
        matches = data.stickers.filter(s => meSobra.includes(s));
      }

      if (matches.length > 0) {
        setScanResult({
          success: true,
          message: `¡HAY MATCH CON ${data.userEmail.toUpperCase()}!`,
          sub: data.type === 'REPE' ? 'Tu amigo tiene estas repetidas que te sirven:' : 'Tú tienes estas repetidas que él necesita:',
          stickers: matches.join(', ')
        });
      } else {
        setScanResult({
          success: false,
          message: `Sin Match con ${data.userEmail}`,
          sub: 'Sus listas no tienen coincidencias que se puedan intercambiar.'
        });
      }

    } catch (e) {
      alert("El código QR escaneado no pertenece al ecosistema Goalbum.");
    }
  };

  const percentage = totalStickers === 0 ? 0 : Math.round((ownedStickers / totalStickers) * 100);

  return (
    <div className="animate-slide-up">
      <h1 className="title">Goalbum 2026</h1>
      <p className="subtitle">Hola, {user?.correo.split('@')[0] || 'Usuario'}</p>

      <div className="glass-panel">
        <h3>Progreso General</h3>
        {loading ? (
          <div className="skeleton skeleton-box"></div>
        ) : (
          <>
            <div style={{ background: 'rgba(255,255,255,0.1)', height: '10px', borderRadius: '5px', marginTop: '10px' }}>
              <div style={{ background: 'var(--primary)', height: '100%', width: `${percentage}%`, borderRadius: '5px', transition: 'width 1s ease-in-out' }}></div>
            </div>
            <p style={{ marginTop: '10px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              {ownedStickers} / {totalStickers} láminas ({percentage}%)
            </p>
          </>
        )}
      </div>

      <h3 style={{ marginTop: '2rem' }}>Centro de Intercambios QR</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
        <button className="btn btn-secondary" onClick={() => handleGenerateQR('REPE')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '1rem' }}>
          <QrCode color="#ffd700" size={30} />
          <span>Generar QR<br />(Láminas Repetidas)</span>
        </button>
        <button className="btn btn-secondary" onClick={() => handleGenerateQR('FALT')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '1rem' }}>
          <QrCode color="var(--primary)" size={30} />
          <span>Generar QR<br />(Láminas que me Faltan)</span>
        </button>
      </div>

      <div className="glass-panel" style={{ marginTop: '1rem', background: 'rgba(255,255,255,0.1)' }}>
        <button className="btn" onClick={() => setScannerOpen(true)} style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', padding: '1rem', fontSize: '1.1rem' }}>
          <ScanLine size={24} /> Escanear QR
        </button>
      </div>

      {/* Modal Mostrar QR */}
      {qrModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem' }}>
          <div className="glass-panel" style={{ background: '#1a1a1a', border: '1px solid #ffd700', textAlign: 'center', maxWidth: '90vw', width: '350px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ color: '#ffd700', marginTop: 0, fontSize: '1.2rem' }}>{qrType}</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>Muestra este código a tu amigo para comparar inventarios.</p>
            <div style={{ background: 'white', padding: '1rem', borderRadius: '12px', display: 'flex', justifyContent: 'center' }}>
              <QRCodeCanvas id="qr-code-canvas" value={qrPayload} size={256} style={{ width: '100%', maxWidth: '200px', height: 'auto' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '1.5rem' }}>
              <button className="btn btn-secondary" onClick={() => {
                const canvas = document.getElementById("qr-code-canvas");
                const pngUrl = canvas.toDataURL("image/png");
                const downloadLink = document.createElement("a");
                downloadLink.href = pngUrl;
                downloadLink.download = `Goalbum_QR_${qrType.replace(/\s+/g, '_')}.png`;
                document.body.appendChild(downloadLink);
                downloadLink.click();
                document.body.removeChild(downloadLink);
              }} style={{ width: '100%', fontSize: '0.9rem' }}>Descargar PNG</button>
              <button className="btn" onClick={() => setQrModalOpen(false)} style={{ width: '100%', fontSize: '0.9rem' }}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Escáner de Cámara */}
      {scannerOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'black', zIndex: 1000, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '4vw', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1a1a1a', borderBottom: '1px solid #ffd700' }}>
            <h3 style={{ margin: 0, color: 'white', fontSize: '1rem' }}>Escaneando código...</h3>
          </div>
          <div style={{ flex: 1, width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
            <div style={{ width: '100%', maxWidth: '500px', margin: '0 auto', display: 'flex', justifyContent: 'center' }}>
              <Scanner onScan={handleScan} onError={(e) => console.log('Scanner error:', e)} components={{ audio: false, finder: true }} />
            </div>
          </div>
          <div style={{ padding: '1rem', background: '#1a1a1a', display: 'flex', justifyContent: 'center', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <button className="btn" onClick={() => setScannerOpen(false)} style={{ width: '100%', maxWidth: '300px', background: '#ff4d4d', color: 'white' }}>
              Cerrar Cámara
            </button>
          </div>
        </div>
      )}

      {/* Modal Resultados Matchmaking */}
      {scanResult && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.9)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem' }}>
          <div className="glass-panel" style={{ background: '#1a1a1a', border: `2px solid ${scanResult.success ? '#ffd700' : 'gray'}`, textAlign: 'center', maxWidth: '90vw', width: '400px', maxHeight: '90vh', overflowY: 'auto' }}>
            {scanResult.success ? <Trophy color="#ffd700" size={50} style={{ margin: '0 auto' }} /> : <SearchX color="gray" size={50} style={{ margin: '0 auto' }} />}
            <h2 style={{ color: scanResult.success ? '#ffd700' : 'white', fontSize: '1.3rem' }}>{scanResult.message}</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{scanResult.sub}</p>
            {scanResult.success && (
              <div style={{ background: 'rgba(255,215,0,0.1)', padding: '1rem', borderRadius: '8px', color: '#ffd700', fontWeight: 'bold', wordBreak: 'break-all', marginTop: '1rem', fontSize: '0.9rem' }}>
                {scanResult.stickers}
              </div>
            )}
            <button className="btn" onClick={() => setScanResult(null)} style={{ marginTop: '2rem', width: '100%' }}>Entendido</button>
          </div>
        </div>
      )}
    </div>
  );
};

const Collection = () => {
  const [stickers, setStickers] = useState([]);
  const [groupedStickers, setGroupedStickers] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRareza, setFilterRareza] = useState('');
  const [expandedTeams, setExpandedTeams] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchCollectionData = async () => {
    try {
      const token = localStorage.getItem('token');
      // Doble fetch: Todo el catálogo VS mis laminas poseidas
      const [resCatalog, resMyCol] = await Promise.all([
        fetch(`${API_URL}/stickers`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/collections/me`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (resCatalog.ok && resMyCol.ok) {
        const catalogData = await resCatalog.json();
        const myColData = await resMyCol.json();

        // Mapear mis stickers para fácil lectura { idSticker: cantidad }
        const myColMap = {};
        myColData.forEach(item => {
          // El populate() hace que item.stickerId sea un objeto, sacamos su _id
          myColMap[item.stickerId._id] = item.cantidad;
        });

        // Fusionar datos
        const mergedStickers = catalogData.map(s => ({
          ...s,
          ownedCount: myColMap[s._id] || 0
        }));

        setStickers(mergedStickers);
      }
    } catch (e) {
      console.error('Error fetching collection', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollectionData();
  }, []);

  // Filtrado y agrupado automático
  useEffect(() => {
    const filtered = stickers.filter(s => {
      const matchSearch = s.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.numero.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.equipo.toLowerCase().includes(searchQuery.toLowerCase());
      const matchRareza = filterRareza ? s.rareza === filterRareza : true;
      return matchSearch && matchRareza;
    });

    const grouped = {};
    filtered.forEach(s => {
      if (!grouped[s.equipo]) grouped[s.equipo] = [];
      grouped[s.equipo].push(s);
    });

    setGroupedStickers(grouped);
  }, [stickers, searchQuery, filterRareza]);

  const toggleTeam = (team) => {
    setExpandedTeams(prev => ({ ...prev, [team]: !prev[team] }));
  };

  const handleUpdate = async (stickerId, change) => {
    // Actualización optimista en Frontend para que la interfaz se sienta hiper veloz
    setStickers(prev => prev.map(s => {
      if (s._id === stickerId) {
        return { ...s, ownedCount: Math.max(0, s.ownedCount + change) };
      }
      return s;
    }));

    try {
      const token = localStorage.getItem('token');
      const endpoint = change > 0 ? '/collections/add' : '/collections/remove';

      const res = await fetch(`${API_URL}${endpoint}`, {
        method: change > 0 ? 'POST' : 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ stickerId, cantidad: 1 })
      });

      if (!res.ok) {
        // Si la base de datos falla (ej: No internet), revertimos
        fetchCollectionData();
      }
    } catch (e) {
      console.error(e);
      fetchCollectionData(); // Force sync
    }
  };

  if (loading) return <div className="animate-slide-up"><p>Cargando tu colección de stickers...</p></div>;

  return (
    <div className="animate-slide-up" style={{ paddingBottom: '2rem' }}>
      <h1 className="title">Mis Láminas</h1>
      <p className="subtitle">Lleva el control de tu álbum en todo momento.</p>

      <div className="input-group" style={{ marginBottom: '1.5rem', maxWidth: '600px', display: 'flex', gap: '0.5rem' }}>
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="input-field"
          placeholder="Buscar jugador, número o equipo..."
          style={{ flex: 1 }}
        />
        <select
          value={filterRareza}
          onChange={e => setFilterRareza(e.target.value)}
          className="input-field"
          style={{ width: 'auto' }}
        >
          <option value="">Todas las Categorías</option>
          <option value="COMUN">Común</option>
          <option value="DORADA">Dorada</option>
          <option value="EXTRA">Extra</option>
        </select>
      </div>

      {Object.keys(groupedStickers).length === 0 ? (
        <div className="glass-panel"><p style={{ textAlign: 'center' }}>No se encontraron láminas.</p></div>
      ) : (
        Object.keys(groupedStickers).sort().map(equipo => {
          const teamStickers = groupedStickers[equipo];
          const obtained = teamStickers.filter(s => s.ownedCount > 0).length;
          const total = teamStickers.length;
          const isExpanded = expandedTeams[equipo];

          return (
            <div key={equipo} className="glass-panel" style={{ marginBottom: '1rem', padding: '1rem', overflow: 'hidden' }}>
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}
                onClick={() => toggleTeam(equipo)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                  <h3 style={{ margin: 0, color: obtained === total ? '#ffd700' : 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {equipo} {obtained === total && <Trophy size={16} />}
                  </h3>
                  <span style={{ fontSize: '0.85rem', background: obtained === total ? 'rgba(255,215,0,0.2)' : 'rgba(255,255,255,0.1)', color: obtained === total ? '#ffd700' : 'var(--text-secondary)', padding: '0.2rem 0.6rem', borderRadius: '12px' }}>
                    {obtained} / {total}
                  </span>
                </div>
                <span style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s', fontSize: '1.2rem', color: 'var(--primary)' }}>▼</span>
              </div>

              {isExpanded && (
                <div style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '1rem', animation: 'slideUp 0.3s ease' }}>
                  {teamStickers.map(s => {
                    let rColor = 'rgba(255,255,255,0.2)';
                    if (s.rareza === 'DORADA') rColor = '#ffd700';
                    if (s.rareza === 'EXTRA') rColor = '#ff4d4d';

                    return (
                      <div key={s._id} style={{
                        background: 'rgba(0,0,0,0.3)',
                        borderRadius: '8px',
                        padding: '0.8rem 0.5rem',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.5rem',
                        transition: 'all 0.2s',
                        border: s.ownedCount > 0 ? (s.ownedCount > 1 ? '1px solid #ffd700' : '1px solid var(--primary)') : '1px dashed rgba(255,255,255,0.2)',
                        boxShadow: s.ownedCount > 0 ? `0 0 10px ${rColor}33` : 'none'
                      }}>
                        <div style={{ position: 'relative', width: '100%', textAlign: 'center' }}>
                          <span style={{ position: 'absolute', top: -5, left: 5, fontSize: '0.6rem', color: rColor, border: `1px solid ${rColor}`, borderRadius: '4px', padding: '0.1rem 0.3rem' }}>{s.rareza}</span>
                          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: s.ownedCount > 0 ? 'white' : 'var(--text-secondary)' }}>{s.numero}</div>
                        </div>
                        <div style={{ fontSize: '0.8rem', textAlign: 'center', color: s.ownedCount > 0 ? 'white' : 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>{s.nombre}</div>

                        {/* Controls de Cantidad */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', background: 'rgba(255,255,255,0.1)', borderRadius: '20px', padding: '0.2rem' }}>
                          <button
                            onClick={() => handleUpdate(s._id, -1)}
                            disabled={s.ownedCount === 0}
                            style={{ width: '28px', height: '28px', borderRadius: '50%', border: 'none', background: s.ownedCount === 0 ? 'transparent' : 'rgba(255, 77, 77, 0.8)', color: s.ownedCount === 0 ? 'rgba(255,255,255,0.2)' : 'white', cursor: s.ownedCount === 0 ? 'default' : 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '1rem', transition: 'background 0.2s' }}
                          >-</button>
                          <span style={{ fontSize: '1rem', width: '20px', textAlign: 'center', fontWeight: 'bold', color: s.ownedCount > 1 ? '#ffd700' : 'white' }}>{s.ownedCount}</span>
                          <button
                            onClick={() => handleUpdate(s._id, 1)}
                            style={{ width: '28px', height: '28px', borderRadius: '50%', border: 'none', background: 'var(--primary)', color: 'white', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '1rem', transition: 'background 0.2s' }}
                          >+</button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};

const Trade = () => {
  const [searchParams] = useSearchParams();
  const initPartnerEmail = searchParams.get('partnerEmail') || '';
  const { user } = useAuth();

  const [viewMode, setViewMode] = useState('NUEVO'); // 'NUEVO' | 'BANDEJA'

  const [searchEmail, setSearchEmail] = useState(initPartnerEmail);
  const [partnerFull, setPartnerFull] = useState(null);

  const [myRepeated, setMyRepeated] = useState([]);
  const [hisRepeated, setHisRepeated] = useState([]);

  const [selectedToGive, setSelectedToGive] = useState([]);
  const [selectedToReceive, setSelectedToReceive] = useState([]);

  const [loading, setLoading] = useState(false);

  const [myTrades, setMyTrades] = useState([]);

  useEffect(() => {
    if (initPartnerEmail) {
      handleSearch(initPartnerEmail);
    }
    fetchMyTrades();
  }, [initPartnerEmail]);

  const fetchMyTrades = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/trades/me`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        setMyTrades(await res.json());
      }
    } catch (e) { }
  };

  const handleSearch = async (email) => {
    if (!email) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');

      // 1. Resolve User
      const resUser = await fetch(`${API_URL}/users/find/${email}`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!resUser.ok) throw new Error("Usuario no encontrado");
      const userResolved = await resUser.json();
      setPartnerFull(userResolved);

      // 2. Traer el Comparador Inteligente (Solo las que nos servimos mutuamente)
      const resCompare = await fetch(`${API_URL}/collections/compare/${userResolved._id}`, { headers: { 'Authorization': `Bearer ${token}` } });
      const compareData = await resCompare.json();

      setMyRepeated(compareData.theyNeed);
      setHisRepeated(compareData.iNeed);

      // Reiniciar checkboxes
      setSelectedToGive([]);
      setSelectedToReceive([]);

    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleGive = (stickerId) => {
    if (selectedToGive.includes(stickerId)) {
      setSelectedToGive(selectedToGive.filter(id => id !== stickerId));
    } else {
      setSelectedToGive([...selectedToGive, stickerId]);
    }
  };

  const toggleReceive = (stickerId) => {
    if (selectedToReceive.includes(stickerId)) {
      setSelectedToReceive(selectedToReceive.filter(id => id !== stickerId));
    } else {
      setSelectedToReceive([...selectedToReceive, stickerId]);
    }
  };

  const handlePropose = async () => {
    if (selectedToGive.length === 0 && selectedToReceive.length === 0) {
      alert("Selecciona al menos una lámina para realizar la oferta.");
      return;
    }

    if (!window.confirm("¿Seguro que deseas proponer este intercambio oficialmente?")) return;

    try {
      const token = localStorage.getItem('token');
      const body = {
        targetUserId: partnerFull._id,
        oferta: selectedToGive,
        peticion: selectedToReceive
      };
      const res = await fetch(`${API_URL}/trades/propose`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        alert(`¡Propuesta enviada a ${partnerFull.usuario}! Pídele que revise su bandeja de Intercambios.`);
        setPartnerFull(null);
        setSearchEmail('');
        fetchMyTrades();
        setViewMode('BANDEJA');
      } else {
        alert('Error enviando propuesta');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handeTradeAction = async (tradeId, actionStatus) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/trades/${tradeId}/status`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: actionStatus })
      });
      if (res.ok) {
        alert(`Intercambio marcado como ${actionStatus}`);
        fetchMyTrades();
      } else {
        const err = await res.json();
        alert(`Error: ${err.message}`);
      }
    } catch (e) { }
  };

  return (
    <div className="animate-slide-up" style={{ paddingBottom: '3rem' }}>
      {/* Header con tabs - stack vertical en mobile */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ marginBottom: '0.5rem' }}>
          <h1 className="title" style={{ margin: 0 }}>Intercambios</h1>
          <p className="subtitle" style={{ margin: '0.25rem 0 0.75rem 0' }}>Formaliza tus tratos con otros coleccionistas.</p>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.1)', padding: '0.4rem', borderRadius: '8px', display: 'flex', gap: '0.5rem', width: 'fit-content' }}>
          <button className={`btn ${viewMode === 'NUEVO' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setViewMode('NUEVO')} style={{ padding: '0.5rem 1.2rem' }}>Nuevo</button>
          <button className={`btn ${viewMode === 'BANDEJA' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setViewMode('BANDEJA')} style={{ padding: '0.5rem 1.2rem', position: 'relative' }}>
            Bandeja
            {myTrades.some(t => t.status === 'PENDING' && t.userB._id === user.userId) && (
              <span style={{ position: 'absolute', top: '-5px', right: '-5px', background: 'red', borderRadius: '50%', width: '12px', height: '12px', zIndex: 10 }}></span>
            )}
          </button>
        </div>
      </div>

      {viewMode === 'NUEVO' && (
        <>
          {/* Buscador */}
          <div className="glass-panel" style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <input
              className="input-field"
              placeholder="Ingresa correo o username del amigo (ej: camilo)"
              value={searchEmail}
              onChange={e => setSearchEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch(searchEmail)}
            />
            <button className="btn" onClick={() => handleSearch(searchEmail)} disabled={!searchEmail || loading} style={{ width: '100%' }}>
              {loading ? 'Buscando...' : 'Iniciar Negociación'}
            </button>
          </div>

          {partnerFull && (
            <div className="glass-panel" style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid var(--primary)' }}>
              <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', marginTop: 0, fontSize: '1rem' }}>
                Negociando con <span style={{ color: '#ffd700' }}>{partnerFull.usuario.toUpperCase()}</span>
              </h3>

              {/* Columnas: en mobile 1 col, en desktop 2 cols */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                {/* Columna: Yo doy */}
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(var(--primary-rgb), 0.3)' }}>
                  <h4 style={{ margin: '0 0 0.25rem 0', color: 'var(--primary)' }}>Vas a DAR ({selectedToGive.length})</h4>
                  <p style={{ fontSize: '0.75rem', color: 'gray', margin: '0 0 0.75rem 0' }}>Tus repetidas que le sirven a {partnerFull.usuario}.</p>
                  <div style={{ maxHeight: '250px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                    {myRepeated.length === 0
                      ? <p style={{ fontSize: '0.9rem', color: 'gray', textAlign: 'center', padding: '1rem 0' }}>No tienes ninguna lámina que le falte a él/ella.</p>
                      : myRepeated.map(s => (
                        <label key={s._id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', cursor: 'pointer', padding: '0.4rem', borderRadius: '6px', background: selectedToGive.includes(s._id) ? 'rgba(var(--primary-rgb),0.15)' : 'transparent', transition: 'background 0.2s' }}>
                          <input type="checkbox" checked={selectedToGive.includes(s._id)} onChange={() => toggleGive(s._id)} style={{ transform: 'scale(1.3)', flexShrink: 0 }} />
                          <span style={{ fontSize: '0.85rem', lineHeight: 1.3 }}>
                            <b>{s.numero}</b> - {s.nombre}
                            {s.rareza !== 'COMUN' && <span style={{ fontSize: '0.6rem', padding: '0.1rem 0.3rem', border: '1px solid #ffd700', color: '#ffd700', borderRadius: '4px', marginLeft: '0.4rem' }}>{s.rareza}</span>}
                          </span>
                        </label>
                      ))
                    }
                  </div>
                </div>

                {/* Columna: Yo pido */}
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,215,0,0.2)' }}>
                  <h4 style={{ margin: '0 0 0.25rem 0', color: '#ffd700' }}>Vas a PEDIR ({selectedToReceive.length})</h4>
                  <p style={{ fontSize: '0.75rem', color: 'gray', margin: '0 0 0.75rem 0' }}>Sus repetidas que te faltan a ti.</p>
                  <div style={{ maxHeight: '250px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                    {hisRepeated.length === 0
                      ? <p style={{ fontSize: '0.9rem', color: 'gray', textAlign: 'center', padding: '1rem 0' }}>Él/Ella no tiene ninguna lámina que te sirva.</p>
                      : hisRepeated.map(s => (
                        <label key={s._id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', cursor: 'pointer', padding: '0.4rem', borderRadius: '6px', background: selectedToReceive.includes(s._id) ? 'rgba(255,215,0,0.1)' : 'transparent', transition: 'background 0.2s' }}>
                          <input type="checkbox" checked={selectedToReceive.includes(s._id)} onChange={() => toggleReceive(s._id)} style={{ transform: 'scale(1.3)', flexShrink: 0 }}/>
                          <span style={{ fontSize: '0.85rem', lineHeight: 1.3 }}>
                            <b>{s.numero}</b> - {s.nombre}
                            {s.rareza !== 'COMUN' && <span style={{ fontSize: '0.6rem', padding: '0.1rem 0.3rem', border: '1px solid #ffd700', color: '#ffd700', borderRadius: '4px', marginLeft: '0.4rem' }}>{s.rareza}</span>}
                          </span>
                        </label>
                      ))
                    }
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  className="btn"
                  onClick={handlePropose}
                  style={{ background: '#ffd700', color: 'black', fontWeight: 'bold', width: '100%', padding: '0.85rem' }}
                >
                  Enviar Oferta ({selectedToGive.length} doy / {selectedToReceive.length} pido)
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {viewMode === 'BANDEJA' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
          {myTrades.length === 0 ? (
            <div className="glass-panel"><p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No tienes intercambios activos.</p></div>
          ) : (
            myTrades.slice().reverse().map(trade => {
              const uA_id = trade.userA?._id ? trade.userA._id.toString() : trade.userA?.toString();
              const uB_id = trade.userB?._id ? trade.userB._id.toString() : trade.userB?.toString();

              console.log("=== DEBUG INTERCAMBIOS ===");
              console.log("User en Sesion (user?.userId):", user?.sub);
              console.log("User en Sesion completo:", user);
              console.log("UserB del Trato (uB_id):", uB_id);
              console.log("Son iguales?:", uB_id === user?.sub?.toString());

              const iAmReceiver = uB_id === user?.sub?.toString();
              const isPending = trade.status === 'PENDING';

              const partName = iAmReceiver ? (trade.userA?.usuario || 'Alguien') : (trade.userB?.usuario || 'Alguien');
              const dateStr = trade.createdAt ? new Date(trade.createdAt).toLocaleDateString() + ' ' + new Date(trade.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Fecha desconocida';

              let statusColor = 'gray';
              if (trade.status === 'ACCEPTED') statusColor = '#00ff00';
              if (trade.status === 'PENDING') statusColor = '#ffd700';
              if (trade.status === 'REJECTED') statusColor = '#ff4d4d';
              if (trade.status === 'CANCELLED') statusColor = '#ff9800';

              const misStickersA = Array.isArray(trade.offeredStickersA) ? trade.offeredStickersA : [];
              const misStickersB = Array.isArray(trade.offeredStickersB) ? trade.offeredStickersB : [];

              const countTotal = misStickersA.length + misStickersB.length;

              return (
                <div key={trade._id} className="glass-panel" style={{ borderLeft: `4px solid ${statusColor}`, position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <h4 style={{ margin: 0 }}>Trato con {partName.toUpperCase()} <span style={{ fontSize: '0.8rem', fontWeight: 'normal', color: 'var(--text-secondary)' }}>({countTotal} láminas)</span></h4>
                      <small style={{ color: 'var(--text-secondary)' }}>Iniciado: {dateStr}</small>
                    </div>
                    <span style={{ background: 'rgba(255,255,255,0.1)', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem', color: statusColor }}>{trade.status}</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '1rem', fontSize: '0.9rem', background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px' }}>
                    <div>
                      <strong style={{ color: 'var(--primary)' }}>{iAmReceiver ? 'Él me da:' : 'Yo le doy:'} ({misStickersA.length})</strong>
                      <ul style={{ paddingLeft: '0.5rem', marginTop: '0.5rem', color: 'white', listStyle: 'none', margin: '0.5rem 0' }}>
                        {misStickersA.map(st => (
                          <li key={st._id || Math.random()} style={{ marginBottom: '0.3rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.1rem' }}>
                            <b>{st.numero || '?'}</b> - {st.nombre || 'Oculto'} <br /> <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{st.equipo}</span>
                          </li>
                        ))}
                        {misStickersA.length === 0 && <li style={{ color: 'gray' }}>Ninguna</li>}
                      </ul>
                    </div>
                    <div>
                      <strong style={{ color: '#ffd700' }}>{iAmReceiver ? 'Yo le doy:' : 'Él me da:'} ({misStickersB.length})</strong>
                      <ul style={{ paddingLeft: '0.5rem', marginTop: '0.5rem', color: 'white', listStyle: 'none', margin: '0.5rem 0' }}>
                        {misStickersB.map(st => (
                          <li key={st._id || Math.random()} style={{ marginBottom: '0.3rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.1rem' }}>
                            <b>{st.numero || '?'}</b> - {st.nombre || 'Oculto'} <br /> <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{st.equipo}</span>
                          </li>
                        ))}
                        {misStickersB.length === 0 && <li style={{ color: 'gray' }}>Ninguna</li>}
                      </ul>
                    </div>
                  </div>

                  {isPending && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                      {iAmReceiver ? (
                        <>
                          <button className="btn btn-secondary" onClick={() => handeTradeAction(trade._id, 'REJECTED')} style={{ color: '#ff4d4d', borderColor: '#ff4d4d' }}>Rechazar</button>
                          <button className="btn" onClick={() => handeTradeAction(trade._id, 'ACCEPTED')} style={{ background: '#00ff00', color: 'black' }}>Aceptar Trato</button>
                        </>
                      ) : (
                        <button className="btn btn-secondary" onClick={() => { if(window.confirm('¿Deseas cancelar esta propuesta?')) handeTradeAction(trade._id, 'CANCELLED'); }} style={{ color: '#ff9800', borderColor: '#ff9800' }}>Cancelar Propuesta</button>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

const Profile = () => {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/users/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setProfileData(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!newPassword) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/users/${profileData._id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password: newPassword })
      });
      if (res.ok) {
        alert("Contraseña actualizada exitosamente.");
        setNewPassword('');
      } else {
        alert("Error al actualizar contraseña.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div className="animate-slide-up"><p>Cargando perfil...</p></div>;

  const APP_VERSION = import.meta.env.VITE_APP_VERSION || '1.0.0';

  return (
    <div className="animate-slide-up">
      <h1 className="title">Mi Perfil</h1>
      <p className="subtitle">Gestiona tu información personal y seguridad.</p>

      <div className="glass-panel" style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px' }}>
          <div style={{ background: 'var(--primary)', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '1.5rem', fontWeight: 'bold', flexShrink: 0 }}>
            {profileData?.usuario?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 style={{ margin: 0 }}>{profileData?.usuario}</h3>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{profileData?.correo}</p>
            <span style={{ fontSize: '0.75rem', padding: '0.1rem 0.5rem', background: 'rgba(255,215,0,0.15)', color: '#ffd700', borderRadius: '10px', display: 'inline-block', marginTop: '0.3rem' }}>
              {profileData?.rol?.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Campo: Usuario */}
        <div className="input-group">
          <label>Usuario (para compartir)</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input readOnly value={profileData?.usuario || ''} className="input-field" style={{ flex: 1, background: 'rgba(0,0,0,0.2)' }} />
            <button className="btn btn-secondary" style={{ padding: '0.5rem 0.8rem' }} onClick={() => {
              navigator.clipboard.writeText(profileData?.usuario);
              alert("Usuario copiado!");
            }}>📋</button>
          </div>
        </div>

        {/* Campo: Correo */}
        <div className="input-group">
          <label>Correo (para compartir)</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input readOnly value={profileData?.correo || ''} className="input-field" style={{ flex: 1, background: 'rgba(0,0,0,0.2)' }} />
            <button className="btn btn-secondary" style={{ padding: '0.5rem 0.8rem' }} onClick={() => {
              navigator.clipboard.writeText(profileData?.correo);
              alert("Correo copiado!");
            }}>📋</button>
          </div>
        </div>

        {/* Campo: Celular (si existe) */}
        {profileData?.celular && (
          <div className="input-group">
            <label>Celular</label>
            <input readOnly value={profileData?.celular} className="input-field" style={{ background: 'rgba(0,0,0,0.2)' }} />
          </div>
        )}

        {/* Versión */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.6rem', borderRadius: '10px' }}>v{APP_VERSION}</span>
        </div>

        {/* Cambiar contraseña */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem' }}>
          <h3 style={{ marginTop: 0 }}>Cambiar Contraseña</h3>
          <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="input-group">
              <label>Nueva Contraseña</label>
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="input-field" placeholder="******" />
            </div>
            <button type="submit" className="btn" style={{ alignSelf: 'flex-start', padding: '0.6rem 2rem' }}>Actualizar Clave</button>
          </form>
        </div>
      </div>
    </div>
  );
};

const GlobalToast = () => {
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const originalAlert = window.alert;
    window.alert = (message) => {
      setToast({ message, id: Date.now() });
      setTimeout(() => setToast(null), 3500);
    };
    return () => { window.alert = originalAlert; };
  }, []);

  if (!toast) return null;
  return (
    <div className="toast-container">
      <div className={`toast splash`}>
        {toast.message}
      </div>
    </div>
  );
};

function AppContent() {
  return (
    <div className="app-container">
      <GlobalToast />
      <div className="content-area">
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />

          <Route path="/collection" element={
            <ProtectedRoute>
              <Collection />
            </ProtectedRoute>
          } />

          <Route path="/trade" element={
            <ProtectedRoute>
              <Trade />
            </ProtectedRoute>
          } />

          <Route path="/admin/stickers" element={
            <ProtectedRoute roles={['admin', 'superadmin']}>
              <StickerAdminDashboard />
            </ProtectedRoute>
          } />

          <Route path="/admin/users" element={
            <ProtectedRoute roles={['admin', 'superadmin']}>
              <UserAdminDashboard />
            </ProtectedRoute>
          } />

          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <Navigation />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
