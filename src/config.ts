/**
 * Official $PEGZEUS contract address.
 *
 * Leave this empty until the requester supplies the official address.
 * While it is empty the page shows "CA: TBA" and the Copy CA button stays
 * disabled. Do NOT paste an address found on an explorer, launch site or
 * listing: tokens already published under this name are not official.
 *
 * To publish it, set the string below (0x followed by 40 hex characters) or
 * build with VITE_PEGZEUS_CA=0x... and rebuild with `npm run build`.
 */
const OFFICIAL_CA = "";

export const CONTRACT_ADDRESS: string = (import.meta.env.VITE_PEGZEUS_CA ?? OFFICIAL_CA).trim();

/** True when `value` looks like an EVM address (0x + 40 hex characters). */
export function isAddress(value: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(value);
}
