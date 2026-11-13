---
title: A Dev Server Through a Cloudflare Tunnel
excerpt: Pin the dev port, bind to loopback, allow the tunnel host in Vite, and check the public URL from outside before you say it works.
difficulty: intermediate
tags: Cloudflare, Deployment, Vite, Security
---

## Rule

Each project has one fixed dev port and one named tunnel that points at it. The dev server binds to loopback, the tunnel host is on the dev server's allow-list, and the public URL is verified with a real request.

## Why

A tunnel that points at the wrong port serves a 502, and from the browser that looks like a tunnel fault. A dev server that rejects the tunnel's `Host` header returns 403, and that also looks like a tunnel fault. Most "the tunnel is broken" reports are one of these two mismatches.

## Must

- Pin the port in `package.json` and in the tunnel config, and keep the two in step.
- Bind the dev server to `127.0.0.1`. `host: true` exposes it, and any dev-only login, to the whole local network.
- Add the tunnel's domain to `server.allowedHosts`. A leading dot allows every subdomain.
- Start the server first, wait until the port answers, then fetch the public hostname and read the status code.
- Remember that everything arriving through the tunnel comes from loopback. Code that trusts local addresses now trusts the internet.
- Gate dev-only sign-in on the compile-time dev flag and on a loopback `Host`, so it cannot be used through the tunnel.

## Pattern

```ts
// vite.config.ts
export default defineConfig({
	server: {
		host: '127.0.0.1',
		port: 4255,
		strictPort: true,
		allowedHosts: ['.example.dev']
	}
});
```

```yaml
# ~/.cloudflared/myapp-dev.yml
tunnel: myapp-dev
ingress:
  - hostname: dev-myapp.example.dev
    service: http://localhost:4255
  - service: http_status:404
```

## Should

- Run the server and the tunnel as two service units, so they restart on their own and a second copy is not started by hand.
- Before you kill a process that holds the port, find out what it is. It may be this project's own server.
- Turn off hot module reload over the tunnel if pages hang. The reload WebSocket can stall there.
- Use `protocol: http2` if a hostname hangs on a stalled QUIC stream.
- Probe the public URL from a watcher, and restart the tunnel after two failed checks in a row. A local probe cannot see a hung tunnel.

## Gotchas

- A named tunnel can run in only one place at a time.
- TLS ends at Cloudflare's edge. Do not describe the link as end to end encrypted.
- A stale dependency hash in a cached page can return 504 and break hydration when hot reload is off. Reload without cache.
- A sample or demo mode that is fine on localhost becomes public through a tunnel.

## Validation checklist

- `curl -s -o /dev/null -w '%{http_code}' https://dev-myapp.example.dev/` prints 200.
- The dev server does not answer on the machine's LAN address.
- Dev-only sign-in fails through the public hostname.
- Stopping the dev server turns the public URL into a 502, which proves the tunnel points at this port.
