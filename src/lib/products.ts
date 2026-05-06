export interface Product {
  id: number;
  name: string;
  category: string;
}

export const PRODUCTS: Product[] = [
  { id: 1, name: "קפה - טסטר צ'וייס אדום", category: "קפה" },
  { id: 2, name: "קפה - טסטר צ'וייס ירוק - נטול", category: "קפה" },
  { id: 3, name: "קפה - טורקי 200 גר'", category: "קפה" },
  { id: 4, name: "קפה - עם הל 100 גרם", category: "קפה" },
  { id: 5, name: "קפה - נס קפה עלית 200 גר'", category: "קפה" },
  { id: 6, name: "שוקו - שוקולית 500 גר'", category: "שוקו" },
  { id: 7, name: "תה - ארל גריי", category: "תה" },
  { id: 8, name: "תה - נענע גרין קטן", category: "תה" },
  { id: 9, name: "תה - לימונענע", category: "תה" },
  { id: 10, name: "תה - קמומיל", category: "תה" },
  { id: 11, name: "תה - הילולי פירות", category: "תה" },
  { id: 12, name: "תה - לימונית ולואיזה", category: "תה" },
  { id: 13, name: "חלב רגיל 3%", category: "חלב" },
  { id: 14, name: "חלב רגיל 1%", category: "חלב" },
  { id: 15, name: "חלב סויה דל", category: "חלב" },
  { id: 16, name: "חלב שיבולת שועל", category: "חלב" },
  { id: 17, name: "חלב שקדים", category: "חלב" },
  { id: 18, name: "תה - תפוח וקינמון", category: "תה" },
  { id: 19, name: "תה - פסיפלורה מנגו", category: "תה" },
  { id: 20, name: "תה - קינמון", category: "תה" },
  { id: 21, name: "תה - חמדת השקד", category: "תה" },
  { id: 22, name: "תה - ליפטון 100 יח' מעטפה", category: "תה" },
  { id: 23, name: "סוכר - 1 ק\"ג", category: "סוכר" },
  { id: 24, name: "סוכרלוז שקיות", category: "סוכר" },
  { id: 25, name: "סוכרלוז פטנט", category: "סוכר" },
  { id: 26, name: "קטשופ", category: "ממרחים ותוספות" },
  { id: 27, name: "טחינה מעודנת / שומשום לחיץ", category: "ממרחים ותוספות" },
  { id: 28, name: "נשנושי קרקר מלוח 300 גרם", category: "חטיפים" },
  { id: 29, name: "בייגלה שטוחים 300 גרם", category: "חטיפים" },
  { id: 30, name: "חטיף בריאות אנרג'י", category: "חטיפים" },
  { id: 31, name: "וופל עלית 500 גרם", category: "חטיפים" },
  { id: 32, name: "חטיף בוטנים/שומשום/קוקוס אישי מארז 28 יח'", category: "חטיפים" },
  { id: 33, name: "חלבה מנות 240 יח' (ללא גלוטן)", category: "חטיפים" },
  { id: 34, name: "כוסות פלסטיק", category: "כלים חד פעמיים" },
  { id: 35, name: "צלחת", category: "כלים חד פעמיים" },
  { id: 36, name: "מזלג", category: "כלים חד פעמיים" },
  { id: 37, name: "סכין", category: "כלים חד פעמיים" },
  { id: 38, name: "כפית", category: "כלים חד פעמיים" },
  { id: 39, name: "לחם אחיד פרוס", category: "מזון" },
  { id: 40, name: "קורנפלקס 850 גרם", category: "מזון" },
  { id: 41, name: "פריכיות 250 גרם", category: "מזון" },
  { id: 42, name: "גבינה לבנה תנובה 250 גרם", category: "מוצרי חלב" },
  { id: 43, name: "ממרח שוקולד שחר מגדים 400 גר'", category: "ממרחים ותוספות" },
  { id: 44, name: "תפוחים אדום 1 קג", category: "פירות" },
];

export const CATEGORIES = [...new Set(PRODUCTS.map((p) => p.category))];
