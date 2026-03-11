/**
 * Resolves a color name string to a valid CSS color value.
 * Handles exact CSS color names, hex codes, and fuzzy/multi-word names
 * like "cosmic orange", "space black", "deep purple", etc.
 */

// Extended map of common product color names → CSS hex values
const COLOR_MAP = {
    // Blacks & Grays
    black: "#000000",
    "space black": "#1c1c1e",
    "midnight black": "#0a0a0a",
    "matte black": "#1a1a1a",
    "graphite": "#4a4a4a",
    "space gray": "#8e8e93",
    "space grey": "#8e8e93",
    "titanium": "#8a8a8f",
    "dark gray": "#333333",
    "dark grey": "#333333",
    gray: "#808080",
    grey: "#808080",
    "light gray": "#d1d5db",
    "light grey": "#d1d5db",
    "silver": "#c0c0c0",
    "starlight": "#f0ece3",

    // Whites & Creams
    white: "#ffffff",
    "pearl white": "#f8f4f0",
    "alpine white": "#f5f5f0",
    "ceramic white": "#f9f9f9",
    cream: "#fffdd0",
    ivory: "#fffff0",
    "natural titanium": "#c8c5bb",

    // Blues
    blue: "#2563eb",
    "dark blue": "#1e3a8a",
    "light blue": "#bfdbfe",
    "sky blue": "#0ea5e9",
    navy: "#001f5b",
    "midnight blue": "#003366",
    "sierra blue": "#a8c5da",
    "pacific blue": "#3d7ebf",
    "ocean blue": "#1e6fa8",
    "alpine blue": "#4a90d9",
    teal: "#0d9488",
    cyan: "#06b6d4",
    "glacier blue": "#b0d4e8",

    // Greens
    green: "#16a34a",
    "dark green": "#14532d",
    "light green": "#86efac",
    olive: "#6b7280",
    "midnight green": "#1c3d2e",
    "alpine green": "#2d5a27",
    mint: "#3eb489",
    sage: "#8fa37e",
    "forest green": "#228b22",

    // Purples & Pinks
    purple: "#9333ea",
    "deep purple": "#4c1d95",
    violet: "#7c3aed",
    lavender: "#c4b5fd",
    mauve: "#e0b0ff",
    pink: "#ec4899",
    "hot pink": "#ff69b4",
    rose: "#f43f5e",
    magenta: "#d946ef",
    "light purple": "#c084fc",

    // Reds & Oranges
    red: "#dc2626",
    "dark red": "#7f1d1d",
    crimson: "#b91c1c",
    scarlet: "#c0392b",
    orange: "#f97316",
    "cosmic orange": "#e8602c",
    "sunset orange": "#fd5e53",
    coral: "#f97070",
    "burnt orange": "#cc5500",
    salmon: "#fa8072",
    tomato: "#ff6347",

    // Yellows & Golds
    yellow: "#eab308",
    gold: "#f59e0b",
    "light gold": "#fde68a",
    amber: "#f59e0b",
    "warm gold": "#d4a017",
    champagne: "#f7e7ce",
    "desert titanium": "#c2a882",

    // Browns & Earth Tones
    brown: "#92400e",
    tan: "#d2b48c",
    beige: "#f5f5dc",
    bronze: "#cd7f32",
    copper: "#b87333",
    mocha: "#6b4423",

    // Special / Branded
    "product red": "#bf0000",
    "midnight": "#1d1d2e",
    "ultra violet": "#5f4b8b",
    "nebula": "#6b4f8e",
    "aurora": "#00c9a7",
};

/**
 * Given a color string (name or hex), returns a valid CSS color.
 * Falls back to generating a deterministic color from the name.
 */
export function resolveColor(colorName) {
    if (!colorName) return "#cccccc";

    const trimmed = String(colorName).trim();

    // Already a valid hex color
    if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(trimmed)) {
        return trimmed;
    }

    // Already a valid rgb/hsl value
    if (/^(rgb|hsl)a?\(/.test(trimmed)) {
        return trimmed;
    }

    // Lookup in map (case-insensitive)
    const lower = trimmed.toLowerCase();
    if (COLOR_MAP[lower]) {
        return COLOR_MAP[lower];
    }

    // Partial match — find first key that contains the color word or vice versa
    const partialMatch = Object.keys(COLOR_MAP).find(
        (key) => lower.includes(key) || key.includes(lower)
    );
    if (partialMatch) {
        return COLOR_MAP[partialMatch];
    }

    // Last resort: generate a deterministic hue from the string
    let hash = 0;
    for (let i = 0; i < trimmed.length; i++) {
        hash = trimmed.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 55%, 50%)`;
}

/**
 * Returns true if the resolved color is very light (needs dark border for visibility).
 */
export function isLightColor(cssColor) {
    // Simple heuristic for known light colors
    const lightKeywords = ["white", "cream", "ivory", "starlight", "silver", "light", "pearl", "champagne", "beige"];
    const lower = String(cssColor).toLowerCase();
    return lightKeywords.some((k) => lower.includes(k));
}