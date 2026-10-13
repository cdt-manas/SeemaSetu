#!/bin/bash

echo "🛡️  Starting Seema Setu..."
echo ""

# Start Flask backend
echo "⚙️  Starting Flask Backend..."
cd backend
source venv/bin/activate
python3 app.py &
BACKEND_PID=$!
echo "✅ Backend running on http://127.0.0.1:5000"

# Go back to root
cd ..

# Wait 2 seconds for backend to initialize
sleep 2

# Start React frontend
echo ""
echo "⚛️  Starting React Frontend..."
yarn dev &
FRONTEND_PID=$!
echo "✅ Frontend running on http://localhost:5173"

echo ""
echo "🚀 Seema Setu is running!"
echo "   Frontend → http://localhost:5173"
echo "   Backend  → http://127.0.0.1:5000"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait and handle Ctrl+C
trap "echo ''; echo 'Stopping Seema Setu...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait