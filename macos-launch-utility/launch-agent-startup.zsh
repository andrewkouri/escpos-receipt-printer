#!/bin/zsh

# ESC/POS Receipt Printer - Launch Agent Compatible Startup Script
# This script launches both ngrok tunnel and npm server for launch agent execution

# Configuration
PROJECT_DIR="/Users/USERNAME/Developer/escpos-receipt-printer"
NPM_SCRIPT="todo-server"
LOCAL_PORT=3000     # Default port, adjust based on your server configuration
NGROK_SUBDOMAIN=""  # Optional: set a custom subdomain (requires ngrok pro)

# Log file for debugging
LOG_FILE="/tmp/escpos-printer-startup.log"

# Function to log messages
log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$LOG_FILE"
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Start logging
log_message "Starting ESC/POS Receipt Printer services..."

# Check prerequisites
log_message "Checking prerequisites..."

# Check if node/npm is installed
if ! command_exists npm; then
    log_message "ERROR: npm is not installed"
    exit 1
fi

# Check if ngrok is installed
if ! command_exists ngrok; then
    log_message "ERROR: ngrok is not installed"
    exit 1
fi

# Change to project directory
log_message "Changing to project directory: $PROJECT_DIR"
cd "$PROJECT_DIR" || {
    log_message "ERROR: Could not change to project directory: $PROJECT_DIR"
    exit 1
}

# Install npm dependencies if node_modules doesn't exist
if [[ ! -d "node_modules" ]]; then
    log_message "Installing npm dependencies..."
    npm install >> "$LOG_FILE" 2>&1
    if [[ $? -ne 0 ]]; then
        log_message "ERROR: Failed to install npm dependencies"
        exit 1
    fi
fi

# Create PID files directory
PID_DIR="/tmp/escpos-printer"
mkdir -p "$PID_DIR"

# Start npm server in background
log_message "Starting npm server with script: $NPM_SCRIPT"
npm run $NPM_SCRIPT >> "$LOG_FILE" 2>&1 &
NPM_PID=$!
echo $NPM_PID > "$PID_DIR/npm.pid"

# Wait a moment for the server to start
sleep 5

# Check if npm server is still running
if ! kill -0 $NPM_PID 2>/dev/null; then
    log_message "ERROR: npm server failed to start"
    exit 1
fi

log_message "npm server started successfully (PID: $NPM_PID)"

# Start ngrok tunnel
log_message "Starting ngrok tunnel on port $LOCAL_PORT"

if [[ -n $NGROK_SUBDOMAIN ]]; then
    log_message "Using custom subdomain: $NGROK_SUBDOMAIN"
    ngrok http $LOCAL_PORT --subdomain=$NGROK_SUBDOMAIN --log=stdout >> "$LOG_FILE" 2>&1 &
else
    ngrok http $LOCAL_PORT --log=stdout >> "$LOG_FILE" 2>&1 &
fi

NGROK_PID=$!
echo $NGROK_PID > "$PID_DIR/ngrok.pid"

# Wait a moment for ngrok to establish tunnel
sleep 8

# Check if ngrok is still running
if ! kill -0 $NGROK_PID 2>/dev/null; then
    log_message "ERROR: ngrok failed to start"
    # Cleanup npm process
    if kill -0 $NPM_PID 2>/dev/null; then
        kill $NPM_PID
        rm -f "$PID_DIR/npm.pid"
    fi
    exit 1
fi

log_message "ngrok tunnel started successfully (PID: $NGROK_PID)"

# Try to get ngrok tunnel URL and log it
sleep 3
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null | grep -o '"public_url":"[^"]*' | grep https | head -1 | cut -d'"' -f4)

if [[ -n $NGROK_URL ]]; then
    log_message "Services are now running!"
    log_message "Local server: http://localhost:$LOCAL_PORT"
    log_message "Public URL: $NGROK_URL"
    log_message "ngrok dashboard: http://localhost:4040"
    
    # Write URLs to a file for easy access
    echo "ESC/POS Receipt Printer Services" > "/tmp/escpos-printer-urls.txt"
    echo "Started: $(date)" >> "/tmp/escpos-printer-urls.txt"
    echo "Local server: http://localhost:$LOCAL_PORT" >> "/tmp/escpos-printer-urls.txt"
    echo "Public URL: $NGROK_URL" >> "/tmp/escpos-printer-urls.txt"
    echo "ngrok dashboard: http://localhost:4040" >> "/tmp/escpos-printer-urls.txt"
else
    log_message "WARNING: Could not retrieve ngrok public URL. Check ngrok dashboard at http://localhost:4040"
fi

log_message "Startup completed successfully. Services are running in background."

# The script exits here, but the background processes continue running
# LaunchAgent will keep them alive
exit 0
