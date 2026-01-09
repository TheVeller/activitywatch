# Integration Guide

This document explains how to integrate `aw-gameui` with the ActivityWatch fork.

## Prerequisites

1. Submodules must be initialized:
   ```bash
   git submodule update --init --recursive
   ```

2. Build the game UI:
   ```bash
   cd aw-gameui
   npm install
   npm run build
   ```

## Patching aw-server

The `aw-server` submodule needs to be patched to serve the new UI as the default.

### Option 1: Copy build output to aw-server static directory

```bash
# Build the UI
cd aw-gameui
npm run build

# Copy to aw-server static directory
cp -r dist/* ../aw-server/aw_server/static/gameui/
```

### Option 2: Modify aw-server routing

In `aw-server/aw_server/routes.py` (or wherever static routes are defined), add:

```python
from flask import send_from_directory
import os

# Serve new UI at root
@app.route('/')
def index():
    return send_from_directory('static/gameui', 'index.html')

# Serve legacy UI at /legacy
@app.route('/legacy')
@app.route('/legacy/<path:path>')
def legacy(path='index.html'):
    return send_from_directory('static', path)
```

Ensure API routes (`/api/0/*`) remain unchanged.

## Patching aw-qt

The `aw-qt` submodule should open the new UI by default.

In the code that opens the browser/webview, ensure it navigates to:
- `http://localhost:5600/` (new UI) instead of legacy UI

Add a menu item or setting to access legacy UI at `/legacy` if needed.

## Build Scripts

See the root `Makefile` for build targets that automate:
- Building aw-gameui
- Copying assets to aw-server
- Running dev mode
