# 🏫 IS216 Web Application Development II

---

## G4 Group 20

---

## Group Members

| Photo | Full Name | Role / Features Responsible For |
|:--:|:--|:--|
| <img src="photos/member1.jpg" width="80"> | ChatGPT + Claude | Our Bestfriend |
| <img src="photos/member2.jpg" width="80"> | Joshua Lim | Supreme Leader - Oversees project direction, architecture, and integration of the Profile and Dashboard features. |
| <img src="photos/member3.jpg" width="80"> | Jared Chan | Lead Backend Engineer - Develops and maintains backend logic for Auction Theatre and Management systems. |
| <img src="photos/member4.jpg" width="80"> | Javen Tan | UI/UX Designer - Designs user flows and interfaces for the Landing and Category pages, ensuring visual consistency and usability. |
| <img src="photos/member5.jpg" width="80"> | Kai Wen | Frontend Developer - Builds and refines the Auction Creation interface with responsive, user-friendly design. |
| <img src="photos/member6.jpg" width="80"> | Benedic Tan | Backend Engineer - Implements APIs and database logic for the Auction Creation module. |
| <img src="photos/member7.jpg" width="80"> | Jacob Soh | System Architect - Designs core system architecture, ensures seamless integration between frontend and backend, and maintains codebase scalability. |

> Place all headshot thumbnails in the `/photos` folder (JPEG or PNG).

---

## Business Problem

Singapore’s e-commerce scene has seen growing interest in live auctions, but the lack of dedicated platforms has driven sellers to use social media channels like Telegram, TikTok Live, and Instagram Live. These platforms are not optimized for auctions—bids are sent through chat messages, creating clutter and confusion, while payment processes remain unsecured, raising scam risks.

Our project addresses these gaps by creating a dedicated online auction platform that provides a secure, intuitive, and engaging space for users to trade safely.

> Auctions on social media are scattered and hard to access.
> Payments are manual and lack seller verification.
> Scam cases from unverified sales are increasing.

---

## Web Solution Overview

### 🎯 Intended Users
Young Adults around 21 - 35 years old, Mixed of Genders, 
looking for second hand items or exquisite collections.

### 💡 What Users Can Do & Benefits

Explain the core features and the benefit each provides.  

| Feature | Description | User Benefit |
|:--|:--|:--|
| Register & Login | Secure authentication system for all users | Provides personalized access and protects user data |
| Categorization and Featured Auctions | Browse items by category or view trending auctions | Saves time and helps users discover relevant listings easily |
| 3D Auction House | Immersive 3D environment for live auctions | Creates an engaging, interactive experience for younger audiences |
| Digital Wallet (Hitpay) | Enables seamless and secure in-app payments | Removes the need for manual transfers and payment screenshots |
| Identity Verification (Persona) | Verifies users through official ID checks | Ensures seller authenticity and builds trust across the platform |

---

## Tech Stack

| Logo | Technology | Purpose / Usage |
|:--:|:--|:--|
| <img src="https://raw.githubusercontent.com/github/explore/main/topics/html/html.png" width="40"> | **HTML5** | Structure and layout |
| <img src="https://raw.githubusercontent.com/github/explore/main/topics/tailwind/tailwind.png" width="40"> | **CSS3 / Tailwind** | Styling and responsiveness |
| <img src="https://raw.githubusercontent.com/github/explore/main/topics/shadcn-ui/shadcn-ui.png" width="40"> | **ShadCN** | React component library |
| <img src="https://raw.githubusercontent.com/github/explore/main/topics/javascript/javascript.png" width="40"> | **JavaScript (ES6)** |  Interactivity and logic |
| <img src="https://raw.githubusercontent.com/github/explore/main/topics/nextjs/nextjs.png" width="40"> | **Next JS / React JS** | Frontend and routing framework |

---

## Use Case & User Journey

### Buyer Journey

1. **Landing Page & Navigation**
   <img src="README/screenshots/landing.jpg" width="600">

   - Users are greeted with the landing page showcasing "Vintage Retro Finds" with a discover button to explore the platform.

   <img src="README/screenshots/navbar.jpg" width="600">

   - Navigation menu provides easy access to Home, Auctions, Categories, Profile, and Dashboard.

2. **User Registration**
   <img src="README/screenshots/register.jpg" width="300">

   - New users sign up by providing their username, email, and password to create an account.

3. **User Login**
   <img src="README/screenshots/login.jpg" width="300">

   - Returning users authenticate with their credentials to access personalized features.

4. **Wallet Top-Up & Payment Flow**
   <img src="README/screenshots/topupwallet.jpg" width="300">

   - Users add funds to their wallet by selecting preset amounts or entering a custom value.

   <img src="README/screenshots/payment.jpg" width="600">

   - Payment gateway (HitPay) integration displays the amount and payment method selection.

   <img src="README/screenshots/payment2.jpg" width="300">

   - Users complete the transaction via PayNow or other supported payment methods.

   <img src="README/screenshots/payment_complete.jpg" width="300">

   - Transaction history shows completed wallet top-ups and auction payments.

5. **Browse Categories**
   <img src="README/screenshots/categories.jpg" width="600">

   - Users explore diverse categories including Automotive, Books, Collectibles, Electronics, and Fashion to discover items of interest.

6. **Featured Auctions**
   <img src="README/screenshots/featured_auction.jpg" width="600">

   - Live auctions are prominently displayed, showcasing featured collections with category filters for easy browsing.

7. **Live Auction House (3D Experience)**
   <img src="README/screenshots/auction_house1.jpg" width="600">

   - Immersive 3D auction environment where users can view live auctions, see active bidders, and control audio settings.

   <img src="README/screenshots/auction_house2.jpg" width="600">

   - Interactive bidding modal displays wallet balance, current bid status, minimum increment, and live chat functionality.

