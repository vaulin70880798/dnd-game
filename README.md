# Gamebook Project — חאר: עיר המלכודות (שימוש פרטי)

פרויקט Next.js מלא לספר־משחק דיגיטלי: מנוע פסקאות, קרב, קוביות, מלאי, מפה, יומן, שמירה/טעינה וולידציה לנתונים.

## סטטוס עדכני
- נטענו `511` פסקאות מתוך מקור OCR לקובץ `data/paragraphs.json`.
- כל טקסט המשחק הומר לעברית בשדה `textHe`.
- טקסט מקור רוסי נשמר בשדה `textOriginal` לצורך ביקורת דיוק.
- חוקי המשחק עודכנו לפי החומר שסיפקת ב־`data/rules.json`.
- מוינו אויבים אוטומטית ל־`data/enemies.json`.
- נוספו תמונות מקור: מפה + דפי דמות/קרב תחת `public/assets`.
- פסקאות קרב עם טבלת אויבים קיבלו `combat` object מובנה (27 פסקאות שניתנות לחילוץ אמין).

## טכנולוגיה
- Next.js 16 (App Router)
- TypeScript
- React 19
- Tailwind CSS 4
- LocalStorage
- JSON לניהול תוכן הספר

## מבנה
- `app/` עמודים
- `components/` רכיבי UI
- `engine/` לוגיקת משחק (מעברים, תנאים, קרב, שמירה)
- `data/` נתוני הספר
- `types/` טיפוסים
- `scripts/` ingestion/translation/validation

## פקודות
1. `npm install`
2. `npm run ingest:data` — טעינת מקור OCR לפסקאות
3. `npm run extract:enemies` — חילוץ אויבים מטבלאות קרב
4. `npm run structure:combats -- 60` — בניית combat objects לפסקאות קרב ראשונות
5. `npm run translate:he` — תרגום נתונים מרוסית לעברית
6. `npm run validate:data` — בדיקת תקינות הפניות ותלויות
7. `npm run lint`
8. `npm run build`
9. `npm run dev`
10. `./scripts/generateVisualAssetsOpenAI.sh` — יצירת סט נכסי עיצוב אחיד עם OpenAI Image API (מודל חסכוני `gpt-image-1-mini`)
11. `npm run generate:paragraph-illustrations` — יצירת איורי רימייק לפסקאות שסומנו כבעלות הקשר איורי

## יצירת נכסי AI
כדי לייצר את נכסי האמנות בפועל, נדרש מפתח API מקומי:

```bash
export OPENAI_API_KEY=your_key_here
./scripts/generateVisualAssetsOpenAI.sh
npm run generate:paragraph-illustrations
```

הקבצים נוצרים תחת `public/assets/generated`.

## גישה פרטית (אופציונלי)
להגנה בסיסית בסיסמה, הוסף לקובץ `.env.local`:

```bash
PRIVATE_GAME_PASSWORD=your_password_here
```

הגישה תנוהל דרך `/unlock` ו־`proxy.ts`.

## פריסה ל־Vercel
1. העלאה ל־GitHub.
2. חיבור ה־repo ל־Vercel.
3. Build command: `npm run build`
4. Dev command: `npm run dev`
5. (אופציונלי) הוספת `PRIVATE_GAME_PASSWORD` ב־Environment Variables.

## הערת זכויות
הפרויקט מיועד לשימוש פרטי בלבד עם תוכן שקיבלת אליו זכויות שימוש. לפרסום ציבורי של הטקסט/האיורים נדרש אישור מפורש מבעלי הזכויות.
