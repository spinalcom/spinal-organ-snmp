// subscribe-poll.js
const EventEmitter = require("events");
const { createV2Session, snmpGet, vbValue } = require("./snmp");

class OidSubscriber extends EventEmitter {
    constructor({ ip, community = "public", intervalMs = 5000 }) {
        super();
        this.session = createV2Session(ip, community);
        this.intervalMs = intervalMs;
        this.timers = new Map(); // oid -> timer
        this.last = new Map();   // oid -> lastValue
    }

    async subscribe(oid) {
        if (this.timers.has(oid)) return;

        const tick = async () => {
            try {
                const [vb] = await snmpGet(this.session, [oid]);
                const { value, error } = vbValue(vb);
                if (error) return this.emit("error", { oid, error });

                const prev = this.last.get(oid);
                const curr = JSON.stringify(value);
                if (prev !== undefined && prev !== curr) {
                    this.emit("change", { oid, oldValue: JSON.parse(prev), newValue: value });
                }
                this.last.set(oid, curr);
                this.emit("data", { oid, value });
            } catch (e) {
                this.emit("error", { oid, error: e.message });
            }
        };

        await tick(); // première lecture immédiate
        const timer = setInterval(tick, this.intervalMs);
        this.timers.set(oid, timer);
    }

    unsubscribe(oid) {
        const t = this.timers.get(oid);
        if (t) clearInterval(t);
        this.timers.delete(oid);
        this.last.delete(oid);
    }

    close() {
        for (const t of this.timers.values()) clearInterval(t);
        this.timers.clear();
        this.last.clear();
        this.session.close();
    }
}

// Demo
(async () => {
    const ip = process.argv[2];
    const community = process.argv[3] || "public";
    const oid = process.argv[4] || "1.3.6.1.2.1.1.3.0"; // sysUpTime

    const sub = new OidSubscriber({ ip, community, intervalMs: 2000 });

    sub.on("data", (x) => console.log("data:", x));
    sub.on("change", (x) => console.log("CHANGE:", x));
    sub.on("error", (x) => console.error("error:", x));

    await sub.subscribe(oid);

    // stop après 30s (exemple)
    setTimeout(() => sub.close(), 30000);
})();