import { useState, useEffect } from 'react';
import { useAuth, API_URL } from './App';

export const TournamentViewer = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('GRUPOS');
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [groups, setGroups] = useState([]);
  const [teams, setTeams] = useState([]);
  const [matches, setMatches] = useState([]);
  const [standings, setStandings] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');

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
    } catch (e) { console.error(e); }
  };

  const fetchTeams = async (eventId) => {
    try {
      const res = await fetch(`${API_URL}/events/${eventId}/teams`);
      setTeams(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchMatches = async (eventId) => {
    try {
      const res = await fetch(`${API_URL}/events/${eventId}/matches`);
      setMatches(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchStandings = async (eventId, groupId) => {
    try {
      const res = await fetch(`${API_URL}/events/${eventId}/groups/${groupId}/standings`);
      setStandings(await res.json());
    } catch (e) { console.error(e); }
  };

  return (
    <div className="animate-slide-up" style={{ padding: '1rem', color: 'white' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <h1 className="title" style={{ margin: 0, color: '#ffd700' }}>Eventos Deportivos</h1>
      </div>
      <p className="subtitle" style={{ marginTop: '-0.5rem' }}>Explora torneos mundiales, calendarios y estadísticas.</p>
      
      <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '8px' }}>
        <label style={{ fontWeight: 'bold' }}>Torneo Seleccionado: </label>
        <select value={selectedEventId} onChange={(e) => {
          const evtId = e.target.value;
          setSelectedEventId(evtId);
          fetchGroups(evtId);
          fetchTeams(evtId);
          fetchMatches(evtId);
        }} style={{ padding: '0.5rem', marginLeft: '1rem', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid gray' }}>
          {events.map(ev => (
            <option key={ev._id} value={ev._id} style={{ color: 'black' }}>{ev.nombre}</option>
          ))}
        </select>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        {['GRUPOS', 'EQUIPOS', 'PARTIDOS', 'POSICIONES', 'LLAVES'].map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              background: activeTab === tab ? '#ffd700' : 'rgba(255,255,255,0.1)',
              color: activeTab === tab ? 'black' : 'white',
              border: '1px solid rgba(255,215,0,0.5)',
              padding: '0.5rem 1.5rem',
              borderRadius: '25px',
              cursor: 'pointer',
              fontWeight: 'bold',
              transition: 'all 0.2s'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="glass-panel" style={{ borderTop: '3px solid #ffd700' }}>

        {activeTab === 'GRUPOS' && (
          <div>
            <h3>Fase de Grupos</h3>
            {groups.length === 0 ? <p style={{ color: 'gray' }}>No hay grupos disponibles en este evento.</p> : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                {groups.map(g => (
                  <div key={g._id} style={{ background: 'linear-gradient(to bottom, rgba(50,50,50,0.5), rgba(0,0,0,0.8))', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,215,0,0.3)', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
                    <h4 style={{ margin: '0 0 1rem 0', color: '#ffd700', textAlign: 'center', fontSize: '1.2rem' }}>Grupo {g.codigo}</h4>
                    <ul style={{ paddingLeft: '0', listStyleType: 'none', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {g.teams.map(t => (
                        <li key={t._id} style={{ background: 'rgba(255,255,255,0.1)', padding: '0.6rem', borderRadius: '6px', textAlign: 'center' }}>
                          <span style={{ fontWeight: 'bold', color: 'white' }}>{t.codigo}</span> - <span style={{ color: '#ccc' }}>{t.nombre}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'EQUIPOS' && (
          <div>
            <h3>Catálogo de Selecciones ({teams.length})</h3>
            {teams.length === 0 ? <p style={{ color: 'gray' }}>No hay equipos importados aún.</p> : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1rem' }}>
                {teams.map(t => (
                  <div key={t._id} style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', textAlign: 'center', border: '1px solid rgba(255,215,0,0.2)' }}>
                    <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#ffd700', marginBottom: '0.3rem' }}>{t.codigo}</div>
                    <div style={{ fontSize: '0.9rem', color: 'white' }}>{t.nombre}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'PARTIDOS' && (
          <div>
            <h3>Calendario y Marcadores</h3>
            {matches.length === 0 ? <p style={{ color: 'gray' }}>No hay partidos agendados.</p> : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                {matches.map(m => (
                  <div key={m._id} style={{ background: 'rgba(0,0,0,0.3)', padding: '1.2rem', borderRadius: '12px', border: '1px solid rgba(255,215,0,0.2)', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: m.estado === 'JUGADO' ? '#00ff00' : 'orange' }}></div>
                    <div style={{ fontSize: '0.8rem', color: 'gray', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
                      <span style={{ fontWeight: 'bold', color: '#ffd700' }}>Fase: {m.fase}</span>
                      <span>{new Date(m.fechaHora).toLocaleDateString()} {new Date(m.fechaHora).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{flex: 1, textAlign: 'right', fontWeight: 'bold', fontSize: '1.1rem'}}>{m.localTeamId?.nombre || 'Local'}</div>
                      <div style={{padding: '0 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                        <div style={{ padding: '0.4rem 1rem', background: 'rgba(0,0,0,0.5)', borderRadius: '8px', color: 'white', fontSize: '1.4rem', fontWeight: 'bold', border: '1px solid #ffd700' }}>
                          {m.golesLocal} - {m.golesVisitante}
                        </div>
                      </div>
                      <div style={{flex: 1, textAlign: 'left', fontWeight: 'bold', fontSize: '1.1rem'}}>{m.visitanteTeamId?.nombre || 'Visitante'}</div>
                    </div>
                    <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.8rem', fontWeight: 'bold', letterSpacing: '1px', color: m.estado === 'JUGADO' ? '#00ff00' : 'orange' }}>
                      {m.estado}
                    </div>
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
                    <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                      <span style={{ fontSize: '0.7rem', color: 'gray' }}>{m.estado}</span>
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
                    <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                      <span style={{ fontSize: '0.7rem', color: 'gray' }}>{m.estado}</span>
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
                    <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                      <span style={{ fontSize: '0.7rem', color: 'gray' }}>{m.estado}</span>
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
                    <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                      <span style={{ fontSize: '0.7rem', color: 'gray' }}>{m.estado}</span>
                    </div>
                  </div>
                ))}
                {matches.filter(m => m.fase === 'FINAL').length === 0 && <span style={{ color: 'gray', textAlign: 'center', display: 'block', padding: '1rem' }}>Sin Partidos</span>}
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
};
