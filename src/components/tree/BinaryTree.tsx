import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Tree from 'react-d3-tree';
import type { CustomNodeElementProps, RawNodeDatum } from 'react-d3-tree';
import { Minus, Plus, Maximize2 } from 'lucide-react';
import type { SlotTreeNode } from '@/api/types';
import { maskAddress } from '@/lib/wallet';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface NodeMeta {
  raw: SlotTreeNode | null;
  empty: boolean;
}

type Datum = RawNodeDatum & { __meta: NodeMeta };

/** Convert the nested API tree into react-d3-tree data, inserting empty
 * placeholders for the open child slots beneath occupied nodes. */
function toDatum(node: SlotTreeNode): Datum {
  const children: Datum[] = [];

  const left = node.leftChild;
  const right = node.rightChild;

  children.push(
    left ? toDatum(left) : emptyDatum(node.bfsIndex * 2 + 1, 'left')
  );
  children.push(
    right ? toDatum(right) : emptyDatum(node.bfsIndex * 2 + 2, 'right')
  );

  return {
    name: node.user?.username ?? maskAddress(node.userWallet),
    __meta: { raw: node, empty: false },
    children,
  };
}

function emptyDatum(bfsIndex: number, position: 'left' | 'right'): Datum {
  return {
    name: 'open',
    __meta: {
      raw: null,
      empty: true,
    },
    attributes: { bfsIndex: String(bfsIndex), position },
  };
}

interface BinaryTreeProps {
  root: SlotTreeNode | null;
  slot: number;
  onNodeClick?: (node: SlotTreeNode) => void;
  className?: string;
}

export function BinaryTree({ root, slot, onNodeClick, className }: BinaryTreeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(0.8);

  const data = useMemo(() => (root ? [toDatum(root)] : []), [root]);

  const center = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const { width } = el.getBoundingClientRect();
    setTranslate({ x: width / 2, y: 90 });
  }, []);

  useEffect(() => {
    center();
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => center());
    ro.observe(el);
    return () => ro.disconnect();
  }, [center]);

  const renderNode = useCallback(
    ({ nodeDatum }: CustomNodeElementProps) => {
      const meta = (nodeDatum as unknown as Datum).__meta;
      return (
        <NodeCard
          meta={meta}
          slot={slot}
          onClick={() => meta.raw && onNodeClick?.(meta.raw)}
        />
      );
    },
    [onNodeClick, slot]
  );

  return (
    <div ref={containerRef} className={cn('relative h-[560px] w-full overflow-hidden rounded-lg border bg-muted/20', className)}>
      <div className="absolute right-3 top-3 z-10 flex flex-col gap-1">
        <Button variant="secondary" size="icon-sm" onClick={() => setZoom((z) => Math.min(2, +(z + 0.1).toFixed(2)))} aria-label="Zoom in">
          <Plus className="h-4 w-4" />
        </Button>
        <Button variant="secondary" size="icon-sm" onClick={() => setZoom((z) => Math.max(0.2, +(z - 0.1).toFixed(2)))} aria-label="Zoom out">
          <Minus className="h-4 w-4" />
        </Button>
        <Button variant="secondary" size="icon-sm" onClick={() => { setZoom(0.8); center(); }} aria-label="Reset view">
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>

      <Legend />

      {data.length > 0 && (
        <Tree
          data={data}
          translate={translate}
          zoom={zoom}
          orientation="vertical"
          pathFunc="diagonal"
          collapsible={false}
          zoomable
          scaleExtent={{ min: 0.2, max: 2 }}
          separation={{ siblings: 1.1, nonSiblings: 1.3 }}
          nodeSize={{ x: 180, y: 130 }}
          renderCustomNodeElement={renderNode}
          rootNodeClassName="rd3t-root"
        />
      )}
    </div>
  );
}

function NodeCard({ meta, slot, onClick }: { meta: NodeMeta; slot: number; onClick: () => void }) {
  if (meta.empty) {
    return (
      <foreignObject width={150} height={64} x={-75} y={-32}>
        <div className="flex h-full w-full items-center justify-center rounded-md border border-dashed border-border/60 bg-background/40 text-[10px] uppercase tracking-wider text-muted-foreground">
          Open slot
        </div>
      </foreignObject>
    );
  }

  const node = meta.raw!;
  const completed = !!node.isCompleted;
  const username = node.user?.username ?? '—';
  const wallet = maskAddress(node.userWallet);

  return (
    <foreignObject width={160} height={92} x={-80} y={-46}>
      <button
        type="button"
        onClick={onClick}
        title={`${node.user?.username ?? ''}\n${node.userWallet}\nSlot ${slot} · L${node.level} · bfs ${node.bfsIndex} · ${node.childPosition}`}
        className={cn(
          'flex h-full w-full flex-col items-start gap-1 rounded-md border p-2 text-left shadow-sm transition-colors',
          completed
            ? 'border-success/50 bg-success/10 hover:bg-success/20'
            : 'border-primary/40 bg-card hover:bg-accent'
        )}
      >
        <div className="flex w-full items-center justify-between gap-1">
          <span className="truncate text-xs font-semibold">{username}</span>
          <span
            className={cn(
              'shrink-0 rounded px-1 py-0.5 text-[9px] font-medium',
              completed ? 'bg-success/20 text-success' : 'bg-primary/15 text-primary'
            )}
          >
            L{node.level}
          </span>
        </div>
        <span className="font-mono text-[10px] text-muted-foreground">{wallet}</span>
        <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
          <span className="rounded bg-muted px-1 py-0.5">S{slot}</span>
          <span className="rounded bg-muted px-1 py-0.5">#{node.bfsIndex}</span>
          {completed && <span className="rounded bg-success/20 px-1 py-0.5 text-success">done</span>}
        </div>
      </button>
    </foreignObject>
  );
}

function Legend() {
  return (
    <div className="absolute left-3 top-3 z-10 flex flex-col gap-1.5 rounded-md border bg-card/90 p-2 text-[10px] backdrop-blur">
      <div className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-sm border border-primary/40 bg-card" /> Active position
      </div>
      <div className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-sm border border-success/50 bg-success/20" /> Completed (rebirth)
      </div>
      <div className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-sm border border-dashed border-border/60" /> Open slot
      </div>
    </div>
  );
}
