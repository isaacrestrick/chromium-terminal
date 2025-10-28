// Terminal logic and Chrome Bookmarks API integration

class Terminal {
  constructor() {
    this.input = document.getElementById('input');
    this.output = document.getElementById('output');
    this.commandHistory = [];
    this.historyIndex = -1;
    this.bookmarksCache = null;
    
    this.init();
  }

  init() {
    this.input.addEventListener('keydown', (e) => this.handleKeydown(e));
    this.input.focus();
    
    // Cache bookmarks on load
    this.refreshBookmarksCache();
  }

  async refreshBookmarksCache() {
    this.bookmarksCache = await chrome.bookmarks.getTree();
  }

  handleKeydown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      const command = this.input.value.trim();
      if (command) {
        this.commandHistory.push(command);
        this.historyIndex = this.commandHistory.length;
        this.executeCommand(command);
        this.input.value = '';
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (this.historyIndex > 0) {
        this.historyIndex--;
        this.input.value = this.commandHistory[this.historyIndex];
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (this.historyIndex < this.commandHistory.length - 1) {
        this.historyIndex++;
        this.input.value = this.commandHistory[this.historyIndex];
      } else {
        this.historyIndex = this.commandHistory.length;
        this.input.value = '';
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      this.handleAutocomplete();
    }
  }

  handleAutocomplete() {
    const input = this.input.value;
    const commands = ['help', 'ls', 'add', 'rm', 'search', 'mkdir', 'mv', 'tree', 'clear'];
    
    const matches = commands.filter(cmd => cmd.startsWith(input));
    if (matches.length === 1) {
      this.input.value = matches[0] + ' ';
    }
  }

  async executeCommand(commandString) {
    // Echo the command
    this.appendOutput(`<div class="command-input-echo"><span class="prompt-echo">❯</span>${this.escapeHtml(commandString)}</div>`);

    // Parse command
    const parts = this.parseCommand(commandString);
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    try {
      switch (command) {
        case 'help':
          await this.cmdHelp();
          break;
        case 'ls':
          await this.cmdList(args);
          break;
        case 'add':
          await this.cmdAdd(args);
          break;
        case 'rm':
          await this.cmdRemove(args);
          break;
        case 'search':
          await this.cmdSearch(args);
          break;
        case 'mkdir':
          await this.cmdMkdir(args);
          break;
        case 'mv':
          await this.cmdMove(args);
          break;
        case 'tree':
          await this.cmdTree(args);
          break;
        case 'clear':
          this.cmdClear();
          break;
        default:
          this.appendOutput(`<div class="command-output error">Unknown command: ${this.escapeHtml(command)}</div>`);
          this.appendOutput(`<div class="command-output info">Type 'help' to see available commands</div>`);
      }
    } catch (error) {
      this.appendOutput(`<div class="command-output error">Error: ${this.escapeHtml(error.message)}</div>`);
    }

    // Refresh cache after commands that modify bookmarks
    if (['add', 'rm', 'mkdir', 'mv'].includes(command)) {
      await this.refreshBookmarksCache();
    }

    this.scrollToBottom();
  }

  parseCommand(commandString) {
    const parts = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < commandString.length; i++) {
      const char = commandString[i];
      
      if (char === '"' || char === "'") {
        inQuotes = !inQuotes;
      } else if (char === ' ' && !inQuotes) {
        if (current) {
          parts.push(current);
          current = '';
        }
      } else {
        current += char;
      }
    }
    
    if (current) {
      parts.push(current);
    }
    
    return parts;
  }

  // Command implementations

