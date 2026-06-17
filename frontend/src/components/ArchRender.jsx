import { useState, useEffect, useRef } from 'react';
import api from '../api';
import KitchenStudio from './KitchenStudio';
import RoomStudio from './RoomStudio';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const DRAWING_TYPES = [
  { label: 'תוכנית קומה (מבט-על)', value: 'plan' },
  { label: 'חזית / מבט מבחוץ', value: 'elevation' },
  { label: 'חדר / פרספקטיבה', value: 'room' },
];
const SPACE_TO_TYPE = {
  facade: 'elevation', kitchen: 'room', living_room: 'room',
  bedroom: 'room', bathroom: 'room', full_plan: 'plan',
};
const ANGLES = [
  { label: 'חזית (מלפנים)', value: 'front' },
  { label: 'זווית 3/4', value: 'angle' },
  { label: 'פרספקטיבה', value: 'perspective' },
];
const WALL_COLORS = [
  { label: 'לבן', value: 'white' }, { label: 'אפור בהיר', value: 'light gray' },
  { label: "בז׳", value: 'beige' }, { label: 'כחול בהיר', value: 'light blue' },
  { label: 'ירוק מרווה', value: 'sage green' },
];
const FLOORINGS = [
  { label: 'פרקט עץ', value: 'wood parquet' }, { label: 'שיש', value: 'marble' },
  { label: 'בטון מוחלק', value: 'polished concrete' }, { label: 'אריחי קרמיקה', value: 'ceramic tiles' },
];
const STYLES = [
  { label: 'מודרני', value: 'modern' }, { label: 'מינימליסטי', value: 'minimalist' },
  { label: 'סקנדינבי', value: 'scandinavian' }, { label: 'תעשייתי', value: 'industrial' },
  { label: 'קלאסי', value: 'classic' },
];

const defaultConfig = () => ({
  flooring: FLOORINGS[0].value,
  wall_color: WALL_COLORS[0].value,
  style: STYLES[0].value,
  extra: '',
});

function SectionCard({ number, title, children, action }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="flex items-center gap-2 font-bold text-slate-800">
          {number && (
            <span className="w-7 h-7 rounded-full bg-indigo-600 text-white text-sm flex items-center justify-center">{number}</span>
          )}
          {title}
        </h3>
        {action}
      </div>
      {children}
    </div>
  );
}

