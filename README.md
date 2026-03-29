<div align="center">

<img src="https://img.shields.io/badge/SQL%20Server-2019%2B-CC2927?style=for-the-badge&logo=microsoftsqlserver&logoColor=white"/>
<img src="https://img.shields.io/badge/T--SQL-T--SQL-0078D4?style=for-the-badge&logo=microsoftsqlserver&logoColor=white"/>
<img src="https://img.shields.io/badge/GitHub%20Pages-Live-22c55e?style=for-the-badge&logo=github&logoColor=white"/>
<img src="https://img.shields.io/badge/Roles-4%20POV-6366f1?style=for-the-badge"/>

<br/><br/>

# 🚕 RideShare DB — Interactive Dashboard

### A role-aware web dashboard built on top of a complete SQL Server ride-sharing database

<br/>

**[🌐 Open Live Dashboard →](https://naremanukiian.github.io/RideShareDBWeb)**&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;**[🗄️ View SQL Repository →](https://github.com/naremanukiian/RideSharingDBSystem)**

<br/>

</div>

---

## What is this?

This repository hosts the **interactive web dashboard** for the RideSharingDB project — a complete SQL Server database system for a ride-sharing platform.

The dashboard is built from real data extracted directly from [`ride_sharing.sql`](https://github.com/naremanukiian/RideSharingDBSystem) and runs entirely in the browser with no backend or server required. It lets you explore the database from **four different role perspectives**, each showing exactly what that SQL login can access in SQL Server.

> 📦 Looking for the SQL script, schema, triggers, and stored procedures?
> **[→ naremanukiian/RideSharingDBSystem](https://github.com/naremanukiian/RideSharingDBSystem)**

---

## 🌐 Live Demo

**[https://naremanukiian.github.io/RideShareDBWeb](https://naremanukiian.github.io/RideShareDBWeb)**

No installation. No login. Open in any browser and select your role.

---

## 🎭 Role-Based Access

The first screen lets you choose which role to enter as. Each role has its own colour theme, navigation, and data access — matching the actual SQL Server permissions defined in the database.

<br/>

| Role | SQL Login | Colour | What You Can See |
|------|-----------|--------|-----------------|
| 🧑 **Passenger** | `ride_app` | Cyan | Your rides, payments, available drivers, promo codes |
| 🚗 **Driver** | `ride_app` | Green | Your trips, earnings, ratings, vehicle details |
| 📊 **Analyst** | `ride_report` | Amber | All data read-only — revenue, city analytics, driver summaries |
| 🛡️ **DBA Admin** | `ride_dba` | Purple | Everything — schema, triggers, procedures, DCL, full data |

> **Passenger** and **Driver** both use the `ride_app` SQL login. In a real system, the application layer filters by the logged-in user's ID. The underlying database permissions are the same — the POV is different.

---

## 📂 Files in This Repository

```
RideShareDBWeb/
├── index.html      — Role selector screen + all 9 dashboard views
├── style.css       — Full design system, dark theme, role colour themes
├── app.js          — All rendering logic, navigation, chart builders
└── data.js         — All real data extracted from ride_sharing.sql
```

Everything runs client-side. GitHub Pages serves these four static files — no server, no database connection, no build step.

---

## 🗄️ About the Database

The data powering this dashboard comes from a complete SQL Server implementation. Here is a summary:

| Component | Count |
|-----------|-------|
| Tables | 8 |
| Rows | 336 total (42 per table, 40 for ratings) |
| Foreign Keys | 9 |
| CHECK Constraints | 12 |
| UNIQUE Constraints | 6 |
| Non-Clustered Indexes | 15 |
| Views | 8 |
| Triggers | 7 |
| Stored Procedures | 8 |
| DQL Queries | 30 (all 7 relational algebra operations) |
| DCL User Roles | 3 |

**Tables:** `users` · `drivers` · `vehicles` · `locations` · `rides` · `payments` · `ratings` · `promocodes`

**Cities:** New York · Chicago · Los Angeles · San Francisco

**Revenue:** $940.75 total · $23.52 average fare · 31.4 min average duration

---

## 📊 Dashboard Pages by Role

### 🧑 Passenger View
- **My Rides** — Personal trip history with driver names, locations, fares, promo codes applied, and status
- **Book a Ride** — All currently available drivers with vehicle details (`sp_available_drivers`)
- **My Payments** — Personal payment history with method and status
- **Promo Codes** — Active non-expired discount codes (`vw_active_promos`)

### 🚗 Driver View
- **My Trips** — All completed rides with passenger names, routes, fares, and durations
- **Earnings** — Monthly earnings breakdown and summary stats (`sp_driver_earnings`)
- **My Ratings** — Passenger feedback with driver and user ratings (`trg_update_driver_rating`)
- **My Vehicle** — Registered vehicle details from the `vehicles` table

### 📊 Analyst View
- **Overview** — Revenue by city, payment methods, ride status distribution, top 5 drivers
- **All Rides** — Full dataset from `vw_ride_details` with all names resolved
- **All Drivers** — Full driver roster from `vw_driver_summary`
- **Revenue** — City revenue table + top earner leaderboard (`vw_revenue_by_city`)
- **Users** — All 42 registered users

### 🛡️ DBA View
All Analyst pages plus:
- **Schema** — All 8 table structures with PKs, FKs, and constraints
- **Triggers** — All 7 triggers with BR references, event types, and descriptions
- **Procedures** — All 8 stored procedures with parameters
- **Access Control** — All 3 DCL roles with permissions and the SSMS verification query

---

## 🔗 Related Repository

> ### [naremanukiian/RideSharingDBSystem](https://github.com/naremanukiian/RideSharingDBSystem)
>
> The full SQL Server implementation — `ride_sharing.sql` (1,279 lines, zero errors).
>
> Contains: DDL · DML (42 rows/table) · 15 Indexes · 8 Views · 7 Triggers · 8 Stored Procedures · 30 DQL Queries · DCL (3 roles) · Full 3NF normalisation · Complete project report and documentation

---

## 🚀 Deploy Your Own Copy

```bash
# 1. Fork or clone this repo
git clone https://github.com/naremanukiian/RideShareDBWeb.git

# 2. No build step needed — open index.html directly in a browser
# OR push to GitHub and enable Pages:
# Settings → Pages → Source → main branch / root
```

That is all. Four static files, works everywhere.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Database | Microsoft SQL Server 2019+ · T-SQL |
| IDE | SQL Server Management Studio (SSMS) 22 |
| Frontend | Vanilla HTML · CSS · JavaScript — no frameworks |
| Fonts | Inter · JetBrains Mono (Google Fonts) |
| Hosting | GitHub Pages |
| Data | Extracted from `ride_sharing.sql` into `data.js` |

---

<div align="center">

**[🌐 Open Dashboard](https://naremanukiian.github.io/RideShareDBWeb)** &nbsp;·&nbsp; **[🗄️ SQL Repository](https://github.com/naremanukiian/RideSharingDBSystem)**

<br/>

*SQL Server 2019+ · T-SQL · SSMS 22 · Full 3NF · Zero errors · GitHub Pages*

</div>
