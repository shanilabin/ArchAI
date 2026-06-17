export default function Landing({ onStart }) {
  const features = [
    { n: '01', color: '#4f46e5', icon: '🔍', tag: 'ArchCheck', title: 'בדיקת שגיאות חכמה', desc: 'ה-AI סורק את השרטוט, מזהה בעיות תכנון (חדר ללא חלון, מרווח חריג, קיר דק) ומסמן אותן על התוכנית — עם הסבר לכל דגל.' },
    { n: '02', color: '#0ea5e9', icon: '🎨', tag: 'ArchRender', title: 'הדמיות ריאליסטיות', desc: 'בוחרים חומרים, צבעים וסגנון, וה-AI מזהה את החדרים ומפיק הדמיה לכל חלל — מטבח, סלון, חזית — לפי הבחירות שלך.' },
    { n: '03', color: '#7c3aed', icon: '📊', tag: 'ArchSpecs', title: 'כתב כמויות ואקסל', desc: 'חישוב אוטומטי של חומרים, כמויות ומחירים, עם ייצוא לקובץ Excel מעוצב — מוכן ללקוח או לקבלן.' },
  ];

  const benefits = [
    { icon: '⚡', title: 'חוסך שעות עבודה', desc: 'מה שלקח ימים — דקות.' },
    { icon: '🎯', title: 'פחות טעויות', desc: 'דגלים לבדיקה לפני הביצוע.' },
    { icon: '💬', title: 'מרשים לקוחות', desc: 'הדמיות שמסבירות את החזון.' },
    { icon: '📁', title: 'הכל במקום אחד', desc: 'בדיקה, הדמיה ותמחור יחד.' },
  ];

  const steps = [
    { t: 'מעלים שרטוט', d: 'תמונה של תוכנית, חזית או חדר.' },
    { t: 'ה-AI עובד', d: 'בודק, מזהה חדרים ומפיק הדמיות.' },
    { t: 'מורידים תוצאות', d: 'הדמיות + כתב כמויות באקסל.' },
  ];

  const oldWay = [
    'בדיקת שגיאות ידנית — שעות על גבי שעות',
    'הדמיות יקרות מסטודיו חיצוני',
    'כתב כמויות באקסל ידני, מועד לטעויות',
    'כל משימה בתוכנה נפרדת',
  ];

  const newWay = [
    'בדיקה אוטומטית תוך דקות',
    'הדמיות AI מיידיות, ללא עלות',
    'כתב כמויות שנוצר אוטומטית',
    'הכל בפלטפורמה אחת',
  ];

  const audience = [
    { icon: '🏛️', title: 'אדריכלים', desc: 'בדיקת תכנון והדמיות מהירות להצגה ללקוח.' },
    { icon: '🛋️', title: 'מעצבי פנים', desc: 'הדמיות חללים לפי חומרים, צבעים וסגנון.' },
    { icon: '🎓', title: 'סטודנטים', desc: 'להציג פרויקטים בצורה מקצועית ומרשימה.' },
    { icon: '🔨', title: 'קבלנים', desc: 'כתב כמויות מדויק לתמחור מהיר.' },
  ];

  const tech = [
    { icon: '🧠', name: 'Gemini Vision', desc: 'זיהוי וניתוח שרטוטים' },
    { icon: '⚛️', name: 'React', desc: 'ממשק מהיר ומודרני' },
    { icon: '🐍', name: 'FastAPI', desc: 'שרת Python יציב' },
    { icon: '🖼️', name: 'Stable Diffusion', desc: 'מנוע ההדמיות' },
    { icon: '🔒', name: 'JWT Auth', desc: 'אבטחה והרשאות' },
    { icon: '📊', name: 'Excel Export', desc: 'ייצוא כתב כמויות' },
  ];

  const faq = [
    { q: 'האם צריך להתקין תוכנה?', a: 'לא. הכל עובד ישירות בדפדפן, מכל מחשב — בלי התקנות.' },
    { q: 'האם זה חינם?', a: 'כן. אפשר להתחיל בחינם, ללא כרטיס אשראי.' },
    { q: 'אילו סוגי שרטוטים נתמכים?', a: 'תוכניות (Plan), חזיתות וצילומי חדרים — כתמונה רגילה.' },
    { q: 'כמה זמן לוקחת בדיקה?', a: 'בדרך כלל דקות ספורות, תלוי במורכבות השרטוט.' },
    { q: 'מה לגבי פרטיות?', a: 'השרטוטים נשמרים בחשבון האישי שלך בלבד, מאחורי התחברות מאובטחת.' },
  ];

  const btn = "px-9 py-4 text-white text-base font-semibold rounded-full shadow-lg shadow-indigo-500/30 hover:scale-105 hover:shadow-xl transition-all duration-200";
  const btnStyle = { background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' };

  return (
    <div dir="rtl" className="min-h-screen relative overflow-hidden text-slate-900"
      style={{ fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
               background: 'linear-gradient(180deg, #eef2ff 0%, #f8fafc 35%, #ffffff 100%)' }}>

      {/* כתמי צבע ברקע */}
      <div className="absolute -top-40 -right-32 w-[28rem] h-[28rem] rounded-full blur-3xl opacity-40 pointer-events-none" style={{ background: 'radial-gradient(circle, #a5b4fc 0%, transparent 70%)' }} />
      <div className="absolute top-32 -left-32 w-[28rem] h-[28rem] rounded-full blur-3xl opacity-40 pointer-events-none" style={{ background: 'radial-gradient(circle, #7dd3fc 0%, transparent 70%)' }} />

      <div className="relative z-10">
        {/* Hero */}
        <section className="max-w-4xl mx-auto px-6 pt-28 pb-20 text-center">
          <span className="inline-block px-4 py-1.5 rounded-full text-sm font-medium text-indigo-700 bg-indigo-100/70 mb-8">
            ✨ פלטפורמת AI לאדריכלים ומעצבי פנים
          </span>
          <h1 className="text-5xl sm:text-7xl font-semibold tracking-tight leading-[1.1]">
            תכנון חכם יותר,<br />בעזרת{' '}
            <span style={{ background: 'linear-gradient(90deg, #4f46e5, #0ea5e9, #7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              בינה מלאכותית
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-500 mt-7 max-w-2xl mx-auto leading-relaxed">
            העלי שרטוט אחד — וקבלי בדיקת שגיאות, הדמיות ריאליסטיות וכתב כמויות. כל מה שאדריכל צריך, במקום אחד.
          </p>
          <div className="mt-10">
            <button onClick={onStart} style={btnStyle} className={btn}>להתחלת עבודה ←</button>
          </div>
          <p className="text-xs text-slate-400 mt-4">חינמי להתחלה · ללא כרטיס אשראי</p>
        </section>

        {/* פס נתונים */}
        <section className="max-w-4xl mx-auto px-6 pb-20">
          <div className="grid grid-cols-3 text-center bg-white/70 backdrop-blur rounded-3xl border border-white shadow-sm py-8">
            <div>
              <div className="text-3xl font-bold text-indigo-600">3 ב-1</div>
              <div className="text-sm text-slate-500 mt-1">בדיקה · הדמיה · תמחור</div>
            </div>
            <div className="border-x border-slate-100">
              <div className="text-3xl font-bold text-sky-600">דקות</div>
              <div className="text-sm text-slate-500 mt-1">במקום ימי עבודה</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-violet-600">AI</div>
              <div className="text-sm text-slate-500 mt-1">מבוסס Gemini Vision</div>
            </div>
          </div>
        </section>

        {/* לפני / אחרי */}
        <section className="max-w-4xl mx-auto px-6 pb-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">התהליך הישן מול ArchAI</h2>
            <p className="text-slate-500 mt-3">אותה עבודה — בשבריר מהזמן.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
              <div className="flex items-center gap-2 mb-5">
                <span className="text-2xl">😮‍💨</span>
                <h3 className="text-lg font-semibold text-slate-700">בלי ArchAI</h3>
              </div>
              <ul className="space-y-3">
                {oldWay.map((t) => (
                  <li key={t} className="flex items-start gap-3 text-sm text-slate-500">
                    <span className="text-red-400 mt-0.5">✕</span>{t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-3xl p-8 text-white shadow-lg" style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
              <div className="flex items-center gap-2 mb-5">
                <span className="text-2xl">🚀</span>
                <h3 className="text-lg font-semibold">עם ArchAI</h3>
              </div>
              <ul className="space-y-3">
                {newWay.map((t) => (
                  <li key={t} className="flex items-start gap-3 text-sm text-indigo-50">
                    <span className="text-emerald-300 mt-0.5">✓</span>{t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* 3 היכולות */}
        <section className="max-w-5xl mx-auto px-6 pb-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">שלושה כלים, תהליך אחד</h2>
            <p className="text-slate-500 mt-3">מהשרטוט ועד הביצוע.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((s) => (
              <div key={s.n} className="bg-white/70 backdrop-blur rounded-3xl p-9 border border-white shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <div className="w-12 h-12 mb-5 rounded-2xl flex items-center justify-center text-2xl shadow-md"
                  style={{ background: `linear-gradient(135deg, ${s.color}, ${s.color}cc)` }}>
                  {s.icon}
                </div>
                <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: s.color }}>{s.tag}</span>
                <h3 className="text-xl font-semibold tracking-tight mt-1 mb-3">{s.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* יתרונות */}
        <section className="max-w-5xl mx-auto px-6 pb-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">למה אדריכלים אוהבים את זה</h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {benefits.map((b) => (
              <div key={b.title} className="bg-white rounded-2xl p-6 text-center shadow-sm border border-slate-50">
                <div className="text-3xl mb-3">{b.icon}</div>
                <h4 className="font-semibold tracking-tight mb-1">{b.title}</h4>
                <p className="text-sm text-slate-500">{b.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* למי זה מתאים */}
        <section className="max-w-5xl mx-auto px-6 pb-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">למי זה מתאים?</h2>
            <p className="text-slate-500 mt-3">לכל מי שעובד עם תכנון ועיצוב חללים.</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {audience.map((a) => (
              <div key={a.title} className="bg-white/70 backdrop-blur rounded-3xl p-7 text-center border border-white shadow-sm hover:-translate-y-1 transition-all duration-300">
                <div className="text-4xl mb-4">{a.icon}</div>
                <h4 className="font-semibold tracking-tight mb-2">{a.title}</h4>
                <p className="text-sm text-slate-500 leading-relaxed">{a.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* איך זה עובד */}
        <section className="max-w-4xl mx-auto px-6 pb-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">איך זה עובד?</h2>
            <p className="text-slate-500 mt-3">שלושה צעדים פשוטים.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((s, i) => (
              <div key={i} className="text-center">
                <div className="w-14 h-14 mx-auto mb-4 rounded-full text-white text-xl font-bold flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
                  {i + 1}
                </div>
                <h4 className="font-semibold tracking-tight mb-1">{s.t}</h4>
                <p className="text-sm text-slate-500">{s.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* הטכנולוגיה מאחורי הקלעים */}
        <section className="max-w-5xl mx-auto px-6 pb-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">הטכנולוגיה מאחורי הקלעים</h2>
            <p className="text-slate-500 mt-3">בנוי על כלים מתקדמים ואמינים.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            {tech.map((t) => (
              <div key={t.name} className="flex items-center gap-4 bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                <span className="text-3xl">{t.icon}</span>
                <div>
                  <div className="font-semibold tracking-tight">{t.name}</div>
                  <div className="text-sm text-slate-500">{t.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* שאלות נפוצות */}
        <section className="max-w-3xl mx-auto px-6 pb-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">שאלות נפוצות</h2>
          </div>
          <div className="space-y-4">
            {faq.map((f) => (
              <details key={f.q} className="group bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <summary className="flex items-center justify-between cursor-pointer px-6 py-5 font-semibold tracking-tight list-none">
                  {f.q}
                  <span className="text-indigo-500 transition-transform duration-200 group-open:rotate-45 text-xl">+</span>
                </summary>
                <p className="px-6 pb-5 text-sm text-slate-500 leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* CTA סיום */}
        <section className="max-w-3xl mx-auto px-6 pb-28">
          <div className="rounded-[2rem] p-12 text-center text-white shadow-xl"
            style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' }}>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-4">מוכנים להתחיל?</h2>
            <p className="text-indigo-100 mb-8 max-w-md mx-auto">העלי את השרטוט הראשון שלך, ותראי את ה-AI עובד בשבילך.</p>
            <button onClick={onStart}
              className="px-9 py-4 bg-white text-indigo-700 text-base font-semibold rounded-full hover:scale-105 transition-all duration-200 shadow-lg">
              להתחלת עבודה — חינם
            </button>
          </div>
        </section>

        <footer className="border-t border-slate-100 py-8 text-center">
          <p className="text-xs text-slate-400">ArchAI · פלטפורמת AI לאדריכלים ומעצבי פנים</p>
        </footer>
      </div>
    </div>
  );
}
