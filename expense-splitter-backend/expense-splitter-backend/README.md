# Expense Splitter - Django Backend

## Tech Stack
- **Django 4.2** - Python web framework
- **Django REST Framework** - REST API
- **JWT Authentication** - via `djangorestframework-simplejwt`
- **django-cors-headers** - CORS support
- **drf-nested-routers** - Nested API routes
- **SQLite** (dev) / PostgreSQL (prod)

## Setup

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Start server
python manage.py runserver
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register/ | Register new user |
| POST | /api/token/ | Login (get JWT tokens) |
| POST | /api/token/refresh/ | Refresh JWT token |
| GET/PUT | /api/auth/profile/ | Get/Update user profile |
| GET/POST | /api/groups/ | List/Create groups |
| GET/PUT/DELETE | /api/groups/{id}/ | Group detail |
| POST | /api/groups/{id}/add_member/ | Add member |
| POST | /api/groups/{id}/remove_member/ | Remove member |
| GET | /api/groups/{id}/balances/ | Get balances |
| GET | /api/groups/{id}/summary/ | Group summary |
| GET/POST | /api/groups/{id}/expenses/ | List/Create expenses |
| GET/PUT/DELETE | /api/groups/{id}/expenses/{id}/ | Expense detail |
| GET/POST | /api/groups/{id}/settlements/ | List/Create settlements |
| POST | /api/groups/{id}/settlements/{id}/complete/ | Mark settled |
| GET | /api/groups/{id}/activities/ | Activity feed |
| GET | /api/dashboard/ | Dashboard stats |

## Authentication
All endpoints (except register/login) require `Authorization: Bearer <token>` header.