  async cmdHelp() {
    const helpText = `
      <div class="help-section">
        <div class="help-title">AVAILABLE COMMANDS</div>
        <div class="help-command">
          <span class="help-command-name">ls [path]</span>
          <span class="help-command-desc">- List bookmarks and folders</span>
        </div>
        <div class="help-command">
          <span class="help-command-name">add &lt;url&gt; &lt;title&gt; [folder]</span>
          <span class="help-command-desc">- Add a new bookmark</span>
        </div>
        <div class="help-command">
          <span class="help-command-name">rm &lt;id&gt;</span>
          <span class="help-command-desc">- Remove a bookmark or folder</span>
        </div>
        <div class="help-command">
          <span class="help-command-name">search &lt;query&gt;</span>
          <span class="help-command-desc">- Search bookmarks by title or URL</span>
        </div>
        <div class="help-command">
          <span class="help-command-name">mkdir &lt;name&gt; [parent]</span>
          <span class="help-command-desc">- Create a new folder</span>
        </div>
        <div class="help-command">
          <span class="help-command-name">mv &lt;id&gt; &lt;folder-id&gt;</span>
          <span class="help-command-desc">- Move bookmark to a folder</span>
        </div>
        <div class="help-command">
          <span class="help-command-name">tree</span>
          <span class="help-command-desc">- Display bookmark hierarchy</span>
        </div>
        <div class="help-command">
          <span class="help-command-name">clear</span>
          <span class="help-command-desc">- Clear the terminal</span>
        </div>
      </div>
      <div class="info-message">
        Use quotes for titles/names with spaces: add "https://example.com" "My Site"
      </div>
    `;
    this.appendOutput(`<div class="command-output">${helpText}</div>`);
  }

  async cmdList(args) {
    const path = args[0];
    let nodes;

    if (path) {
      // Try to find the folder by ID or name
      const folder = await this.findFolder(path);
      if (!folder) {
        this.appendOutput(`<div class="command-output error">Folder not found: ${this.escapeHtml(path)}</div>`);
        return;
      }
      nodes = await chrome.bookmarks.getChildren(folder.id);
    } else {
      // List root bookmarks
      const tree = await chrome.bookmarks.getTree();
      nodes = tree[0].children;
    }

    if (nodes.length === 0) {
      this.appendOutput(`<div class="command-output info">No bookmarks found</div>`);
      return;
    }

    let output = '<div class="command-output">';
    for (const node of nodes) {
      if (node.url) {
        // It's a bookmark
        output += `<div class="bookmark-item">
          <span class="bookmark-title">${this.escapeHtml(node.title || 'Untitled')}</span>
          <span class="bookmark-url">${this.escapeHtml(node.url)}</span>
          <span class="bookmark-id">[${node.id}]</span>
        </div>`;
      } else {
        // It's a folder
        output += `<div class="bookmark-item folder-item">
          <span class="folder-icon"></span>${this.escapeHtml(node.title || 'Untitled Folder')}
          <span class="bookmark-id">[${node.id}]</span>
        </div>`;
      }
    }
    output += '</div>';
    this.appendOutput(output);
  }

  async cmdAdd(args) {
    if (args.length < 2) {
      this.appendOutput(`<div class="command-output error">Usage: add &lt;url&gt; &lt;title&gt; [folder-id]</div>`);
      return;
    }

    const url = args[0];
    const title = args[1];
    const folderId = args[2] || '1'; // Default to Bookmarks Bar

    // Validate URL
    if (!this.isValidUrl(url)) {
      this.appendOutput(`<div class="command-output error">Invalid URL: ${this.escapeHtml(url)}</div>`);
      return;
    }

    try {
      const bookmark = await chrome.bookmarks.create({
        parentId: folderId,
        title: title,
        url: url
      });
      this.appendOutput(`<div class="command-output success">✓ Bookmark added: ${this.escapeHtml(title)} [${bookmark.id}]</div>`);
    } catch (error) {
      this.appendOutput(`<div class="command-output error">Failed to add bookmark: ${this.escapeHtml(error.message)}</div>`);
    }
  }

  async cmdRemove(args) {
    if (args.length < 1) {
      this.appendOutput(`<div class="command-output error">Usage: rm &lt;id&gt;</div>`);
      return;
    }

    const id = args[0];

    try {
      // Check if it's a folder
      const nodes = await chrome.bookmarks.getSubTree(id);
      const node = nodes[0];
      
      if (node.children && node.children.length > 0) {
        // It's a non-empty folder
        this.appendOutput(`<div class="command-output warning">⚠ Removing folder with ${node.children.length} items</div>`);
        await chrome.bookmarks.removeTree(id);
      } else {
        await chrome.bookmarks.remove(id);
      }
      
      this.appendOutput(`<div class="command-output success">✓ Removed: ${this.escapeHtml(node.title || 'Untitled')}</div>`);
    } catch (error) {
      this.appendOutput(`<div class="command-output error">Failed to remove: ${this.escapeHtml(error.message)}</div>`);
    }
  }

