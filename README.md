# ArchAI 🏛️

פלטפורמת **Full-Stack מבוססת AI לאדריכלים ומעצבי פנים**. המשתמש מעלה שרטוט, והמערכת מבצעת עליו שלושה דברים: בודקת שגיאות תכנון, מפיקה הדמיות ריאליסטיות, ומחשבת כתב כמויות עם ייצוא ל-Excel.

---

## ✨ יכולות (Features)

### 🔍 ArchCheck — בדיקת שגיאות
מעלים שרטוט, ו-**Gemini Vision** מזהה בעיות תכנון (חדר ללא חלון, מרווח חריג, קיר דק) ומחזיר JSON עם מיקום והסבר. הבעיות מסומנות בעיגולים אדומים על השרטוט (Canvas overlay) ונשמרות ב-DB.

### 🎨 ArchRender — הדמיות ריאליסטיות
זרימה חכמה שמתאימה את עצמה לסוג השרטוט (זיהוי אוטומטי):
- **תוכנית קומה** → זיהוי חדרים (bounding boxes) → בחירת חומרים לכל חדר → גלריה.
- **חזית** → הדמיית חוץ מכמה כיוונים (img2img + ControlNet).
- **מטבח** → זיהוי ארונות/מקרר/כיור → בחירת גימורים.
- **חדר** → זיהוי רהיטים → בחירת ריהוט וסגנון.

מנוע ההדמיה: **AI Horde** (חינמי) — ניתן להחלפה ל-Replicate בשורה אחת.

### 📊 ArchSpecs — כתב כמויות
טבלת חומרים/כמויות/מחירים עם חישוב אוטומטי וייצוא לקובץ **Excel** מעוצב (openpyxl).

---

## 🛠️ Tech Stack
- **Frontend:** React + Vite + Tailwind CSS v4, Axios
- **Backend:** Python + FastAPI, SQLite
- **Auth:** JWT (PyJWT) + bcrypt/passlib
- **AI:** Gemini Vision API (זיהוי) + AI Horde (יצירת תמונות)
- **Reports:** openpyxl

## 🏗️ Architecture (Backend בשכבות)
```
backend/
├── main.py            # יצירת האפליקציה + חיבור הראוטרים
├── config.py          # נתיבים
├── schemas.py         # מודלים (Pydantic)
├── database.py        # חיבור ל-DB
├── crud.py            # שכבת Repository — כל ה-SQL
├── auth.py            # אבטחה (hashing + JWT)
├── deps.py            # תלויות (אימות + בעלות)
├── vision.py          # אינטגרציית Gemini
├── render.py          # אינטגרציית AI Horde
├── reports.py         # יצירת Excel
└── routers/           # Controllers (auth_routes, projects)
```

---

## 🚀 הרצה — צריך שני טרמינלים

לפני הרצה, צרי קבצי `.env` (ראי "משתני סביבה" למטה).

### טרמינל 1 — Backend
```bash
cd backend
pip install -r requirements.txt
python database.py             # יוצר את הטבלאות (פעם אחת)
python -m uvicorn main:app --reload   # http://localhost:8000
```

### טרמינל 2 — Frontend
```bash
cd frontend
npm install
npm run dev                    # http://localhost:5173
```

פתחו בדפדפן: **http://localhost:5173**

---

## 🔑 משתני סביבה (.env)
הקבצים האלה לא עולים לגיטהב (מוגנים ב-`.gitignore`). יש ליצור אותם מקומית:

**`backend/.env`**
```
JWT_SECRET=<מחרוזת אקראית ארוכה>
FRONTEND_URL=http://localhost:5173
GEMINI_API_KEY=<מפתח מ-aistudio.google.com>
AIHORDE_API_KEY=<מפתח חינמי מ-aihorde.net (אופציונלי)>
```

**`frontend/.env`**
```
VITE_API_URL=http://localhost:8000
```

---

## 📌 הערות
- מנוע ההדמיה (AI Horde) חינמי אך עלול להיות איטי בשעות עומס. ניתן לשדרג ל-Replicate/Gemini-image בתשלום.
- דיוק מיקומי הזיהוי וההדמיות הוא ברמת קונספט (מגבלת מודלי AI), לא שחזור גיאומטרי מדויק.
