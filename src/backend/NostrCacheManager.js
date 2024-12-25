// NostrCacheManager.js
import 'websocket-polyfill'
import { addOrUpdateEvent, deleteEventFromCache } from './NostrCacheStore.js'; // Stelle sicher, dass der Import korrekt ist
const { SimplePool } = window.NostrTools;
import { relaysStore } from './RelayStore.js';
import { nip19, nip44 } from 'nostr-tools';

import { 
  NOSTR_KIND_SEAL,
  NOSTR_KIND_GIFT_WRAP
} from '../constants/nostrKinds.js';

export class NostrCacheManager {
    constructor(write_mode) {
        this.pool = new SimplePool();
        this.subscriptions = new Map();
        this.write_mode = write_mode;
        this.publicKey = null;
        this.relays = [];

        relaysStore.subscribe(value => {
            this.relays = value;
        });
    }

    async deleteEvent(event_id) {
        if (!event_id) {
            console.error("Event ID is required for deletion.");
            return;
        }

        if (!this.write_mode || !this.publicKey) {
            console.error("User must be logged in and in write mode to delete events.");
            return;
        }

        try {
            // Erzeugen des Lösch-Events für das angegebene Event
            const deleteTags = [["e", event_id]]; // Der Tag, der das zu löschende Event spezifiziert
            await this.sendEvent(5, "", deleteTags); // Senden des Lösch-Events
            console.log("Event deletion published:", event_id);

            // Aufruf der Methode aus dem NostrEventCache, um das Event aus dem Cache zu entfernen
            deleteEventFromCache(event_id);
            console.log("Event removed from cache:", event_id);
        } catch (error) {
            console.error("Error deleting the event:", error);
        }
    }

    updateRelays(new_relays) {
        // remove relays that do not match relay url properties:
        // starts with wss://
        new_relays = new_relays.filter(relay => relay.startsWith("wss://"));
        relaysStore.set(new_relays);
    }

    async initialize() {
        let useExtension = await this.extensionAvailable();
        console.log("useExtension2:", useExtension);
        console.log("writeMode:", this.write_mode);
        if (this.write_mode && useExtension) {
            this.publicKey = await window.nostr.getPublicKey();
            console.log("publicKey:", this.publicKey);
        }
        else {
            this.write_mode = false;
            this.publicKey = null;
        }
    }

    async extensionAvailable() {
        if ("nostr" in window) {
            return true;
        }
        return false;
    }

    uniqueTags(tags) {
        // Convert each tag array to a string and put it in a set.
        const tagSet = new Set(tags.map(tag => JSON.stringify(tag)));

        // Convert the set back to an array of arrays.
        const uniqueTags = Array.from(tagSet).map(tagStr => JSON.parse(tagStr));

        return uniqueTags;
    }

    async sendEvent(kind, content, tags, options = {}) {
        if (!this.write_mode) return;
        if (!this.extensionAvailable()) return;
        let event = {
            pubkey: this.publicKey,
            created_at: Math.floor(Date.now() / 1000),
            kind,
            content,
            tags,
        };

        // Add bitspark tag if not present
        if (!tags.some(tag => tag[0] === "s" && tag[1] === "bitspark")) {
            event.tags.push(["s", "bitspark"]);
        }

        event.tags = this.uniqueTags(event.tags);
        event = await window.nostr.signEvent(event);
        await this.pool.publish(this.relays, event);
        return event.id;
    }

    async createSealedEvent(content, receiverPubKey) {
        const sealContent = await window.nostr.nip44.encrypt(receiverPubKey, JSON.stringify(content));
        let seal = {
            created_at: Math.floor(Date.now() / 1000),
            kind: NOSTR_KIND_SEAL,
            tags: [],
            content: sealContent,
        };
        return await window.nostr.signEvent(seal);
    }

    async createGiftWrap(sealedEvent, anonPrivateKey, receiverPubKey) {
        const conversationKey = nip44.getConversationKey(anonPrivateKey, receiverPubKey);
        return await nip44.encrypt(JSON.stringify(sealedEvent), conversationKey);
    }

    async wrapMessage(unsignedEvent, receiverPubKey) {
        const anonPrivateKey = window.NostrTools.generateSecretKey();
        const anonPublicKey = window.NostrTools.getPublicKey(anonPrivateKey);

        // Create sealed event (NIP-59)
        const seal = await this.createSealedEvent(unsignedEvent, receiverPubKey);

        // Create gift wrap (NIP-59)
        const giftWrapContent = await this.createGiftWrap(seal, anonPrivateKey, receiverPubKey);

        return {
            content: giftWrapContent,
            anonPrivateKey,
            anonPublicKey
        };
    }

    async sendPrivateEvent(event, receiverPubKey) {
        const tags = [["p", receiverPubKey]];
        const { content, anonPrivateKey, anonPublicKey } = await this.wrapMessage(event, receiverPubKey);

        let final_event = {
            pubkey: anonPublicKey,
            created_at: Math.floor(Date.now() / 1000),
            kind: NOSTR_KIND_GIFT_WRAP,
            content,
            tags,
        };
        
        final_event.tags = this.uniqueTags(final_event.tags);
        final_event = window.NostrTools.finalizeEvent(final_event, anonPrivateKey);
        
        const pubs = this.pool.publish(this.relays, final_event);
        console.log("send anon event:", final_event);
        return final_event.id;
    }

    // Methode zum Abonnieren von Events mit Fehlerbehandlung
    subscribeToEvents(criteria) {
        console.log('relays:', this.relays);
        const subscriptionKey = this.generateSubscriptionKey(criteria);

        if (this.subscriptions.has(subscriptionKey)) {
            //console.warn('Subscription for these criteria already exists.');
            return;
        } else {
            console.log('Subscription:', criteria);
        }

        try {
            const sub = this.pool.subscribeMany(
                this.relays,
                [criteria],
                {
                    onevent: (event) => {
                        try {
                            addOrUpdateEvent(event);
                        } catch (error) {
                            console.error('Error updating event in store:', error);
                        }
                    },
                    onclose: () => {
                        console.log(`Sub ${subscriptionKey} closed.`);
                        this.subscriptions.delete(subscriptionKey);
                    }
                }
            );
            this.subscriptions.set(subscriptionKey, sub);
        } catch (error) {
            console.error('Failed to subscribe to events:', error);
            return;
        }
    }

    unsubscribeEvent(criteria) {
        const subscriptionKey = this.generateSubscriptionKey(criteria);

        // Check if a subscription exists for these criteria.
        if (this.subscriptions.has(subscriptionKey)) {
            try {
                // Close the subscription and remove it from the subscriptions map.
                this.subscriptions.get(subscriptionKey).close();
                this.subscriptions.delete(subscriptionKey);
                console.log(`Unsubscribed successfully from criteria: ${subscriptionKey}`);
            } catch (error) {
                console.error('Error unsubscribing:', error);
            }
        }
    }

    unsubscribeAll() {
        this.subscriptions.forEach(sub => {
            try {
                sub.close();
            } catch (error) {
                console.error('Error closing subscription:', error);
            }
        });
        this.subscriptions.clear();
    }

    // Generiert einen eindeutigen Schlüssel für die Subscription
    generateSubscriptionKey(criteria) {
        return JSON.stringify(criteria);
    }

    // Methode zum Beenden aller Abonnements

    // New methods for encryption handling
    async generateAnonKeyPair() {
        const privateKey = window.NostrTools.generatePrivateKey();
        const publicKey = window.NostrTools.getPublicKey(privateKey);
        return { privateKey, publicKey };
    }



}