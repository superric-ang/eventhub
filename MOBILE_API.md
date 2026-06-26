# Mobile App API Documentation

This document describes the RESTful API endpoints available for the mobile app integration.

## Base URL

```
Development: http://localhost:5000/api
Production: https://yourdomain.com/api
```

## Authentication

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

### Auth Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | No | Create new account |
| POST | `/auth/login` | No | Sign in |
| GET | `/auth/me` | Yes | Get current user |
| PUT | `/auth/profile` | Yes | Update profile |

**POST /auth/register**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "attendee|organizer",
  "organizationName": "My Org (optional)"
}
```

**POST /auth/login**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "id": "...",
    "email": "...",
    "firstName": "...",
    "lastName": "...",
    "role": "attendee|organizer",
    "avatar": null,
    "organizationName": null
  }
}
```

### Event Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/events` | No | List events (paginated, filterable) |
| GET | `/events/:id` | No | Get single event |
| GET | `/events/categories` | No | Get category list |
| POST | `/events` | Yes (organizer) | Create event |
| PUT | `/events/:id` | Yes (owner) | Update event |
| DELETE | `/events/:id` | Yes (owner) | Delete event |
| POST | `/events/:id/save` | Yes | Toggle save event |

**GET /events?page=1&limit=20&category=music&format=in_person&search=concert&city=singapore&sort=-startDate**

**Response:**
```json
{
  "success": true,
  "events": [
    {
      "_id": "...",
      "title": "Summer Music Festival",
      "description": "...",
      "category": "music",
      "format": "in_person",
      "status": "published",
      "coverImage": "/uploads/event-cover.jpg",
      "startDate": "2024-12-25T18:00:00.000Z",
      "endDate": "2024-12-25T23:00:00.000Z",
      "venue": { "name": "Marina Bay", "address": "10 Bayfront Ave", "city": "Singapore", "country": "SG" },
      "ticketTiers": [
        { "_id": "...", "name": "General", "price": 50, "quantity": 500, "quantitySold": 120, "isFree": false }
      ],
      "organizer": { "_id": "...", "firstName": "John", "lastName": "Doe", "avatar": null },
      "currentAttendees": 120,
      "views": 1500
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 150, "pages": 8 }
}
```

**POST /events** (multipart/form-data)

| Field | Type | Description |
|-------|------|-------------|
| coverImage | File | Event cover image |
| title | string | Event title |
| description | string | Full description |
| shortDescription | string | Short description (max 500) |
| category | string | One of the category values |
| format | string | in_person, online, hybrid |
| startDate | ISO date | Event start |
| endDate | ISO date | Event end |
| timezone | string | IANA timezone string |
| venue[name] | string | Venue name |
| venue[address] | string | Street address |
| venue[city] | string | City |
| venue[country] | string | Country code |
| ticketTiers | JSON string | Array of ticket tier objects |
| tags | JSON string | Array of tag strings |
| isPrivate | boolean | Private event flag |
| settings | JSON string | Event settings object |

### Order Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/orders` | Yes | Create order / purchase tickets |
| GET | `/orders` | Yes | List user's orders |
| GET | `/orders/:orderNumber` | Yes | Get order by number |
| PUT | `/orders/:orderNumber/checkin` | Yes (organizer) | Check in attendee |
| PUT | `/orders/:id/cancel` | Yes | Cancel order |

**POST /orders**
```json
{
  "eventId": "event_object_id",
  "items": [
    { "ticketTierId": "tier_id", "quantity": 2 }
  ],
  "attendeeDetails": [
    {
      "ticketTierId": "tier_id",
      "tickets": [
        { "name": "John Doe", "email": "john@example.com" },
        { "name": "Jane Doe", "email": "jane@example.com" }
      ]
    }
  ],
  "promoCode": "SUMMER20 (optional)",
  "paymentMethod": "card"
}
```

### Promo Code Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/promos` | Yes (organizer) | Create promo code |
| GET | `/promos/validate?code=SUMMER&eventId=xxx&orderAmount=100` | No | Validate promo code |

---

## Mobile App Architecture Notes

### Required Flows

1. **Authentication**: Token-based JWT auth. Store token securely (Keychain on iOS, EncryptedSharedPreferences on Android).
2. **Event Discovery**: Paginated list with search, category, and location filters.
3. **Event Booking**: Select ticket tiers → fill attendee info → apply promo → purchase.
4. **Ticket Management**: View purchased tickets with QR code generation (use orderNumber as QR data).
5. **Organizer Features**: Event creation, order management, attendee check-in via QR scanning.

### Push Notifications

The backend supports `routes` for notification preferences. For push, integrate with Firebase Cloud Messaging (FCM) and store device tokens:

```
POST /api/devices/register
{
  "token": "fcm_device_token",
  "platform": "ios|android"
}
```

### File Uploads

Use multipart/form-data for image uploads. Supported formats: jpg, png, gif, webp (max 5MB).

### Error Handling

All endpoints return:
```json
{
  "success": false,
  "message": "Error description"
}
```

HTTP status codes: 200 (success), 201 (created), 400 (bad request), 401 (unauthorized), 403 (forbidden), 404 (not found), 500 (server error).

### SDK Generation

For mobile SDK generation, import the OpenAPI spec from `/api/openapi.json` (coming soon) to auto-generate API clients using OpenAPI Generator.
