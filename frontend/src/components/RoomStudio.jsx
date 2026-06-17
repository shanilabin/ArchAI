import { useState, useEffect } from 'react';
import api from '../api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const ROOM_TYPES = [
  { label: 'חדר שינה', value: 'bedroom' },
  { label: 'סלון', value: 'living room' },
  { label: 'חדר עבודה', value: 'home office' },
  { label: 'חדר ילדים', value: 'kids room' },
  { label: 'חדר אוכל', value: 'dining room' },
];
const WALL_COLORS = [
  { label: 'לבן', value: 'white' }, { label: 'אפור בהיר', value: 'light gray' },
  { label: "בז׳", value: 'beige' }, { label: 'כחול בהיר', value: 'light blue' },
  { label: 'ירוק מרווה', value: 'sage green' },
];
const FLOORINGS = [
  { label: 'פרקט עץ', value: 'wood parquet' }, { label: 'שיש', value: 'marble' },
  { label: 'בטון מוחלק', value: 'polished concrete' }, { label: 'שטיח', value: 'carpet' },
];
const STYLES = [
  { label: 'מודרני', value: 'modern' }, { label: 'מינימליסטי', value: 'minimalist' },
  { label: 'סקנדינבי', value: 'scandinavian' }, { label: 'בוהו', value: 'boho' },
  { label: 'קלאסי', value: 'classic' },
];

const selectClass = 'w-full px-3 py-2 bg-white border border-slate-300 rounded-lg outline-none focus:border-indigo-500 transition text-sm';

export default function RoomStudio({ project }) {
  const [drawingUrl, setDrawingUrl] = useState(null);
  const [items, setItems] = useState([]);
  const [detecting, setDetecting] = useState(false);
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cfg, setCfg] = useState({
    room_type: ROOM_TYPES[0].value,
    wall_color: WALL_COLORS[0].value,
    flooring: FLOORINGS[0].value,
    style: STYLES[0].value,
    furniture: '',
    extra: '',
  });

  const set = (k, v) => setCfg((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    api.get(`/api/projects/${project.id}`)
      .then((res) => setDrawingUrl(res.data.original_drawing_url || null))
      .catch(() => {});
  }, [project.id]);

  const handleDetect = async () => {
    setDetecting(true);
    setError('');
    try {
      const res = await api.post(`/api/projects/${project.id}/detect-furniture`);
      const found = res.data.items || [];
      setItems(found);
      // ממלא אוטומטית את שדה הריהוט לפי מה שזוהה (אפשר לערוך)
      if (found.length > 0) {
        set('furniture', found.map((it) => it.name_en || it.name).join(', '));
      }
    } catch (err) {
      setError('שגיאה בזיהוי הרהיטים (' + (err.response?.data?.detail || 'בעיה בשרת') + ')');
    } finally {
      setDetecting(false);
    }
  };

  const handleRender = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.post(`/api/projects/${project.id}/render-room`, {
        room_type: cfg.room_type,
        wall_color: cfg.wall_color,
        flooring: cfg.flooring,
        furniture: cfg.furniture,
        style: cfg.style,
        extra: cfg.extra,
      });
      setImage(res.data.image_url);
    } catch (err) {
      setError('שגיאה בהדמיית החדר (' + (err.response?.data?.detail || 'בעיה בשרת') + ')');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-slate-900">🛋️ עיצוב חדר</h3>
        <button onClick={handleDetect} disabled={detecting}
          className="px-4 py-1.5 text-sm font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition disabled:opacity-60">
          {detecting ? 'מזהה...' : items.length > 0 ? 'זהה מחדש' : '🔎 זהה רהיטים'}
        </button>
      </div>

      {error && <p className="mb-4 p-3 text-sm text-center text-red-700 bg-red-50 rounded-xl">{error}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* שרטוט + רהיטים שזוהו */}
        <div>
          {drawingUrl && (
            <div className="relative border border-slate-200 rounded-2xl overflow-hidden bg-slate-50">
              <img src={`${API_URL}${drawingUrl}`} alt="חדר" className="block w-full" />
              {items.map((el, i) => (
                <span key={i} title={el.name}
                  style={{ left: `${el.x}%`, top: `${el.y}%`, transform: 'translate(-50%, -50%)' }}
                  className="absolute w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shadow">
                  {i + 1}
                </span>
              ))}
            </div>
          )}
          {items.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {items.map((el, i) => (
                <span key={i} className="text-xs px-2 py-1 bg-slate-100 rounded-full text-slate-600">{i + 1}. {el.name}</span>
              ))}
            </div>
          )}
        </div>

        {/* בחירות */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">סוג החדר</label>
            <select value={cfg.room_type} onChange={(e) => set('room_type', e.target.value)} className={selectClass}>
              {ROOM_TYPES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">צבע קירות</label>
              <select value={cfg.wall_color} onChange={(e) => set('wall_color', e.target.value)} className={selectClass}>
                {WALL_COLORS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">ריצוף</label>
              <select value={cfg.flooring} onChange={(e) => set('flooring', e.target.value)} className={selectClass}>
                {FLOORINGS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">סגנון</label>
            <select value={cfg.style} onChange={(e) => set('style', e.target.value)} className={selectClass}>
              {STYLES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">רהיטים</label>
            <input value={cfg.furniture} onChange={(e) => set('furniture', e.target.value)}
              placeholder="מיטה זוגית, ארון 4 דלתות, שולחן עבודה..." className={selectClass} />
            <p className="text-xs text-slate-400 mt-1">מתמלא אוטומטית מהזיהוי — אפשר לערוך או להוסיף.</p>
          </div>

          <input value={cfg.extra} onChange={(e) => set('extra', e.target.value)}
            placeholder="תוספת חופשית (תאורה חמה, צמחייה...)" className={selectClass} />

          <button onClick={handleRender} disabled={loading}
            style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
            className="w-full py-2.5 text-white font-semibold rounded-xl shadow-md hover:-translate-y-0.5 transition disabled:opacity-60">
            {loading ? '🎨 מרנדר חדר...' : '✨ צור הדמיית חדר'}
          </button>
        </div>
      </div>

      {/* תוצאה */}
      {(loading || image) && (
        <div className="mt-6">
          {loading ? (
            <div className="flex items-center justify-center min-h-[200px] bg-slate-50 rounded-2xl border border-slate-200">
              <p className="text-slate-500">🎨 ה-AI מצייר את החדר... עד דקה.</p>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50">
              <img src={`${API_URL}${image}`} alt="הדמיית חדר" className="block w-full" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}