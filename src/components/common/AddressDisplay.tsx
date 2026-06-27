import { ExternalLink } from 'lucide-react';
import { CopyButton } from './CopyButton';
import { bscScanAddress, maskAddress } from '@/lib/wallet';
import { cn } from '@/lib/utils';

interface AddressDisplayProps {
  address: string | null | undefined;
  className?: string;
  withCopy?: boolean;
  withLink?: boolean;
  mono?: boolean;
}

export function AddressDisplay({
  address,
  className,
  withCopy = true,
  withLink = false,
  mono = true,
}: AddressDisplayProps) {
  if (!address) return <span className="text-muted-foreground">—</span>;

  return (
    <span className={cn('inline-flex items-center gap-1', className)}>
      <span className={cn('tabular-nums', mono && 'font-mono text-xs')} title={address}>
        {maskAddress(address)}
      </span>
      {withCopy && <CopyButton value={address} label="Address copied" />}
      {withLink && (
        <a
          href={bscScanAddress(address)}
          target="_blank"
          rel="noreferrer"
          className="text-muted-foreground hover:text-primary"
          aria-label="View on BscScan"
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      )}
    </span>
  );
}
