import { useMemo, useState } from 'react';
import { Layers, CheckCircle2, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useBuyUserSlots, useUserSlots } from '@/api/hooks';
import type { BuySlotResult } from '@/api/types';
import { cn } from '@/lib/utils';

export function UserSlotsCard({ userId, readOnly = false }: { userId: string; readOnly?: boolean }) {
  const { data, isLoading } = useUserSlots(userId);
  const buy = useBuyUserSlots();
  const [selected, setSelected] = useState<number[]>([]);
  const [lastResults, setLastResults] = useState<BuySlotResult[] | null>(null);
  const [confirmBuyOpen, setConfirmBuyOpen] = useState(false);
  const [buyOtp, setBuyOtp] = useState('');

  // The first slot that is neither purchased nor already selected.
  // Only this slot number is clickable to add — enforces sequential selection.
  const nextSelectableSlot = useMemo(() => {
    if (!data) return null;
    const sorted = [...data.slots].sort((a, b) => a.slotNumber - b.slotNumber);
    for (const slot of sorted) {
      if (!slot.purchased && !selected.includes(slot.slotNumber)) {
        return slot.slotNumber;
      }
    }
    return null;
  }, [data, selected]);

  const handleSlotClick = (slotNumber: number) => {
    if (selected.includes(slotNumber)) {
      // Deselect this slot and every slot selected after it (sequence must stay contiguous)
      setSelected((prev) => prev.filter((n) => n < slotNumber));
    } else if (slotNumber === nextSelectableSlot) {
      setSelected((prev) => [...prev, slotNumber]);
    }
  };

  const handleBuy = (twoFactorCode: string) => {
    setLastResults(null);
    buy.mutate(
      { userId, slots: selected, twoFactorCode },
      {
        onSuccess: (result) => {
          setLastResults(result.results);
          setSelected([]);
        },
      }
    );
  };

  const availableSlots = data?.slots.filter((s) => !s.purchased) ?? [];
  const selectedSlotsInfo = data?.slots.filter((s) => selected.includes(s.slotNumber)) ?? [];

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Layers className="h-4 w-4 text-primary" /> {readOnly ? 'Purchased slots' : 'Slot management'}
        </CardTitle>
        {data && (
          <div className="flex items-center gap-2">
            <Badge variant="muted">
              {data.purchasedCount} / {data.totalSlots} purchased
            </Badge>
            {!readOnly && data.availableCount > 0 && <Badge variant="outline">{data.availableCount} available</Badge>}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading slots…</p>
        ) : data ? (
          <>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
              {(readOnly ? data.slots.filter((s) => s.purchased) : data.slots).map((slot) => {
                const isSelected = selected.includes(slot.slotNumber);
                const isNext = slot.slotNumber === nextSelectableSlot;
                const isLocked = !slot.purchased && !isSelected && !isNext;

                return (
                  <div
                    key={slot.slotNumber}
                    onClick={() => !readOnly && !slot.purchased && !isLocked && handleSlotClick(slot.slotNumber)}
                    className={cn(
                      'select-none rounded-lg border p-2.5 text-sm transition-colors',
                      slot.purchased
                        ? 'cursor-default border-primary/30 bg-primary/10'
                        : isSelected
                          ? 'cursor-pointer border-blue-500 bg-blue-500/10'
                          : isNext
                            ? 'cursor-pointer border-border hover:border-muted-foreground/40 hover:bg-muted/30'
                            : 'cursor-not-allowed border-border/40 opacity-35'
                    )}
                  >
                    <p className="font-medium">Slot {slot.slotNumber}</p>
                    <p className="text-xs text-muted-foreground">{slot.amount} USDT</p>
                    {slot.purchased ? (
                      <p className="mt-1 text-xs text-primary">
                        L{slot.level} · #{slot.bfsIndex}
                        {slot.isCompleted && ' · Done'}
                      </p>
                    ) : (
                      <p
                        className={cn(
                          'mt-1 text-xs',
                          isSelected ? 'text-blue-400' : isNext ? 'text-muted-foreground' : 'text-muted-foreground/50'
                        )}
                      >
                        {isSelected ? 'Selected' : isNext ? 'Next' : 'Locked'}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {readOnly && data.purchasedCount === 0 && (
              <p className="text-sm text-muted-foreground">No slots purchased yet.</p>
            )}

            {!readOnly && availableSlots.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelected(availableSlots.map((s) => s.slotNumber))}
                  disabled={selected.length === availableSlots.length}
                >
                  Select all ({availableSlots.length})
                </Button>
                {selected.length > 0 && (
                  <Button variant="outline" size="sm" onClick={() => setSelected([])}>
                    Clear
                  </Button>
                )}
                <Button size="sm" disabled={!selected.length} onClick={() => setConfirmBuyOpen(true)}>
                  Buy{selected.length > 0 ? ` ${selected.length} slot${selected.length > 1 ? 's' : ''}` : ' slots'}
                </Button>
              </div>
            )}

            {!readOnly && availableSlots.length === 0 && (
              <p className="text-sm text-muted-foreground">All slots have been purchased.</p>
            )}

            {!readOnly && lastResults && (
              <div className="space-y-1.5 rounded-md border bg-muted/20 p-3">
                <p className="mb-2 text-xs font-medium text-muted-foreground">Purchase results</p>
                {lastResults.map((r) => (
                  <div
                    key={r.slot}
                    className={cn(
                      'flex items-start gap-1.5 text-xs',
                      r.success ? 'text-primary' : 'text-destructive'
                    )}
                  >
                    {r.success ? (
                      <>
                        <CheckCircle2 className="mt-px h-3.5 w-3.5 shrink-0" />
                        <span>
                          Slot {r.slot} placed at position {r.bfsIndex} (Level {r.level})
                        </span>
                      </>
                    ) : (
                      <>
                        <XCircle className="mt-px h-3.5 w-3.5 shrink-0" />
                        <span>
                          Slot {r.slot}: {r.error}
                        </span>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        ) : null}
      </CardContent>

      <Dialog
        open={confirmBuyOpen}
        onOpenChange={(open) => {
          setConfirmBuyOpen(open);
          if (!open) setBuyOtp('');
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm slot purchase</DialogTitle>
            <DialogDescription>
              You are about to purchase {selected.length} slot{selected.length !== 1 ? 's' : ''} on behalf of this
              user. Enter your authenticator code to confirm.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5 rounded-md border bg-muted/20 p-3 text-sm">
            {selectedSlotsInfo.map((s) => (
              <div key={s.slotNumber} className="flex justify-between">
                <span className="text-muted-foreground">Slot {s.slotNumber}</span>
                <span className="tabular-nums">{s.amount} USDT</span>
              </div>
            ))}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="buy-otp">Authenticator code</Label>
            <Input
              id="buy-otp"
              placeholder="6-digit code"
              inputMode="numeric"
              maxLength={6}
              value={buyOtp}
              onChange={(e) => setBuyOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmBuyOpen(false)}>
              Cancel
            </Button>
            <Button
              loading={buy.isPending}
              disabled={buyOtp.length !== 6}
              onClick={() => {
                setConfirmBuyOpen(false);
                handleBuy(buyOtp);
                setBuyOtp('');
              }}
            >
              Confirm purchase
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
