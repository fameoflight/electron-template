#!/bin/bash
##
# Zsh Completion Installation Script for Electron Template
#
# This script installs zsh completions for yarn commands in this project.
#
# Usage:
#   ./cli/completions/install.sh
#   # Or: yarn setup:completions (if added to package.json)
##

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Installing Zsh Completions for Electron Template${NC}\n"

# Check if zsh is available
if ! command -v zsh &> /dev/null; then
    echo -e "${YELLOW}⚠️  Zsh is not installed. Completions are only for zsh.${NC}"
    exit 1
fi

# Detect zsh config file
if [ -f "$HOME/.zshrc" ]; then
    ZSH_CONFIG="$HOME/.zshrc"
else
    echo -e "${YELLOW}⚠️  No .zshrc found in $HOME${NC}"
    echo "Creating ~/.zshrc..."
    touch "$HOME/.zshrc"
    ZSH_CONFIG="$HOME/.zshrc"
fi

# Get the absolute path to the completion file
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
COMPLETION_FILE="$SCRIPT_DIR/_yarn-electron-template"

echo -e "${GREEN}✓${NC} Found completion file: $COMPLETION_FILE"
echo -e "${GREEN}✓${NC} Will modify: $ZSH_CONFIG\n"

# Check if already installed
if grep -q "_yarn-electron-template" "$ZSH_CONFIG"; then
    echo -e "${YELLOW}⚠️  Completion already installed in $ZSH_CONFIG${NC}"
    echo "Remove existing lines and re-run if you want to reinstall."
    exit 0
fi

# Add source line to .zshrc
echo -e "\n# Electron Template yarn completions" >> "$ZSH_CONFIG"
echo "source \"$COMPLETION_FILE\"" >> "$ZSH_CONFIG"

echo -e "${GREEN}✅ Successfully installed!${NC}\n"
echo "To activate completions:"
echo -e "  ${BLUE}exec zsh${NC}  # Reload your shell"
echo ""
echo "Or in a new terminal:"
echo -e "  ${BLUE}source ~/.zshrc${NC}"
echo ""
echo "Try it out:"
echo -e "  ${BLUE}yarn [TAB]${NC}        # See all commands"
echo -e "  ${BLUE}yarn utils [TAB]${NC}  # See utils subcommands"
echo -e "  ${BLUE}yarn db:[TAB]${NC}     # See database commands"
echo ""
