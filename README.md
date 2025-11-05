# 🧠 SlotSwapper – Peer-to-Peer Time Slot Scheduling

SlotSwapper is a **full-stack web application** that allows users to swap their busy time slots with others easily.  
Users can mark specific slots as *swappable*, browse others’ available slots, and send or receive swap requests in real-time.

---

## 🚀 Live Demo
> The application is live at:  
`https://schedswap.vercel.app`  
*(Replace this link with your actual deployment URL if different.)*

---

## ✨ Features

### 🧩 Core Features
- **User Authentication** – Secure signup and login using JWT tokens.
- **Calendar Management** – Create, edit, delete, and view time slots.
- **Slot Status System**
  - `BUSY` → Regular occupied slots  
  - `SWAPPABLE` → Available for swap  
  - `SWAP_PENDING` → Awaiting confirmation  
- **Marketplace** – Explore other users’ swappable slots.
- **Swap Requests** – Request, accept, or reject swaps seamlessly.
- **Notifications** – View incoming and outgoing requests in one place.
- **Automatic Logic** – Ownership automatically updates after swap approval.

---

## ⚙️ Technology Stack

### Backend
- **Framework:** FastAPI (Python 3.11+)
- **Database:** MongoDB (Motor async driver)
- **Authentication:** JWT (PyJWT) with bcrypt password hashing
- **Architecture:** RESTful APIs with async operations
- **Validation:** Pydantic models for clean data handling

### Frontend
- **Framework:** React 19
- **Routing:** React Router v7
- **UI Components:** Shadcn UI (Radix Primitives)
- **Styling:** Tailwind CSS
- **HTTP Client:** Axios
- **Date Utilities:** date-fns
- **State Management:** React Context API

---

## 🧰 Prerequisites

Make sure you have the following installed:

- **Python 3.11+**
- **Node.js 18+**
- **Yarn or npm**
- **MongoDB** (local or cloud instance)

---

## 🏗️ Local Setup Guide

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/YOUR_USERNAME/slotswapper.git
cd slotswapper
