# ShopKit — Full-Stack E-Commerce Starter

MERN stack scaffold: **React + Vite + Tailwind** on the front, **Express + MongoDB + JWT** on the back.

---

## 1. Folder Structure

```
shopkit/
├── server/                        # Express REST API
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js              # Mongoose connection
│   │   ├── models/
│   │   │   ├── User.js            # + bcrypt pre-save hook, matchPassword()
│   │   │   └── Product.js         # name, price, category, image, stock
│   │   ├── controllers/
│   │   │   ├── authController.js  # register, login, me
│   │   │   └── productController.js
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js  # protect (JWT), admin (role gate)
│   │   │   └── errorMiddleware.js # notFound + central error handler
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   └── productRoutes.js
│   │   ├── utils/
│   │   │   └── generateToken.js
│   │   ├── app.js                 # express app: middleware + route mounting
│   │   └── server.js              # entry point: env check, DB, listen
│   ├── .env.example
│   ├── .gitignore
│   └── package.json
│
└── client/                        # React SPA
    ├── src/
    │   ├── api/
    │   │   └── axios.js           # base instance + JWT interceptor
    │   ├── components/
    │   │   ├── Navbar.jsx
    │   │   ├── ProductCard.jsx    # "Add to Cart" button lives here
    │   │   └── CartDrawer.jsx
    │   ├── context/
    │   │   └── CartContext.jsx    # useReducer + localStorage persistence
    │   ├── pages/
    │   │   └── ProductsPage.jsx   # search / filter / sort / paginate
    │   ├── utils/
    │   │   └── format.js
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css              # Tailwind entry
    ├── index.html
    ├── vite.config.js             # /api proxy → localhost:5000
    ├── postcss.config.js
    ├── .env.example
    ├── .gitignore
    └── package.json
```

---

## 2. Prerequisites

| Tool    | Version | Check with       |
| ------- | ------- | ---------------- |
| Node.js | ≥ 18    | `node -v`        |
| npm     | ≥ 9     | `npm -v`         |
| MongoDB | ≥ 6     | local or Atlas   |

MongoDB options:

- **Local** — install MongoDB Community Server, then `mongod` must be running.
- **Atlas (free, no install)** — create a cluster at mongodb.com/atlas, add your IP under Network Access, and copy the connection string.

---

## 3. Environment Variables — Step by Step

### Step 3.1 — Server `.env`

```bash
cd server
cp .env.example .env
```

Open `server/.env` and fill it in:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/shopkit
JWT_SECRET=<paste a long random string here>
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

Generate a real secret (do not ship the placeholder):

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Using Atlas instead of local Mongo? Replace `MONGO_URI` with:

```
mongodb+srv://<user>:<password>@<cluster>.mongodb.net/shopkit?retryWrites=true&w=majority
```

> If your Atlas password contains `@ : / ?` etc., URL-encode it — otherwise the connection string parses wrong.

### Step 3.2 — Client `.env`

```bash
cd ../client
cp .env.example .env
```

```env
VITE_API_URL=/api
```

Leave it as `/api` in development — Vite proxies `/api` to `http://localhost:5000`, so there are no CORS preflights while you work. For production, set the full API origin (e.g. `https://api.yourdomain.com/api`).

> Vite only exposes variables prefixed with `VITE_` to browser code. That is deliberate — never put a secret in a client `.env`.

---

## 4. Install & Run

Use **two terminals**.

**Terminal 1 — API**

```bash
cd server
npm install
npm run dev
```

→ `API running in development mode on http://localhost:5000`

Verify: `curl http://localhost:5000/api/health`

**Terminal 2 — Frontend**

```bash
cd client
npm install
npm run dev
```

→ open http://localhost:5173

The product grid will be empty until you create products — see §6.

---

## 5. API Reference

Base URL: `http://localhost:5000/api`

### Auth

