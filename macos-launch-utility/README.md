## How to make this run on login on macOS

### Option 1: Interactive Mode (Manual Start)
Use `sample-startup-script.zsh` for interactive testing and development:
```bash
./sample-startup-script.zsh
```
This script provides colored output and can be stopped with Ctrl+C.

### Option 2: Launch Agent (Automatic Start on Login)

For automatic startup on login, use the launch agent compatible version:

1. **Edit the configuration**: Update the username in the scripts
   ```bash
   # Edit launch-agent-startup.zsh and change USERNAME to your actual username
   sed -i '' 's/USERNAME/andrew/g' launch-agent-startup.zsh
   
   # Edit startupscript.plist and change YOUR_USERNAME to your actual username  
   sed -i '' 's/YOUR_USERNAME/andrew/g' startupscript.plist
   ```

2. **Copy the plist file to LaunchAgents**:
   ```bash
   cp startupscript.plist ~/Library/LaunchAgents/com.user.escpos-printer-startup.plist
   ```

3. **Load the launch agent**:
   ```bash
   launchctl load ~/Library/LaunchAgents/com.user.escpos-printer-startup.plist
   ```

4. **Test the launch agent**:
   ```bash
   launchctl start com.user.escpos-printer-startup
   ```

### Managing the Services

**Check if services are running**:
```bash
# Check the log file
tail -f /tmp/escpos-printer-startup.log

# Check the URLs file
cat /tmp/escpos-printer-urls.txt

# Check processes
ps aux | grep -E "(ngrok|npm run)"
```

**Stop the services manually**:
```bash
./stop-services.zsh
```

**Unload the launch agent**:
```bash
launchctl unload ~/Library/LaunchAgents/com.user.escpos-printer-startup.plist
```

### Log Files and Debugging

- Main log: `/tmp/escpos-printer-startup.log`
- Launch agent stdout: `/tmp/escpos-printer-launchagent.out`
- Launch agent stderr: `/tmp/escpos-printer-launchagent.err`
- Service URLs: `/tmp/escpos-printer-urls.txt`

### Important Notes

- The launch agent version runs in the background and doesn't provide interactive output
- Services will automatically restart on login if the launch agent is loaded
- Make sure ngrok is installed and authenticated before using the launch agent
- The scripts assume your project is in `/Users/USERNAME/Developer/escpos-receipt-printer`

