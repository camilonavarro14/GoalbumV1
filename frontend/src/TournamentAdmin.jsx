import { useState, useEffect } from 'react';
import { useAuth, API_URL } from './App';
import * as Papa from 'papaparse';

export const TournamentAdmin = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('EVENTO');
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [groups, setGroups] = useState([]);
  const [teams, setTeams] = useState([]);
  const [matches, setMatches] = useState([]);
  const [standings, setStandings] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  
  const [editingMatchId, setEditingMatchId] = useState(null);
  const [editScore, setEditScore] = useState({ local: 0, visitante: 0 });

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await fetch(`${API_URL}/events`);
      const data = await res.json();
      setEvents(data);
      if (data.length > 0 && !selectedEventId) {
        setSelectedEventId(data[0]._id);
        fetchGroups(data[0]._id);
        fetchTeams(data[0]._id);
        fetchMatches(data[0]._id);
      }
    } catch(e) { console.error(e); }
  };

  const fetchGroups = async (eventId) => {
    try {
      const res = await fetch(`${API_URL}/events/${eventId}/groups`);
      const groupsData = await res.json();
      setGroups(groupsData);
      if (groupsData.length > 0 && !selectedGroupId) {
        setSelectedGroupId(groupsData[0]._id);
        fetchStandings(eventId, groupsData[0]._id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchTeams = async (eventId) => {
    try {
      const res = await fetch(`${API_URL}/events/${eventId}/teams`);
      setTeams(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchMatches = async (eventId) => {
    try {
      const res = await fetch(`${API_URL}/events/${eventId}/matches`);
      setMatches(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchStandings = async (eventId, groupId) => {
    try {
      const res = await fetch(`${API_URL}/events/${eventId}/groups/${groupId}/standings`);
      setStandings(await res.json());
    } catch (e) { console.error(e); }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    const payload = {
      codigo: e.target.codigo.value,
      nombre: e.target.nombre.value
    };
    try {
      await fetch(`${API_URL}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      alert('Evento creado exitosamente');
      fetchEvents();
    } catch (e) { alert('Error creando evento'); }
  };

  const handleUploadTeams = (e) => {
    if (!selectedEventId) return alert('Selecciona un evento primero');
    const file = e.target.files[0];
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const teamsObj = results.data.map(r => ({
          codigo: r.codigo,
          nombre: r.nombre
        }));
        try {
          await fetch(`${API_URL}/events/${selectedEventId}/teams/bulk`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ teams: teamsObj })
          });
          alert('Equipos cargados correctamente');
          fetchTeams(selectedEventId);
        } catch (err) { alert('Error subiendo equipos'); }
      }
    });
  };

  const downloadTeamsTemplate = () => {
    const csvContent = "codigo,nombre\nCOL,Colombia\nBRA,Brasil\nARG,Argentina";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Plantilla_Equipos.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUploadGroups = (e) => {
    if (!selectedEventId) return alert('Selecciona un evento primero');
    const file = e.target.files[0];
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const groupsObj = results.data.map(r => ({
          codigo: r.codigo,
          nombre: r.nombre,
          equipos: r.equipos
        }));
        try {
          await fetch(`${API_URL}/events/${selectedEventId}/groups/bulk`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ groups: groupsObj })
          });
          alert('Grupos cargados correctamente');
          fetchGroups(selectedEventId);
        } catch (err) { alert('Error subiendo grupos'); }
      }
    });
  };

  const downloadGroupsTemplate = () => {
    const csvContent = "codigo,nombre,equipos\nA,Grupo A,COL-BRA-ARG-CHI\nB,Grupo B,URU-ECU-PER-VEN\n";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Plantilla_Grupos.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUploadMatches = (e) => {
    if (!selectedEventId) return alert('Selecciona un evento primero');
    const file = e.target.files[0];
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const matchesObj = results.data.map(r => ({
          grupo: r.grupo,
          local: r.local,
          visitante: r.visitante,
          fechaHora: r.fechaHora,
          fase: r.fase
        }));
        try {
          const res = await fetch(`${API_URL}/events/${selectedEventId}/matches/bulk`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ matches: matchesObj })
          });
          const data = await res.json();
          if (data.message) {
            alert(data.message);
          } else {
            alert(`Partidos cargados correctamente. Total insertados: ${data.length}`);
          }
          fetchMatches(selectedEventId);
        } catch (err) { alert('Error subiendo partidos'); }
      }
    });
  };

  const downloadMatchesTemplate = () => {
    const csvContent = "grupo,local,visitante,fechaHora,fase\nA,COL,BRA,2026-06-11T16:00:00Z,GRUPOS\nA,ARG,CHI,2026-06-12T10:00:00Z,GRUPOS\n";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Plantilla_Partidos.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUpdateResult = async (matchId) => {
    try {
      const res = await fetch(`${API_URL}/matches/${matchId}/result`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ scoredHome: editScore.local, scoredAway: editScore.visitante })
      });
      if (res.ok) {
        alert('Marcador actualizado y guardado correctamente.');
        setEditingMatchId(null);
        fetchMatches(selectedEventId);
      } else {
        alert('Error al actualizar el marcador. Verifica permisos.');
      }
    } catch (e) { console.error(e); }
  };

  return (
    <div style={{ padding: '1rem', color: 'white' }}>
      <h2>🏆 Admin Torneo / Polla</h2>
      
      <div style={{ marginBottom: '1rem' }}>
        <label>Evento Activo: </label>
        <select value={selectedEventId} onChange={(e) => {
          setSelectedEventId(e.target.value);
          fetchGroups(e.target.value);
          fetchTeams(e.target.value);
          fetchMatches(e.target.value);
        }} style={{ padding: '0.5rem', marginLeft: '1rem', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid gray' }}>
          {events.map(ev => (
            <option key={ev._id} value={ev._id} style={{ color: 'black' }}>{ev.nombre}</option>
          ))}
        </select>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        {['EVENTO', 'EQUIPOS', 'GRUPOS', 'PARTIDOS', 'POSICIONES', 'LLAVES'].map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              background: activeTab === tab ? '#ffd700' : 'rgba(255,255,255,0.1)',
              color: activeTab === tab ? 'black' : 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '20px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="glass-panel">
        {activeTab === 'EVENTO' && (
          <div>
            <h3>Crear Nuevo Evento</h3>
            <form onSubmit={handleCreateEvent} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '400px' }}>
              <input type="text" name="codigo" placeholder="Código (ej. WC2026)" className="input" required />
              <input type="text" name="nombre" placeholder="Nombre completo" className="input" required />
              <button type="submit" className="btn btn-primary">Registrar Evento</button>
            </form>
          </div>
        )}

        {activeTab === 'EQUIPOS' && (
          <div>
            <h3>Gestión de Equipos</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 300px)', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', border: '1px dashed #ffd700', position: 'relative', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div>
                  <p style={{ margin: '0', fontSize: '0.9rem', color: 'gray' }}>Catálogo Maestro de Equipos</p>
                  <h4 style={{ margin: '0.5rem 0 0 0', color: '#ffd700' }}>+ Cargar Archivo CSV</h4>
                  <input type="file" accept=".csv" onChange={handleUploadTeams} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '50%', opacity: 0, cursor: 'pointer' }} title="Subir CSV de Equipos" />
                </div>
                <button onClick={downloadTeamsTemplate} style={{ marginTop: 'auto', zIndex: 2, position: 'relative', background: 'transparent', color: '#ffd700', border: '1px solid #ffd700', borderRadius: '4px', cursor: 'pointer', padding: '0.3rem', fontSize: '0.8rem' }}>
                  Descargar Plantilla CSV
                </button>
              </div>
            </div>

            <h4>Equipos Registrados ({teams.length})</h4>
            {teams.length === 0 ? <p style={{ color: 'gray' }}>No hay equipos importados aún.</p> : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem' }}>
                {teams.map(t => (
                  <div key={t._id} style={{ background: 'rgba(255,255,255,0.05)', padding: '0.8rem', borderRadius: '8px', textAlign: 'center', border: '1px solid rgba(255,215,0,0.2)' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#ffd700' }}>{t.codigo}</div>
                    <div style={{ fontSize: '0.9rem' }}>{t.nombre}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'GRUPOS' && (
          <div>
            <h3>Gestión de Grupos</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 300px)', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', border: '1px dashed #ffd700', position: 'relative', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div>
                  <p style={{ margin: '0', fontSize: '0.9rem', color: 'gray' }}>Catálogo Maestro de Grupos</p>
                  <h4 style={{ margin: '0.5rem 0 0 0', color: '#ffd700' }}>+ Cargar Archivo CSV</h4>
                  <input type="file" accept=".csv" onChange={handleUploadGroups} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '50%', opacity: 0, cursor: 'pointer' }} title="Subir CSV de Grupos" />
                </div>
                <button onClick={downloadGroupsTemplate} style={{ marginTop: 'auto', zIndex: 2, position: 'relative', background: 'transparent', color: '#ffd700', border: '1px solid #ffd700', borderRadius: '4px', cursor: 'pointer', padding: '0.3rem', fontSize: '0.8rem' }}>
                  Descargar Plantilla CSV
                </button>
              </div>
            </div>

            <h4>Grupos Registrados ({groups.length})</h4>
            {groups.length === 0 ? <p style={{ color: 'gray' }}>No hay grupos creados aún.</p> : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                {groups.map(g => (
                  <div key={g._id} style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,215,0,0.2)' }}>
                    <h4 style={{ margin: '0 0 1rem 0', color: '#ffd700', textAlign: 'center' }}>Grupo {g.codigo}</h4>
                    <ul style={{ paddingLeft: '0', listStyleType: 'none', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {g.teams.map(t => (
                        <li key={t._id} style={{ background: 'rgba(0,0,0,0.3)', padding: '0.5rem', borderRadius: '4px', textAlign: 'center' }}>
                          <span style={{ fontWeight: 'bold' }}>{t.codigo}</span> - {t.nombre}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'POSICIONES' && (
          <div>
            <h3>Tabla de Clasificación (Reglas FIFA)</h3>
            <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <label>Selecciona un Grupo:</label>
              <select value={selectedGroupId} onChange={(e) => {
                setSelectedGroupId(e.target.value);
                fetchStandings(selectedEventId, e.target.value);
              }} style={{ padding: '0.5rem', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid gray' }}>
                <option value="">-- Elige un grupo --</option>
                {groups.map(g => (
                  <option key={g._id} value={g._id} style={{ color: 'black' }}>Grupo {g.codigo}</option>
                ))}
              </select>
            </div>

            {selectedGroupId && standings.length > 0 && (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', overflow: 'hidden' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,215,0,0.2)', color: '#ffd700' }}>
                      <th style={{ padding: '1rem', textAlign: 'left' }}>#</th>
                      <th style={{ padding: '1rem', textAlign: 'left' }}>País</th>
                      <th style={{ padding: '1rem', textAlign: 'center' }}>PTS</th>
                      <th style={{ padding: '1rem', textAlign: 'center' }}>PJ</th>
                      <th style={{ padding: '1rem', textAlign: 'center' }}>PG</th>
                      <th style={{ padding: '1rem', textAlign: 'center' }}>PE</th>
                      <th style={{ padding: '1rem', textAlign: 'center' }}>PP</th>
                      <th style={{ padding: '1rem', textAlign: 'center' }}>GF</th>
                      <th style={{ padding: '1rem', textAlign: 'center' }}>GC</th>
                      <th style={{ padding: '1rem', textAlign: 'center' }}>DIF</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standings.map((row, index) => (
                      <tr key={row.teamId} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                        <td style={{ padding: '1rem', fontWeight: 'bold', color: index < 2 ? '#00ff00' : 'white' }}>{index + 1}</td>
                        <td style={{ padding: '1rem', fontWeight: 'bold' }}>{row.nombre}</td>
                        <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 'bold', color: '#ffd700' }}>{row.pts}</td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>{row.pj}</td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>{row.pg}</td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>{row.pe}</td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>{row.pp}</td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>{row.gf}</td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>{row.gc}</td>
                        <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 'bold', color: row.gd > 0 ? '#00ff00' : (row.gd < 0 ? 'red' : 'white') }}>
                          {row.gd > 0 ? `+${row.gd}` : row.gd}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'LLAVES' && (
          <div>
            <h3>Fase de Eliminatorias</h3>
            <p style={{ color: 'gray', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Para cargar llaves, asegúrate de subir el archivo .csv de partidos con el código de fase apropiado (OCTAVOS, CUARTOS, SEMIFINAL, FINAL).
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 300px)', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', border: '1px dashed #ffd700', position: 'relative', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div>
                  <p style={{ margin: '0', fontSize: '0.9rem', color: 'gray' }}>Cargar Archivo de Eliminatorias</p>
                  <h4 style={{ margin: '0.5rem 0 0 0', color: '#ffd700' }}>+ Subir CSV</h4>
                  <input type="file" accept=".csv" onChange={handleUploadMatches} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '50%', opacity: 0, cursor: 'pointer' }} title="Subir CSV de Llaves" />
                </div>
                <button onClick={downloadMatchesTemplate} style={{ marginTop: 'auto', zIndex: 2, position: 'relative', background: 'transparent', color: '#ffd700', border: '1px solid #ffd700', borderRadius: '4px', cursor: 'pointer', padding: '0.3rem', fontSize: '0.8rem' }}>
                  Descargar Plantilla CSV
                </button>
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '12px' }}>
              
              {/* Columna Octavos */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h4 style={{ color: '#ffd700', textAlign: 'center', borderBottom: '1px solid rgba(255,215,0,0.3)', paddingBottom: '0.5rem' }}>Octavos</h4>
                {matches.filter(m => m.fase === 'OCTAVOS').map(m => (
                  <div key={m._id} style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', borderLeft: `3px solid ${m.estado === 'JUGADO' ? '#00ff00' : 'orange'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem' }}>
                      <span>{m.localTeamId?.nombre || 'Local'}</span>
                      <span style={{ color: '#ffd700' }}>{m.golesLocal}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '0.9rem' }}>
                      <span>{m.visitanteTeamId?.nombre || 'Visitante'}</span>
                      <span style={{ color: '#ffd700' }}>{m.golesVisitante}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                      <span style={{ fontSize: '0.7rem', color: 'gray' }}>{m.estado}</span>
                      {editingMatchId === m._id ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                          <input type="number" value={editScore.local} onChange={e=>setEditScore({...editScore, local:parseInt(e.target.value)||0})} style={{width: '40px'}}/>
                          <input type="number" value={editScore.visitante} onChange={e=>setEditScore({...editScore, visitante:parseInt(e.target.value)||0})} style={{width: '40px'}}/>
                          <button onClick={() => handleUpdateResult(m._id)}>✓</button>
                        </div>
                      ) : (
                        <button onClick={() => { setEditingMatchId(m._id); setEditScore({ local: m.golesLocal, visitante: m.golesVisitante }); }} style={{ background: 'transparent', color: '#ffd700', border: 'none', cursor: 'pointer', fontSize: '0.8rem' }}>✏️ Editar</button>
                      )}
                    </div>
                  </div>
                ))}
                {matches.filter(m => m.fase === 'OCTAVOS').length === 0 && <span style={{ color: 'gray', textAlign: 'center', display: 'block', padding: '1rem' }}>Sin Partidos</span>}
              </div>

              {/* Columna Cuartos */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h4 style={{ color: '#ffd700', textAlign: 'center', borderBottom: '1px solid rgba(255,215,0,0.3)', paddingBottom: '0.5rem' }}>Cuartos</h4>
                {matches.filter(m => m.fase === 'CUARTOS').map(m => (
                  <div key={m._id} style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', borderLeft: `3px solid ${m.estado === 'JUGADO' ? '#00ff00' : 'orange'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem' }}>
                      <span>{m.localTeamId?.nombre || 'Local'}</span>
                      <span style={{ color: '#ffd700' }}>{m.golesLocal}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '0.9rem' }}>
                      <span>{m.visitanteTeamId?.nombre || 'Visitante'}</span>
                      <span style={{ color: '#ffd700' }}>{m.golesVisitante}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                      <span style={{ fontSize: '0.7rem', color: 'gray' }}>{m.estado}</span>
                      {editingMatchId === m._id ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                          <input type="number" value={editScore.local} onChange={e=>setEditScore({...editScore, local:parseInt(e.target.value)||0})} style={{width: '40px'}}/>
                          <input type="number" value={editScore.visitante} onChange={e=>setEditScore({...editScore, visitante:parseInt(e.target.value)||0})} style={{width: '40px'}}/>
                          <button onClick={() => handleUpdateResult(m._id)}>✓</button>
                        </div>
                      ) : (
                        <button onClick={() => { setEditingMatchId(m._id); setEditScore({ local: m.golesLocal, visitante: m.golesVisitante }); }} style={{ background: 'transparent', color: '#ffd700', border: 'none', cursor: 'pointer', fontSize: '0.8rem' }}>✏️ Editar</button>
                      )}
                    </div>
                  </div>
                ))}
                {matches.filter(m => m.fase === 'CUARTOS').length === 0 && <span style={{ color: 'gray', textAlign: 'center', display: 'block', padding: '1rem' }}>Sin Partidos</span>}
              </div>

              {/* Columna Semifinales */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h4 style={{ color: '#ffd700', textAlign: 'center', borderBottom: '1px solid rgba(255,215,0,0.3)', paddingBottom: '0.5rem' }}>Semifinal</h4>
                {matches.filter(m => m.fase === 'SEMIFINAL').map(m => (
                  <div key={m._id} style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', borderLeft: `3px solid ${m.estado === 'JUGADO' ? '#00ff00' : 'orange'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem' }}>
                      <span>{m.localTeamId?.nombre || 'Local'}</span>
                      <span style={{ color: '#ffd700' }}>{m.golesLocal}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '0.9rem' }}>
                      <span>{m.visitanteTeamId?.nombre || 'Visitante'}</span>
                      <span style={{ color: '#ffd700' }}>{m.golesVisitante}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                      <span style={{ fontSize: '0.7rem', color: 'gray' }}>{m.estado}</span>
                      {editingMatchId === m._id ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                          <input type="number" value={editScore.local} onChange={e=>setEditScore({...editScore, local:parseInt(e.target.value)||0})} style={{width: '40px'}}/>
                          <input type="number" value={editScore.visitante} onChange={e=>setEditScore({...editScore, visitante:parseInt(e.target.value)||0})} style={{width: '40px'}}/>
                          <button onClick={() => handleUpdateResult(m._id)}>✓</button>
                        </div>
                      ) : (
                        <button onClick={() => { setEditingMatchId(m._id); setEditScore({ local: m.golesLocal, visitante: m.golesVisitante }); }} style={{ background: 'transparent', color: '#ffd700', border: 'none', cursor: 'pointer', fontSize: '0.8rem' }}>✏️ Editar</button>
                      )}
                    </div>
                  </div>
                ))}
                {matches.filter(m => m.fase === 'SEMIFINAL').length === 0 && <span style={{ color: 'gray', textAlign: 'center', display: 'block', padding: '1rem' }}>Sin Partidos</span>}
              </div>

              {/* Columna Final */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h4 style={{ color: 'white', background: '#ffd700', borderRadius: '8px', padding: '0.2rem', textAlign: 'center' }}>🏆 Final</h4>
                {matches.filter(m => m.fase === 'FINAL').map(m => (
                  <div key={m._id} style={{ background: 'rgba(255,215,0,0.1)', padding: '1.5rem 1rem', borderRadius: '8px', borderLeft: `5px solid #ffd700` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem', fontWeight: 'bold', fontSize: '1rem', color: '#ffd700' }}>
                      <span>{m.localTeamId?.nombre || 'Local'}</span>
                      <span>{m.golesLocal}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1rem', color: '#ffd700' }}>
                      <span>{m.visitanteTeamId?.nombre || 'Visitante'}</span>
                      <span>{m.golesVisitante}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                      <span style={{ fontSize: '0.7rem', color: 'gray' }}>{m.estado}</span>
                      {editingMatchId === m._id ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                          <input type="number" value={editScore.local} onChange={e=>setEditScore({...editScore, local:parseInt(e.target.value)||0})} style={{width: '40px'}}/>
                          <input type="number" value={editScore.visitante} onChange={e=>setEditScore({...editScore, visitante:parseInt(e.target.value)||0})} style={{width: '40px'}}/>
                          <button onClick={() => handleUpdateResult(m._id)}>✓</button>
                        </div>
                      ) : (
                        <button onClick={() => { setEditingMatchId(m._id); setEditScore({ local: m.golesLocal, visitante: m.golesVisitante }); }} style={{ background: 'transparent', color: '#ffd700', border: 'none', cursor: 'pointer', fontSize: '0.8rem' }}>✏️ Editar</button>
                      )}
                    </div>
                  </div>
                ))}
                {matches.filter(m => m.fase === 'FINAL').length === 0 && <span style={{ color: 'gray', textAlign: 'center', display: 'block', padding: '1rem' }}>Sin Partidos</span>}
              </div>

            </div>
          </div>
        )}

        {activeTab === 'PARTIDOS' && (
          <div>
            <h3>Gestión de Partidos (Calendario)</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 300px)', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', border: '1px dashed #ffd700', position: 'relative', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div>
                  <p style={{ margin: '0', fontSize: '0.9rem', color: 'gray' }}>Catálogo Maestro de Partidos</p>
                  <h4 style={{ margin: '0.5rem 0 0 0', color: '#ffd700' }}>+ Cargar Archivo CSV</h4>
                  <input type="file" accept=".csv" onChange={handleUploadMatches} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '50%', opacity: 0, cursor: 'pointer' }} title="Subir CSV de Partidos" />
                </div>
                <button onClick={downloadMatchesTemplate} style={{ marginTop: 'auto', zIndex: 2, position: 'relative', background: 'transparent', color: '#ffd700', border: '1px solid #ffd700', borderRadius: '4px', cursor: 'pointer', padding: '0.3rem', fontSize: '0.8rem' }}>
                  Descargar Plantilla CSV
                </button>
              </div>
            </div>

            <h4>Calendario Registrado ({matches.length})</h4>
            {matches.length === 0 ? <p style={{ color: 'gray' }}>No hay partidos cargados.</p> : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                {matches.map(m => (
                  <div key={m._id} style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,215,0,0.2)' }}>
                    <div style={{ fontSize: '0.8rem', color: 'gray', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Fase: {m.fase}</span>
                      <span>{new Date(m.fechaHora).toLocaleDateString()} {new Date(m.fechaHora).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{flex: 1, textAlign: 'right', fontWeight: 'bold'}}>{m.localTeamId?.nombre || 'Local'}</div>
                      
                      <div style={{padding: '0 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                        {editingMatchId === m._id ? (
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <input type="number" min="0" value={editScore.local} onChange={e => setEditScore({...editScore, local: parseInt(e.target.value)||0})} style={{ width: '40px', textAlign: 'center', background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid #ffd700', borderRadius: '4px' }} />
                            <span>-</span>
                            <input type="number" min="0" value={editScore.visitante} onChange={e => setEditScore({...editScore, visitante: parseInt(e.target.value)||0})} style={{ width: '40px', textAlign: 'center', background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid #ffd700', borderRadius: '4px' }} />
                          </div>
                        ) : (
                          <div style={{color: '#ffd700', fontSize: '1.2rem', fontWeight: 'bold'}}>{m.golesLocal} - {m.golesVisitante}</div>
                        )}
                      </div>

                      <div style={{flex: 1, textAlign: 'left', fontWeight: 'bold'}}>{m.visitanteTeamId?.nombre || 'Visitante'}</div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.8rem' }}>
                      <div style={{ fontSize: '0.75rem', color: m.estado === 'JUGADO' ? '#00ff00' : 'orange' }}>
                        {m.estado}
                      </div>
                      
                      {editingMatchId === m._id ? (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button onClick={() => handleUpdateResult(m._id)} style={{ background: '#00ff00', color: 'black', border: 'none', borderRadius: '4px', padding: '0.2rem 0.5rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}>✓ Guardar</button>
                          <button onClick={() => setEditingMatchId(null)} style={{ background: 'transparent', color: 'white', border: '1px solid gray', borderRadius: '4px', padding: '0.2rem 0.5rem', cursor: 'pointer', fontSize: '0.8rem' }}>Cancelar</button>
                        </div>
                      ) : (
                        <button onClick={() => { setEditingMatchId(m._id); setEditScore({ local: m.golesLocal, visitante: m.golesVisitante }); }} style={{ background: 'transparent', color: '#ffd700', border: '1px dashed #ffd700', borderRadius: '4px', padding: '0.2rem 0.5rem', cursor: 'pointer', fontSize: '0.8rem' }}>
                          ✏️ Modificar
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {['LLAVES'].includes(activeTab) && (
          <div>
            <h3 style={{ color: '#ffd700' }}>En Construcción</h3>
            <p>Este submódulo será activado durante la próxima fase de actualización.</p>
          </div>
        )}
      </div>
    </div>
  );
};