| Method | Endpoint         | Access  | Body                       |
| ------ | ---------------- | ------- | -------------------------- |
| POST   | `/auth/register` | Public  | `{ name, email, password }` |
| POST   | `/auth/login`    | Public  | `{ email, password }`      |
| GET    | `/auth/me`       | Private | —                          |

Both register and login return:

```json
{
  "user": { "_id": "...", "name": "...", "email": "...", "role": "user" },
  "token": "eyJhbGciOi..."
}
```

### Products

| Method | Endpoint               | Access  | Notes                                  |
| ------ | ---------------------- | ------- | -------------------------------------- |
| GET    | `/products`            | Public  | `?keyword&category&minPrice&maxPrice&sort&page&limit` |
| GET    | `/products/categories` | Public  | distinct category list                 |
| GET    | `/products/:id`        | Public  | single product                         |
| POST   | `/products`            | Private | requires `Authorization: Bearer <token>` |

`GET /products` responds with `{ products, page, pages, total }`.

---

## 6. Quick Smoke Test

```bash
# 1. Register — copy the "token" from the response
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Asif","email":"asif@example.com","password":"secret123"}'

# 2. Create a product (paste your token)
curl -X POST http://localhost:5000/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
        "name":"Wireless Headphones",
        "description":"Over-ear, 40h battery",
        "price":129.99,
        "category":"electronics",
        "image":"https://picsum.photos/seed/headphones/600",
        "stock":24
      }'

# 3. List products
curl http://localhost:5000/api/products
```

Refresh http://localhost:5173 — the product appears and **Add to Cart** works.

---

## 7. How the Cart Works

`CartContext.jsx` wraps the app in `main.jsx`. Any component calls:

```jsx
import { useCart } from '../context/CartContext.jsx';

const { items, totalItems, subtotal, addToCart, setQty, removeFromCart, clearCart } = useCart();
```

Design notes:

- **`useReducer`, not `useState`** — add / update-quantity / remove / clear are four related transitions on one array. A reducer keeps them in one auditable place.
- **Stock is capped in the reducer**, not the button. A UI guard alone would be bypassed by a stale render.
- **Persisted to `localStorage`** on every change and rehydrated on mount, wrapped in `try/catch` — private-browsing mode throws on write.
- **Product fields are denormalised into the cart item** so the drawer renders correctly even before the product list has loaded.

---

## 8. Security Notes

Things this scaffold does right, worth keeping as you build:

- Passwords are hashed with bcrypt (10 salt rounds) in a `pre('save')` hook guarded by `isModified`, so profile updates don't double-hash.
- `password` has `select: false` — it never leaks through a stray `res.json(user)`.
- Login returns the **same** error for unknown email and wrong password, so the endpoint can't be used to enumerate registered users.
- `protect` re-fetches the user on every request — a deleted or demoted account loses access immediately instead of at token expiry.
- Error stacks are suppressed when `NODE_ENV=production`.

Before going live, add: rate limiting on `/auth/*` (`express-rate-limit`), `helmet`, input validation (`zod` or `express-validator`), and move the JWT to an httpOnly cookie if you want XSS-resistant sessions.

---

## 9. Deploying

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** — MongoDB Atlas + Render, free tier, start to finish.

Quick seed for a fresh database (local or Atlas, whichever `server/.env` points at):

```bash
cd server
npm run seed          # 8 demo products + an admin user
npm run seed -- --wipe  # clear products first
```

---

## 10. Natural Next Steps

1. `POST /api/products` is open to any logged-in user. Lock it down by changing one line in `routes/productRoutes.js`:
   ```js
   router.route('/').get(getProducts).post(protect, admin, createProduct);
   ```
2. Add `Order` model + `POST /api/orders` and wire the Checkout button.
3. Add `react-router-dom` for `/`, `/product/:id`, `/cart`, `/login`.
4. Add an `AuthContext` mirroring `CartContext` for login state.
5. Add a `seed.js` script to bulk-load sample products.
