export let AppConfig = null;

export async function loadConfig() {
    try {
        const response = await fetch('/config.json');
        if (!response.ok) {
            throw new Error(`Failed to load config: ${response.statusText}`);
        }
        AppConfig = await response.json();
        return AppConfig;
    } catch (error) {
        console.error("Error loading config:", error);
        throw error;
    }
}
