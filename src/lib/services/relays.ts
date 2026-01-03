/**
 * RelayService - Manages user relay configuration
 * 
 * Handles reading/writing NIP-65 relay list (Kind 10002)
 */

import { NDKEvent, type NDKFilter, NDKRelayList } from '@nostr-dev-kit/ndk';
import { ndk, createEvent } from '$lib/nostr';
import { DEFAULT_RELAYS } from '$lib/nostr/config';

export interface RelayInfo {
    url: string;
    read: boolean;
    write: boolean;
}

class RelayService {
    /**
     * Get current connected relays
     */
    getConnectedRelays(): string[] {
        const relays: string[] = [];
        ndk.pool.relays.forEach((relay, url) => {
            if (relay.status === 1) { // Connected
                relays.push(url);
            }
        });
        return relays;
    }

    /**
     * Get all configured relays (connected or not)
     */
    getConfiguredRelays(): string[] {
        const relays: string[] = [];
        ndk.pool.relays.forEach((_, url) => {
            relays.push(url);
        });
        return relays.length > 0 ? relays : DEFAULT_RELAYS;
    }

    /**
     * Fetch user's NIP-65 relay list from Nostr
     */
    async getUserRelayList(pubkey: string): Promise<RelayInfo[]> {
        try {
            const filter: NDKFilter = {
                kinds: [10002],
                authors: [pubkey],
                limit: 1
            };

            const event = await ndk.fetchEvent(filter);
            if (!event) return [];

            return event.tags
                .filter(t => t[0] === 'r')
                .map(t => ({
                    url: t[1],
                    read: !t[2] || t[2] === 'read',
                    write: !t[2] || t[2] === 'write'
                }));
        } catch (error) {
            console.error('[RelayService] Failed to fetch relay list:', error);
            return [];
        }
    }

    /**
     * Add a relay to the pool
     */
    async addRelay(url: string): Promise<boolean> {
        try {
            // Normalize URL
            const normalizedUrl = url.trim().toLowerCase();
            if (!normalizedUrl.startsWith('ws://') && !normalizedUrl.startsWith('wss://')) {
                throw new Error('Relay URL must start with ws:// or wss://');
            }

            await ndk.pool.addRelay(ndk.pool.getRelay(normalizedUrl) ?? normalizedUrl);
            return true;
        } catch (error) {
            console.error('[RelayService] Failed to add relay:', error);
            return false;
        }
    }

    /**
     * Remove a relay from the pool
     */
    removeRelay(url: string): void {
        ndk.pool.relays.delete(url);
    }

    /**
     * Save relay list to Nostr (NIP-65)
     */
    async saveRelayList(relays: RelayInfo[]): Promise<void> {
        const event = createEvent();
        event.kind = 10002;
        event.content = '';
        event.tags = relays.map(r => {
            if (r.read && r.write) {
                return ['r', r.url];
            } else if (r.read) {
                return ['r', r.url, 'read'];
            } else {
                return ['r', r.url, 'write'];
            }
        });

        await event.publish();
    }
}

export const relayService = new RelayService();
