import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search as SearchIcon } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useUser } from '@/api/hooks';

const MONGO_ID_RE = /^[a-f0-9]{24}$/i;
const SHORTHAND_RE = /^\d+$/;

/** The platform auto-generates usernames as CARBEX<seq>, zero-padded to at least 2 digits. */
function shorthandToUsername(input: string): string {
  return `CARBEX${input.padStart(2, '0')}`;
}

export default function UserOverviewSearchPage() {
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [resolveId, setResolveId] = useState('');

  const { data: resolvedUser, isFetching, isError } = useUser(resolveId);

  useEffect(() => {
    if (!resolveId) return;
    if (resolvedUser) {
      navigate(`/users/overview/${resolvedUser.username}`);
    } else if (isError) {
      setError('No user found for that ID.');
      setResolveId('');
    }
  }, [resolveId, resolvedUser, isError, navigate]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmed = input.trim();
    if (!trimmed) return;

    if (SHORTHAND_RE.test(trimmed)) {
      navigate(`/users/overview/${shorthandToUsername(trimmed)}`);
      return;
    }

    if (MONGO_ID_RE.test(trimmed)) {
      setResolveId(trimmed);
      return;
    }

    setError('Enter a valid Mongo user ID or a user number (e.g. 1, 9, 108).');
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="User Overview"
        description="Look up a user's complete public profile by Mongo ID or user number."
      />

      <Card className="max-w-lg">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="overview-input">Mongo user ID or user number</Label>
              <div className="relative">
                <SearchIcon className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="overview-input"
                  className="pl-8"
                  placeholder="e.g. 66f1a2b3c4d5e6f7a8b9c0d1 or 108"
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    setError(null);
                  }}
                  autoFocus
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Paste the user's Mongo ID, or just their number — e.g. entering <span className="font-mono">108</span>{' '}
                opens <span className="font-mono">CARBEX108</span>, and <span className="font-mono">1</span> opens{' '}
                <span className="font-mono">CARBEX01</span>.
              </p>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" loading={isFetching} disabled={!input.trim()}>
              View overview
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
