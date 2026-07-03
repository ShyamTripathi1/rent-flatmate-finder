# Rent & Flatmate Finder

A comprehensive full-stack web application designed to connect people looking for rooms (Tenants) with people offering rooms (Owners), complete with matchmaking compatibility, real-time chat, and an administrative dashboard.

## 🌟 Project Overview

Rent & Flatmate Finder streamlines the process of finding the perfect living situation. It features a modern, glassmorphic UI, robust role-based authentication, and a real-time messaging system. 

**Key Features:**
- **Role-Based Portals:** Dedicated dashboards for Tenants, Owners, and Admins.
- **Cascading Location Filtering:** Precision location searching using a comprehensive list of all Indian States and Districts.
- **Smart Matchmaking:** AI-inspired compatibility scoring based on tenant preferences and listing details.
- **Real-Time Chat:** Integrated instant messaging using WebSockets for owners and tenants to communicate.
- **Admin Dashboard:** Total platform oversight to manage users, monitor listings, and view system statistics.

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 18
- **Build Tool:** Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS (with custom Glassmorphism designs)
- **Icons:** Lucide React
- **Real-Time Communication:** Socket.IO Client

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Language:** TypeScript
- **Database ORM:** Prisma
- **Database:** SQLite (Development)
- **Real-Time Communication:** Socket.IO
- **Authentication:** JSON Web Tokens (JWT) & bcryptjs

---

## 🔄 Project Flow

1. **Onboarding & Authentication:** Users sign up as either a `TENANT` or an `OWNER`. Authentication is handled securely via JWT.
2. **Owner Workflow:** 
   - Owners can post new room listings (Single, Shared, Studio) with details like rent, amenities, and available dates.
   - They can view incoming "Interests" from tenants and choose to Accept or Decline them.
   - Once a room is occupied, owners can toggle it to "Mark Filled" to hide it from searches, and "Mark Active" to list it again.
3. **Tenant Workflow:**
   - Tenants configure their lifestyle preferences, budget, and desired location (State & District).
   - They browse available listings, sorted by a unique compatibility score.
   - Tenants express interest in listings they like.
4. **Communication:** Once an owner accepts a tenant's interest, a private real-time chat room is unlocked for them to discuss terms and arrange viewings.
5. **Administration:** `ADMIN` users can monitor platform health, delete inappropriate listings, and manage user accounts through a dedicated, secure control panel.

---

## 🚀 How to Install

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- Git

### 1. Clone the repository
\`\`\`bash
git clone <repository-url>
cd rent-flatmate-finder
\`\`\`

### 2. Backend Setup
\`\`\`bash
cd backend
npm install

# Setup Environment Variables
# Create a .env file in the backend directory with the following:
# JWT_SECRET=your_super_secret_key_here
# DATABASE_URL="file:./dev.db"

# Initialize the Database
npm run prisma:push
\`\`\`

### 3. Frontend Setup
\`\`\`bash
cd ../frontend
npm install

# Setup Environment Variables
# Create a .env file in the frontend directory with the following:
# VITE_API_URL=http://localhost:5000/api
# VITE_SOCKET_URL=http://localhost:5000
\`\`\`

---

## 💻 How to Run

### Option 1: Using the Batch Script (Windows Only)
From the root directory of the project, simply double-click the \`start.bat\` file, or run it in your terminal:
\`\`\`cmd
start.bat
\`\`\`
This will automatically launch both the Backend and Frontend servers in separate command windows.

### Option 2: Manual Start

**Start the Backend (Terminal 1):**
\`\`\`bash
cd backend
npm run dev
\`\`\`
*(Runs on http://localhost:5000)*

**Start the Frontend (Terminal 2):**
\`\`\`bash
cd frontend
npm run dev
\`\`\`
*(Runs on http://localhost:5173)*

Open your browser and navigate to \`http://localhost:5173\` to view the application!

---

## 📋 Available Commands

**Backend:**
- \`npm run dev\` - Starts the development server with hot-reload.
- `npm run dev` - Starts the development server with hot-reload.
- `npm run build` - Compiles TypeScript code to JavaScript.
- `npm start` - Runs the compiled JavaScript production server.
- `npm run prisma:push` - Pushes the Prisma schema state to the database.
- `npm run prisma:generate` - Generates Prisma Client.

**Frontend:**
- `npm run dev` - Starts the Vite development server.
- `npm run build` - Builds the frontend for production.
- `npm run preview` - Locally previews the production build.
- `npm run lint` - Runs the linter to catch code issues.

---

## 🔐 Test Accounts

If you have seeded the database (which runs automatically on first setup or via `npm run prisma:seed` in the backend), you can use the following default test accounts to explore the different dashboards:

**Admin Account:**
- **Email:** admin@flatmatefinder.com
- **Password:** AdminPassword123!

**Owner Account:**
- **Email:** owner@flatmatefinder.com
- **Password:** Password123!

**Tenant Account:**
- **Email:** tenant@flatmatefinder.com
- **Password:** Password123!

---

## 🌐 Hosted Application URL

*Hosted deployment URL goes here (e.g., Vercel / Render / Railway).*
**URL:** `https://your-deployment-url.com`

