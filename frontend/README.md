# TutorConnect — Frontend

Offline tuition / tutorial provider platform built with **React + Vite + Tailwind CSS**.

## Features

- **Login / Sign Up** with role selection (Student / Teacher)
- Teacher signup includes: degree, subjects, experience, fee/hour, availability, location (state → district → city), bio
- **Home page** with hero slider, stats, how-it-works, featured teachers, CTA
- **Teachers page** with cascading location filters, subject, fee & experience filters + search
- **Teacher detail** page + “Connect” form (sends email notification via backend)
- **Dashboard** for both roles
- Dark mode toggle
- Fully responsive
- Demo data fallback when backend is offline

## Quick Start

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

## Environment

Create `.env` if needed:

```
VITE_API_URL=http://localhost:5000/api
```

## Project Structure

```
src/
├── api/axios.js          # Axios instance + interceptors
├── components/
│   ├── Navbar.jsx
│   ├── Footer.jsx
│   ├── HeroSlider.jsx
│   ├── TeacherCard.jsx
│   ├── FilterBar.jsx
│   └── ProtectedRoute.jsx
├── context/AuthContext.jsx
├── data/locations.js     # States / districts / cities + subjects
├── pages/
│   ├── Home.jsx
│   ├── Login.jsx
│   ├── Teachers.jsx
│   ├── TeacherDetail.jsx
│   └── Dashboard.jsx
├── App.jsx
├── main.jsx
└── index.css
```

## Backend Endpoints Expected

| Method | Endpoint              | Description                    |
|--------|-----------------------|--------------------------------|
| POST   | /api/auth/register    | Register student or teacher    |
| POST   | /api/auth/login       | Login                          |
| GET    | /api/teachers         | List teachers (with filters)   |
| GET    | /api/teachers/:id     | Single teacher                 |
| POST   | /api/contact          | Send connection request + email|
| GET    | /api/contact/my-requests | Teacher’s incoming requests |

## Next Step

Build the **MERN backend** (Express + MongoDB + JWT + Nodemailer) so auth, filters and email notifications work for real.
