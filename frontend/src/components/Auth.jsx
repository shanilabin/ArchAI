import { useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// תמונת רקע — אפשר להחליף ל-URL אחר או לתמונה מקומית מ-assets
const BG_IMAGE =
  'https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&w=1600&q=80';

export default function Auth({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    const endpoint = isLogin
      ? `${API_URL}/api/auth/login`
      : `${API_URL}/api/auth/register`;

    try {
      const response = await axios.post(endpoint, { username, password });
      if (isLogin) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('username', response.data.username);
        onLoginSuccess(response.data.username);
      } else {
        setMessage('ההרשמה בוצעה בהצלחה! עכשיו אפשר להתחבר.');
        setIsLogin(true);
      }
      setUsername('');
      setPassword('');
    } catch (err) {
      setError(err.response?.data?.detail || 'אירעה שגיאה בתקשורת עם השרת');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full px-4 py-3 text-slate-900 bg-slate-50 border border-slate-200 rounded-xl outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-200';

  return (
    <div
      dir="rtl"
      className="min-h-screen flex items-center justify-center relative p-4 bg-slate-800 bg-cover bg-center"
      style={{ backgroundImage: `url(${BG_IMAGE})` }}
    >
      {/* שכבת כהות לקריאוּת */}
      <div className="absolute inset-0 bg-slate-900/60" />

      {/* כרטיס הטופס */}
      <div className="relative z-10 w-full max-w-md bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8">
        <div
          className="w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center text-3xl shadow-lg"
          style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
        >
          🏛️
        </div>
        <h2 className="text-center text-2xl font-extrabold text-slate-900">
          {isLogin ? 'ברוכה הבאה ל-ArchAI' : 'הרשמה ל-ArchAI'}
        </h2>
        <p className="text-center text-sm text-slate-500 mt-1 mb-7">
          {isLogin ? 'התחברי כדי להמשיך לפרויקטים שלך' : 'צרי חשבון חדש כדי להתחיל'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">שם משתמש</label>
            <input
              type="text"
              placeholder="הכניסי שם משתמש"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">סיסמה</label>
            <input
              type="password"
              placeholder="הכניסי סיסמה"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={inputClass}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
            className="w-full py-3 text-white font-bold rounded-xl shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'אנא המתן...' : isLogin ? 'התחברות' : 'הרשמה'}
          </button>
        </form>

        {message && (
          <p className="mt-4 p-3 text-sm text-center font-semibold text-green-700 bg-green-50 rounded-lg">
            {message}
          </p>
        )}
        {error && (
          <p className="mt-4 p-3 text-sm text-center font-semibold text-red-700 bg-red-50 rounded-lg">
            {error}
          </p>
        )}

        <p className="text-center text-sm text-slate-600 mt-6">
          {isLogin ? 'אין לך חשבון עדיין?' : 'כבר יש לך חשבון?'}
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
              setMessage('');
            }}
            className="text-indigo-600 font-bold underline mr-1.5"
          >
            {isLogin ? 'הירשמי כאן' : 'התחברי כאן'}
          </button>
        </p>
      </div>
    </div>
  );
}
