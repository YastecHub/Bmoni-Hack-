# AKOKA — The Intelligence Layer for Campus Commerce (UNILAG)

> **Hackathon MVP Concept & Technical Implementation**  
> Initial Market: University of Lagos (UNILAG) & Akoka Campus Axis  
> Core Promise: Compare prices, find trustworthy providers, and document transactions with clear expectations.

---

## 1. Project Organization

This repository is structured into two dedicated workspaces:

```text
Bmoni-Hack-/
├── akoka-frontend/         # SvelteKit 3 / Svelte 5 + Tailwind CSS v4 frontend
│   ├── src/                # Public discovery, compare, transactions & portals
│   ├── .env                # Configured with PUBLIC_API_BASE_URL=http://localhost:5000/api
│   └── package.json        # Frontend scripts and dependencies
│
├── akoka-backend/          # Node.js + Express + TypeScript + MongoDB backend API
│   ├── src/
│   │   ├── db/             # MongoDB connection (serverless cached) & Mongoose models
│   │   ├── middleware/     # JWT cookie auth & secure evidence upload
│   │   ├── routes/         # Auth, Categories, Listings, Vendors, Insights, Transactions, Payments, Admin
│   │   ├── services/       # Price intelligence engine & transaction state machine
│   │   └── server.ts       # Express server entry point
│   ├── api/index.ts        # Vercel Serverless Function entry point
│   ├── vercel.json         # Vercel routing configuration
│   ├── uploads/            # Evidence attachments storage
│   ├── .env                # Server configuration (PORT=5000, MONGODB_URI, JWT_SECRET, etc.)
│   └── package.json        # Backend scripts and dependencies
│
├── package.json            # Root monorepo orchestration scripts
└── README.md               # Main project documentation
```

---

## 2. Quick Start (Local Development)

### Prerequisites
- Node.js `v22.x` and `npm`
- MongoDB (Local instance or MongoDB Atlas connection string)

### Step 1: Configure Backend Environment
In `akoka-backend/.env`:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/akoka
# Or MongoDB Atlas: mongodb+srv://<username>:<password>@cluster0.xxx.mongodb.net/akoka?retryWrites=true&w=majority
FRONTEND_URLS=http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173
JWT_SECRET=akoka_super_secret_jwt_key_unilag_2026_hackathon
COOKIE_SECRET=akoka_super_secret_cookie_key_unilag
PAYMENT_MODE=simulated
```

### Step 2: Start the Backend API
```bash
cd akoka-backend
npm install
npm run dev
```
The backend starts on `http://localhost:5000`. On first connection, it automatically connects to MongoDB and seeds realistic UNILAG campus providers, categories, price observations, and transactions.

### Step 3: Start the Frontend App
```bash
cd akoka-frontend
npm install
npm run dev
```
The frontend starts on `http://localhost:5173`.

Alternatively, from the repository root:
```bash
npm run dev:backend     # Runs backend on port 5000
npm run dev:frontend    # Runs frontend on port 5173
```

---

## 3. Deploying to Vercel

Both the frontend and backend are pre-configured for seamless deployment to Vercel.

### Option A: Two Vercel Projects (Recommended)

#### 1. Deploy the Backend (`akoka-backend`)
1. On the Vercel Dashboard, click **Add New** → **Project**.
2. Select the repository and set **Root Directory** to `akoka-backend`.
3. Framework Preset: **Other**.
4. In **Environment Variables**, add:
   - `MONGODB_URI`: `mongodb+srv://<user>:<password>@cluster0.xxx.mongodb.net/akoka?retryWrites=true&w=majority`
   - `JWT_SECRET`: your secret string
   - `COOKIE_SECRET`: your cookie secret string
   - `NODE_ENV`: `production`
   - `PAYMENT_MODE`: `simulated`
   - `FRONTEND_URLS`: `https://your-akoka-frontend.vercel.app` (or leave default; Vercel URLs are automatically allowed)
5. Click **Deploy**. Note the assigned backend URL (e.g. `https://akoka-backend.vercel.app`).

#### 2. Deploy the Frontend (`akoka-frontend`)
1. On Vercel, click **Add New** → **Project**.
2. Select the repository and set **Root Directory** to `akoka-frontend`.
3. Framework Preset: **SvelteKit** (detected automatically).
4. In **Environment Variables**, add:
   - `PUBLIC_API_BASE_URL`: `https://akoka-backend.vercel.app/api` (using your backend URL from step 1)
5. Click **Deploy**.

---

## 4. Seeded Demo Accounts (Pre-loaded)

To test the application across all roles during hackathon evaluation:

