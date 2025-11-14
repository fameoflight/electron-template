# Zsh Completions for Electron Template

**Fully automatic shell completions** - reads `package.json` dynamically, no manual updates needed!

## Features

- ✅ **Automatic**: Parses package.json at completion time
- ✅ Complete all yarn scripts (`yarn dev`, `yarn test`, etc.)
- ✅ Complete utils subcommands (`yarn utils clean`, `yarn utils seed`, etc.)
- ✅ Complete database commands (`yarn db:stats`, `yarn db:inspect`, etc.)
- ✅ Complete generator arguments (`yarn g entity User name:string`)
- ✅ Context-aware suggestions (e.g., entity names discovered from `main/db/entities/`)
- ✅ **Zero maintenance**: Add command to package.json → instantly in completions

## Quick Install

```bash
./cli/completions/install.sh
exec zsh  # Reload shell
```

## Manual Installation

### Option 1: Source in .zshrc (Recommended)

Add to your `~/.zshrc`:

```bash
# Electron Template completions
source /path/to/electron-template/cli/completions/_yarn-electron-template
```

Then reload:
```bash
exec zsh
```

### Option 2: Copy to completions directory

```bash
mkdir -p ~/.zsh/completions
cp cli/completions/_yarn-electron-template ~/.zsh/completions/

# Add to ~/.zshrc:
fpath=(~/.zsh/completions $fpath)
autoload -Uz compinit && compinit
```

## Usage

After installation, press TAB to see suggestions:

```bash
# Main commands
yarn [TAB]
# Shows: dev, console, test, build, etc.

# Utils subcommands
yarn utils [TAB]
# Shows: clean, schema, seed, info, routes, etc.

# Database commands
yarn db:[TAB]
# Shows: seed, reset, stats, inspect, snapshot, etc.

# Generators
yarn g [TAB]
# Shows: entity

yarn g entity [TAB]
# Type entity name

yarn g entity User [TAB]
# Type field definitions like: name:string email:string
```

## How It Works (Automatic!)

The completion script is **self-updating** and requires zero maintenance:

### 1. Package.json Commands
Every time you press TAB, the script:
1. Finds package.json by walking up the directory tree
2. Uses Node.js to parse package.json and read all scripts
3. Generates completions on-the-fly

**Result**: Add a command to package.json → it's immediately available in completions!

### 2. Entity Names
When completing `yarn db:inspect [TAB]`:
1. Scans `main/db/entities/` directory
2. Lists all `.ts` files (User.ts → User, Post.ts → Post)
3. Shows only entities that actually exist

**Result**: Create new entity → it's immediately available for db:inspect!

### 3. No Manual Updates
Unlike hardcoded completion scripts, this one:
- ❌ Doesn't need editing when you add commands
- ❌ Doesn't need rebuilding or cache clearing
- ❌ Can't get out of sync with your project
- ✅ Always reflects current state of package.json
- ✅ Always reflects current entities

## Customization

The completion script is located at `cli/completions/_yarn-electron-template`.

You typically **don't need to edit it** because it's automatic, but you can customize:

### Add Better Descriptions
Edit the node script in the completion file (lines 51-63) to add descriptions for your custom commands:

```javascript
if (name === 'my-custom-command') desc = 'My custom description';
```

### Add New Command Categories
To add a new completion category (like utils, db, etc.), edit the `case` statement around line 141.

## Troubleshooting

**Completions not working?**

1. Make sure you're using zsh:
   ```bash
   echo $SHELL  # Should show /bin/zsh or similar
   ```

2. Check if completion is loaded:
   ```bash
   which _yarn-electron-template
   # Should show the function is defined
   ```

3. Rebuild completion cache:
   ```bash
   rm -f ~/.zcompdump
   compinit
   ```

4. Check for conflicts:
   ```bash
   # Disable other yarn completion plugins temporarily
   # in your .zshrc or oh-my-zsh plugins
   ```

**Slow completions?**

The script is optimized but if you have many plugins, try:
```bash
# Add to .zshrc before compinit:
zstyle ':completion:*' use-cache yes
zstyle ':completion:*' cache-path ~/.zsh/cache
```

## Examples

```bash
# Development workflow
yarn d[TAB] → yarn dev
yarn t[TAB] → yarn test
yarn con[TAB] → yarn console

# Utilities
yarn utils cl[TAB] → yarn utils clean
yarn utils inf[TAB] → yarn utils info

# Database
yarn db:st[TAB] → yarn db:stats
yarn db:in[TAB] User[TAB] → yarn db:inspect User

# Generator
yarn g entity Post title:string content:text[TAB]
```

## Compatibility

- **Zsh**: 5.0+ (tested on 5.8, 5.9)
- **Oh My Zsh**: Compatible (may need plugin ordering)
- **NPM**: Also completes npm commands (bonus!)

## See Also

- Main README: [../../README.md](../../README.md)
- Console Guide: [../../CONSOLE.md](../../CONSOLE.md)
- CLI Documentation: [../README.md](../README.md)
