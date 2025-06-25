#!/usr/bin/env node

// Simple test client for the Todo Printer Server
// Usage: node test-client.js [title] [assignee] [description]

const http = require('http');

const args = process.argv.slice(2);

if (args.length === 0) {
    console.log('Todo Printer Test Client');
    console.log('========================');
    console.log('');
    console.log('Usage:');
    console.log('  node test-client.js "Task title" [assignee] [description]');
    console.log('');
    console.log('Examples:');
    console.log('  node test-client.js "Fix login bug"');
    console.log('  node test-client.js "Fix login bug" "John Doe"');
    console.log('  node test-client.js "Fix login bug" "John Doe" "Users cannot login with special chars"');
    console.log('');
    console.log('You can also test with curl:');
    console.log('  curl -X POST http://localhost:3000/print-todo \\');
    console.log('    -H "Content-Type: application/json" \\');
    console.log('    -d \'{"title":"Fix login bug","assignee":"John Doe","description":"Urgent fix needed"}\'');
    process.exit(1);
}

const title = args[0];
const assignee = args[1] || null;
const description = args[2] || null;

const data = JSON.stringify({
    title,
    assignee,
    description
});

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/print-todo',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

console.log('📋 Sending todo ticket to printer...');
console.log(`Title: ${title}`);
if (assignee) console.log(`Assignee: ${assignee}`);
if (description) console.log(`Description: ${description}`);
console.log('');

const req = http.request(options, (res) => {
    let responseData = '';

    res.on('data', (chunk) => {
        responseData += chunk;
    });

    res.on('end', () => {
        try {
            const response = JSON.parse(responseData);
            
            if (res.statusCode === 200) {
                console.log('✅ Success!');
                console.log('🖨️  Ticket printed successfully');
                console.log(`📅 Timestamp: ${response.ticket.timestamp}`);
            } else {
                console.log('❌ Error:');
                console.log(`Status: ${res.statusCode}`);
                console.log(`Message: ${response.error || response.message}`);
                if (response.details) {
                    console.log(`Details: ${response.details}`);
                }
            }
        } catch (error) {
            console.log('❌ Error parsing response:');
            console.log(responseData);
        }
    });
});

req.on('error', (error) => {
    console.log('❌ Request failed:');
    console.log(`Error: ${error.message}`);
    console.log('');
    console.log('Make sure the server is running:');
    console.log('  npm run todo-server');
});

req.write(data);
req.end();
