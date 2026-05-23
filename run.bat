@echo off
echo Starting Vogue Artisan Backend (FastAPI)...
start cmd /k "cd backend && ..\\.venv\\Scripts\\uvicorn main:app --reload --port 8000"

echo Starting Verification Service (Flask)...
start cmd /k ".venv\\Scripts\\python backend/verification_service.py"

echo Starting Frontend (Vite)...
cd frontend
npm run dev
