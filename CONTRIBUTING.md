## Contributing

We welcome contributions to the Todo Ticket Printer Server! This project is open-source and community-driven.

### Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/andrewkouri/escpos-receipt-printer.git
   cd escpos-receipt-printer
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

### Development Guidelines

#### Code Style
- Use consistent indentation (2 spaces)
- Follow JavaScript ES6+ standards
- Add comments for complex logic
- Use meaningful variable and function names

#### Testing Your Changes
Before submitting changes, please test thoroughly:

1. **Test with a physical printer** (if available):
   ```bash
   npm run todo-server
   node test-client.js "Test ticket"
   ```

2. **Test without a printer** (simulation mode):
   - The server should handle printer connection errors gracefully
   - Check that all API endpoints respond correctly

3. **Test different scenarios**:
   - Empty/missing fields
   - Special characters in text
   - Long titles and descriptions
   - Network errors

#### What We're Looking For

**🐛 Bug Fixes**
- Printer compatibility issues
- Error handling improvements
- Memory leaks or performance issues

**✨ New Features**
- Additional ESC/POS commands
- New API endpoints
- Support for different printer models
- Print templates/themes
- Queue management for multiple print jobs

**📚 Documentation**
- API documentation improvements
- Setup guides for different operating systems
- Troubleshooting guides
- Code comments and examples

**🧪 Testing**
- Unit tests for core functionality
- Integration tests for printer communication
- Mock printer for testing without hardware

### Submitting Changes

1. **Commit your changes** with clear, descriptive messages:
   ```bash
   git add .
   git commit -m "Add support for custom paper sizes"
   ```

2. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

3. **Create a Pull Request** with:
   - Clear title describing the change
   - Detailed description of what was changed and why
   - Screenshots or examples if applicable
   - Reference any related issues

### Pull Request Guidelines

- **One feature per PR** - Keep changes focused and atomic
- **Update documentation** if you're changing APIs or adding features
- **Test your changes** thoroughly before submitting
- **Be responsive** to feedback and requested changes
- **Follow the existing code style** and patterns

### Reporting Issues

When reporting bugs or requesting features:

1. **Search existing issues** first to avoid duplicates
2. **Use descriptive titles** and provide details:
   - Operating system and version
   - Node.js version
   - Printer model and connection method
   - Steps to reproduce the issue
   - Expected vs actual behavior
   - Error messages or logs

### Development Setup

#### Hardware Requirements
- USB thermal receipt printer (optional but recommended)
- USB cable
- Computer with USB port

#### Software Requirements
- Node.js 14+ 
- npm or yarn
- Git

#### Supported Printers
Currently tested with:
- Generic ESC/POS thermal printers
- Star Micronics printers
- Epson TM series

*Help us expand this list by testing with your printer model!*

### Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help newcomers get started
- Follow GitHub's community guidelines

### Questions?

- Open an issue for bugs or feature requests
- Start a discussion for questions about usage
- Check existing issues and discussions first

Thank you for contributing! 🎉