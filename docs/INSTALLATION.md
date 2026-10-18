# Apex EAMS & Commercial Operations — Installation Guide

## 1. System Requirements

- **Node.js**: v20+ or v22 LTS
- **Package Manager**: npm v10+
- **Memory**: Minimum 2 GB RAM (4 GB recommended)
- **Disk**: 500 MB free space
- **Operating System**: Linux, macOS, or Windows WSL2

---

## 2. Local Development Setup

1. **Clone and Navigate**:
   ```bash
   cd <project-directory>
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy the provided `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```

4. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   The application and backend API server will start on `http://localhost:3000`.

5. **Verify REST API & Health**:
   - Web application: `http://localhost:3000`
   - API health check: `http://localhost:3000/api/health`
   - OpenAPI 3.0 specification: `http://localhost:3000/api/v1/openapi.json`

---

## 3. Production Deployment with Docker

1. **Build and Run with Docker Compose**:
   ```bash
   docker-compose up -d --build
   ```

2. **Verify Container Health**:
   ```bash
   docker-compose ps
   docker-compose logs -f apex-eams
   ```

3. **Stop the Application**:
   ```bash
   docker-compose down
   ```

---

## 4. Automated Verification Testing

You can run automated integration tests at any time either:
- Via the in-app **Automated Test Suite** tab (`/test-runner`)
- Via curl:
  ```bash
  curl http://localhost:3000/api/v1/system/run-tests
  ```
