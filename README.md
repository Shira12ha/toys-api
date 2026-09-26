# Toys API

REST API לניהול צעצועים באמצעות Node.js, Express ו־MongoDB.
הפרויקט כולל הרשמה, התחברות והרשאות באמצעות JWT.

## הפעלה

1. התקנת הספריות:

```bash
npm install
```

2. יצירת קובץ .env בשורש הפרויקט:

```env
PORT=3001
MONGO_URL=your_mongodb_connection_string
JWT_SECRET=your_random_secret
```

3. הפעלת השרת:

```bash
npm start
```

כתובת בסיס: http://localhost:3001

## הרשמה

POST /users

Body בפורמט JSON:

```json
{
  "name": "Shira",
  "email": "shira@example.com",
  "password": "ExamplePass123"
}
```

שם: 2–100 תווים.
סיסמה: לפחות 6 תווים ועד 72 בתים בקידוד UTF-8.
האימייל חייב להיות תקין וייחודי.
אין לשלוח role. משתמש חדש נוצר בתפקיד USER.
הסיסמה נשמרת כ־bcrypt hash ואינה מוחזרת בתגובה.

בהצלחה: 201 עם פרטי המשתמש.
אימייל שכבר קיים: 409.

## התחברות

POST /users/login

```json
{
  "email": "shira@example.com",
  "password": "ExamplePass123"
}
```

בהצלחה מוחזר אובייקט עם token, התקף ל־24 שעות.
פרטי התחברות שגויים מחזירים 401.

## שליפת צעצועים

כל בקשות GET פתוחות ללא טוקן.

| שיטה | כתובת | תיאור |
|---|---|---|
| GET | /toys | רשימת צעצועים |
| GET | /toys?s=lego&category=building | חיפוש וסינון משולבים |
| GET | /toys/search?s=lego | חיפוש בשם או בתיאור |
| GET | /toys/category/building | סינון לפי קטגוריה |
| GET | /toys/single/TOY_ID | צעצוע בודד כאובייקט |
| GET | /toys/count | מספר הצעצועים, בפורמט {"count":12} |
| GET | /toys/prices?min=10&max=40 | סינון לפי מחיר, כולל הגבולות |

יש להחליף TOY_ID במזהה צעצוע אמיתי.

רשימות מחזירות עד 10 צעצועים בכל עמוד.
skip הוא מספר עמוד שמתחיל ב־0:

- /toys?skip=0 — עשרת הראשונים.
- /toys?skip=1 — עשרת הבאים.

אפשר להוסיף skip גם לחיפוש, לקטגוריה ולמחירים.
ברירת המחדל היא 0.
הצעצועים ממוינים לפי _id בסדר יורד.

## הוספת צעצוע

POST /toys

Headers:

```text
Content-Type: application/json
x-api-key: YOUR_TOKEN
```

יש להחליף YOUR_TOKEN בטוקן שהתקבל בהתחברות.

Body:

```json
{
  "name": "Lego City",
  "info": "Building blocks for children",
  "category": "building",
  "img_url": "",
  "price": 120
}
```

חובה לשלוח name, info, category ו־price.
name ו־category: בין 2 ל־100 תווים.
info: בין 2 ל־500 תווים.
price: בין 1 ל־999.
img_url אופציונלי: כתובת HTTP/HTTPS או מחרוזת ריקה.

אין לשלוח user_id או תאריכים.
השרת קובע את user_id לפי הטוקן.
createdAt ו־updatedAt נוצרים אוטומטית.

בהצלחה: 201 עם הצעצוע שנוצר.

## עריכת צעצוע

PUT /toys/TOY_ID

יש לשלוח x-api-key ואותו מבנה Body של הוספת צעצוע,
כולל כל שדות החובה.

רק המשתמש שיצר את הצעצוע יכול לערוך אותו.
בהצלחה מוחזר הצעצוע המעודכן.

## מחיקת צעצוע

DELETE /toys/TOY_ID

יש לשלוח x-api-key. אין צורך ב־Body.

רק המשתמש שיצר את הצעצוע יכול למחוק אותו.

## שגיאות

- 400 — נתונים, מזהה או פרמטרים לא תקינים.
- 401 — טוקן חסר, לא תקין, שפג תוקפו, או פרטי התחברות שגויים.
- 404 — כתובת או צעצוע שלא נמצאו; בעריכה ובמחיקה גם צעצוע שאינו שייך למשתמש.
- 409 — אימייל שכבר רשום.
- 500 — שגיאת שרת.

אין להעלות ל־GitHub את .env או את node_modules.