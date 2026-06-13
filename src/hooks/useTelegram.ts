
import { useEffect, useState } from 'react';

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
}

export function useTelegram() {
  const [tg, setTg] = useState<any>(null);
  const [user, setUser] = useState<TelegramUser | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
      const webapp = (window as any).Telegram.WebApp;
      setTg(webapp);
      webapp.expand();
      if (webapp.initDataUnsafe?.user) {
        setUser(webapp.initDataUnsafe.user);
      } else {
        // Fallback for dev environment
        setUser({
          id: 12345678,
          first_name: 'Dev',
          username: 'dev_player',
        });
      }
    }
  }, []);

  return { tg, user };
}