export default function ArchRender({ project }) {
  const [drawingUrl, setDrawingUrl] = useState(null);
  const [hasDrawing, setHasDrawing] = useState(true);
  const [drawingType, setDrawingType] = useState('');
  const [summary, setSummary] = useState('');
  const [spaceType, setSpaceType] = useState('');
  const [analyzing, setAnalyzing] = useState(true);
  const [rooms, setRooms] = useState([]);
  const [roomConfigs, setRoomConfigs] = useState([]);
  const [expandedRoom, setExpandedRoom] = useState(null);
  const [detecting, setDetecting] = useState(false);
  const [renderingRoom, setRenderingRoom] = useState(null);
  const [gallery, setGallery] = useState([]);
  const [galleryProgress, setGalleryProgress] = useState(null);
  const cancelGallery = useRef(false);
  const [wallColor, setWallColor] = useState(WALL_COLORS[0].value);
  const [flooring, setFlooring] = useState(FLOORINGS[0].value);
  const [style, setStyle] = useState(STYLES[0].value);
  const [angle, setAngle] = useState('front');
  const [currentImage, setCurrentImage] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadHistory = async () => {
    try {
      const res = await api.get(`/api/projects/${project.id}/renders`);
      setHistory(res.data);
      if (res.data.length > 0) setCurrentImage((cur) => cur || res.data[0].image_url);
    } catch (err) { /* מתעלמים */ }
  };

  const runAnalyze = async () => {
    setAnalyzing(true);
    try {
      const res = await api.post(`/api/projects/${project.id}/analyze`);
      setSummary(res.data.summary || '');
      setSpaceType(res.data.space_type || '');
      const mapped = SPACE_TO_TYPE[res.data.space_type];
      setDrawingType(mapped || 'plan');
    } catch (err) {
      setDrawingType((t) => t || 'plan');
    } finally {
      setAnalyzing(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const res = await api.get(`/api/projects/${project.id}`);
        const url = res.data.original_drawing_url || null;
        setDrawingUrl(url);
        setHasDrawing(!!url);
        if (url) runAnalyze(); else setAnalyzing(false);
      } catch (err) {
        setHasDrawing(false);
        setAnalyzing(false);
      }
    };
    init();
    loadHistory();
    return () => { cancelGallery.current = true; };
  }, [project.id]);

  const handleDetectRooms = async () => {
    setDetecting(true);
    setError('');
    try {
      const res = await api.post(`/api/projects/${project.id}/detect-rooms`);
      const detected = res.data.rooms || [];
      setRooms(detected);
      setRoomConfigs(detected.map(() => defaultConfig()));
      setExpandedRoom(null);
    } catch (err) {
      setError('שגיאה בזיהוי החדרים (' + (err.response?.data?.detail || 'בעיה בשרת') + ')');
    } finally {
      setDetecting(false);
    }
  };

  const updateRoomConfig = (i, field, value) => {
    setRoomConfigs((prev) => prev.map((c, idx) => (idx === i ? { ...c, [field]: value } : c)));
  };

  const renderOneRoom = async (i) => {
    const room = rooms[i];
    const cfg = roomConfigs[i] || defaultConfig();
    const res = await api.post(`/api/projects/${project.id}/render`, {
      room_name: room.name_en || room.name,
      wall_color: cfg.wall_color,
      flooring: cfg.flooring,
      style: cfg.style,
      extra: cfg.extra,
    });
    return res.data.image_url;
  };

  const handleRenderRoom = async (i) => {
    setRenderingRoom(i);
    setError('');
    try {
      const imageUrl = await renderOneRoom(i);
      setCurrentImage(imageUrl);
      setGallery((prev) => [...prev.filter((g) => g.name !== rooms[i].name), { name: rooms[i].name, image_url: imageUrl }]);
      await loadHistory();
    } catch (err) {
      setError('שגיאה ברינדור החדר (' + (err.response?.data?.detail || 'בעיה בשרת') + ')');
    } finally {
      setRenderingRoom(null);
    }
  };

  const handleRenderGallery = async () => {
    if (!window.confirm(`רינדור גלריה ל-${rooms.length} חדרים ייקח זמן (כמה דקות לכל חדר). להתחיל?`)) return;
    cancelGallery.current = false;
    setError('');
    for (let i = 0; i < rooms.length; i++) {
      if (cancelGallery.current) break;
      setGalleryProgress({ current: i + 1, total: rooms.length, name: rooms[i].name });
      try {
        const imageUrl = await renderOneRoom(i);
        setGallery((prev) => [...prev.filter((g) => g.name !== rooms[i].name), { name: rooms[i].name, image_url: imageUrl }]);
        setCurrentImage(imageUrl);
      } catch (err) {
        // חדר שנכשל — ממשיכים לבא
      }
    }
    setGalleryProgress(null);
    await loadHistory();
  };

  const handleRender = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.post(`/api/projects/${project.id}/render`, {
        wall_color: wallColor,
        flooring: flooring,
        style: style,
        drawing_type: drawingType,
        angle: drawingType === 'elevation' ? angle : '',
      });
      setCurrentImage(res.data.image_url);
      await loadHistory();
    } catch (err) {
      setError('שגיאה ביצירת ההדמיה (' + (err.response?.data?.detail || 'בעיה בשרת') + ')');
    } finally {
      setLoading(false);
    }
  };

  if (!hasDrawing) {
    return (
      <div dir="rtl" className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
        <p className="text-slate-500">קודם צריך להעלות שרטוט בטאב ArchCheck. 📐</p>
      </div>
    );
  }

  const selectClass = 'w-full px-3 py-2 bg-white border border-slate-300 rounded-lg outline-none focus:border-indigo-500 transition text-sm';
  const busy = loading || renderingRoom !== null || galleryProgress !== null;
  const isPlan = drawingType === 'plan';
  const hasStudio = spaceType === 'kitchen' || ['bedroom', 'living_room'].includes(spaceType);

  const materialSelects = (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1">צבע קירות</label>
        <select value={wallColor} onChange={(e) => setWallColor(e.target.value)} className={selectClass}>
          {WALL_COLORS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1">ריצוף</label>
        <select value={flooring} onChange={(e) => setFlooring(e.target.value)} className={selectClass}>
          {FLOORINGS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1">סגנון</label>
        <select value={style} onChange={(e) => setStyle(e.target.value)} className={selectClass}>
          {STYLES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
    </div>
  );

  return (
    <div dir="rtl">
      {spaceType === 'kitchen' && <KitchenStudio project={project} />}
      {['bedroom', 'living_room'].includes(spaceType) && <RoomStudio project={project} />}

      {/* שלב 1 — סוג השרטוט */}
      <SectionCard number="1" title="סוג השרטוט"
        action={
          <button onClick={runAnalyze} disabled={analyzing}
            className="px-3 py-1.5 text-sm font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition disabled:opacity-60">
            {analyzing ? '🔎 מנתח...' : '🔎 נתח מחדש'}
          </button>
        }>
        <div className="flex flex-wrap items-center gap-3">
          <select value={drawingType} onChange={(e) => setDrawingType(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm">
            <option value="" disabled>{analyzing ? 'מזהה...' : 'בחרי סוג'}</option>
            {DRAWING_TYPES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          {summary && <span className="text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">🔎 {summary}</span>}
        </div>
      </SectionCard>

      {/* שלב 2 — חדרים (רק לתוכנית) */}
      {isPlan && (
        <SectionCard number="2" title="החדרים בתוכנית"
          action={
            <button onClick={handleDetectRooms} disabled={detecting || busy}
              className="px-3 py-1.5 text-sm font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition disabled:opacity-60">
              {detecting ? '🏠 מזהה...' : rooms.length > 0 ? '🔄 זהה מחדש' : '🏠 זהה חדרים (AI)'}
            </button>
          }>
          {rooms.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">לחצי "זהה חדרים" כדי שה-AI ימפה את התוכנית 🏠</p>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* השרטוט */}
              <div className="relative border border-slate-200 rounded-xl overflow-hidden bg-slate-50 self-start">
                <img src={`${API_URL}${drawingUrl}`} alt="שרטוט" className="block w-full" />
                {rooms.map((r, i) => (
                  <button key={i} title={r.name} onClick={() => setExpandedRoom(expandedRoom === i ? null : i)}
                    style={{ left: `${r.x}%`, top: `${r.y}%`, transform: 'translate(-50%, -50%)' }}
                    className={'absolute w-7 h-7 rounded-full text-white text-sm font-bold flex items-center justify-center shadow cursor-pointer transition ' +
                      (expandedRoom === i ? 'bg-green-600 scale-125' : 'bg-indigo-600 hover:scale-110')}>
                    {i + 1}
                  </button>
                ))}
              </div>

              {/* רשימת חדרים — אקורדיון */}
              <div className="space-y-2 self-start">
                {rooms.map((r, i) => {
                  const open = expandedRoom === i;
                  const done = gallery.find((g) => g.name === r.name);
                  return (
                    <div key={i} className={'border rounded-xl transition ' + (open ? 'border-indigo-300 bg-indigo-50/40' : 'border-slate-200 bg-white')}>
                      <button onClick={() => setExpandedRoom(open ? null : i)}
                        className="w-full flex items-center gap-2 p-3 text-right">
                        <span className={'w-6 h-6 rounded-full text-white text-xs flex items-center justify-center font-bold ' + (open ? 'bg-green-600' : 'bg-indigo-600')}>{i + 1}</span>
                        <span className="font-semibold text-slate-800 flex-1">{r.name}</span>
                        {done && <span className="text-xs text-green-600 font-semibold">✓</span>}
                        <span className="text-slate-400 text-xs">{open ? '▲' : '▼'}</span>
                      </button>
                      {open && (
                        <div className="px-3 pb-3 space-y-2">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <select value={roomConfigs[i]?.flooring || FLOORINGS[0].value}
                              onChange={(e) => updateRoomConfig(i, 'flooring', e.target.value)} className={selectClass}>
                              {FLOORINGS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                            <select value={roomConfigs[i]?.wall_color || WALL_COLORS[0].value}
                              onChange={(e) => updateRoomConfig(i, 'wall_color', e.target.value)} className={selectClass}>
                              {WALL_COLORS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                            <select value={roomConfigs[i]?.style || STYLES[0].value}
                              onChange={(e) => updateRoomConfig(i, 'style', e.target.value)} className={selectClass}>
                              {STYLES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                          </div>
                          <input value={roomConfigs[i]?.extra || ''}
                            onChange={(e) => updateRoomConfig(i, 'extra', e.target.value)}
                            placeholder="תוספת חופשית (מיטה זוגית, ארון 4 דלתות...)"
                            className={selectClass} />
                          <button onClick={() => handleRenderRoom(i)} disabled={busy}
                            style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
                            className="w-full py-2 text-white text-sm font-semibold rounded-lg disabled:opacity-60">
                            {renderingRoom === i ? '🎨 מרנדר...' : `✨ צור הדמיה ל${r.name}`}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </SectionCard>
      )}

      {/* שלב 3 — גלריה (רק לתוכנית עם חדרים) */}
      {isPlan && rooms.length > 0 && (
        <SectionCard number="3" title={`הגלריה (${gallery.length}/${rooms.length})`}
          action={
            galleryProgress ? (
              <button onClick={() => { cancelGallery.current = true; }}
                className="px-3 py-1.5 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition">
                ⏹ עצור
              </button>
            ) : (
              <button onClick={handleRenderGallery} disabled={busy}
                style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)' }}
                className="px-3 py-1.5 text-sm font-semibold text-white rounded-lg shadow transition disabled:opacity-60">
                🖼️ צור גלריה מלאה
              </button>
            )
          }>
          {galleryProgress && (
            <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-800">
              מרנדר {galleryProgress.current}/{galleryProgress.total}: <strong>{galleryProgress.name}</strong>...
            </div>
          )}
          {gallery.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">עדיין אין הדמיות — רנדרי חדר בודד או גלריה מלאה 🖼️</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {gallery.map((g, i) => (
                <div key={i} className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                  <img src={`${API_URL}${g.image_url}`} alt={g.name}
                    onClick={() => setCurrentImage(g.image_url)}
                    className="w-full h-32 object-cover cursor-pointer hover:opacity-90 transition" />
                  <p className="p-1.5 text-xs font-semibold text-slate-700 text-center">{g.name}</p>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      )}

      {/* הדמיה כללית */}
      {isPlan ? (
        <details className="bg-white border border-slate-200 rounded-2xl p-5 mb-5">
          <summary className="font-bold text-slate-600 cursor-pointer text-sm">⚙️ הדמיה כללית (לא לפי חדר)</summary>
          <div className="mt-4 space-y-3">
            {materialSelects}
            <button onClick={handleRender} disabled={busy || !drawingType}
              style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
              className="px-5 py-2 text-white text-sm font-semibold rounded-lg disabled:opacity-60">
              {loading ? '🎨 מייצר...' : '✨ צור הדמיה כללית'}
            </button>
          </div>
        </details>
      ) : hasStudio ? null : (
        <SectionCard number="2" title={drawingType === 'elevation' ? 'הדמיית חזית' : 'הדמיית החדר'}>
          <div className="space-y-3">
            {drawingType === 'elevation' && (
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">כיוון מבט</label>
                <select value={angle} onChange={(e) => setAngle(e.target.value)} className={selectClass}>
                  {ANGLES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            )}
            {materialSelects}
            <button onClick={handleRender} disabled={busy || !drawingType}
              style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
              className="w-full py-2.5 text-white font-semibold rounded-xl shadow transition hover:-translate-y-0.5 disabled:opacity-60">
              {loading ? '🎨 מייצר...' : '✨ צור הדמיה'}
            </button>
          </div>
        </SectionCard>
      )}

      {/* תצוגה + היסטוריה */}
      <SectionCard title="🖼️ תצוגה">
        {busy ? (
          <div className="flex items-center justify-center min-h-[260px] bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-slate-500">
              {galleryProgress
                ? `🖼️ מרנדר את "${galleryProgress.name}" (${galleryProgress.current}/${galleryProgress.total})...`
                : '🎨 ה-AI מצייר... זה יכול לקחת כמה דקות.'}
            </p>
          </div>
        ) : currentImage ? (
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
            <img src={`${API_URL}${currentImage}`} alt="הדמיה" className="block w-full" />
          </div>
        ) : (
          <p className="text-sm text-slate-400 text-center py-10">ההדמיה תופיע כאן ✨</p>
        )}

        {history.length > 0 && (
          <div className="mt-4">
            <h4 className="font-semibold text-slate-600 text-xs mb-2">היסטוריה</h4>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {history.map((r) => (
                <img key={r.id} src={`${API_URL}${r.image_url}`} onClick={() => setCurrentImage(r.image_url)}
                  className={'h-16 w-24 flex-shrink-0 object-cover rounded-lg cursor-pointer border-2 transition ' + (currentImage === r.image_url ? 'border-indigo-500' : 'border-transparent hover:border-slate-300')}
                  alt="הדמיה" />
              ))}
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  );
}