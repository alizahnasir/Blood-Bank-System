# Blood Bank Backend API

Express + SQL Server backend for the Blood Bank Management System.

## Setup

1. Install dependencies:
   ```
   cd backend
   npm install
   ```

2. Create your `.env` file (copy from `.env.example`):
   ```
   cp .env.example .env
   ```
   Then fill in your actual SQL Server credentials:
   ```
   DB_SERVER=localhost
   DB_DATABASE=blood_bank
   DB_USER=sa
   DB_PASSWORD=YourActualPassword
   DB_PORT=1433
   PORT=5000
   ```

   If you're using Windows Authentication instead of SQL Authentication,
   let me know and I'll adjust config/db.js accordingly.

3. Make sure your `blood_bank` database is already created in SQL Server
   (run the SQLQuery1.sql script in SSMS first if you haven't).

4. Run the server:
   ```
   npm run dev
   ```
   This uses nodemon, so it restarts automatically when you edit files.
   You should see:
   ```
   Connected to SQL Server (blood_bank database)
   Server running on http://localhost:5000
   ```

5. Test it works by visiting http://localhost:5000 in your browser —
   you should see `{"message":"Blood Bank API is running"}`

## API Endpoints

### Donors
- `GET    /api/donors`              — list all donors (filters: ?city=&blood_type=&status=)
- `GET    /api/donors/:id`          — get one donor's full detail
- `POST   /api/donors`              — register a new donor
- `PATCH  /api/donors/:id`          — update eligibility/notes
- `DELETE /api/donors/:id`          — remove a donor

### Blood Units (Inventory)
- `GET    /api/units`               — list all units (filters: ?status=&blood_type=&bank_id=)
- `GET    /api/units/summary`       — inventory grouped by blood type
- `GET    /api/units/expiring`      — units expiring within 14 days
- `POST   /api/units`               — add a new unit (after donation passes screening)
- `PATCH  /api/units/:id/status`    — update status (available/reserved/used/expired)

### Blood Requests
- `GET    /api/requests`            — list all requests (filters: ?status=&urgency=)
- `GET    /api/requests/:id`        — get one request's full detail
- `POST   /api/requests`            — submit a new request
- `PATCH  /api/requests/:id/fulfill`— fulfill a request (creates transfusion record)
- `PATCH  /api/requests/:id/cancel` — cancel a pending request

### Reports (powers your dashboard)
- `GET /api/reports/audit`            — full donor-to-patient transfusion trail
- `GET /api/reports/top-donors`       — top 10 donors by total donations
- `GET /api/reports/hospital-demand`  — requests grouped by hospital
- `GET /api/reports/camp-performance` — donation camp collection rates
- `GET /api/reports/critical-pending` — urgent pending requests with matching stock

### Hospitals & Banks (for dropdowns)
- `GET /api/hospitals`               — list all hospitals
- `GET /api/hospitals/:id/patients`  — patients at a specific hospital
- `GET /api/banks`                   — list all blood banks
- `GET /api/banks/camps`             — list all donation camps
- `POST /api/banks/camps`            — create a new donation camp

## Example requests (for testing in Postman or Cursor)

Register a donor:
```
POST http://localhost:5000/api/donors
Content-Type: application/json

{
  "full_name": "Hamza Sheikh",
  "dob": "1995-04-12",
  "gender": "M",
  "cnic": "42101-9988776-5",
  "phone": "0321-9988776",
  "email": "hamza.s@email.com",
  "city": "Karachi",
  "blood_type": "O+"
}
```

Submit a blood request:
```
POST http://localhost:5000/api/requests
Content-Type: application/json

{
  "patient_id": 1,
  "hospital_id": 1,
  "handled_by": 1,
  "blood_type": "O+",
  "quantity_ml": 450,
  "urgency": "urgent",
  "requested_on": "2026-06-17"
}
```

Fulfill a request:
```
PATCH http://localhost:5000/api/requests/3/fulfill
Content-Type: application/json

{
  "unit_id": 2,
  "administered_by": 1,
  "transfusion_date": "2026-06-17",
  "quantity_ml": 450,
  "outcome_notes": "Transfusion successful"
}
```

## Connecting from Cursor (frontend)

In your React app, set the base URL to `http://localhost:5000/api` and use axios:

```js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
});

export default api;
```

Then call it like:
```js
const donors = await api.get('/donors');
const newDonor = await api.post('/donors', formData);
```

Make sure your backend (`npm run dev`) is running on port 5000 BEFORE you
start the frontend, or your API calls will fail with connection errors.
