import { BrowserWindow, screen, app } from 'electron';
import * as fs from 'node:fs';
import path from 'node:path';

// Local getUserDataPath implementation to avoid import issues
function getUserDataPath(): string {
  try {
    return app.getPath('userData');
  } catch {
    // Fallback for development/testing
    return path.join(process.cwd(), '.data');
  }
}

interface WindowState {
  x: number;
  y: number;
  width: number;
  height: number;
  isMaximized: boolean;
  isFullScreen: boolean;
}

export class WindowManager {
  private windowStatePath: string;
  private defaultState: WindowState = {
    width: 1200,
    height: 800,
    x: 0,
    y: 0,
    isMaximized: false,
    isFullScreen: false
  };

  constructor() {
    this.windowStatePath = path.join(getUserDataPath(), 'window-state.json');
  }

  loadWindowState(): Partial<WindowState> {
    try {
      if (fs.existsSync(this.windowStatePath)) {
        const data = fs.readFileSync(this.windowStatePath, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.warn('Failed to load window state:', error);
    }
    return {};
  }

  saveWindowState(window: BrowserWindow) {
    try {
      const bounds = window.getBounds();
      const state: WindowState = {
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height,
        isMaximized: window.isMaximized(),
        isFullScreen: window.isFullScreen()
      };

      fs.writeFileSync(this.windowStatePath, JSON.stringify(state, null, 2));
    } catch (error) {
      console.warn('Failed to save window state:', error);
    }
  }

  getValidWindowState(): WindowState {
    const savedState = this.loadWindowState();
    const state = { ...this.defaultState, ...savedState };

    // Ensure window is within screen bounds
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;

    if (state.x + state.width > width) {
      state.x = width - state.width;
    }
    if (state.y + state.height > height) {
      state.y = height - state.height;
    }
    if (state.x < 0) state.x = 0;
    if (state.y < 0) state.y = 0;

    // Ensure minimum size
    state.width = Math.max(state.width, 800);
    state.height = Math.max(state.height, 600);

    return state;
  }

  setupWindowEvents(window: BrowserWindow) {
    // Save state on various events
    window.on('resize', () => this.saveWindowState(window));
    window.on('move', () => this.saveWindowState(window));
    window.on('maximize', () => this.saveWindowState(window));
    window.on('unmaximize', () => this.saveWindowState(window));
    window.on('enter-full-screen', () => this.saveWindowState(window));
    window.on('leave-full-screen', () => this.saveWindowState(window));
    window.on('close', () => this.saveWindowState(window));
  }
}