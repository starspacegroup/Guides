---
title: Durable Objects: Survive Hibernation and Clean Up
excerpt: A Durable Object can be evicted while its WebSockets stay open. Rebuild state from the sockets, not from memory, and delete the alarm before the storage.
difficulty: advanced
tags: Cloudflare, Durable Objects, WebSockets
---

## Rule

Treat every in-memory field of a Durable Object as a cache that may be empty. Rebuild from `getWebSockets()` and socket attachments, persist on transitions, and tear down in a fixed order.

## Why

A multiplayer room kept its players in a `Map`. With the WebSocket Hibernation API the runtime may evict the object from memory while the sockets stay connected. On the next message a new instance woke with an empty map and open sockets. It decided nobody was in the room, so rooms died without an error and left their storage behind.

## Must

- Accept sockets with `state.acceptWebSocket(ws)`, and store what you need to recognise each one with `ws.serializeAttachment()` at join time.
- Rebuild the session map from `state.getWebSockets()` and `deserializeAttachment()` before you handle the first event after a wake.
- Take liveness from `state.getWebSockets().length`, not from the size of your own map.
- Persist on transitions, such as join, leave, and round end. Do not write on every tick.
- Reclaim an empty room with an alarm, and check emptiness again inside the alarm.
- Call `deleteAlarm()` before `deleteAll()`.
- Remove outside pointers to a room, such as a KV entry, only after the object has shut down.

## Pattern

```ts
private restore() {
  if (this.sessions.size > 0) return;
  for (const ws of this.state.getWebSockets()) {
    const session = ws.deserializeAttachment() as Session | null;
    if (session) this.sessions.set(ws, session);
  }
}

async webSocketMessage(ws: WebSocket, message: string) {
  this.restore();
  // handle the message
}

private async destroy() {
  // Alarm before storage. deleteAll() does not cancel a pending alarm,
  // so without this the object wakes for ever on an empty room.
  try {
    await this.state.storage.deleteAlarm();
  } catch {
    // already gone
  }
  await this.state.storage.deleteAll();
}
```

## Should

- Keep attachments small. They have a size limit, and they are read on every wake.
- Put constants that the client and the server both use in one shared module. One game had the server test at 0.05 and the client at 0.015 for the same check.
- Let the server decide outcomes. A message handler that trusted the client let any player complete every objective. Removing the handler was safer than writing a validator for it.

## Gotchas

- Timers made with `setInterval` do not survive eviction. Use an alarm.
- Pages cannot host Durable Object classes. Define them in a Worker, and bind to that Worker from the Pages project.
- Eviction is hard to cause on demand. If the fix was proved only by reading the code, say so in the notes.
- Measure storage with `state.storage.sql.databaseSize` before you make a claim about cost.

## Validation checklist

- After a simulated wake with an empty map, a message from an existing socket is handled as that player.
- An empty room has no alarm and no storage a few minutes later.
- Storage writes happen on transitions and not per frame.
- Closing the last socket schedules cleanup, and a rejoin before the alarm cancels it.
