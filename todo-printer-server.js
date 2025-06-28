const express = require("express");
const usb = require("usb");
const {
  ThermalPrinter,
  PrinterTypes,
  CharacterSet,
} = require("node-thermal-printer");

// Your printer USB info
const VENDOR_ID = 0x20d1;
const PRODUCT_ID = 0x7008;

class TodoPrinter {
  constructor() {
    this.printer = null;
  }

  async connect() {
    try {
      // Find the USB device first
      const device = usb.findByIds(VENDOR_ID, PRODUCT_ID);

      if (!device) {
        return false;
      }

      // Initialize printer with node-thermal-printer using USB interface
      this.printer = new ThermalPrinter({
        type: PrinterTypes.EPSON,
        interface: `usb://${VENDOR_ID.toString(16).padStart(
          4,
          "0"
        )}:${PRODUCT_ID.toString(16).padStart(4, "0")}`,
        characterSet: CharacterSet.PC852_LATIN2,
        removeSpecialCharacters: false,
        lineCharacter: "=",
      });

      // Test connection
      const isConnected = await this.printer.isPrinterConnected();
      return isConnected;
    } catch (error) {
      console.error("Error initializing printer:", error.message);
      return false;
    }
  }

  async printTodoTicket(title, assignee = null, description = null) {
    if (!this.printer) {
      throw new Error("Printer not initialized");
    }

    try {
      // Clear buffer
      this.printer.clear();

      // Top header with emphasis
      this.printer.alignCenter();
      this.printer.setTextSize(2, 2);
      this.printer.bold(true);
      this.printer.invert(true);
      this.printer.println(" TODO ");
      this.printer.invert(false);
      this.printer.bold(false);
      this.printer.setTextNormal();

      // Task title section
      this.printer.alignLeft();
      this.printer.drawLine();

      // Title with large text
      this.printer.setTextSize(1, 2);
      this.printer.bold(true);
      const wrappedTitle = this.wrapText(title, 24);
      wrappedTitle.split("\n").forEach((line) => {
        this.printer.println(line);
      });
      this.printer.bold(false);
      this.printer.setTextNormal();
      this.printer.newLine();

      // Assignee section with highlight
      if (assignee && assignee.trim()) {
        this.printer.setTextSize(1, 1);
        this.printer.bold(true);
        this.printer.print("OWNER: ");
        this.printer.bold(false);
        this.printer.underline(true);
        this.printer.println(assignee.trim());
        this.printer.underline(false);
        this.printer.newLine();
      }

      // Description section with indentation
      if (description && description.trim()) {
        this.printer.bold(true);
        this.printer.println("NOTES:");
        this.printer.bold(false);

        // Indent and wrap description
        const wrappedDesc = this.wrapText(description.trim(), 22); // 24 chars minus "> " prefix
        wrappedDesc.split("\n").forEach((line) => {
          this.printer.println(`> ${line}`);
        });
        this.printer.newLine();
      }

      // Timestamp
      this.printer.alignCenter();
      this.printer.setTextSize(1, 1);
      const now = new Date();

      // Round to nearest hour (9:31 -> 10a, 9:29 -> 9a)
      const roundedHour =
        now.getMinutes() >= 30 ? now.getHours() + 1 : now.getHours();
      const hour12 =
        roundedHour === 0
          ? 12
          : roundedHour > 12
          ? roundedHour - 12
          : roundedHour;
      const ampm = roundedHour >= 12 && roundedHour < 24 ? "p" : "a";

      const timestamp = `${hour12}${ampm} ${now.toLocaleDateString("en-US", {
        weekday: "short",
      })} - ${now.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })}`;
      this.printer.println(timestamp);
      this.printer.setTextNormal();
      this.printer.alignLeft();

      // Cut paper
      this.printer.cut();

      // Execute print job
      await this.printer.execute();

      console.log("✅ Ticket printed successfully");
    } catch (error) {
      throw new Error(`Print error: ${error.message}`);
    }
  }

  // Simple word-wrap function
  wrapText(text, width) {
    const words = text.split(" ");
    const lines = [];
    let currentLine = "";

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;

      if (testLine.length <= width) {
        currentLine = testLine;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }

    if (currentLine) lines.push(currentLine);
    return lines.join("\n");
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

// Start server first, then connect to printer
app.listen(port, async () => {
  console.log(
    `📋 Todo Ticket Printer Server running on http://localhost:${port}`
  );
  console.log(`📄 Visit http://localhost:${port} for API documentation`);

  // Connect to printer after server starts
  console.log("🔌 Connecting to printer...");
  printerConnected = await printer.connect();

  if (printerConnected) {
    console.log("🖨️  Printer status: Connected ✅");
  } else {
    console.log("🖨️  Printer status: Not connected ❌");
    console.log(
      "    Make sure the printer is powered on and connected via USB"
    );
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    printer: printerConnected ? "connected" : "disconnected",
    timestamp: new Date().toISOString(),
  });
});

// Print todo ticket endpoint
app.post("/print-todo", async (req, res) => {
  try {
    const { title, assignee, description } = req.body;

    // Validate required fields
    if (!title || typeof title !== "string" || title.trim() === "") {
      return res.status(400).json({
        error: "Title is required and must be a non-empty string",
      });
    }

    if (!printerConnected) {
      return res.status(503).json({
        error: "Printer is not connected",
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
      message: "Todo ticket printed successfully",
      ticket: {
        title: title.trim(),
        assignee: assignee ? String(assignee).trim() : null,
        description: description ? String(description).trim() : null,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Print error:", error);
    res.status(500).json({
      error: "Failed to print ticket",
      details: error.message,
    });
  }
});

// Get printer status
app.get("/printer-status", (req, res) => {
  res.json({
    connected: printerConnected,
    type: "EPSON",
    interface: `usb://${VENDOR_ID.toString(16).padStart(
      4,
      "0"
    )}:${PRODUCT_ID.toString(16).padStart(4, "0")}`,
    vendor_id: `0x${VENDOR_ID.toString(16)}`,
    product_id: `0x${PRODUCT_ID.toString(16)}`,
  });
});

// Basic usage info endpoint
app.get("/", (req, res) => {
  res.json({
    name: "Todo Ticket Printer Server",
    version: "1.0.0",
    endpoints: {
      "GET /": "This help message",
      "GET /health": "Health check",
      "GET /printer-status": "Printer connection status",
      "POST /print-todo": "Print a todo ticket",
    },
    usage: {
      "POST /print-todo": {
        body: {
          title: "string (required) - The main task title",
          assignee: "string (optional) - Person assigned to the task",
          description: "string (optional) - Additional task details",
        },
      },
    },
    example: {
      title: "Fix the login bug",
      assignee: "John Doe",
      description:
        "Users are unable to login with special characters in their passwords",
    },
  });
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n👋 Shutting down server...");
  printer.disconnect();
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n👋 Shutting down server...");
  printer.disconnect();
  process.exit(0);
});