  async cmdSearch(args) {
    if (args.length < 1) {
      this.appendOutput(`<div class="command-output error">Usage: search &lt;query&gt;</div>`);
      return;
    }

    const query = args.join(' ');
    const results = await chrome.bookmarks.search(query);

    if (results.length === 0) {
      this.appendOutput(`<div class="command-output info">No results found for: ${this.escapeHtml(query)}</div>`);
      return;
    }

    let output = `<div class="command-output"><div class="info">Found ${results.length} result(s):</div>`;
    for (const result of results) {
      if (result.url) {
        output += `<div class="bookmark-item">
          <span class="bookmark-title">${this.escapeHtml(result.title || 'Untitled')}</span>
          <span class="bookmark-url">${this.escapeHtml(result.url)}</span>
          <span class="bookmark-id">[${result.id}]</span>
        </div>`;
      } else {
        output += `<div class="bookmark-item folder-item">
          <span class="folder-icon"></span>${this.escapeHtml(result.title || 'Untitled Folder')}
          <span class="bookmark-id">[${result.id}]</span>
        </div>`;
      }
    }
    output += '</div>';
    this.appendOutput(output);
  }

  async cmdMkdir(args) {
    if (args.length < 1) {
      this.appendOutput(`<div class="command-output error">Usage: mkdir &lt;name&gt; [parent-id]</div>`);
      return;
    }

    const name = args[0];
    const parentId = args[1] || '1'; // Default to Bookmarks Bar

    try {
      const folder = await chrome.bookmarks.create({
        parentId: parentId,
        title: name
      });
      this.appendOutput(`<div class="command-output success">✓ Folder created: ${this.escapeHtml(name)} [${folder.id}]</div>`);
    } catch (error) {
      this.appendOutput(`<div class="command-output error">Failed to create folder: ${this.escapeHtml(error.message)}</div>`);
    }
  }

  async cmdMove(args) {
    if (args.length < 2) {
      this.appendOutput(`<div class="command-output error">Usage: mv &lt;bookmark-id&gt; &lt;folder-id&gt;</div>`);
      return;
    }

    const bookmarkId = args[0];
    const folderId = args[1];

    try {
      const result = await chrome.bookmarks.move(bookmarkId, { parentId: folderId });
      this.appendOutput(`<div class="command-output success">✓ Moved: ${this.escapeHtml(result.title || 'Untitled')}</div>`);
    } catch (error) {
      this.appendOutput(`<div class="command-output error">Failed to move: ${this.escapeHtml(error.message)}</div>`);
    }
  }

  async cmdTree(args) {
    const tree = await chrome.bookmarks.getTree();
    let output = '<div class="command-output">';
    output += this.renderTree(tree[0], 0);
    output += '</div>';
    this.appendOutput(output);
  }

  renderTree(node, depth) {
    let output = '';
    const indent = '  '.repeat(depth);
    
    if (depth > 0) { // Skip root node
      if (node.url) {
        output += `<div class="bookmark-item">
          ${indent}<span class="tree-branch">├─</span> <span class="bookmark-title">${this.escapeHtml(node.title || 'Untitled')}</span>
          <span class="bookmark-id">[${node.id}]</span>
        </div>`;
      } else {
        output += `<div class="bookmark-item folder-item">
          ${indent}<span class="tree-branch">├─</span> <span class="folder-icon"></span>${this.escapeHtml(node.title || 'Untitled Folder')}
          <span class="bookmark-id">[${node.id}]</span>
        </div>`;
      }
    }

    if (node.children) {
      for (const child of node.children) {
        output += this.renderTree(child, depth + 1);
      }
    }

    return output;
  }

  cmdClear() {
    this.output.innerHTML = '';
  }

  // Utility methods

  async findFolder(nameOrId) {
    const tree = await chrome.bookmarks.getTree();
    return this.searchFolder(tree[0], nameOrId);
  }

  searchFolder(node, nameOrId) {
    if (node.id === nameOrId || node.title === nameOrId) {
      return node;
    }
    
    if (node.children) {
      for (const child of node.children) {
        const result = this.searchFolder(child, nameOrId);
        if (result) return result;
      }
    }
    
    return null;
  }

  isValidUrl(string) {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  appendOutput(html) {
    const commandLine = document.createElement('div');
    commandLine.className = 'command-line';
    commandLine.innerHTML = html;
    this.output.appendChild(commandLine);
  }

  scrollToBottom() {
    this.output.scrollTop = this.output.scrollHeight;
  }
}

// Initialize terminal when page loads
document.addEventListener('DOMContentLoaded', () => {
  new Terminal();
});

