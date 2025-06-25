const express = require('express');
const usb = require('usb');

// Your printer USB info
const VENDOR_ID = 0x0fe6;
const PRODUCT_ID = 0x811e;
const INTERFACE_NUMBER = 0;
const ENDPOINT_ADDRESS = 0x02;

class TodoPrinter {
    constructor() {
        this.device = null;
        this.interface = null;
        this.endpoint = null;
    }

    async connect() {
        try {
            // Find the USB device
            this.device = usb.findByIds(VENDOR_ID, PRODUCT_ID);
            
            if (!this.device) {
                throw new Error('Printer not found. Make sure it\'s connected and powered on.');
            }

            console.log('Printer found!');
            
            // Open the device
            this.device.open();
            
            // Get the interface
            this.interface = this.device.interface(INTERFACE_NUMBER);
            
            // Claim the interface
            if (this.interface.isKernelDriverActive()) {
                this.interface.detachKernelDriver();
            }
            this.interface.claim();
            
            // Find the OUT endpoint
            this.endpoint = this.interface.endpoints.find(ep => 
                ep.direction === 'out' && 
                (ep.address === ENDPOINT_ADDRESS || ep.address === 0x01)
            );
            
            if (!this.endpoint) {
                this.endpoint = this.interface.endpoints.find(ep => ep.direction === 'out');
            }
            
            if (!this.endpoint) {
                throw new Error('No suitable endpoint found');
            }

            console.log(`Connected to endpoint: 0x${this.endpoint.address.toString(16)}`);
            return true;
        } catch (error) {
            console.error('Error connecting to printer:', error.message);
            return false;
        }
    }

    async printTodoTicket(title, assignee = null, description = null) {
        if (!this.endpoint) {
            throw new Error('Printer not connected');
        }

        try {
            // ESC/POS commands
            const ESC = '\x1b';
            const INIT = ESC + '@';          // Initialize printer
            const CUT = ESC + 'i';           // Cut paper
            const LF = '\n';                 // Line feed
            const CENTER = ESC + 'a1';       // Center alignment
            const LEFT = ESC + 'a0';         // Left alignment
            const BOLD_ON = ESC + 'E1';      // Bold on
            const BOLD_OFF = ESC + 'E0';     // Bold off
            const DOUBLE_HEIGHT = ESC + '!1'; // Double height text
            const LARGE_TEXT = ESC + '!17';   // Double height + width
            const NORMAL_TEXT = ESC + '!0';   // Normal text
            
            // Build the ticket
            let ticket = `${INIT}${CENTER}${LARGE_TEXT}TODO TICKET${NORMAL_TEXT}${LEFT}${LF}`;
            ticket += '========================' + LF;
            ticket += LF;
            
            // Title takes up 75% of the ticket height
            ticket += `${DOUBLE_HEIGHT}${BOLD_ON}TASK:${BOLD_OFF}${NORMAL_TEXT}${LF}`;
            ticket += LF;
            ticket += this.wrapText(title, 32) + LF;
            ticket += LF;
            
            // Add some spacing to make title prominent (75% of content)
            ticket += LF.repeat(2);
            
            // Assignee section (if provided)
            if (assignee && assignee.trim()) {
                ticket += `${BOLD_ON}ASSIGNED TO:${BOLD_OFF} ${assignee.trim()}${LF}`;
                ticket += LF;
            }
            
            // Description section (if provided)
            if (description && description.trim()) {
                ticket += `${BOLD_ON}DESCRIPTION:${BOLD_OFF}${LF}`;
                ticket += this.wrapText(description.trim(), 32) + LF;
                ticket += LF;
            }
            
            // Footer
            ticket += `${CENTER}${NORMAL_TEXT}Created: ${new Date().toLocaleString()}${LEFT}${LF}`;
            
            // Add spacing at bottom for pinning/tearing
            ticket += LF.repeat(6);
            ticket += CUT;
            
            const buffer = Buffer.from(ticket, 'utf8');
            
            return new Promise((resolve, reject) => {
                this.endpoint.transfer(buffer, (error) => {
                    if (error) {
                        reject(new Error(`Print failed: ${error.message}`));
                    } else {
                        resolve();
                    }
                });
            });
        } catch (error) {
            throw new Error(`Print error: ${error.message}`);
        }
    }

    // Helper function to wrap text to specified width
    wrapText(text, width) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';

        for (const word of words) {
            if ((currentLine + word).length <= width) {
                currentLine += (currentLine ? ' ' : '') + word;
            } else {
                if (currentLine) {
                    lines.push(currentLine);
                }
                currentLine = word;
            }
        }
        
        if (currentLine) {
            lines.push(currentLine);
        }

        return lines.join('\n');
    }

    disconnect() {
        try {
            if (this.interface) {
                this.interface.release();
            }
            if (this.device) {
                this.device.close();
            }
        } catch (error) {
            console.error('Error disconnecting:', error.message);
        }
    }
}

// Create Express app
const app = express();
const port = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize printer
const printer = new TodoPrinter();
let printerConnected = false;

// Connect to printer on startup
(async () => {
    printerConnected = await printer.connect();
    if (printerConnected) {
        console.log('✅ Printer connected successfully');
    } else {
        console.log('❌ Failed to connect to printer');
    }
})();

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        printer: printerConnected ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString()
    });
});

// Print todo ticket endpoint
app.post('/print-todo', async (req, res) => {
    try {
        const { title, assignee, description } = req.body;

        // Validate required fields
        if (!title || typeof title !== 'string' || title.trim() === '') {
            return res.status(400).json({
                error: 'Title is required and must be a non-empty string'
            });
        }

        if (!printerConnected) {
            return res.status(503).json({
                error: 'Printer is not connected'
            });
        }

        // Print the ticket
        await printer.printTodoTicket(
            title.trim(),
            assignee ? String(assignee).trim() : null,
            description ? String(description).trim() : null
        );

        res.json({
            success: true,
            message: 'Todo ticket printed successfully',
            ticket: {
                title: title.trim(),
                assignee: assignee ? String(assignee).trim() : null,
                description: description ? String(description).trim() : null,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Print error:', error);
        res.status(500).json({
            error: 'Failed to print ticket',
            details: error.message
        });
    }
});

// Get printer status
app.get('/printer-status', (req, res) => {
    res.json({
        connected: printerConnected,
        vendor_id: VENDOR_ID.toString(16),
        product_id: PRODUCT_ID.toString(16)
    });
});

// Basic usage info endpoint
app.get('/', (req, res) => {
    res.json({
        name: 'Todo Ticket Printer Server',
        version: '1.0.0',
        endpoints: {
            'GET /': 'This help message',
            'GET /health': 'Health check',
            'GET /printer-status': 'Printer connection status',
            'POST /print-todo': 'Print a todo ticket'
        },
        usage: {
            'POST /print-todo': {
                body: {
                    title: 'string (required) - The main task title',
                    assignee: 'string (optional) - Person assigned to the task',
                    description: 'string (optional) - Additional task details'
                }
            }
        },
        example: {
            title: 'Fix the login bug',
            assignee: 'John Doe',
            description: 'Users are unable to login with special characters in their passwords'
        }
    });
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n👋 Shutting down server...');
    printer.disconnect();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n👋 Shutting down server...');
    printer.disconnect();
    process.exit(0);
});

// Start server
app.listen(port, () => {
    console.log(`📋 Todo Ticket Printer Server running on http://localhost:${port}`);
    console.log(`📄 Visit http://localhost:${port} for API documentation`);
    console.log(`🖨️  Printer status: ${printerConnected ? 'Connected' : 'Not connected'}`);
});
