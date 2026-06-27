import { toast } from 'sonner';

/** Mask an address as 0x1234…abcd. */
export function maskAddress(address: string | null | undefined, lead = 6, tail = 4): string {
  if (!address) return '—';
  if (address.length < lead + tail + 2) return address;
  return `${address.slice(0, lead)}…${address.slice(-tail)}`;
}

/** Mask a bytes32 / long hash (e.g. txHash, stakeId). */
export function maskHash(hash: string | null | undefined): string {
  return maskAddress(hash, 10, 8);
}

export async function copyToClipboard(text: string, label = 'Copied') {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} to clipboard`);
  } catch {
    toast.error('Failed to copy');
  }
}

const BSCSCAN_BASE = 'https://testnet.bscscan.com';

export function bscScanTx(txHash: string): string {
  return `${BSCSCAN_BASE}/tx/${txHash}`;
}

export function bscScanAddress(address: string): string {
  return `${BSCSCAN_BASE}/address/${address}`;
}

/** On-chain slotIndex is 0-based; UI slot numbers are 1-based. */
export function slotIndexToNumber(slotIndex: number): number {
  return slotIndex + 1;
}
