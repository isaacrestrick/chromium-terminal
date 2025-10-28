# Chromium Terminal

A sci-fi terminal interface for managing Chrome bookmarks programmatically. Click the extension icon to open a beautiful, Terminal that lets you manipulate your bookmarks using command-line style commands.

![Chromium Terminal](https://img.shields.io/badge/Chrome-Extension-green)
![Version](https://img.shields.io/badge/version-1.0.0-blue)

## Features

- 🖥️ **Terminal UI** - Clean, modern terminal aesthetic with subtle colors and great typography
- ⚡ **Fast & Intuitive** - Command-line interface for power users
- 📚 **Full Bookmark Management** - List, add, delete, search, organize with folders
- 🎨 **Large Input Box** - Comfortable typing experience
- ⌨️ **Command History** - Navigate previous commands with arrow keys
- 🔍 **Smart Search** - Find bookmarks by title or URL
- 🌳 **Tree View** - Visualize bookmark hierarchy

## Installation

### From Source

1. Clone this repository:
```bash
git clone https://github.com/YOUR_USERNAME/chromium-terminal.git
cd chromium-terminal
```

2. Open Chrome and navigate to `chrome://extensions/`

3. Enable **Developer mode** (toggle in top-right corner)

4. Click **Load unpacked** and select the `chromium-terminal` directory

5. The Chromium Terminal icon should now appear in your extensions toolbar

## Usage

### Opening the Terminal

Click the Chromium Terminal extension icon in your Chrome toolbar. This will open a new tab with the terminal interface.

### Available Commands

#### `help`
Display all available commands and their usage.

#### `ls [path]`
List bookmarks and folders.
- `ls` - List root bookmarks
- `ls 1` - List bookmarks in folder with ID 1

#### `add <url> <title> [folder-id]`
Add a new bookmark.
- `add https://example.com "Example Site"` - Add to default folder
- `add https://github.com GitHub 5` - Add to folder with ID 5

#### `rm <id>`
Remove a bookmark or folder by ID.
- `rm 42` - Remove bookmark/folder with ID 42

#### `search <query>`
Search bookmarks by title or URL.
- `search github` - Find all bookmarks containing "github"

#### `mkdir <name> [parent-id]`
Create a new bookmark folder.
- `mkdir Development` - Create folder in default location
- `mkdir Projects 5` - Create folder inside folder 5

#### `mv <bookmark-id> <folder-id>`
Move a bookmark to a different folder.
- `mv 42 5` - Move bookmark 42 to folder 5

#### `tree`
Display the entire bookmark hierarchy as a tree.

#### `clear`
Clear the terminal output.

### Tips

- Use **quotes** for titles/names with spaces: `add "https://example.com" "My Site"`
- Press **↑** and **↓** arrow keys to navigate command history
- Press **Tab** to autocomplete commands
- Each bookmark and folder has an **ID** shown in brackets `[id]` - use these for operations

## Development

### Project Structure

```
chromium-terminal/
├── manifest.json          # Extension configuration
├── background.js          # Service worker (handles icon clicks)
├── terminal.html          # Terminal UI
├── terminal.css           # Ghostty-inspired styling
├── terminal.js            # Terminal logic and Bookmarks API
├── icons/                 # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── generate_icons.py      # Icon generation script
└── README.md             # This file
```

### Building Icons

If you need to regenerate the icons:

```bash
python3 generate_icons.py
```

Requires the `Pillow` library:
```bash
pip install Pillow
```

## Permissions

This extension requires the following permissions:
- **bookmarks** - Read and modify your bookmarks
- **tabs** - Open the terminal in a new tab

### Command Examples
```
❯ help
❯ ls
❯ search github
❯ add https://github.com "GitHub"
❯ mkdir Development
❯ tree
```

---

Made with ❤️ for power users who love the command line

