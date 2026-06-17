import { useState, useEffect } from 'react';
import api from '../api';

export default function ArchSpecs({ project }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ item_code: '', description: '', unit: '', quantity: '', unit_price: '' });
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [suggesting, setSuggesting] = useState(false);

  const loadItems = async () => {
    try {
      const res = await api.get(`/api/projects/${project.id}/items`);
      setItems(res.data);
    } catch (err) {
      setError('שגיאה בטעינת הפריטים');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadItems(); }, [project.id]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleAdd = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api.post(`/api/projects/${project.id}/items`, {
        item_code: form.item_code, description: form.description, unit: form.unit,
        quantity: parseFloat(form.quantity), unit_price: parseFloat(form.unit_price),
      });
      setForm({ item_code: '', description: '', unit: '', quantity: '', unit_price: '' });
      await loadItems();
    } catch (err) {
      setError('שגיאה בהוספת הפריט (ודאי שכמות ומחיר הם מספרים)');
    } finally {
      setSaving(false);
    }
  };

  const handleSuggest = async () => {
    setSuggesting(true);
    setError('');
    try {
      await api.post(`/api/projects/${project.id}/suggest-boq`);
      await loadItems();
    } catch (err) {
      setError('שגיאה בהצעת כתב הכמויות (' + (err.response?.data?.detail || 'בעיה בשרת') + ')');
    } finally {
      setSuggesting(false);
    }
  };

  const handleExport = async () => {
    setDownloading(true);
    setError('');
    try {
      const res = await api.get(`/api/projects/${project.id}/boq.xlsx`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(res.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${project.name}_survey.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('אין פריטים לייצוא, או שאירעה שגיאה בהורדה');
    } finally {
      setDownloading(false);
    }
  };

  const grandTotal = items.reduce((sum, it) => sum + it.quantity * it.unit_price, 0);
  const inputClass = 'px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-500 transition text-sm';

  return (
    <div dir="rtl">
      {/* הצעת AI */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="font-bold text-slate-800">כתב כמויות</h3>
            <p className="text-sm text-slate-500 mt-0.5">תני ל-AI להציע פריטים לפי השרטוט, או הוסיפי ידנית.</p>
          </div>
          <button onClick={handleSuggest} disabled={suggesting}
            style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
            className="px-5 py-2.5 text-white font-semibold rounded-xl shadow-md hover:-translate-y-0.5 transition disabled:opacity-60">
            {suggesting ? '🤖 מנתח...' : '🤖 הצע כתב כמויות (AI)'}
          </button>
        </div>
      </div>

      {/* הוספה ידנית */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 mb-6">
        <h4 className="font-semibold text-slate-700 mb-3 text-sm">הוספת פריט ידנית</h4>
        <form onSubmit={handleAdd} className="grid grid-cols-2 sm:grid-cols-6 gap-2">
          <input name="item_code" value={form.item_code} onChange={handleChange} placeholder="קוד" required className={inputClass} />
          <input name="description" value={form.description} onChange={handleChange} placeholder="תיאור" required className={inputClass + ' col-span-2'} />
          <input name="unit" value={form.unit} onChange={handleChange} placeholder="יחידה" required className={inputClass} />
          <input name="quantity" type="number" step="any" value={form.quantity} onChange={handleChange} placeholder="כמות" required className={inputClass} />
          <input name="unit_price" type="number" step="any" value={form.unit_price} onChange={handleChange} placeholder="מחיר יח'" required className={inputClass} />
          <button type="submit" disabled={saving}
            className="col-span-2 sm:col-span-6 py-2.5 text-slate-700 font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 transition disabled:opacity-60">
            {saving ? 'מוסיף...' : '+ הוסף פריט'}
          </button>
        </form>
      </div>

      {error && <p className="mb-4 p-3 text-sm text-center text-red-700 bg-red-50 rounded-xl">{error}</p>}

      {loading ? (
        <p className="text-slate-400 text-center py-8">טוען...</p>
      ) : items.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border-2 border-dashed border-slate-200">
          <div className="text-4xl mb-3">📊</div>
          <p className="text-slate-500">אין עדיין פריטים — לחצי "הצע כתב כמויות" או הוסיפי ידנית</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead>
                <tr className="bg-slate-50 text-slate-600">
                  <th className="p-3 font-semibold">קוד</th>
                  <th className="p-3 font-semibold">תיאור</th>
                  <th className="p-3 font-semibold">יחידה</th>
                  <th className="p-3 font-semibold">כמות</th>
                  <th className="p-3 font-semibold">מחיר יח'</th>
                  <th className="p-3 font-semibold">סה״כ</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr key={it.id} className="border-t border-slate-50 hover:bg-slate-50/50">
                    <td className="p-3">{it.item_code}</td>
                    <td className="p-3">{it.description}</td>
                    <td className="p-3">{it.unit}</td>
                    <td className="p-3">{it.quantity.toLocaleString()}</td>
                    <td className="p-3">{it.unit_price.toLocaleString()}</td>
                    <td className="p-3 font-semibold">{(it.quantity * it.unit_price).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 font-bold border-t border-slate-100">
                  <td colSpan="5" className="p-3 text-left">סה״כ כולל:</td>
                  <td className="p-3 text-indigo-600">{grandTotal.toLocaleString()} ₪</td>
                </tr>
              </tfoot>
            </table>
          </div>
          <div className="p-4 border-t border-slate-100">
            <button onClick={handleExport} disabled={downloading}
              className="px-5 py-2.5 font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md hover:-translate-y-0.5 transition disabled:opacity-60">
              {downloading ? 'מייצא...' : '📥 ייצא לאקסל'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}