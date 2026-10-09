import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationsApi, type AppNotification } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

// The badge polls once a minute and whenever the tab regains focus.
const POLL_MS = 60_000;

export function useUnreadCount() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['notifications', 'count'],
    queryFn: notificationsApi.unreadCount,
    enabled: !!user,
    refetchInterval: POLL_MS,
    refetchOnWindowFocus: true,
  });
}

export function useNotificationList(enabled = true) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['notifications', 'list'],
    queryFn: notificationsApi.list,
    enabled: !!user && enabled,
  });
}

export function useMarkRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ type, id }: Pick<AppNotification, 'type' | 'id'>) => notificationsApi.markRead(type, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

export function useMarkAllRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

// Where a notification leads when clicked: blog posts open the post; announcements
// are shown in full on the Notifications page.
export const notificationHref = (n: AppNotification) =>
  n.type === 'blog' && n.slug ? `/blog/${n.slug}` : '/notifications';
