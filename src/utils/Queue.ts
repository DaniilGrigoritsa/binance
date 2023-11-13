import { EventEmitter } from 'events';

export default class Queue<T> extends EventEmitter {
    private items: T[] = [];

    enqueue(item: T): void {
        this.items.push(item);
        this.emit('itemAdded', item);
    }

    async dequeue(): Promise<T> {
        if (this.isEmpty()) {
            await this.waitForItem();
        }
        return this.items.shift() as T;
    }

    size(): number {
        return this.items.length;
    }

    isEmpty(): boolean {
        return this.size() === 0;
    }

    private waitForItem(): Promise<void> {
        return new Promise(resolve => {
            this.once('itemAdded', () => resolve());
        });
    }
}
