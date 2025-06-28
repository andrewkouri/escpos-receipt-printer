const usb = require("usb");
const {
  ThermalPrinter,
  PrinterTypes,
  CharacterSet,
} = require("node-thermal-printer");
const readline = require("readline");

// Your printer USB info
const VENDOR_ID = 0x20d1;
const PRODUCT_ID = 0x7008;

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function findPrinter() {
  try {
    // Find the USB device
    const device = usb.findByIds(VENDOR_ID, PRODUCT_ID);

    if (!device) {
      console.log(
        "Printer not found. Make sure it's connected and powered on."
      );
      return null;
    }

    console.log("Printer found!");

    // Create thermal printer instance
    const printer = new ThermalPrinter({
      type: PrinterTypes.EPSON,
      interface: `usb://${VENDOR_ID.toString(16).padStart(
        4,
        "0"
      )}:${PRODUCT_ID.toString(16).padStart(4, "0")}`,
      characterSet: CharacterSet.PC852_LATIN2,
      removeSpecialCharacters: false,
      lineCharacter: "-",
    });

    // Test connection
    const isConnected = await printer.isPrinterConnected();
    if (!isConnected) {
      console.log("Could not connect to printer");
      return null;
    }

    return printer;
  } catch (error) {
    console.error("Error finding printer:", error.message);
    return null;
  }
}

async function printText(printer, text) {
  try {
    printer.clear();
    printer.println(text);
    printer.cut();

    await printer.execute();
    console.log("Printed successfully!\n");
  } catch (error) {
    console.error("Error printing:", error.message);
  }
}

async function main() {
  console.log("Thermal Printer Controller (Node.js)");
  console.log("=====================================");

  const printer = await findPrinter();
  if (!printer) {
    process.exit(1);
  }

  console.log("\nPrinter ready! Type your text and press Enter to print.");
  console.log('Type "quit" to exit.\n');

  const askForInput = () => {
    rl.question('Enter text to print (or "quit" to exit): ', async (input) => {
      if (input.trim().toLowerCase() === "quit") {
        console.log("Exiting...");
        rl.close();
        return;
      }

      if (input.trim()) {
        await printText(printer, input);
      }

      askForInput(); // Ask for next input
    });
  };

  askForInput();
}

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\nShutting down...");
  rl.close();
  process.exit(0);
});

// Run the application
main().catch(console.error);
