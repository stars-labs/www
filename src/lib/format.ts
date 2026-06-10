// Shared display formatters for hashes, addresses, and timestamps.

export function formatHash(hash: string, prefix = 8, suffix = 6): string {
  if (!hash) return '';
  return hash.length > prefix + suffix + 2
    ? `${hash.slice(0, prefix)}...${hash.slice(-suffix)}`
    : hash;
}

export function formatTime(timestamp: number | null): string {
  if (!timestamp) return 'Pending';

  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return 'Pending';

  const diff = Date.now() - date.getTime();

  if (diff < 0) return date.toLocaleString();
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
  return date.toLocaleDateString();
}

export function formatValue(value: string): string {
  // Value is in wei (string), convert to readable format
  const num = parseFloat(value);
  if (isNaN(num)) return value;
  if (num >= 1e18) return (num / 1e18).toFixed(4) + ' ETH';
  if (num >= 1e9) return (num / 1e9).toFixed(2) + ' Gwei';
  return num.toLocaleString();
}
