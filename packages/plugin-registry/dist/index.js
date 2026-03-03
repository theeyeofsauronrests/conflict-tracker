export class PluginRegistry {
    // Use maps for fast lookups by id and feature flag.
    plugins = new Map();
    flags = new Map();
    register(plugin) {
        // Guard against accidental double-registration.
        if (this.plugins.has(plugin.id)) {
            throw new Error(`Plugin already registered: ${plugin.id}`);
        }
        this.plugins.set(plugin.id, plugin);
    }
    setFeatureFlag(flag, enabled) {
        this.flags.set(flag, enabled);
    }
    list(kind) {
        // Filter by plugin type first, then apply feature-flag visibility.
        const values = [...this.plugins.values()];
        const filtered = kind ? values.filter((p) => p.kind === kind) : values;
        return filtered.filter((plugin) => {
            if (!plugin.featureFlag) {
                return true;
            }
            return this.flags.get(plugin.featureFlag) !== false;
        });
    }
}
