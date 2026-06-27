import { Contract, JsonRpcProvider, formatUnits, type EventLog } from 'ethers';
import { CONTRACT_ADDRESS, RPC_URL, STAKING_EVENT_ABI } from './constants';

export interface ChainEvent {
  id: string; // `${txHash}:${logIndex}`
  eventName: 'Staked' | 'Withdrawal' | string;
  txHash: string;
  logIndex: number;
  blockNumber: number;
  args: Record<string, string>;
}

let provider: JsonRpcProvider | null = null;
function getProvider() {
  if (!provider) provider = new JsonRpcProvider(RPC_URL);
  return provider;
}

function stringifyArgs(log: EventLog): Record<string, string> {
  const out: Record<string, string> = {};
  const frag = log.fragment;
  frag.inputs.forEach((input, i) => {
    const v = log.args[i];
    out[input.name || `arg${i}`] = typeof v === 'bigint' ? v.toString() : String(v);
  });
  return out;
}

/**
 * Read-only fallback: query Staked/Withdrawal logs directly from the contract
 * over the most recent block window. Used when the backend events endpoint is
 * unavailable.
 */
export async function readChainEvents(blockWindow = 4900): Promise<ChainEvent[]> {
  const p = getProvider();
  const contract = new Contract(CONTRACT_ADDRESS, STAKING_EVENT_ABI, p);
  const latest = await p.getBlockNumber();
  const fromBlock = Math.max(0, latest - blockWindow);

  const [staked, withdrawals] = await Promise.all([
    contract.queryFilter(contract.filters.Staked(), fromBlock, latest),
    contract.queryFilter(contract.filters.Withdrawal(), fromBlock, latest),
  ]);

  const logs = [...staked, ...withdrawals].filter((l): l is EventLog => 'fragment' in l);

  return logs
    .map((log) => ({
      id: `${log.transactionHash}:${log.index}`,
      eventName: log.fragment.name,
      txHash: log.transactionHash,
      logIndex: log.index,
      blockNumber: log.blockNumber,
      args: stringifyArgs(log),
    }))
    .sort((a, b) => b.blockNumber - a.blockNumber || b.logIndex - a.logIndex);
}

/** Format an 18-decimal token/USDT value string for display. */
export function formatTokenAmount(value: string | undefined, decimals = 18): string {
  if (value === undefined) return '—';
  try {
    return Number(formatUnits(value, decimals)).toLocaleString('en-US', { maximumFractionDigits: 4 });
  } catch {
    return value;
  }
}