| Role | Email | Password | Details |
| :--- | :--- | :--- | :--- |
| **Student** | `student@unilag.edu.ng` | `password123` | Tunde Bakare (New Hall) — can compare prices, submit observations, draft agreements, and sign off deliverables |
| **Student** | `chioma@unilag.edu.ng` | `password123` | Chioma Eze (Moremi / Amina Hall) |
| **Vendor** | `vendor@unilag.edu.ng` | `password123` | Madam Ngozi (Finbarr & CITS Academic Print Hub) — can manage listings, update milestones, and submit deliverable evidence |
| **Vendor (Tech)** | `repairs@unilag.edu.ng` | `password123` | Engr. Segun Adeyemi (New Hall Tech Clinic) |
| **Vendor (Laundry)**| `laundry@unilag.edu.ng` | `password123` | Ibrahim Bello (Akoka Swift Wash & Dry Depot) |
| **Admin** | `admin@akoka.unilag.edu.ng` | `admin123` | Campus Trust & Safety Desk — can audit incoming price observations, resolve reports, and inspect disputes |

---

## 5. Key Architectural Implementations

### Price Intelligence Engine (Section 7 of Spec)
- **Comparability:** Normalizes pricing for like-for-like specifications (e.g., A4 Monochrome 80gsm vs. Full Colour Plate vs. Hardcover Gold Embossing).
- **Explainable Confidence Indicator:**
  - `High`: $\ge 5$ observations within 14 days and coefficient of variation $\le 25\%$ with vendor/receipt confirmation.
  - `Moderate`: $\ge 3$ observations within 30 days and coefficient of variation $\le 40\%$.
  - `Low`: Wide price disparity or older data.
  - `Insufficient Data`: $< 3$ observations (median and range are withheld to avoid inventing unverified claims).
- **Trend Detection:** Evaluates chronological price dispersion and labels movement (`stable`, `increasing`, `decreasing`, `volatile`).

### Protected Transaction State Machine (Section 8 of Spec)
```text
[Draft] ──> [Awaiting Agreement] ──> [Agreed] ──> [In Progress] ──> [Awaiting Confirmation] ──> [Completed]
                     │                    │              │                      │
                     └── [Cancelled]      └──────────────┴──────────────────────┴──> [Disputed]
```
- **Mutual Agreement:** Price, deliverables, turnaround description, and cancellation terms are documented before payment.
- **Evidence Attachments:** Vendors upload JPG/PNG/PDF proofs (up to 10MB) before requesting student sign-off.
- **Simulated Payment Gateway:** Conforms to the BMONI Nigeria API integration pattern. Generates a secure checkout session URL that updates transaction state upon verification callback.

### Campus Safety & Moderation Desk (Section 11 of Spec)
- User submissions enter a pending moderation queue before affecting trusted public price medians.
- Reports against listings, transactions, or reviews are triaged by administrators with resolution tracking.

---

## 6. API Reference Summary

All routes are mounted under `/api` (and at root `/`):

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Session login with HTTP-only cookie | None |
| `POST` | `/api/auth/register` | Register student or vendor account | None |
| `GET` | `/api/auth/me` | Fetch active authenticated user | Yes |
| `POST` | `/api/auth/logout` | Clear session cookie | Yes |
| `GET` | `/api/categories` | List active campus categories | None |
| `GET` | `/api/listings` | Filter listings by category, zone, price, query | None |
| `POST` | `/api/listings` | Vendor creates new offer | Vendor |
| `PATCH`| `/api/listings/:id` | Vendor updates listing | Vendor (Owner) |
| `GET` | `/api/vendors` | List campus vendor profiles | None |
| `GET` | `/api/vendors/:id` | Vendor profile + listings + reviews | None |
| `GET` | `/api/price-insights` | Calculate benchmark, range, and confidence | None |
| `GET` | `/api/price-observations`| Fetch verified observations | None |
| `POST` | `/api/price-observations`| Submit new campus price | Authenticated |
| `GET` | `/api/transactions` | List scoped user agreements | Authenticated |
| `POST` | `/api/transactions` | Student drafts transaction agreement | Student |
| `GET` | `/api/transactions/:id` | Get agreement details & milestone progress | Parties / Admin |
| `PATCH`| `/api/transactions/:id/agreement` | Transition agreement status | Parties / Admin |
| `PATCH`| `/api/transactions/:id/milestones/:id` | Toggle milestone completion | Vendor |
| `POST` | `/api/transactions/:id/evidence` | Upload deliverable evidence (multipart) | Vendor |
| `POST` | `/api/transactions/:id/review` | Submit verified review on completion | Buyer |
| `POST` | `/api/payments/checkout` | Create payment checkout session | Buyer |
| `GET` | `/api/payments/:id` | Check verified payment status | Authenticated |
| `POST` | `/api/reports` | Report listing, review, or dispute | Authenticated |
| `GET` | `/api/admin/moderation-queue` | Admin audit queue | Admin |
| `PATCH`| `/api/admin/moderation-queue/observation/:id` | Verify/reject price observation | Admin |
| `PATCH`| `/api/admin/moderation-queue/report/:id` | Resolve/dismiss report | Admin |
