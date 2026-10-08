# TutorConnect Backend

Complete Node.js + Express + MongoDB backend for the **TutorConnect** offline tuition platform.

## Features

- ✅ JWT Authentication (Student & Teacher)
- ✅ Teacher registration with extra fields (degree, subjects, fee, location, etc.)
- ✅ Teachers listing with advanced filters (state, district, city, subject, fee range, experience)
- ✅ Teacher profile + ratings & reviews
- ✅ Connection requests (student → teacher)
- ✅ Email notifications via Nodemailer
- ✅ Protected routes & role-based access
- ✅ Seed script with demo data

## Tech Stack

- Node.js + Express
- MongoDB + Mongoose
- JWT + bcryptjs
- Nodemailer
- express-validator

## Quick Start

### 1. Install dependencies

```bash
cd backend
npm install
```

### 2. Setup environment

```bash
cp .env.example .env
```

Edit `.env` and set:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/tutorconnect
JWT_SECRET=any_long_random_string_here
JWT_EXPIRE=7d

# For real emails (optional for testing)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password
EMAIL_FROM=TutorConnect <your_gmail@gmail.com>

# Razorpay Test Mode (required for accepting more than one request)
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_razorpay_test_secret
ADMIN_EMAIL=admin@tutorconnect.com

CLIENT_URL=http://localhost:5173
```

> **Gmail App Password**: Google Account → Security → 2-Step Verification → App passwords

### 3. Start MongoDB

Make sure MongoDB is running locally, or use MongoDB Atlas and paste the connection string in `MONGO_URI`.

### 4. Seed demo data (optional but recommended)

```bash
npm run seed
```

Demo accounts created:
- **Teacher**: `rahul.sharma@demo.com` / `password123`
- **Student**: `student@demo.com` / `password123`

### 5. Run the server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

Server runs at: **http://localhost:5000**

---

## API Endpoints

### Auth
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/auth/register` | Public | Register student or teacher |
| POST | `/api/auth/login` | Public | Login |
| GET | `/api/auth/me` | Private | Get current user |
| PUT | `/api/auth/profile` | Private | Update profile |

Teachers accepting a second or later request are sent through Razorpay Test Mode for the configured platform fee. Add `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` to `.env` before testing this flow.

### Teachers
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/teachers` | Public | List teachers (with filters) |
| GET | `/api/teachers/featured` | Public | Top rated teachers |
| GET | `/api/teachers/:id` | Public | Single teacher |
| POST | `/api/teachers/:id/rate` | Student | Add rating/review |
| GET | `/api/teachers/stats/overview` | Public | Platform stats |

### Contact / Connections
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/contact` | Student | Send connection request + email |
| GET | `/api/contact/my-requests` | Private | Get my connection requests |
| PUT | `/api/contact/:id/status` | Teacher | Accept / Reject request |

---

## Example Filter Query

```
GET /api/teachers?state=Maharashtra&city=Andheri&subject=Mathematics&minFee=300&maxFee=700&page=1&limit=12
```

## Connect Frontend

In your frontend `.env` (or `src/api/axios.js`):

```
VITE_API_URL=http://localhost:5000/api
```

---

## Project Structure

```
backend/
├── models/
│   ├── User.js
│   └── Connection.js
├── routes/
│   ├── auth.js
│   ├── teachers.js
│   └── contact.js
├── middleware/
│   └── auth.js
├── utils/
│   ├── sendEmail.js
│   └── seed.js
├── server.js
├── package.json
├── .env.example
└── README.md
```

Happy coding! 🚀
