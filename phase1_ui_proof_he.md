# הוכחת יישום — Phase 1 (UI/UX)

## 1) Scaling — כפתורים ורכיבי פעולה הוקטנו

- כפתור ראשי (`.btn-primary`) הוקטן ל־`padding: 10px 12px` (בעבר גדול יותר).
- כפתור משני (`.btn-soft`) הוקטן ל־`padding: 8px 10px`.
- כפתור צף FAB הוקטן מ־58px ל־52px.
- כפתורי פעולה קטנים (`.icon-btn`) הוקטנו מ־42px ל־38px.
- כפתורי Gameplay תחתונים:
  - D20 הוקטן מ־48px ל־44px.
  - Send הוקטן מ־48px ל־44px.
- ב־SwiftUI:
  - `EmberPrimaryButtonStyle`: מ־18pt ל־16pt.
  - `EmberSecondaryButtonStyle`: מ־16pt ל־14pt.

## 2) טיפוגרפיה בצ׳אט הוקטנה

- HTML:
  - AI message: מ־22px ל־18px.
  - User message: מ־30px ל־20px.
- SwiftUI:
  - AI message: מ־22pt ל־17pt.
  - User message: מ־24pt ל־18pt.

## 3) מיתוג בעברית

- כותרת אפליקציה וספלאש: **"שליט המבוך AI"**.
- HTML משתמש ב־`Cinzel` (premium fantasy style) עם fallback סריפי.
- SwiftUI משתמש ב־`dmBrand` (Copperplate-Bold) למיתוג במסך הספלאש.

## 4) Icon Bank + Ember-Gold Glow

- מנגנון אייקונים מחובר ל־Master Icon Bank:
  - `iconFromBank(name, active)` משתמש ב־sprite coordinates.
  - מצב Active מקבל `drop-shadow` בגוון Ember-Gold.
- fallback מובנה ל־SVG אם קובץ האייקונים לא זמין.
- נתיב קובץ: `./master-icon-bank-hebrew-ui.png`

## 5) RTL + עברית מלאה

- HTML מוגדר `lang="he"` ו־`dir="rtl"`.
- שדות קלט הוגדרו RTL (`direction: rtl; text-align: right`).
- ה־chat נשאר RTL לטקסט אך עם flow יציב להודעות user/assistant.
- SwiftUI קיבל `layoutDirection = .rightToLeft` ברמת האפליקציה.

## 6) Logo Drag Animation

- נוספה אנימציית drag חלקה ללוגו בספלאש:
  - Pointer events + requestAnimationFrame.
  - easing פיזיקלי (lerp).
  - חזרה אוטומטית למרכז אחרי שחרור.
  - ללא קפיצות (smooth transform via CSS vars).

