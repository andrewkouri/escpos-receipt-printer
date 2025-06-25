# Todo Ticket Printer Server

An Express.js server that prints todo tickets to a thermal receipt printer via USB.

## Features

- 🎫 Print todo tickets with title, assignee, and description
- 🖨️ Direct USB thermal printer integration
- 📋 RESTful API endpoints
- ✅ Built-in completion checkbox and notes section
- 📱 Easy to integrate with other applications

## Installation

1. Install dependencies:
```bash
npm install
```

2. Connect your thermal printer via USB

3. Update the USB vendor/product IDs in `todo-printer-server.js` if needed:
```javascript
const VENDOR_ID = 0x0fe6;  // Your printer's vendor ID
const PRODUCT_ID = 0x811e; // Your printer's product ID
```

## Usage

### Start the Server

```bash
npm run todo-server
```

The server will start on `http://localhost:3000`

### API Endpoints

#### POST /print-todo
Print a todo ticket

**Request Body:**
```json
{
  "title": "Fix the login bug",           // Required: Main task title
  "assignee": "John Doe",                 // Optional: Person assigned
  "description": "Users cannot login..."  // Optional: Task details
}
```

**Response:**
```json
{
  "success": true,
  "message": "Todo ticket printed successfully",
  "ticket": {
    "title": "Fix the login bug",
    "assignee": "John Doe",
    "description": "Users cannot login...",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

#### GET /health
Check server and printer status

#### GET /printer-status
Get printer connection details

#### GET /
API documentation and usage examples

## Examples

### Using curl
```bash
# Simple ticket with just a title
curl -X POST http://localhost:3000/print-todo \
  -H "Content-Type: application/json" \
  -d '{"title":"Review pull request #123"}'

# Full ticket with assignee and description
curl -X POST http://localhost:3000/print-todo \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Fix login bug",
    "assignee": "John Doe", 
    "description": "Users are unable to login with special characters in their passwords"
  }'
```

### Using the test client
```bash
# Simple ticket
node test-client.js "Fix login bug"

# With assignee
node test-client.js "Fix login bug" "John Doe"

# Full ticket
node test-client.js "Fix login bug" "John Doe" "Users cannot login with special chars"
```

### Using JavaScript fetch
```javascript
const response = await fetch('http://localhost:3000/print-todo', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    title: 'Update documentation',
    assignee: 'Alice Smith',
    description: 'Add API documentation for the new endpoints'
  })
});

const result = await response.json();
console.log(result);
```


## Troubleshooting

### Printer Not Found
- Ensure printer is connected via USB
- Check if printer is powered on
- Verify USB vendor/product IDs match your printer
- Try running `lsusb` (Linux/Mac) to see connected devices

### Permission Errors
- On Linux, you may need to add your user to the `lp` group
- On Mac, you may need to grant permission to access USB devices

### Print Quality Issues
- Check printer paper
- Ensure printer drivers are not interfering
- Try different ESC/POS commands if formatting looks wrong


## Related Files

- `todo-printer-server.js` - Main server file
- `test-client.js` - Test client for trying the API

## ESC/POS Commands Used

The server uses standard ESC/POS commands for thermal printers:
- Text formatting (bold, double height, centering)
- Paper cutting
- Line feeds and spacing
- Character encoding (UTF-8)
