import { useState, useEffect } from 'react';
import Auth from './components/Auth';
import Landing from './components/Landing';
import MyProjects from './components/MyProjects';
import Workspace from './components/Workspace';

export default function App() {
  const [user, setUser] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('username');
    const token = localStorage.getItem('token');
    if (savedUser && token) setUser(savedUser);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setUser(null);
    setSelectedProject(null);
    setShowAuth(false);
  };

  if (!user) {
    return showAuth
      ? <Auth onLoginSuccess={(username) => setUser(username)} />
      : <Landing onStart={() => setShowAuth(true)} />;
  }

  return (
    <div dir="rtl" className="min-h-screen relative text-slate-900"
      style={{ fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
               background: 'linear-gradient(180deg, #eef2ff 0%, #f8fafc 100%)' }}>

      {/* Navbar */}
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-slate-200/70">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <button onClick={() => setSelectedProject(null)} className="flex items-center gap-2.5 hover:opacity-80 transition">
            <span className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shadow-md"
              style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>🏛️</span>
            <span className="text-xl font-bold tracking-tight">ArchAI</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-full border border-slate-200 shadow-sm">
              <span className="w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
                {user.charAt(0).toUpperCase()}
              </span>
              <span className="text-sm font-medium text-slate-700">{user}</span>
            </div>
            <button onClick={handleLogout}
              className="px-3 py-1.5 text-sm font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
              התנתקות
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        {selectedProject ? (
          <Workspace project={selectedProject} onBack={() => setSelectedProject(null)} />
        ) : (
          <MyProjects onOpenProject={setSelectedProject} />
        )}
      </main>
    </div>
  );
}