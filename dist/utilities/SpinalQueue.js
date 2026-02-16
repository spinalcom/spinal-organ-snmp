"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpinalQueue = exports.Events = void 0;
const lodash = require("lodash");
const events_1 = require("events");
var Events;
(function (Events) {
    Events["FINISH"] = "finish";
    Events["START"] = "start";
})(Events || (exports.Events = Events = {}));
class SpinalQueue extends events_1.EventEmitter {
    constructor() {
        super();
        this.processed = [];
        this.queueList = [];
        this.percent = 0;
        this.length = 0;
        this.isProcessing = false;
        this.debounceStart = lodash.debounce(this.begin.bind(this), 3000);
    }
    addToQueue(obj) {
        this.queueList.push(obj);
        this.length = this.queueList.length;
        this.debounceStart();
        return this.length;
    }
    setQueue(queue) {
        this.queueList.push(...queue);
        this.length = this.queueList.length;
        this.debounceStart();
        return this.length;
    }
    dequeue() {
        const item = this.queueList.shift();
        if (this.queueList.length === 0)
            this.finish();
        else
            this.processed.push(item);
        this.percent = Math.floor((100 * this.processed.length) / this.length);
        return item;
    }
    refresh() {
        this.clear();
    }
    clear() {
        this.queueList = [];
        this.finish();
    }
    getQueue() {
        return [...this.queueList];
    }
    isEmpty() {
        return this.queueList.length === 0;
    }
    begin() {
        if (!this.isProcessing) {
            this.isProcessing = true;
            this.emit(Events.START);
        }
    }
    finish() {
        if (this.isProcessing) {
            this.isProcessing = false;
            this.emit(Events.FINISH);
        }
    }
}
exports.SpinalQueue = SpinalQueue;
exports.default = SpinalQueue;
//# sourceMappingURL=SpinalQueue.js.map