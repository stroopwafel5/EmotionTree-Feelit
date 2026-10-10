/**
 * useFriendsOverview.ts
 * --------------------------------------------------------------------------
 * A React hook that asks the server "what's new in Friends?" (friends,
 * groups, requests, unread messages) and asks again every
 * FRIENDS_REFRESH_MS while `active` is true.
 *
 *   const { overview, error, refresh } = useFriendsOverview(token, active);
 */
import { useCallback, useEffect, useRef, useState } from 'react';

import { FRIENDS_REFRESH_MS } from '../config';
import { ApiError } from './api';
import { friendsService, type FriendsOverview } from './friendsService';

export function useFriendsOverview(token: string | null, active: boolean) {
  const [overview, setOverview] = useState<FriendsOverview | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  // Ignore answers that arrive after the token changed.
  const tokenRef = useRef(token);
  tokenRef.current = token;

  const refresh = useCallback(async () => {
    if (!token) {
      return;
    }
    try {
      const fresh = await friendsService.overview(token);
      if (tokenRef.current === token) {
        setOverview(fresh);
        setError(null);
      }
    } catch (e) {
      if (tokenRef.current === token) {
        setError(e instanceof ApiError ? e : new ApiError(0, String(e)));
      }
    }
  }, [token]);

  // A new (or no) token: forget the old answer.
  useEffect(() => {
    setOverview(null);
    setError(null);
  }, [token]);

  useEffect(() => {
    if (!token || !active) {
      return;
    }
    refresh();
    const timer = setInterval(refresh, FRIENDS_REFRESH_MS);
    return () => clearInterval(timer);
  }, [token, active, refresh]);

  return { overview, error, refresh };
}

/** The red number on the Friends button: new messages + friend requests. */
export function countNews(overview: FriendsOverview | null): number {
  if (!overview) {
    return 0;
  }
  return (
    overview.parent.unread +
    overview.friends.reduce((sum, f) => sum + f.unread, 0) +
    overview.groups.reduce((sum, g) => sum + g.unread, 0) +
    overview.incoming.length
  );
}
