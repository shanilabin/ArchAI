import { useState, useEffect } from 'react';
import api from '../api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const CABINETS = [
  { label: 'עץ אלון טבעי', value: 'natural oak wood' },
  { label: 'לבן מט', value: 'matte white' },
  { label: 'אפור', value: 'gray' },
  { label: 'שחור מט', value: 'matte black' },
  { label: 'עץ כהה (אגוז)', value: 'dark walnut wood' },
];
const COUNTERTOPS = [
  { label: 'שיש לבן', value: 'white marble' },
  { label: 'קוורץ שחור', value: 'black quartz' },
  { label: 'גרניט', value: 'granite' },
  { label: 'משטח עץ', value: 'butcher block wood' },
];
const APPLIANCES = [
  { label: 'נירוסטה', value: 'stainless steel' },
  { label: 'שחור', value: 'black' },
  { label: 'לבן', value: 'white' },
  { label: 'משולב/נסתר', value: 'integrated hidden' },
];
const STYLES = [
  { label: 'מודרני', value: 'modern' },
  { label: 'מינימליסטי', value: 'minimalist' },
  { label: 'סקנדינבי', value: 'scandinavian' },
  { label: 'כפרי', value: 'rustic farmhouse' },
  { label: 'קלאסי', value: 'classic' },
];

const selectClass = 'w-full px-3 py-2 bg-white border border-slate-300 rounded-lg outline-none focus:border-indigo-500 transition text-sm';

function FinishGroup({ label, field, options, cfg, setCfg }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-1">{label}</label>
      <select value={cfg[field]} onChange={(e) => setCfg((p) => ({ ...p, [field]: e.target.value }))} className={selectClass}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <input value={cfg[field + 'Custom']} onChange={(e) => setCfg((p) => ({ ...p, [field + 'Custom']: e.target.value }))}
        placeholder="או הקלידי תיאור משלך..." className={selectClass + ' mt-1.5'} />
    </div>
  );
}

export default function KitchenStudio({ project }) {
  const [drawingUrl, setDrawingUrl] = useState(null);
  const [elements, setElements] = useState([]);
  const [detecting, setDetecting] = useState(false);
  const [hasIsland, setHasIsland] = useState(false);
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cfg, setCfg] = useState({
    cabinets: CABINETS[0].value, cabinetsCustom: '',
    island: CABINETS[1].value, islandCustom: '',
    countertop: COUNTERTOPS[0].value, countertopCustom: '',
    appliances: APPLIANCES[0].value, appliancesCustom: '',
    style: STYLES[0].value, extra: '',
  });

  useEffect(() => {
    api.get(`/api/projects/${project.id}`)
      .then((res) => setDrawingUrl(res.data.original_drawing_url || null))
      .catch(() => {});
  }, [project.id]);

  const eff = (k) => (cfg[k + 'Custom'] || '').trim() || cfg[k];

  const handleDetect = async () => {
    setDetecting(true);
    setError('');
    try {
      const res = await api.post(`/api/projects/${project.id}/detect-kitchen`);
      const els = res.data.elements || [];
      setElements(els);
      if (els.some((e) => (e.name_en || '').toLowerCase().includes('island') || (e.name || '').includes('אי'))) {
        setHasIsland(true);
      }
    } catch (err) {
      setError('שגיאה בזיהוי המטבח (' + (err.response?.data?.detail || 'בעיה בשרת') + ')');
    } finally {
      setDetecting(false);
    }
  };

  const handleRender = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.post(`/api/projects/${project.id}/render-kitchen`, {
        cabinets: eff('cabinets'),
        island: hasIsland ? eff('island') : '',
        countertop: eff('countertop'),
        appliances: eff('appliances'),
        style: cfg.style,
        extra: cfg.extra,
        has_island: hasIsland,
      });
      setImage(res.data.image_url);
    } catch (err) {
      setError('שגיאה בהדמיית המטבח (' + (err.response?.data?.detail || 'בעיה בשרת') + ')');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-slate-900">🍳 עיצוב מטבח</h3>
        <button onClick={handleDetect} disabled={detecting}
          className="px-4 py-1.5 text-sm font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition disabled:opacity-60">
          {detecting ? 'מזהה...' : elements.length > 0 ? 'זהה מחדש' : '🔎 זהה רכיבי מטבח'}
        </button>
      </div>

      {error && <p className="mb-4 p-3 text-sm text-center text-red-700 bg-red-50 rounded-xl">{error}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* שרטוט + רכיבים שזוהו */}
        <div>
          {drawingUrl && (
            <div className="relative border border-slate-200 rounded-2xl overflow-hidden bg-slate-50">
              <img src={`${API_URL}${drawingUrl}`} alt="מטבח" className="block w-full" />
              {elements.map((el, i) => (
                <span key={i} title={el.name}
                  style={{ left: `${el.x}%`, top: `${el.y}%`, transform: 'translate(-50%, -50%)' }}
                  className="absolute w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shadow">
                  {i + 1}
                </span>
              ))}
            </div>
          )}
          {elements.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {elements.map((el, i) => (
                <span key={i} className="text-xs px-2 py-1 bg-slate-100 rounded-full text-slate-600">{i + 1}. {el.name}</span>
              ))}
            </div>
          )}
        </div>

        {/* בחירות גימור */}
        <div className="space-y-4">
          <FinishGroup label="גימור ארונות (כל הארונות יחד)" field="cabinets" options={CABINETS} cfg={cfg} setCfg={setCfg} />

          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input type="checkbox" checked={hasIsland} onChange={(e) => setHasIsland(e.target.checked)} className="w-4 h-4" />
            יש אי במטבח (גימור נפרד)
          </label>
          {hasIsland && <FinishGroup label="גימור האי" field="island" options={CABINETS} cfg={cfg} setCfg={setCfg} />}

          <FinishGroup label="משטח עבודה" field="countertop" options={COUNTERTOPS} cfg={cfg} setCfg={setCfg} />
          <FinishGroup label="מוצרי חשמל" field="appliances" options={APPLIANCES} cfg={cfg} setCfg={setCfg} />

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">סגנון</label>
            <select value={cfg.style} onChange={(e) => setCfg((p) => ({ ...p, style: e.target.value }))} className={selectClass}>
              {STYLES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          <input value={cfg.extra} onChange={(e) => setCfg((p) => ({ ...p, extra: e.target.value }))}
            placeholder="תוספת חופשית (תאורה תלויה, גב זכוכית...)" className={selectClass} />

          <button onClick={handleRender} disabled={loading}
            style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
            className="w-full py-2.5 text-white font-semibold rounded-xl shadow-md hover:-translate-y-0.5 transition disabled:opacity-60">
            {loading ? '🎨 מרנדר מטבח...' : '✨ צור הדמיית מטבח'}
          </button>
        </div>
      </div>

      {/* תוצאה */}
      {(loading || image) && (
        <div className="mt-6">
          {loading ? (
            <div className="flex items-center justify-center min-h-[200px] bg-slate-50 rounded-2xl border border-slate-200">
              <p className="text-slate-500">🎨 ה-AI מצייר את המטבח... עד דקה.</p>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50">
              <img src={`${API_URL}${image}`} alt="הדמיית מטבח" className="block w-full" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}