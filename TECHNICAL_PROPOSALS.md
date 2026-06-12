# Τεχνικές Προτάσεις Βελτίωσης — UniBite

## 🔴 Κρίσιμα (Ασφάλεια)
1. **Hashing κωδικών (bcrypt)** — Plaintext passwords → bcrypt hash
2. **Session Management (JWT)** — Frontend-only auth → Backend middleware
3. **Admin Authorization** — Unprotected admin endpoints → requireAdmin middleware
4. **Input Validation & XSS** — DOMPurify + express-validator

## 🟡 Σημαντικά (Αρχιτεκτονική)
5. **Διαγραφή νεκρών αρχείων** — 10 παλιά Releaf components
6. **Αποφυγή διπλού review** — UNIQUE constraint στο reviews table
7. **Αποφυγή αρνητικών credits** — CHECK constraint + server-side guard
8. **Modular Backend (Router)** — Σπάσιμο server.js σε routes/

## 🟢 Χρήσιμα (UX & Features)
9. **Geolocation API** — Κουμπί "Εντόπισέ με"
10. **Click-on-Map** — Επιλογή τοποθεσίας στον χάρτη
11. **Real-time Notifications (WebSocket)**
12. **Photo Upload (Multer)**
13. **Φίλτρο αλλεργιογόνων στο Feed UI**
14. **Responsive Feed (Mobile)**

## 🔵 Τεχνικό Χρέος
15. **Cron job λήξης αγγελιών (48h)**
16. **`.env` configuration**
17. **Structured Logging (Winston/Morgan)**
