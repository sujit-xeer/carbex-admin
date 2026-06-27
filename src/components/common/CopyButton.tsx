import { Check, Copy } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { copyToClipboard } from '@/lib/wallet';
import { cn } from '@/lib/utils';

export function CopyButton({ value, label = 'Copied', className }: { value: string; label?: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  const handle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    await copyToClipboard(value, label);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className={cn('text-muted-foreground hover:text-foreground', className)}
      onClick={handle}
      aria-label="Copy to clipboard"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
    </Button>
  );
}
