# ActivityWatch Game UI

Steam-style game stats UI for ActivityWatch.

## Development

```bash
npm install
npm run dev
```

The dev server runs on `http://localhost:3000` and proxies API requests to `http://localhost:5600`.

## Build

```bash
npm run build
```

Outputs to `dist/` directory.

## Integration with aw-server

To make this UI the default in aw-server:

1. Build the UI: `npm run build`
2. Copy `dist/` contents to `aw-server/aw_server/static/gameui/`
3. Patch `aw-server` to serve the new UI at `/` and legacy UI at `/legacy`

See `INTEGRATION.md` for detailed instructions.
