/**
 * FollowCaseButton — seguir / deixar de seguir um caso.
 * Auto-inscreve por trigger no backend; este botão é override consciente.
 */
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bookmark, BookmarkCheck, Loader2 } from 'lucide-react';
import { followCase, isFollowingCase, unfollowCase } from '@/services/community';
import { toast } from 'sonner';

interface Props {
  caseId: string;
  size?: 'sm' | 'default';
}

export function FollowCaseButton({ caseId, size = 'sm' }: Props) {
  const [following, setFollowing] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    void isFollowingCase(caseId).then((v) => { if (alive) setFollowing(v); });
    return () => { alive = false; };
  }, [caseId]);

  const toggle = async () => {
    setLoading(true);
    try {
      if (following) {
        await unfollowCase(caseId);
        setFollowing(false);
        toast.success('Você deixou de seguir este caso.');
      } else {
        await followCase(caseId);
        setFollowing(true);
        toast.success('Você está seguindo este caso. Avisamos quando houver novidade.');
      }
    } catch (err) {
      toast.error(err?.message || 'Não foi possível atualizar.');
    } finally {
      setLoading(false);
    }
  };

  if (following === null) {
    return (
      <Button variant="ghost" size={size} disabled className="gap-1.5">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      </Button>
    );
  }

  return (
    <Button
      variant={following ? 'secondary' : 'outline'}
      size={size}
      onClick={toggle}
      disabled={loading}
      className="gap-1.5"
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : following ? (
        <BookmarkCheck className="h-3.5 w-3.5" />
      ) : (
        <Bookmark className="h-3.5 w-3.5" />
      )}
      {following ? 'Seguindo' : 'Seguir caso'}
    </Button>
  );
}
