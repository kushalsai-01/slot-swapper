# SlotSwapper - Peer-to-Peer Time Slot Scheduling

A full-stack application for peer-to-peer time-slot scheduling where users can mark busy slots as "swappable" and request to swap with other users' available time slots.

**Built for ServiceHive Technical Challenge**

## 🚀 Live Demo

The application is deployed and running at: `https://schedswap.preview.emergentagent.com`

## ✨ Features

### Core Features
- **User Authentication**: JWT-based signup and login with secure password hashing
- **Calendar Management**: Create, view, edit, and delete time slots with status tracking
- **Event Status System**: 
  - BUSY: Regular busy slots
  - SWAPPABLE: Available for swapping
  - SWAP_PENDING: Currently in a pending swap request
- **Marketplace**: Browse available slots from other users
- **Swap Requests**: Request to exchange time slots with other users
- **Notifications**: View incoming and outgoing swap requests
- **Swap Logic**: Accept or reject swap requests with automatic ownership transfer

### Technical Features
- JWT token authentication with 24-hour expiration
- Protected routes with automatic redirect
- Timezone support for global users
- Real-time state updates without page refresh
- Responsive design for all screen sizes
- Comprehensive error handling

## 🛠️ Technology Stack

### Backend
- **Framework**: FastAPI (Python)
- **Database**: MongoDB with Motor (async driver)
- **Authentication**: JWT (PyJWT) with bcrypt password hashing
- **API Style**: RESTful

### Frontend
- **Framework**: React 19
- **Routing**: React Router v7
- **UI Components**: Shadcn UI (Radix UI primitives)
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **Date Handling**: date-fns

## 📋 Prerequisites

- Python 3.11+
- Node.js 18+ and Yarn
- MongoDB (local or remote instance)

## 🔧 Local Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd slotswapper
```

### 2. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
# Edit backend/.env file with your MongoDB connection
# MONGO_URL="mongodb://localhost:27017"
# DB_NAME="slotswapper_db"
# JWT_SECRET="your-secret-key-change-in-production"

# Start the backend server
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

The backend will be running at `http://localhost:8001`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
yarn install

# Configure environment variables
# Edit frontend/.env file
# REACT_APP_BACKEND_URL=http://localhost:8001

# Start the development server
yarn start
```

The frontend will be running at `http://localhost:3000`

### 4. Access the Application

Open your browser and navigate to `http://localhost:3000`

## 📚 API Documentation

### Base URL
`/api`

### Authentication Endpoints

#### POST `/api/auth/signup`
Create a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "timezone": "America/New_York"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "timezone": "America/New_York"
  }
}
```

#### POST `/api/auth/login`
Authenticate and receive JWT token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:** Same as signup

#### GET `/api/auth/me`
Get current user information (requires authentication).

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": "uuid",
  "name": "John Doe",
  "email": "john@example.com",
  "timezone": "America/New_York"
}
```

### Event Management Endpoints

#### GET `/api/events`
Get all events for the authenticated user.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "title": "Team Meeting",
    "start_time": "2025-01-15T10:00:00Z",
    "end_time": "2025-01-15T11:00:00Z",
    "status": "SWAPPABLE",
    "created_at": "2025-01-10T08:00:00Z"
  }
]
```

#### POST `/api/events`
Create a new event.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "title": "Team Meeting",
  "start_time": "2025-01-15T10:00:00Z",
  "end_time": "2025-01-15T11:00:00Z",
  "status": "BUSY"
}
```

**Response:** Event object

#### PUT `/api/events/{event_id}`
Update an existing event.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "title": "Updated Meeting",
  "status": "SWAPPABLE"
}
```

**Response:** Updated event object

#### DELETE `/api/events/{event_id}`
Delete an event.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Event deleted successfully"
}
```

### Swap Endpoints

#### GET `/api/swappable-slots`
Get all swappable slots from other users.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "user_name": "Jane Smith",
    "user_email": "jane@example.com",
    "title": "Focus Block",
    "start_time": "2025-01-16T14:00:00Z",
    "end_time": "2025-01-16T15:00:00Z",
    "status": "SWAPPABLE"
  }
]
```

#### POST `/api/swap-request`
Request a swap with another user.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "my_slot_id": "uuid",
  "their_slot_id": "uuid"
}
```

**Response:** SwapRequest object

**Validation:**
- Both slots must exist
- Both slots must have status "SWAPPABLE"
- Updates both slots to "SWAP_PENDING"

