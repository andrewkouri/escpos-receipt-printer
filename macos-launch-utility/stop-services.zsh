#!/bin/zsh

# ESC/POS Receipt Printer - Stop Services Script
# This script stops the npm server and ngrok tunnel

# PID files directory
PID_DIR="/tmp/escpos-printer"
LOG_FILE="/tmp/escpos-printer-startup.log"

# Function to log messages
log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$LOG_FILE"
}

log_message "Stopping ESC/POS Receipt Printer services..."

# Stop npm server
if [[ -f "$PID_DIR/npm.pid" ]]; then
    NPM_PID=$(cat "$PID_DIR/npm.pid")
    if kill -0 $NPM_PID 2>/dev/null; then
        log_message "Stopping npm server (PID: $NPM_PID)"
        kill $NPM_PID
        sleep 2
        # Force kill if still running
        if kill -0 $NPM_PID 2>/dev/null; then
            kill -9 $NPM_PID 2>/dev/null
        fi
    fi
    rm -f "$PID_DIR/npm.pid"
fi

# Stop ngrok
if [[ -f "$PID_DIR/ngrok.pid" ]]; then
    NGROK_PID=$(cat "$PID_DIR/ngrok.pid")
    if kill -0 $NGROK_PID 2>/dev/null; then
        log_message "Stopping ngrok tunnel (PID: $NGROK_PID)"
        kill $NGROK_PID
        sleep 2
        # Force kill if still running
        if kill -0 $NGROK_PID 2>/dev/null; then
            kill -9 $NGROK_PID 2>/dev/null
        fi
    fi
    rm -f "$PID_DIR/ngrok.pid"
fi

# Clean up any remaining processes
pkill -f "ngrok http $LOCAL_PORT" 2>/dev/null
pkill -f "npm run" 2>/dev/null

log_message "Service shutdown completed"

# Remove URLs file
rm -f "/tmp/escpos-printer-urls.txt"

echo "ESC/POS Receipt Printer services stopped"
