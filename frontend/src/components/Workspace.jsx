import { useState } from 'react';
import ArchCheck from './ArchCheck';
import ArchRender from './ArchRender';
import ArchSpecs from './ArchSpecs';

const TABS = [
  { key: 'check', icon: '🔍', label: 'בדיקת שגיאות' },
  { key: 'render', icon: '🎨', label: 'הדמיה' },
  { key: 'specs', icon: '📊', label: 'כתב כמויות' },
];

const STATUS_BADGE = {
  draft: { label: 'טיוטה', cls: 'text-slate-600 bg-slate-100' },
  checked: { label: 'נבדק', cls: 'text-sky-700 bg-sky-50' },
  rendered: { label: 'הודמה', cls: 'text-violet-700 bg-violet-50' },
};

export default function Workspace({ project, onBack }) {
  const [activeTab, setActiveTab] = useState('check');
  const badge = STATUS_BADGE[project.status] || STATUS_BADGE.draft;

  return (
    <div dir="rtl">
      {/* כותרת */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack}
          className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-indigo-600 hover:border-indigo-300 transition shadow-sm">
          →
        </button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
          <span className={'inline-block mt-1 text-xs font-semibold px-2.5 py-0.5 rounded-full ' + badge.cls}>{badge.label}</span>
        </div>
      </div>

      {/* טאבים */}
      <div className="flex gap-2 mb-8 p-1.5 bg-white border border-slate-200 rounded-2xl shadow-sm">
        {TABS.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              style={active ? { background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' } : {}}
              className={'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition ' +
                (active ? 'text-white shadow-md' : 'text-slate-500 hover:bg-slate-50')}>
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* תוכן */}
      <div>
        {activeTab === 'check' && <ArchCheck project={project} onContinue={() => setActiveTab('render')} />}
        {activeTab === 'render' && <ArchRender project={project} />}
        {activeTab === 'specs' && <ArchSpecs project={project} />}
      </div>
    </div>
  );
}