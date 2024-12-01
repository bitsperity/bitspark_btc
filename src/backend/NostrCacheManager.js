// NostrCacheManager.js
import 'websocket-polyfill'
import { addOrUpdateEvent, deleteEventFromCache } from './NostrCacheStore.js'; // Stelle sicher, dass der Import korrekt ist
const { SimplePool } = window.NostrTools;
import { relaysStore } from './RelayStore.js';
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
        relaysStore.set(new_relays);
        // console.log("new relays:", new_relays);
    }

    async getPublicRelaysString() {
        return ["wss://relay.damus.io",
            "wss://nostr-pub.wellorder.net"];
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

        const pubs = this.pool.publish(this.relays, event);
        return event.id;
    }

    async sendAnonEvent(kind, content, tags, anonPrivateKey, anonPublicKey) {
        // Generiere einen zufälligen privaten Schlüssel
        let event = {
            pubkey: anonPublicKey,
            created_at: Math.floor(Date.now() / 1000),
            kind,
            content,
            tags,
        };

        // Signiere das Event mit dem zufälligen privaten Schlüssel
        
        event.tags = this.uniqueTags(event.tags);
        event = window.NostrTools.finalizeEvent(event, anonPrivateKey);
        
        const pubs = this.pool.publish(this.relays, event);
        console.log("send anon event:", event);
        // console.log("used relays:", this.relays);
        return event.id;
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

    async createSealedEvent(event, receiverPubKey) {
        const sealedContent = await window.nostr.nip44.encrypt(
            receiverPubKey,
            JSON.stringify(event)
        );

        return {
            kind: NOSTR_KIND_SEAL,
            content: sealedContent,
            tags: [
                ["p", receiverPubKey],
                ["s", "bitspark"]
            ]
        };
    }

    async createGiftWrap(event, receiverPubKey, anonKeyPair) {
        const wrappedContent = await window.nostr.nip44.encrypt(
            receiverPubKey,
            JSON.stringify(event)
        );

        return {
            kind: NOSTR_KIND_GIFT_WRAP,
            pubkey: anonKeyPair.publicKey,
            content: wrappedContent,
            tags: [
                ["p", receiverPubKey],
                ["s", "bitspark"]
            ]
        };
    }

    // New method for sending encrypted events
    async sendEncryptedEvent(kind, content, tags, receiverPubKey) {
        if (!this.write_mode) return;
        if (!this.extensionAvailable()) return;

        // 1. Create and sign the base event
        let event = {
            pubkey: this.publicKey,
            created_at: Math.floor(Date.now() / 1000),
            kind,
            content,
            tags: [...tags, ["s", "bitspark"]]
        };
        event = await window.nostr.signEvent(event);

        // 2. Create seal
        const sealedEvent = await this.createSealedEvent(event, receiverPubKey);

        // 3. Always create gift wrap for anonymity
        const anonKeyPair = await this.generateAnonKeyPair();
        const giftWrap = await this.createGiftWrap(sealedEvent, receiverPubKey, anonKeyPair);
        event = window.NostrTools.finalizeEvent(giftWrap, anonKeyPair.privateKey);

        const pubs = this.pool.publish(this.relays, event);
        return event.id;
    }
}