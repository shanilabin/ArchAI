import { useState, useEffect } from 'react';
import api from '../api';

const STATUS_BADGE = {
  draft: { label: 'טיוטה', cls: 'text-slate-600 bg-slate-100' },
  checked: { label: 'נבדק', cls: 'text-sky-700 bg-sky-50' },
  rendered: { label: 'הודמה', cls: 'text-violet-700 bg-violet-50' },
};

export default function MyProjects({ onOpenProject }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  const loadProjects = async () => {
    setError('');
    try {
      const res = await api.get('/api/projects');
      setProjects(res.data);
    } catch (err) {
      setError('שגיאה בטעינת הפרויקטים');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProjects(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    setError('');
    try {
      await api.post('/api/projects', { name: newName.trim() });
      setNewName('');
      await loadProjects();
    } catch (err) {
      setError('שגיאה ביצירת הפרויקט');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (p) => {
    if (!window.confirm(`למחוק את הפרויקט "${p.name}"?`)) return;
    setError('');
    try {
      await api.delete(`/api/projects/${p.id}`);
      await loadProjects();
    } catch (err) {
      setError('שגיאה במחיקת הפרויקט');
    }
  };

  return (
    <div dir="rtl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">הפרויקטים שלי</h1>
        <p className="text-slate-500 mt-1">{projects.length} פרויקטים · בדיקה, הדמיה ותמחור במקום אחד</p>
      </div>

      {/* יצירה */}
      <form onSubmit={handleCreate}
        className="flex gap-3 mb-10 p-2 bg-white rounded-2xl border border-slate-200 shadow-sm">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="שם פרויקט חדש..."
          className="flex-1 px-4 py-2.5 bg-transparent outline-none text-sm"
        />
        <button type="submit" disabled={creating}
          style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
          className="px-5 py-2.5 text-white text-sm font-semibold rounded-xl shadow-md hover:-translate-y-0.5 transition disabled:opacity-50">
          {creating ? 'יוצר...' : '+ פרויקט חדש'}
        </button>
      </form>

      {error && <p className="mb-6 text-sm text-center text-red-600">{error}</p>}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => <div key={i} className="h-36 bg-white rounded-3xl border border-slate-100 animate-pulse" />)}
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-3xl border-2 border-dashed border-slate-200">
          <div className="text-4xl mb-3">📐</div>
          <p className="text-slate-500 font-medium">אין לך פרויקטים עדיין</p>
          <p className="text-sm text-slate-400 mt-1">צרי את הראשון למעלה</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((p) => {
            const badge = STATUS_BADGE[p.status] || STATUS_BADGE.draft;
            return (
              <div key={p.id} onClick={() => onOpenProject(p)}
                className="group relative p-6 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 cursor-pointer transition-all duration-300">
                <button onClick={(e) => { e.stopPropagation(); handleDelete(p); }} title="מחיקה"
                  className="absolute top-4 left-4 w-7 h-7 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition opacity-0 group-hover:opacity-100">
                  ✕
                </button>
                <div className="w-11 h-11 mb-4 rounded-2xl flex items-center justify-center text-xl"
                  style={{ background: 'linear-gradient(135deg, #eef2ff, #faf5ff)' }}>📐</div>
                <h3 className="text-lg font-bold tracking-tight mb-4 truncate pl-6">{p.name}</h3>
                <div className="flex items-center justify-between">
                  <span className={'text-xs font-semibold px-2.5 py-1 rounded-full ' + badge.cls}>{badge.label}</span>
                  <span className="text-xs text-slate-400">{(p.created_at || '').slice(0, 10)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}