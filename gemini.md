# Laburemos Project Overview

This project is a professional freelance platform built with a Next.js frontend and a NestJS backend, designed for production deployment on AWS.

## Project Structure

The project is a monorepo with the following key directories:

- `frontend/`: Contains the Next.js application.
- `backend/`: Contains the NestJS application.
- `docker/`: Docker-related configurations.
- `database/`: Database schema and migration files.
- `scripts/`: Various utility scripts, including setup and deployment.
- `docs/`: Comprehensive project documentation.

## How to Run the Application (Windows)

This project requires Node.js and XAMPP (for MySQL, though PostgreSQL is also used) to be installed.

**Prerequisites:**

1.  **Node.js:** Download and install from [https://nodejs.org/](https://nodejs.org/).
2.  **XAMPP:** Download and install from [https://www.apachefriends.org/](https://www.apachefriends.org/). Ensure it's installed at `C:\xampp\`.

**Steps to Start:**

1.  Open your file explorer and navigate to the project root directory: `C:\laburemos\`.
2.  Double-click on `start-windows.bat`.

This script will:

-   Verify Node.js and XAMPP installations.
-   Start XAMPP services.
-   Install frontend (Next.js) and backend (NestJS) dependencies if they are not already installed.
-   Start the frontend, accessible at `http://localhost:3000`.
-   Start the backend, accessible at `http://localhost:3001`.

Two new command prompt windows will open for the frontend and backend processes.

## Database Information

-   **PostgreSQL:** Used with Prisma ORM for the modern stack. The SQL schema is available in `database-final.md`.
-   **MySQL:** Used by the legacy PHP application, integrated via XAMPP.

## Key Scripts

-   `start-windows.bat`: Main script to start the local development environment.
-   `setup-windows.bat`: Initial setup script for Windows.
-   `deploy.sh`: Script for deploying to production (AWS).
-   `db:setup` (in `package.json`): Sets up the backend database (Prisma).

## Live Production Environment

-   **Frontend:** `https://laburemos.com.ar` (CloudFront CDN)
-   **Backend API:** `http://3.81.56.168:3001` (EC2 instance)
-   **Database:** AWS RDS PostgreSQL

For more detailed information, refer to the `claude.md` and `README.md` files in the project root.