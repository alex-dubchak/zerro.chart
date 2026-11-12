# IndexedDB storage

Zerro keeps two IndexedDB databases, both opened through the [`idb`](https://github.com/jakearchibald/idb) wrapper: `zerro_data` holds the durable replica of the user's ZenMoney data, and `zerro-backup-folders` holds directory handles for the daily backup feature. Everything else in the app (Redux state, redo stack, UI state) lives in memory only.

## `zerro_data` — the replica database

Defined in [replicaStorage.ts](../src/6-shared/api/replicaStorage.ts) (database name from [config.ts](../src/6-shared/config.ts), version 2; upgrading from version 1 deletes all old stores and starts fresh). The design decision behind it is recorded in [ADR 0001](adr/0001-linear-indexeddb-replica.md). Two object stores:

### `replicas` — the manifest

One record per root user, keyed by `rootUserId` (`keyPath: 'rootUserId'`). The runtime keeps exactly one row; finding more than one is treated as corruption, and signing in as a different root user clears both stores. The record (`TPersistedReplica`) is the replica's manifest:

- `serverTimestamp` — the sync cursor: the accepted ZenMoney server position. A cursor-only pull advances it without writing a journal entry, so this, not the newest entry, is the authoritative position.
- `headSequence`, `latestCheckpointSequence`, `oldestSequence`, `oldestServerTimestamp` — the retained journal window and where its newest checkpoint sits.
- `retainedBytes` — running estimate of the journal's logical JSON size, used by retention.
- `outbox` — the full array of pending local commands (`TCommand[]`), stored inline. This doubles as the durable undo stack and the sync outbox; it is overwritten as a whole on every change.

### `journalEntries` — the linear journal

Keyed by the compound `[rootUserId, sequence]` (`keyPath: ['rootUserId', 'sequence']`). Sequences are contiguous integers starting at 1. Two entry kinds ([linearJournal.ts](../src/zerro-core/internal/operations/replication/linearJournal.ts)):

- **Checkpoint** — a full `TDataStore` snapshot plus a `reason` (`full-sync`, `recovery` or `retention`). Written on full reload, journal recovery and retention compaction.
- **Transition** — a compact diff (`TCompactCanonicalTransition`, computed in [journal.ts](../src/zerro-core/internal/operations/replication/journal.ts)) between the previous and next accepted state: per-entity `upsert` field changes, `deletion` list and the new `serverTimestamp`, plus a `pushed` flag marking whether the change came from pushing local commands. A commit that changes nothing and pushed nothing writes no entry.

Every entry carries `byteSize`, the JSON size of the entry. Transitions are measured exactly; checkpoint snapshots are estimated from sampled rows because only a megabyte-scale budget needs it.

A `TDataStore` snapshot is `serverTimestamp` plus eleven entity maps keyed by id: `instrument`, `country`, `company`, `user`, `merchant`, `account`, `tag`, `budget`, `reminder`, `reminderMarker`, `transaction` ([store.ts](../src/zerro-core/internal/domain/zenmoney/model/store.ts)).

### Write path

All writes flow through the Redux middleware in [replicaPersistence.ts](../src/store/data/replicaPersistence.ts) and run on a single serialized save queue, so writes are ordered per tab (concurrent tabs have no coordination).

- **Canonical commits** — a server patch (`applyServerPatch`) or an accepted push chunk (`acceptClientPushChunk`) calls `commitCanonical`, which in one read-write transaction over both stores appends a checkpoint or transition entry and updates the manifest (cursor, head, retained bytes, outbox). If the stored replica belongs to a different root user, or none exists, both stores are cleared and the journal restarts at sequence 1 with a checkpoint.
- **Outbox saves** — local command actions (append, edit, undo, redo, restore position) call `saveOutbox`, which rewrites only the manifest's `outbox` array. High-frequency edits (e.g. a colour drag firing every frame) coalesce into the save already waiting at the tail of the queue.
- **Failure** — the first failed primary write disables all further writes for the session, dispatches `persistenceFailed` and surfaces a non-blocking warning ([PersistenceWarningNotice](../src/3-widgets/PersistenceWarningNotice.tsx)); Redux stays authoritative in memory.

### Read path and recovery

Startup hydration ([localData.ts](../src/4-features/localData.ts)) calls `loadCurrent`: load the manifest, read the newest checkpoint plus the contiguous transition suffix up to `headSequence`, replay them into the base state, validate it and validate that replaying the outbox over it also yields a valid state. Failures split into two recovery paths:

- **Corrupt journal** — the outbox is loaded alone (`loadOutboxForRecovery`) and the app requires a full reload from the server; the recovered state is persisted as a `recovery` checkpoint.
- **Corrupt outbox** — the base state loads normally but the quarantined on-disk commands are never overwritten until the user explicitly discards them (`discardOutbox`).

### Retention and history

Retention ([compactOneBatch](../src/6-shared/api/replicaStorage.ts)) runs after every canonical commit and once at startup, as a secondary pass whose failure only postpones it. When the oldest retained entry is older than 90 days of server time or the journal exceeds 100 MiB of logical JSON, it folds the oldest batch of up to 100 entries into a single `retention` checkpoint that keeps the last folded sequence number, deletes the folded entries and updates the manifest. A journal reduced to its head is never compacted further, so the minimum durable replica — one checkpoint plus the outbox — can exceed the budget.

The retained journal also backs the history screen ([history.ts](../src/store/history.ts)): `listHistory` pages entries backwards by sequence, and `loadHistoricalState` reconstructs any retained point by replaying forward from the nearest earlier checkpoint.

## `zerro-backup-folders` — backup directory handles

Defined in [backupFolder.ts](../src/4-features/export/backupFolder.ts), version 1, single out-of-line-keyed store `folders` keyed by user id. Each record stores a `FileSystemDirectoryHandle` for the user's chosen daily-backup folder (handles are structured-cloneable, so IndexedDB is the only place they can persist) together with `lastSavedAt` and the last `problem` state. Writes broadcast the user id on a `BroadcastChannel` of the same name so other tabs refresh their view of the folder.
