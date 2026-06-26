# EventHub - Event Management Platform

A full-stack event management and ticketing platform inspired by Eventbrite.sg.

## Tech Stack

- **Backend**: Node.js, Express, TypeScript, MongoDB (Mongoose)
- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Auth**: JWT-based authentication
- **API**: RESTful JSON API (ready for mobile consumption)

## Features

- User authentication (attendees & organizers)
- Event creation with custom ticket tiers
- Event discovery with search, filters, and categories
- Ticket purchasing and order management
- Promo codes and discount system
- Organizer dashboard with analytics
- Saved events and attendee management
- Mobile-first responsive design
- Rate limiting and security headers

## Getting Started

### Prerequisites

- Node.js v18+
- MongoDB (local or Atlas)

### Backend Setup

```bash
cd backend
npm install
cp .env .env.local  # Edit MongoDB URI and secrets
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

## API Documentation

See [MOBILE_API.md](./MOBILE_API.md) for complete API documentation.

## Project Structure

```
Event Management/
├── backend/
│   ├── src/
│   │   ├── controllers/    # Route handlers
│   │   ├── models/         # Mongoose schemas
│   │   ├── routes/         # Express routes
│   │   ├── middleware/     # Auth, upload, error handling
│   │   └── utils/          # Helpers
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── contexts/       # Auth context
│   │   └── services/       # API client
│   └── package.json
├── MOBILE_API.md           # Mobile app integration docs
└── README.md
```

## Environment Variables (Backend)

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 5000 |
| MONGODB_URI | MongoDB connection string | mongodb://localhost:27017/eventmanagement |
| JWT_SECRET | JWT signing key | (required) |
| JWT_EXPIRES_IN | Token expiry | 7d |
| FRONTEND_URL | CORS origin | http://localhost:5173 |
| STRIPE_SECRET_KEY | Stripe (optional) | - |

## License

MIT
