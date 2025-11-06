// Shared category color mapping for seller dashboard visualisations
export const CATEGORY_COLOR_MAP = {
"Automotive": "#E53935",
"Books": "#2E7D32",
"Collectibles": "#00838F",
"Electronics": "#6A1B9A",
"Fashion": "#F9A825",
"Health & Beauty": "#D84315",
"Home & Living": "#0277BD",
"Miscellaneous": "#7CB342",
"Sports": "#F4511E",
"Toys & Games": "#bb70cfff",
};

// Fallback palette cycles when new categories appear
export const FALLBACK_CATEGORY_COLORS = ["#f6a5c0", "#b2df8a"];

const fallbackAssignments = new Map();

function hashCategory(category) {
  let hash = 0;
  for (let i = 0; i < category.length; i += 1) {
    hash = (hash << 5) - hash + category.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

export function getCategoryColor(category) {
  if (CATEGORY_COLOR_MAP[category]) {
    return CATEGORY_COLOR_MAP[category];
  }

  if (!fallbackAssignments.has(category)) {
    const seed = hashCategory(category);
    const color =
      FALLBACK_CATEGORY_COLORS[seed % FALLBACK_CATEGORY_COLORS.length];
    fallbackAssignments.set(category, color);
  }

  return fallbackAssignments.get(category);
}
