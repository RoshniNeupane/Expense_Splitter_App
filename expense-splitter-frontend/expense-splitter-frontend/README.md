# Expense Splitter — React Frontend

## Tech Stack
| Technology | Purpose |
|------------|---------|
| **React 18** | UI framework |
| **Bootstrap 5** | Responsive grid & utilities |
| **React Router DOM** | Client-side routing |
| **Axios** | HTTP client with JWT interceptors |
| **Recharts** | Charts (area, pie) |
| **react-hot-toast** | Toast notifications |
| **Lucide React** | Icon system |
| **DM Serif Display** | Elegant display typography |
| **DM Sans** | Body / UI typeface |
| **JetBrains Mono** | Monospace for amounts |

## Design System
- **Theme:** Dark luxury fintech — deep navy `#0a0d14`, gold `#d4af37`, emerald `#2dd4a0`
- **Typography:** DM Serif Display (headings) + DM Sans (body) + JetBrains Mono (numbers)
- **Components:** Custom card system (es-card, es-card-gold), ES inputs/selects, avatar system, modal system, stat cards with colored top-border accents

## Pages
| Route | Page | Description |
|-------|------|-------------|
| `/` | Dashboard | Stats overview, spending chart, recent activity |
| `groups` | Groups | Group cards grid, create/manage groups |
| `expenses` | Expenses | Expense table with categories, amounts, splits |
| `settlements` | Settlements | Payment tracking with status flow |
| `activity` | Activity Feed | Chronological group event log |
| `profile` | Profile | Edit profile, change password |

## Setup

```bash
npm install
npm start       # dev server at localhost:3000
npm run build   # production build
```

## Environment Variables
```
REACT_APP_API_URL=http://localhost:8000/api
```
