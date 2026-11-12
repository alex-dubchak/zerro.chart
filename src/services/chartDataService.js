import { openDB } from 'idb';

// Zerro stores its data in the `zerro_data` IndexedDB database (version 2):
// - `replicas`: one manifest row per root user (keyPath `rootUserId`) with the
//   journal window (`latestCheckpointSequence`..`headSequence`) and the outbox.
// - `journalEntries`: keyed by [rootUserId, sequence]; a checkpoint entry holds
//   a full TDataStore snapshot (eleven entity maps keyed by id), a transition
//   entry holds a compact diff (per-entity upserts + deletion list).
// Current state = newest checkpoint snapshot + replayed transitions up to head.
const db = openDB('zerro_data');

const ENTITY_TYPES = [
    'instrument', 'country', 'company', 'user', 'merchant', 'account',
    'tag', 'budget', 'reminder', 'reminderMarker', 'transaction',
];

const emptyState = () =>
    Object.fromEntries(ENTITY_TYPES.map(type => [type, {}]));

// Returns the first defined property among `keys`.
const pick = (obj, keys) => {
    if (!obj) return undefined;
    for (const key of keys) {
        if (obj[key] !== undefined) return obj[key];
    }
    return undefined;
};

const isCheckpoint = (entry) => {
    const kind = pick(entry, ['kind', 'type', 'entryType']);
    if (kind !== undefined) return String(kind).toLowerCase().includes('checkpoint');
    // No explicit kind field: a checkpoint carries a snapshot payload.
    return !!findSnapshot(entry);
};

// A TDataStore snapshot is recognisable by its entity maps.
const looksLikeDataStore = (obj) =>
    !!obj && typeof obj === 'object' &&
    ENTITY_TYPES.some(type => obj[type] && typeof obj[type] === 'object');

const findSnapshot = (entry) => {
    const nested = pick(entry, ['snapshot', 'state', 'dataStore', 'store', 'data', 'payload']);
    if (looksLikeDataStore(nested)) return nested;
    if (looksLikeDataStore(entry)) return entry;
    return null;
};

const toIdMap = (collection) => {
    if (!collection) return {};
    if (Array.isArray(collection)) {
        return Object.fromEntries(collection.map(item => [item.id, item]));
    }
    return { ...collection };
};

const applyCheckpoint = (snapshot) => {
    const state = emptyState();
    for (const type of ENTITY_TYPES) {
        state[type] = toIdMap(snapshot[type]);
    }
    return state;
};

const applyTransition = (state, entry) => {
    // The diff may sit on the entry itself or be nested one level down.
    const diff = pick(entry, ['transition', 'diff', 'payload']) ?? entry;

    const upserts = pick(diff, ['upsert', 'upserts', 'changes']);
    if (upserts) {
        for (const type of ENTITY_TYPES) {
            const changes = upserts[type];
            if (!changes) continue;
            const changeList = Array.isArray(changes)
                ? changes.map(change => [change.id, change])
                : Object.entries(changes);
            for (const [id, fields] of changeList) {
                state[type][id] = { ...state[type][id], ...fields };
            }
        }
    }

    const deletions = pick(diff, ['deletion', 'deletions', 'deleted']);
    if (deletions) {
        if (Array.isArray(deletions)) {
            // List of {type, id} / [type, id] pairs.
            for (const item of deletions) {
                const type = Array.isArray(item) ? item[0] : pick(item, ['type', 'entity', 'entityType']);
                const id = Array.isArray(item) ? item[1] : item.id;
                if (state[type]) delete state[type][id];
            }
        } else {
            // Map of entity type -> array of ids.
            for (const type of ENTITY_TYPES) {
                for (const id of deletions[type] ?? []) {
                    delete state[type][id];
                }
            }
        }
    }
};

const loadState = async () => {
    const database = await db;
    const storeNames = Array.from(database.objectStoreNames);

    // Pre-journal Zerro versions kept entity arrays in a `serverData` store.
    if (!storeNames.includes('replicas') && storeNames.includes('serverData')) {
        return loadLegacyState(database);
    }

    const replicas = await database.getAll('replicas');
    if (!replicas || replicas.length === 0) {
        console.error('No replica manifest found in zerro_data.');
        return emptyState();
    }
    if (replicas.length > 1) {
        console.warn('Multiple replica manifests found, using the first one:', replicas);
    }
    const manifest = replicas[0];
    const { rootUserId, headSequence, latestCheckpointSequence, oldestSequence } = manifest;
    const firstSequence = latestCheckpointSequence ?? oldestSequence ?? 1;

    const entries = await database.getAll(
        'journalEntries',
        IDBKeyRange.bound([rootUserId, firstSequence], [rootUserId, headSequence])
    );
    entries.sort((a, b) => a.sequence - b.sequence);
    console.debug(`Replaying ${entries.length} journal entries (${firstSequence}..${headSequence})`);

    let state = emptyState();
    for (const entry of entries) {
        if (isCheckpoint(entry)) {
            const snapshot = findSnapshot(entry);
            if (!snapshot) {
                console.error('Checkpoint entry without a recognisable snapshot:', entry);
                continue;
            }
            state = applyCheckpoint(snapshot);
        } else {
            applyTransition(state, entry);
        }
    }
    return state;
};

const loadLegacyState = async (database) => {
    const state = emptyState();
    for (const type of ENTITY_TYPES) {
        const data = await database.getAll('serverData', type);
        state[type] = toIdMap(data[0]);
    }
    return state;
};

// The journal replay is comparatively expensive, so run it once and share the
// result between the entity getters.
let statePromise = null;
const getState = () => (statePromise ??= loadState().catch(error => {
    statePromise = null;
    throw error;
}));

const getTransactions = async () => {
    const transactions = Object.values((await getState()).transaction);
    console.debug('Loaded transactions from IndexedDB:', transactions);
    if (transactions.length === 0) {
        console.error('No transactions found in the database.');
    }
    return transactions;
};

const getTags = async () => {
    const tags = (await getState()).tag;
    console.debug('Loaded tags from IndexedDB:', tags);
    if (Object.keys(tags).length === 0) {
        console.error('No tags found in the database.');
    }
    return tags;
};

const getAccounts = async () => {
    const accounts = (await getState()).account;
    console.debug('Loaded accounts from IndexedDB:', accounts);
    if (Object.keys(accounts).length === 0) {
        console.error('No accounts found in the database.');
    }
    return accounts;
};

const getInstruments = async () => {
    const instruments = (await getState()).instrument;
    console.debug('Loaded instruments from IndexedDB:', instruments);
    if (Object.keys(instruments).length === 0) {
        console.error('No instruments found in the database.');
    }
    return instruments;
};

const getResultAccount = () => {
    return localStorage.getItem('resultAccount') || null;
}

const setResultAccount = (accountId) => {
    localStorage.setItem('resultAccount', accountId);
}

const getSummaryPeriod = () => {
    const value = parseInt(localStorage.getItem('summaryPeriod'), 10);
    return Number.isFinite(value) && value > 0 ? value : null;
}

const setSummaryPeriod = (period) => {
    const value = parseInt(period, 10);
    if (Number.isFinite(value) && value > 0) {
        localStorage.setItem('summaryPeriod', value);
    }
}

export default {
    getSummaryPeriod,
    setSummaryPeriod,
    getTransactions,
    getTags,
    getAccounts,
    getInstruments,
    setResultAccount,
    getResultAccount
}
