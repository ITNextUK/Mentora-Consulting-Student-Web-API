#!/bin/bash
# Mentora Student Web API - Initialization Script for Linux/Mac
# This script sets up the project for first-time use

echo ""
echo "========================================"
echo " Mentora Student Web API Setup"
echo "========================================"
echo ""

# Check if Node.js is installed
echo "[1/6] Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed. Please install Node.js 18 or higher."
    echo "Download from: https://nodejs.org/"
    exit 1
fi
echo "Node.js is installed: $(node --version)"
echo ""

# Check if npm is installed
echo "[2/6] Checking npm installation..."
if ! command -v npm &> /dev/null; then
    echo "ERROR: npm is not installed."
    exit 1
fi
echo "npm is installed: $(npm --version)"
echo ""

# Install dependencies
echo "[3/6] Installing dependencies..."
echo "This may take a few minutes..."
npm install
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install dependencies"
    exit 1
fi
echo "Dependencies installed successfully!"
echo ""

# Create .env file if it doesn't exist
echo "[4/6] Setting up environment configuration..."
if [ ! -f .env ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    echo ".env file created! Please edit it with your database credentials."
    echo "IMPORTANT: Update the following in .env file:"
    echo "  - DB_PASSWORD"
    echo "  - JWT_SECRET"
    echo "  - SMTP credentials (if using email features)"
    echo ""
else
    echo ".env file already exists. Skipping..."
    echo ""
fi

# Create upload directories
echo "[5/6] Creating upload directories..."
mkdir -p uploads/cv
mkdir -p uploads/profilePictures
mkdir -p logs
echo "Upload directories ready!"
echo ""

# Display next steps
echo "[6/6] Setup Complete!"
echo ""
echo "========================================"
echo " Next Steps:"
echo "========================================"
echo ""
echo "1. Edit .env file with your configuration:"
echo "   - Database credentials (DB_PASSWORD)"
echo "   - JWT secret (JWT_SECRET)"
echo "   - CORS origin (CORS_ORIGIN)"
echo ""
echo "2. Run database migration:"
echo "   npm run migrate"
echo ""
echo "3. Start the server:"
echo "   npm run dev  (development mode)"
echo "   npm start    (production mode)"
echo ""
echo "4. Test the API:"
echo "   curl http://localhost:5001/health"
echo ""
echo "========================================"
echo " Documentation:"
echo "========================================"
echo ""
echo "- README.md - Main documentation"
echo "- SETUP.md - Detailed setup guide"
echo "- API_DOCUMENTATION.md - API reference"
echo "- PROJECT_SUMMARY.md - Complete overview"
echo ""
echo "========================================"
echo ""
