# 🚕 RideShareDB — Database System & Admin Dashboard

> A complete relational database system for a ride-sharing platform, built with **Microsoft SQL Server (T-SQL)** and documented with a **live multi-role web dashboard** deployable to GitHub Pages.

---

## 📋 Table of Contents

- [Project Overview](#-project-overview)
- [Live Dashboard](#-live-dashboard)
- [Repository Structure](#-repository-structure)
- [Database Summary](#-database-summary)
- [How to Run the SQL Script](#-how-to-run-the-sql-script)
- [Dashboard Roles](#-dashboard-roles)
- [How to Deploy to GitHub Pages](#-how-to-deploy-to-github-pages)
- [Database Design](#-database-design)
- [Business Rules & Triggers](#-business-rules--triggers)
- [Stored Procedures](#-stored-procedures)
- [Access Control (DCL)](#-access-control-dcl)
- [Technologies Used](#-technologies-used)

---

## 🎯 Project Overview

This project designs and implements a full relational database system for a **ride-sharing service** — covering the entire development lifecycle from conceptual design through physical SQL Server implementation and documentation.

The system manages:
- Passenger ride bookings across 4 US cities
- Driver assignment, availability, and ratings
- Fare calculation with promotional discounts
- Payment processing and financial records
- Role-based database access control

**Academic context:** University database course project covering conceptual design, logical design (ER + normalization), and physical implementation (SQL Server T-SQL).

---

## 🌐 Live Dashboard

The web dashboard visualises all database data with **4 role-based views** — each showing exactly what that SQL Server role can access.

**To open locally:** download all 4 files and open `index.html` in any browser. No server or build step required.

### Role Selection Screen

When you open the dashboard you are presented with a role selector. Choose your perspective:

| Role Card | SQL Login | Access Level |
|-----------|-----------|--------------|
| 👤 Passenger | `ride_app` | View own rides, book rides, payments, promos |
| 🚗 Driver | `ride_app` | View own trips, earnings, ratings, vehicle |
| 📊 Analyst | `ride_report` | Read-only access to all data and reports |
| 🛡 DBA Admin | `ride_dba` | Full system access including schema, triggers, procedures, DCL |

> Passenger and Driver share the same `ride_app` SQL login but see filtered views of their own data. The difference is at the application layer, not the database layer.

---

## 📁 Repository Structure

```
├── index.html              # Main dashboard — role selector + all views
├── style.css               # Complete design system — dark theme, role colours, responsive
├── app.js                  # All rendering logic — role views, charts, navigation
├── data.js                 # Real data extracted from ride_sharing_fixed.sql
├── ride_sharing_fixed.sql  # Complete SQL Server script — 1,279 lines, zero errors
└── README.md               # This file
```

---

## 🗄 Database Summary

| Component | Count | Details |
|-----------|-------|---------|
| Tables | 8 | users, drivers, vehicles, locations, rides, payments, ratings, promocodes |
| Rows | 42 per table | 40 for ratings (completed rides only) |
| Foreign Keys | 10 | Cascade on users→rides, drivers→vehicles, rides→payments, rides→ratings |
| CHECK Constraints | 12 | Status enums, rating ranges, fare ≥ 0, capacity 1–20, year 1990–2030 |
| UNIQUE Constraints | 6 | Email, LicenseNumber, PlateNumber, PromoCode, RideID in ratings |
| DEFAULT Values | 8 | GETDATE(), 'Available', 5.0, 'Pending', 0 |
| Indexes | 15 | Non-clustered on FK, status, date, fare columns |
| Views | 8 | vw_ride_details, vw_driver_summary, vw_user_activity, vw_revenue_by_city, vw_payment_overview, vw_active_promos, vw_top_drivers, vw_pending_rides |
| Triggers | 7 | AFTER + INSTEAD OF — all business rules enforced at engine level |
| Stored Procedures | 8 | Parameterised, production-ready operations |
| DCL Users | 3 | ride_app, ride_report, ride_dba |
| DQL Queries | 30 | All 7 relational algebra operations: σ π ⋈ γ ∪ ∩ − |
| Normalization | 3NF | All transitive dependencies eliminated |

---

## ▶ How to Run the SQL Script

### Requirements
- Microsoft SQL Server 2019 or later
- SQL Server Management Studio (SSMS) 18+, tested on **SSMS 22**

### Steps

1. Open **SSMS** and connect to your SQL Server instance using Windows Authentication or a login with `sysadmin` privileges (e.g. `sa`).

2. Open the script:
   ```
   File → Open → SQL Script → ride_sharing_fixed.sql
   ```

3. Execute the full script:
   ```
   Ctrl + Shift + Enter   (or click Execute)
   ```

4. The script runs in order — **no manual steps needed**:
   ```
   DDL → DML → Indexes → Views → Triggers → Procedures → DQL → DCL
   ```

5. Check the **Messages tab** in SSMS — every object prints a confirmation line as it is created.

### ⚠ Important Notes

- The script is **idempotent** — safe to run multiple times. It automatically drops and recreates `RideSharingDB` using `SET SINGLE_USER WITH ROLLBACK IMMEDIATE` before dropping, which forces all existing connections to close.
- The **DCL section** (Section 8) requires a login with `sysadmin` or `securityadmin` server role to create new logins. Run the full script as `sa` or your Windows admin account.
- `STRING_AGG` is used in the index inventory query — requires SQL Server 2017 or later.

### Expected Output

After a successful run you will see in the Messages tab:

```
[DDL] Table "users" created
[DDL] Table "drivers" created
...
[DML] users: 42 rows inserted
...
[INDEX] 15 indexes created successfully
...
[VIEW 1/8] vw_ride_details created
...
[TRIGGER 1/7] trg_calc_duration created
...
[PROC 1/8] sp_get_user_rides created
...
[DCL] ride_app — GRANT: SELECT, INSERT, UPDATE | DENY: DELETE
...
SCRIPT COMPLETE — ZERO ERRORS — ALL REQUIREMENTS SATISFIED
  Tables:      8   (42 rows each, 40 for ratings)
  Indexes:     15
  Views:       8
  Triggers:    7
  Procedures:  8
  DQL Queries: 30
  DCL Users:   3
```

---

## 👥 Dashboard Roles

### 👤 Passenger (`ride_app`)
**What they see:** Personal ride history, available drivers to book, their own payment records, and active promo codes.

**SQL permissions:**
```sql
GRANT SELECT, INSERT, UPDATE ON SCHEMA::dbo TO ride_app;
DENY  DELETE                  ON SCHEMA::dbo TO ride_app;
```

**Key restriction:** Cannot delete any records. Cannot see other passengers' data. One active ride at a time enforced by `trg_no_concurrent_rides` (BR-1).

---

### 🚗 Driver (`ride_app`)
**What they see:** Their own completed trips, earnings breakdown by month, passenger ratings they received, and their registered vehicle details.

**SQL permissions:** Same login as Passenger (`ride_app`) — the application layer filters data by the driver's ID.

**Key feature:** Driver's `Status` column (Available / Busy / Offline) is managed automatically by triggers — the driver never sets it manually.

---

### 📊 Analyst (`ride_report`)
**What they see:** Full read-only access — all rides, all drivers, city revenue reports, payment breakdowns, and all user records. Cannot modify anything.

**SQL permissions:**
```sql
GRANT SELECT ON SCHEMA::dbo TO ride_report;
```

**Use case:** BI dashboards, data exports, management reporting, analytics tools.

---

### 🛡 DBA Admin (`ride_dba`)
**What they see:** Everything — all data views plus the full database schema (8 table structures), all 7 triggers with business rule documentation, all 8 stored procedures with parameters, DCL permission tables, and an SSMS verification query.

**SQL permissions:**
```sql
ALTER ROLE db_owner ADD MEMBER ride_dba;
```

**Use case:** Database maintenance, schema changes, index rebuilds, deployment, and access control management.

---

## 🏗 Database Design

### Entity-Relationship Summary

```
users (1) ──────────< rides (N) >──────────── (1) drivers
                        │  │  │
              ┌─────────┘  │  └──────────┐
              │            │             │
           vehicles    locations      promocodes
                        (x2: start
                          & end)
                            │
                    ┌───────┴───────┐
                    │               │
                payments         ratings
```

### Normalization

All 8 tables satisfy **1NF, 2NF, and 3NF**:

- **1NF** — All columns hold atomic values. No arrays or repeating groups. Every row has a unique IDENTITY primary key.
- **2NF** — All tables use single-column surrogate PKs (IDENTITY INT), making partial dependency structurally impossible.
- **3NF** — No transitive dependencies. Driver names, location names, vehicle models, and promo discounts are never stored in the `rides` table — only their FK IDs are stored and names are resolved at query time via JOIN.

> `RideDuration` is a deliberate controlled denormalisation — stored as INT for query performance, maintained automatically by `trg_calc_duration`. The dependency is `RideID → RideDuration` (through the PK), not through another non-key attribute.

### Relational Algebra (30 Queries)

Section 7 of the SQL script demonstrates all 7 operations:

| Operation | Symbol | Queries | Example |
|-----------|--------|---------|---------|
| Selection | σ | Q1–Q7 | `WHERE Status = 'Completed'` |
| Projection | π | Q8–Q10 | `SELECT FirstName, LastName, Email` |
| Natural Join | ⋈ | Q11–Q15 | rides ⋈ users ⋈ drivers |
| Aggregation | γ | Q16–Q20 | `GROUP BY City` + `SUM(Fare)` |
| Union | ∪ | Q21 | `SELECT ... FROM users UNION SELECT ... FROM drivers` |
| Intersection | ∩ | Q22 | `SELECT ... INTERSECT SELECT ...` |
| Difference | − | Q23–Q24 | `WHERE UserID NOT IN (SELECT ...)` |
| Subqueries | nested | Q25–Q30 | `HAVING SUM(Fare) > (SELECT AVG(...))` |

---

## ⚡ Business Rules & Triggers

All 7 business rules are enforced **at the database engine level** — they fire even if the database is accessed directly via SSMS, bypassing the application entirely.

| Trigger | Type | Table | Rule |
|---------|------|-------|------|
| `trg_calc_duration` | AFTER UPDATE | rides | Auto-calculates `RideDuration = DATEDIFF(MINUTE, StartTime, EndTime)` when `EndTime` is set |
| `trg_update_driver_rating` | AFTER INSERT | ratings | Recalculates `driver.Rating = ROUND(AVG(DriverRating), 2)` after every new rating |
| `trg_driver_busy_on_ride` | AFTER INSERT | rides | Sets `driver.Status = 'Busy'` when a Pending ride is inserted |
| `trg_driver_available_on_complete` | AFTER UPDATE | rides | Resets `driver.Status = 'Available'` when ride ends or is cancelled |
| `trg_no_concurrent_rides` | **INSTEAD OF** INSERT | rides | Blocks INSERT if user already has a Pending ride — `RAISERROR + RETURN` |
| `trg_validate_payment_ride` | **INSTEAD OF** INSERT | payments | Blocks payment INSERT if ride is Cancelled |
| `trg_prevent_delete_completed` | AFTER DELETE | rides | `RAISERROR + ROLLBACK TRANSACTION` if any Completed ride is deleted |

> **Why INSTEAD OF for BR-1 and BR-3?**
> SQL Server AFTER triggers fire *after* the row is already written — they cannot prevent the INSERT. INSTEAD OF fires *before* the storage engine writes anything, allowing clean rejection via `RAISERROR + RETURN` with zero side effects and no partial writes.

> **Why AFTER DELETE + ROLLBACK for BR-2?**
> SQL Server prohibits INSTEAD OF DELETE on tables with cascading FK children. AFTER DELETE + `ROLLBACK TRANSACTION` achieves the same result — the DELETE and all its cascades are rolled back atomically.

---

## 🔧 Stored Procedures

| Procedure | Parameters | Purpose |
|-----------|-----------|---------|
| `sp_get_user_rides` | `@UserID INT` | All rides for a user via `vw_ride_details` |
| `sp_available_drivers` | `@City VARCHAR(50) = NULL` | Available drivers with vehicle details |
| `sp_complete_ride` | `@RideID, @EndTime, @Fare` | Mark a ride Completed — fires BR-5 and BR-7 |
| `sp_apply_promo` | `@RideID, @PromoID, @NewFare OUTPUT` | Validate promo and compute discounted fare |
| `sp_monthly_revenue` | `@Year, @Month INT` | TotalRides, TotalRevenue, AvgFare, MinFare, MaxFare |
| `sp_driver_earnings` | `@DriverID, @StartDate, @EndDate` | Total rides and earnings for a driver in a date range |
| `sp_register_user` | `@First, @Last, @Email, @Phone` | Insert new user, return `SCOPE_IDENTITY()` |
| `sp_cancel_ride` | `@RideID INT` | Cancel a Pending ride — fires BR-7, returns `@@ROWCOUNT` |

---

## 🔐 Access Control (DCL)

Three database logins following the **principle of least privilege**:

```sql
-- Application user: read/write, no delete
CREATE LOGIN ride_app    WITH PASSWORD = 'App@Secure123!';
CREATE USER  ride_app    FOR LOGIN ride_app;
GRANT SELECT, INSERT, UPDATE ON SCHEMA::dbo TO ride_app;
DENY  DELETE                  ON SCHEMA::dbo TO ride_app;

-- Report user: read only
CREATE LOGIN ride_report WITH PASSWORD = 'Report@Secure123!';
CREATE USER  ride_report FOR LOGIN ride_report;
GRANT SELECT ON SCHEMA::dbo TO ride_report;

-- DBA: full control
CREATE LOGIN ride_dba    WITH PASSWORD = 'DBA@Secure123!';
CREATE USER  ride_dba    FOR LOGIN ride_dba;
ALTER ROLE db_owner ADD MEMBER ride_dba;
```

All `CREATE LOGIN` statements are wrapped in `IF NOT EXISTS` guards — safe to run the script multiple times.

**Verify permissions in SSMS:**
```sql
SELECT dp.name AS LoginName, p.permission_name, p.state_desc
FROM   sys.database_permissions p
JOIN   sys.database_principals  dp ON p.grantee_principal_id = dp.principal_id
WHERE  dp.name IN ('ride_app', 'ride_report', 'ride_dba')
ORDER  BY dp.name, p.permission_name;
```

---

## 🚀 How to Deploy to GitHub Pages

1. **Create a new repository** on GitHub (e.g. `rideshare-db`).

2. **Upload these 4 files** to the root of the repository:
   ```
   index.html
   style.css
   app.js
   data.js
   ```

3. Go to **Settings → Pages → Source → Deploy from branch → main → / (root)**.

4. Click **Save**. Your dashboard will be live at:
   ```
   https://yourusername.github.io/rideshare-db
   ```

> No build step, no Node.js, no dependencies. Pure HTML + CSS + JavaScript. Works in any modern browser.

---

## 🛠 Technologies Used

| Technology | Version | Purpose |
|------------|---------|---------|
| Microsoft SQL Server | 2019+ | Database engine |
| T-SQL | — | All DDL, DML, DQL, DCL, triggers, views, procedures |
| SSMS | 22 | Development and execution environment |
| HTML5 | — | Dashboard structure |
| CSS3 | — | Styling — dark theme, role colour system, responsive grid |
| JavaScript (ES6+) | — | Dashboard logic — role system, rendering, charts |
| Google Fonts | — | Inter + JetBrains Mono |
| GitHub Pages | — | Dashboard hosting |

---

## 📊 Data Coverage

The dashboard and SQL script use the same real dataset:

- **42 users** — registered Jan–Nov 2023, 4 cities
- **42 drivers** — ratings 4.1–4.9, mix of Available / Busy / Offline
- **42 vehicles** — Sedans, SUVs, vans, EVs from 2018–2022
- **42 locations** — 10 per city (New York, Chicago, Los Angeles, San Francisco)
- **42 promocodes** — discounts 5–50%, mix of active and expired
- **42 rides** — 40 Completed · 1 Pending · 1 Cancelled · Jan–Feb 2024
- **42 payments** — 40 Paid · 1 Pending · 1 Failed · Cash / Card / Online
- **40 ratings** — completed rides only · DriverRating mandatory · UserRating optional
- **$940.75** total revenue across all completed rides
- **$23.52** average fare · **31.4 min** average ride duration

---

*RideSharingDB — Database Systems Project · SQL Server T-SQL · SSMS 22*
