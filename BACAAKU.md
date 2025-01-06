# Chatbot App Setup Guide

**by Fathi**

Proyek ini adalah aplikasi chatbot berbasis React menggunakan **Tailwind CSS** 
untuk desain responsif dan **lucide-react** untuk ikon.

---

## 📋 Persyaratan

Pastikan Anda telah menginstal perangkat lunak berikut:
- **Node.js** (disarankan versi terbaru)
- **npm** atau **yarn** (disertakan dengan Node.js)
- **Visual Studio Code** (editor pilihan)
- **pastikan memiliki Database dengan nama rolegpt_db (MySql)** (untuk isi db akan terbuat otomatis)
---

## 🚀 Langkah-Langkah Instalasi

### 1. **Clone Repository**
Clone repository ini ke komputer lokal Anda:

```bash
git clone <URL-REPOSITORY-ANDA>
cd <NAMA-DIREKTORI-PROYEK>
```

### 2. **Struktur Proyek**
```
ROLEGPTUI/
├── backend/
│   ├── node_modules/
│   ├── ashgpt.js
│   ├── database.js
│   ├── package-lock.json
│   ├── package.json
│   └── server.js
├── node_modules/
├── public/
├── src/
│   ├── pages/
│   │   ├── tampilan.js
│   ├── services/
│   │   └── api.js
│   ├── App.css
│   ├── App.js
│   ├── App.test.js
│   ├── index.css
│   ├── index.js
│   ├── logo.svg
│   ├── reportWebVitals.js
│   ├── setupProxy.js
│   └── setupTests.js
├── .gitignore
├── BACAAKU.md
├── package-lock.json
├── package.json
├── README.md
└── tailwind.config.js
```

### 3. **Pasang Dependensi dan cara menjalankan proyek**
Pasang semua dependensi utama dan tambahan:

```bash
- **pada cmd ketika sudah ada berada di direktori program lakukan**
cd backend
npm install

- **jika sudah terinstall node modules nya kembali ke path awal**
cd..

- **lalu lakukan**
npm install
npm run dev

```

### 4. **Jalankan Proyek**
Gunakan perintah berikut untuk menjalankan proyek di localhost:

```bash
-npm start --Menjalankan React frontend menggunakan perintah react-scripts start, yaitu server pengembangan bawaan dari Create React App.

-npm run server --Menjalankan backend server dengan berpindah direktori ke folder backend dan menjalankan file server.js menggunakan Node.js 
(node server.js)

-npm run dev --Menjalankan React frontend dan Node.js backend secara paralel
```

Buka browser Anda dan akses: http://localhost:3000

---

## 🛠️ Fitur Opsional

### Plugin Tailwind CSS
Untuk fitur tambahan, seperti Form Control atau lainnya, Anda dapat menambahkan plugin Tailwind CSS.

**Contoh: Menambahkan Plugin Form Control**

1. Install Plugin:
```bash
npm install @tailwindcss/forms
```

2. Aktifkan Plugin di `tailwind.config.js`:
```javascript
plugins: [require('@tailwindcss/forms')],
```

---

## 🔧 Bantuan
Jika Anda menghadapi kendala saat setup atau menjalankan proyek ini, jangan ragu untuk menghubungi saya untuk bantuan lebih lanjut.