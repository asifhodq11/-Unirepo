# ==========================================
# ReplyIQ Multi-Stage Dockerfile
# Stage 1: Build the React Frontend
# ==========================================
FROM node:20-alpine AS build-stage
WORKDIR /app/frontend

# Install dependencies first (for better caching)
COPY frontend/package*.json ./
RUN npm install

# Build the frontend
COPY frontend/ ./
RUN npm run build

# ==========================================
# Stage 2: Build the Flask Backend
# ==========================================
FROM python:3.12-slim
WORKDIR /app

# Install system essentials
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy all source files
COPY . .

# Copy the built frontend from Stage 1
# We put it exactly where the Flask app expects it: /app/frontend/dist
COPY --from=build-stage /app/frontend/dist /app/frontend/dist

# Railway automatically sets the PORT environment variable
ENV PORT=8080
EXPOSE 8080

# Start the application with Gunicorn
CMD gunicorn --bind 0.0.0.0:$PORT --workers 2 --timeout 60 run:app
