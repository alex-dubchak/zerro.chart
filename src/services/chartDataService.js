import { openDB } from 'idb';

const db = openDB('zerro_data');

const getTransactions = async () => {
    const data = await (await db).getAll('serverData', 'transaction');
    console.debug('Fetched transactions from IndexedDB:', data);
    if (!data || data.length === 0) {
        console.error('No transactions found in the database.');
        return [];
    }
    return data[0];
}

const getTags = async () => {
    const data = await (await db).getAll('serverData', 'tag');
    console.debug('Fetched tags from IndexedDB:', data);
    if (!data || data.length === 0) {
        console.error('No tags found in the database.');
        return [];
    }
    const result = Object.fromEntries(data[0].map(tag => [tag.id, tag]));
    return result;
}

const getAccounts = async () => {
    const data = await (await db).getAll('serverData', 'account');
    if (!data || data.length === 0) {
        console.error('No accounts found in the database.');
        return [];
    }
    const result = Object.fromEntries(data[0].map(account => [account.id, account]));
    console.debug('Fetched accounts from IndexedDB:', result);
    return result;
}

const getInstruments = async () => {
    const data = await (await db).getAll('serverData', 'instrument');
    console.debug('Fetched instruments from IndexedDB:', data);
    if (!data || data.length === 0) {
        console.error('No instruments found in the database.');
        return [];
    }
    const result = Object.fromEntries(data[0].map(instrument => [instrument.id, instrument]));
    return result;
}

const getResultAccount = () => {
    return localStorage.getItem('resultAccount') || null;
}

const setResultAccount = (accountId) => {
    localStorage.setItem('resultAccount', accountId);
}

export default {
    getTransactions,
    getTags,
    getAccounts,
    getInstruments,
    setResultAccount,
    getResultAccount
}