8. **User Profile - Items Won**
   <img src="README/screenshots/profile.jpg" width="600">

   - Buyers can view their profile showing items won, wallet balance, and verification status.

---

### Seller Journey

*After experiencing the platform as a buyer, users may want to sell their own items (or they might just want to sell items from the start). Here's how they can transition to becoming a seller:*

9. **Identity Verification**
   <img src="README/screenshots/id_verify.jpg" width="600">

   - Users complete identity verification via Persona to become verified sellers and build trust with buyers.

10. **Seller Dashboard**
    <img src="README/screenshots/seller_dashboard.jpg" width="600">

    - Verified sellers access their dashboard to view and manage all their auction listings with search functionality.

11. **Create New Auction**
    <img src="README/screenshots/auction_create.jpg" width="600">

    - Sellers create auctions by providing auction name, description, images, start datetime, and item display duration.

12. **Manage Live Auctions**
    <img src="README/screenshots/auction_manage.jpg" width="600">

    - Auction Host Panel allows sellers to monitor all auction lots, control item display (make active/locked), manage live chat, and control auction flow.

13. **Seller Reviews**
    <img src="README/screenshots/reviews.jpg" width="600">

    - Sellers can view their ratings and reviews from buyers, building their reputation and credibility on the platform.

---

## Developers Setup Guide

Comprehensive steps to help other developers or evaluators run and test your project.

---

### 0) Prerequisites
- [Git](https://git-scm.com/) v2.4+  
- [Node.js](https://nodejs.org/) v18+ and npm v9+  
- Access to backend or cloud services used (Firebase, MongoDB Atlas, AWS S3, etc.)

---

### 1) Download the Project
```bash
git clone https://github.com/JacobSoh/IS216_G4_T20.git
cd IS216_G4_T20
npm install
```

---

### 2) Configure Environment Variables
Create a `.env.local` file in the root directory with the following structure:

```bash
# Replace BASE_URL with Ngrok's if Ngrok's is used.
NEXT_PUBLIC_BASE_URL=
NEXT_PUBLIC_API_BASE_URL=

# Supabase API Keys
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SECRET_KEY=

# HitPay SANDBOX/TEST Configuration
# Uses webhook, require special configuration at HitPay Dashboard
HITPAY_API_KEY=
HITPAY_SALT=
HITPAY_API_URL=

# Persona API
# Uses webhook, require special configuration at Persona Dashboard
NEXT_PUBLIC_PERSONA_TEMPLATE_ID=
NEXT_PUBLIC_PERSONA_ENV_ID=
PERSONA_API_KEY=
PERSONA_WEBHOOK_SECRET=

# Google API Key
NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY=

# SerpAPI Key
NEXT_PUBLIC_SERPAPI_KEY=
```

---

### 3) Backend / Cloud Service Setup

#### NGROK
1. Go to [Ngrok](https://dashboard.ngrok.com/signup)
2. Sign up for an account
3. Copy and run ngrok command
   - ```
      ngrok config add-authtoken <AUTH TOKEN>
      ngrok http 3000
      ```
4. Copy the Ngrok HTTPS Url into `.env.local` file.

#### Supabase
1. Go to [Supabase](https://supabase.com/dashboard/org)
2. Create a new project.
3. Enable the following:
   - **Authentication** → Email/Password sign-in
   - **Create Scehmas** -> Load [main.sql](README/main.sql)
4. Copy the Supabase required API into your `.env.local` file.

### HitPay & Persona
1. Inform contributors if testing these APIs

---

### 4) Run the Frontend
To start the development server:
```bash
npm run dev
```
The project will run on [http://localhost:3000](http://localhost:3000) by default.

To build and preview the production version:
```bash
npm run build
npm run preview
```

---

### 5) Testing the Application

#### Manual Testing
Perform the following checks before submission:

| Area | Test Description | Expected Outcome |
|:--|:--|:--|
| Authentication | Register, Login, Logout | User successfully signs in/out |
| CRUD Operations | Add, Edit, Delete data | Database updates correctly |
| Responsiveness | Test on mobile & desktop | Layout adjusts without distortion |
| Navigation | All menu links functional | Pages route correctly |
| Error Handling | Invalid inputs or missing data | User-friendly error messages displayed |

#### Automated Testing (Optional)
If applicable:
```bash
npm run test
```

---

### 6) Common Issues & Fixes

| Issue | Cause | Fix |
|:--|:--|:--|
| `Module not found` | Missing dependencies | Run `npm install` again |
| `Firebase: permission-denied` | Firestore security rules not set | Check rules under Firestore → Rules |
| `CORS policy error` | Backend not allowing requests | Enable your domain in CORS settings |
| `.env` variables undefined | Missing `VITE_` prefix | Rename variables to start with `VITE_` |
| `npm run dev` fails | Node version mismatch | Check Node version (`node -v` ≥ 18) |

---

## Group Reflection

Each member should contribute 2–3 sentences on their learning and project experience.

> **Example Template:**  
> - *Alice:* Learned to build reusable Vue components and manage state effectively.  
> - *Ben:* Gained experience connecting frontend and backend APIs.  
> - *Chloe:* Improved UI/UX design workflow and collaboration using Figma.  
> - *David:* Understood how Firebase Authentication and Firestore integrate with modern SPAs.  

As a team, reflect on:
- Key takeaways from working with real-world frameworks  
- Challenges faced and how they were resolved  
- Insights on teamwork, project management, and problem-solving  
