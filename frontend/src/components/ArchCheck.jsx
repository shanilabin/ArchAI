import { useState, useEffect } from 'react';
import api from '../api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const SEVERITY = {
  review: { color: '#dc2626', label: 'לבדיקת מהנדס' },
  warning: { color: '#ea580c', label: 'אזהרה' },
  info: { color: '#2563eb', label: 'מידע' },
};

export default function ArchCheck({ project, onContinue }) {
  const [drawingUrl, setDrawingUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [issues, setIssues] = useState([]);
  const [checking, setChecking] = useState(false);
  const [checked, setChecked] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(`/api/projects/${project.id}`);
        setDrawingUrl(res.data.original_drawing_url || null);
        const issuesRes = await api.get(`/api/projects/${project.id}/issues`);
        if (issuesRes.data.length > 0) {
          setIssues(issuesRes.data.map((it, i) => ({ ...it, id: i + 1 })));
          setChecked(true);
        }
      } catch (err) {
        setError('שגיאה בטעינת הפרויקט');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [project.id]);

  const toggleIssue = (id) => setSelectedId((prev) => (prev === id ? null : id));

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setError('');
    setUploading(true);
    setIssues([]);
    setChecked(false);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post(`/api/projects/${project.id}/upload`, formData);
      setDrawingUrl(res.data.original_drawing_url);
    } catch (err) {
      setError('שגיאה בהעלאת הקובץ');
    } finally {
      setUploading(false);
    }
  };

  const handleCheck = async () => {
    setChecking(true);
    setSelectedId(null);
    setError('');
    try {
      const res = await api.post(`/api/projects/${project.id}/check`);
      const found = (res.data.issues || []).map((it, i) => ({ ...it, id: i + 1 }));
      setIssues(found);
      setChecked(true);
    } catch (err) {
      setError('שגיאה בבדיקת השרטוט (' + (err.response?.data?.detail || 'בעיה בשרת') + ')');
    } finally {
      setChecking(false);
    }
  };

  if (loading) return <p className="text-slate-400 text-center py-10">טוען...</p>;

  const selectedIssue = issues.find((it) => it.id === selectedId);

  return (
    <div dir="rtl">
      {error && <p className="mb-4 p-3 text-sm text-center text-red-700 bg-red-50 rounded-xl">{error}</p>}

      {/* כפתורי פעולה */}
      <div className="flex flex-wrap gap-3 mb-6">
        <label className="inline-block">
          <span className="inline-block px-5 py-2.5 text-white font-semibold rounded-xl shadow-md cursor-pointer hover:-translate-y-0.5 transition"
            style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
            {uploading ? 'מעלה...' : drawingUrl ? 'החלף שרטוט' : '📤 העלה שרטוט'}
          </span>
          <input type="file" accept="image/*" onChange={handleFileChange} disabled={uploading} className="hidden" />
        </label>
        {drawingUrl && (
          <button onClick={handleCheck} disabled={checking}
            className="px-5 py-2.5 font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md hover:-translate-y-0.5 transition disabled:opacity-60">
            {checking ? '🤖 בודק...' : '🔍 בדוק שגיאות'}
          </button>
        )}
      </div>

      {!drawingUrl ? (
        <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
          <div className="text-4xl mb-3">📐</div>
          <p className="text-slate-500 font-medium">עדיין לא הועלה שרטוט</p>
          <p className="text-sm text-slate-400 mt-1">העלי תמונה כדי להתחיל</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* התמונה + בועות */}
            <div className="lg:col-span-2 lg:sticky lg:top-24">
              <div className="relative border border-slate-200 rounded-3xl overflow-hidden bg-white shadow-sm">
                <img src={`${API_URL}${drawingUrl}`} alt="שרטוט" className="block w-full" />

                {/* הנקודות */}
                {issues.map((issue, i) => {
                  const c = SEVERITY[issue.severity] || SEVERITY.review;
                  const active = selectedId === issue.id;
                  return (
                    <button key={issue.id} onClick={() => toggleIssue(issue.id)} title={issue.description}
                      style={{
                        left: `${issue.x}%`, top: `${issue.y}%`,
                        transform: active ? 'translate(-50%, -50%) scale(1.25)' : 'translate(-50%, -50%)',
                        borderColor: c.color, color: c.color,
                        boxShadow: active ? `0 0 0 5px ${c.color}55` : 'none',
                        zIndex: active ? 30 : 10,
                      }}
                      className="absolute w-8 h-8 rounded-full bg-white/90 border-[3px] font-bold text-sm flex items-center justify-center cursor-pointer hover:scale-110 hover:z-20 transition">
                      {i + 1}
                    </button>
                  );
                })}

                {/* הבועה של הנקודה הנבחרת */}
                {selectedIssue && (() => {
                  const c = SEVERITY[selectedIssue.severity] || SEVERITY.review;
                  const below = selectedIssue.y < 25;
                  const leftPos = Math.min(82, Math.max(18, selectedIssue.x));
                  return (
                    <div className="absolute z-40 w-56 max-w-[75%]"
                      style={{
                        left: `${leftPos}%`, top: `${selectedIssue.y}%`,
                        transform: below ? 'translate(-50%, 18px)' : 'translate(-50%, calc(-100% - 18px))',
                      }}>
                      <div className="rounded-2xl bg-white shadow-xl border-2 p-3 text-right" style={{ borderColor: c.color }}>
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-xs font-bold" style={{ color: c.color }}>
                            {selectedIssue.id}. {c.label}
                          </span>
                          <button onClick={() => setSelectedId(null)}
                            className="text-slate-400 hover:text-slate-700 text-sm leading-none">✕</button>
                        </div>
                        <p className="text-sm text-slate-700 leading-relaxed">{selectedIssue.description}</p>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* רשימת ממצאים — בלי גלילה פנימית */}
            <div className="lg:col-span-1">
              <h3 className="font-bold text-slate-800 mb-3">
                {!checked ? 'לחצי "בדוק שגיאות"' : issues.length > 0 ? `${issues.length} נקודות לבדיקה` : 'לא נמצאו בעיות ✓'}
              </h3>
              <div className="space-y-2">
                {issues.map((issue, i) => {
                  const c = SEVERITY[issue.severity] || SEVERITY.review;
                  const active = selectedId === issue.id;
                  return (
                    <div key={issue.id} onClick={() => toggleIssue(issue.id)}
                      className={'p-3 rounded-2xl border cursor-pointer transition ' + (active ? 'bg-slate-50 border-slate-300 shadow-sm' : 'border-slate-100 bg-white hover:bg-slate-50')}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-5 h-5 rounded-full text-white text-xs flex items-center justify-center font-bold" style={{ background: c.color }}>{i + 1}</span>
                        <span className="text-xs font-semibold" style={{ color: c.color }}>{c.label}</span>
                      </div>
                      <p className="text-sm text-slate-600">{issue.description}</p>
                    </div>
                  );
                })}
              </div>
              {checked && issues.length > 0 && (
                <p className="mt-4 text-xs text-slate-400 leading-relaxed">
                  * דגלים לבדיקה אנושית שנוצרו ע"י AI — לא פסק דין הנדסי. תמיד לאמת מול מהנדס.
                </p>
              )}
            </div>
          </div>

          {/* Gate */}
          <div className="mt-8 pt-6 border-t border-slate-200 text-left">
            <button onClick={onContinue}
              style={{ background: 'linear-gradient(135deg, #059669, #0d9488)' }}
              className="px-6 py-3 font-bold text-white rounded-xl shadow-md hover:-translate-y-0.5 transition">
              התוכנית תקינה? המשך להדמיה ←
            </button>
          </div>
        </>
      )}
    </div>
  );
}