#### POST `/api/swap-response/{request_id}`
Accept or reject a swap request.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "accepted": true
}
```

**Response:**
```json
{
  "message": "Swap accepted successfully",
  "status": "ACCEPTED"
}
```

**Logic:**
- **If Accepted**: Exchanges ownership of both slots and sets status to "BUSY"
- **If Rejected**: Sets both slots back to "SWAPPABLE"

#### GET `/api/swap-requests/incoming`
Get incoming swap requests for the authenticated user.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "id": "uuid",
    "requester_id": "uuid",
    "requester_name": "John Doe",
    "requester_email": "john@example.com",
    "requester_slot": { /* event object */ },
    "target_slot": { /* event object */ },
    "status": "PENDING",
    "created_at": "2025-01-10T10:00:00Z"
  }
]
```

#### GET `/api/swap-requests/outgoing`
Get outgoing swap requests sent by the authenticated user.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** Similar to incoming requests with status field showing PENDING/ACCEPTED/REJECTED

## 🎯 Design Decisions

### Backend Architecture
1. **JWT Authentication**: Chose JWT for stateless authentication, allowing easy scaling
2. **MongoDB**: Document database perfect for flexible event schema and user data
3. **Async Operations**: Used Motor for async MongoDB operations to handle concurrent requests efficiently
4. **Status State Machine**: Implemented clear status transitions (BUSY → SWAPPABLE → SWAP_PENDING → BUSY/SWAPPABLE)

### Frontend Architecture
1. **Context API**: Used React Context for global auth state management
2. **Protected Routes**: Implemented route guards to redirect unauthenticated users
3. **Optimistic Updates**: UI updates immediately with backend sync
4. **Component Reusability**: Leveraged Shadcn UI for consistent, accessible components

### Security Considerations
1. Password hashing with bcrypt
2. JWT tokens with expiration
3. Authorization checks on all protected endpoints
4. Input validation with Pydantic models

### UI/UX Design
1. **Clean Dashboard**: Space Grotesk for headings, Inter for body text
2. **Color Coding**: Visual status indicators (blue for swappable, red for busy, yellow for pending)
3. **Intuitive Flow**: Clear navigation between Dashboard, Marketplace, and Notifications
4. **Responsive Design**: Mobile-first approach with Tailwind CSS

## 🧪 Testing

### Backend Tests
Comprehensive test suite covering:
- Authentication (signup, login, JWT validation)
- Event CRUD operations
- Swap logic and ownership transfer
- Authorization and error handling

Run tests:
```bash
cd backend
pytest backend_test.py -v
```

**Test Results**: 100% pass rate (27/27 tests)

### Manual Testing
1. Create two user accounts
2. Create events and mark as swappable
3. Browse marketplace and request swap
4. Accept/reject swap requests from notifications
5. Verify ownership transfer after acceptance

## 📝 Assumptions & Challenges

### Assumptions Made
1. Users trust the swap system and won't abuse it
2. Time zone handling is basic (stored as string, no complex conversions)
3. One-to-one swap model (no group swaps)
4. Events don't have recurrence patterns
5. No calendar integration (Google Calendar, etc.)

### Challenges Faced
1. **Swap Logic Complexity**: Ensuring atomic updates when swapping ownership to prevent race conditions
2. **State Synchronization**: Keeping frontend state in sync after swap operations
3. **Status Transitions**: Implementing proper state machine for event statuses
4. **JWT Token Management**: Handling token refresh and expiration gracefully

### Future Enhancements (If Time Permitted)
1. Real-time notifications using WebSockets
2. Calendar grid view with drag-and-drop
3. Email notifications for swap requests
4. Advanced filtering and search in marketplace
5. Recurring events support
6. Integration with external calendars
7. User ratings and trust scores
8. Bulk swap operations

## 📄 Project Structure

```
/app
├── backend/
│   ├── server.py           # Main FastAPI application
│   ├── requirements.txt    # Python dependencies
│   └── .env               # Environment variables
├── frontend/
│   ├── src/
│   │   ├── App.js         # Main React component with routing
│   │   ├── App.css        # Global styles
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Signup.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Marketplace.jsx
│   │   │   └── Notifications.jsx
│   │   └── components/ui/ # Shadcn UI components
│   ├── package.json       # Node dependencies
│   └── .env              # Frontend environment variables
├── test_reports/          # Test results
└── README.md             # This file
```

## 🤝 Contributing

This is a technical challenge submission. For questions or feedback, please contact the development team.

## 📜 License

Built as part of ServiceHive Full Stack Intern Technical Challenge - 2025

---

**Developed with ❤️ using Emergent Agent**