---

## 🔌 API Documentation (Summary)

**Authentication:**
- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login and receive JWT

**Listings (Owner):**
- `POST /` - Create a new room listing
- `GET /` - Get all listings (Admin/Tenant) or own listings (Owner)
- `PUT /:id/status` - Mark a listing as filled/active

**Profiles (Tenant):**
- `PUT /tenant/profile` - Create/Update tenant preferences
- `GET /tenant/profile` - Get current tenant profile

**Interest & Compatibility:**
- `POST /listing/:listingId/interest` - Tenant sends interest (triggers compatibility scoring)
- `GET /interests/received` - Owner views incoming interests with AI compatibility score
- `PUT /interest/:id/status` - Owner accepts/declines interest

**Chat (WebSocket):**
- Handled via `socket.io` namespace upon accepted interest.

---

## 🗄️ Database Schema

The primary models are managed by Prisma ORM:

- **User:** Manages auth and roles (`TENANT`, `OWNER`, `ADMIN`).
- **TenantProfile:** 1-to-1 with User. Stores budget, location preference, move-in date.
- **RoomListing:** 1-to-many with User (Owner). Stores rent, location, status (`ACTIVE`, `FILLED`), photos.
- **Interest:** Tracks a Tenant's request on a RoomListing. Status (`PENDING`, `ACCEPTED`, `DECLINED`).
- **CompatibilityScore:** Stores the AI-generated score and explanation for a Tenant-Listing pair to prevent recomputation.
- **ChatMessage:** Stores messages sent in real-time chat between an Owner and Tenant.
- **NotificationLog:** Tracks email notifications sent (and failures).

---

## 🤖 LLM Integration & Example I/O

The application uses an AI compatibility engine to score a tenant against a room listing. If the LLM is unavailable, it falls back to a deterministic rule-based algorithm.

**LLM Prompt Used:**
```text
Given this room listing: {"location":"Mumbai, Maharashtra","rent":15000,"availableFrom":"2023-11-01","roomType":"Shared","furnishingStatus":"Furnished","description":"Cozy room near station"}
and this tenant profile: {"preferredLocation":"Mumbai, Maharashtra","budgetMin":10000,"budgetMax":18000,"moveInDate":"2023-10-15","lifestyleNotes":"Quiet, non-smoker"}
Compute a compatibility score from 0 to 100 based on budget and location match.
Return JSON: { "score": number, "explanation": string }. Note: All currency numbers are in Indian Rupees (₹), please use Rupees (₹) in the explanation.
```

**Example LLM Output:**
```json
{
  "score": 95,
  "explanation": "Excellent match! The listing's rent of ₹15,000 falls perfectly within the tenant's budget of ₹10,000 to ₹18,000. Both are in Mumbai, Maharashtra, ensuring location compatibility."
}
```
