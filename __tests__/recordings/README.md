# Polly.js Recordings

HTTP request/response recordings for VCR-like testing.

## 🚀 Quick Start

**Default (Offline) Testing:**
```bash
yarn test  # Uses existing recordings, works offline
```

## 📋 Testing Modes

### Default Mode (Recommended)
- **Command**: `yarn test`
- **Behavior**: Uses existing recordings, works completely offline
- **Use case**: Daily development, CI/CD, offline work

### Recording Mode
- **Command**: `RECORD=true yarn test`
- **Behavior**: Creates new recordings or updates existing ones
- **Use case**: Adding new API calls or updating responses

### Development Mode
- **Command**: `POLLY_MODE=passthrough yarn test`
- **Behavior**: Uses recordings when available, makes real requests for missing ones
- **Use case**: Active development with intermittent internet

### CI Mode
- **Command**: `REPLAY_ONLY=true yarn test`
- **Behavior**: Fails fast if recordings are missing
- **Use case**: Production CI/CD pipelines

## 🛠️ Troubleshooting

**Error: "Polly recording not found"**
```bash
# Create missing recordings
RECORD=true yarn test __tests__/polly/polly.test.ts

# Or use development mode to record on-demand
POLLY_MODE=passthrough yarn test __tests__/polly/polly.test.ts
```

**Error: "getaddrinfo ENOTFOUND"**
- This means you're trying to make real HTTP requests without internet
- Use default mode (replay) to work offline with existing recordings

## 📁 File Structure

```
recordings/
├── README.md                    # This file
└── [test-name]_[hash]/
    └── recording.har           # HTTP interactions (HAR format)
```

**Recording Naming:**
- Each test gets its own directory
- Hash suffix prevents conflicts between similar tests
- Files are in HAR format (viewable in browser dev tools)

