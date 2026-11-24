import { writable } from 'svelte/store';

export type Route = 'home' | 'explorer' | 'wallet';

function isWalletHost(): boolean {
  return typeof window !== 'undefined' && window.location.hostname.startsWith('wallet.');
}

export const currentRoute = writable<Route>(isWalletHost() ? 'wallet' : 'home');

export function navigateTo(route: Route) {
  if (isWalletHost() && route === 'home' && window.location.hostname === 'wallet.starslab.qzz.io') {
    window.location.href = 'https://starslab.qzz.io/';
    return;
  }
  currentRoute.set(route);
  // Update URL without page reload
  const path =
    isWalletHost() && route === 'wallet'
      ? '/'
      : route === 'home'
        ? '/'
        : `/${route}`;
  window.history.pushState({ route }, '', path);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function parseRoute(pathname: string): Route {
  if (pathname === '/explorer' || pathname.startsWith('/explorer/')) {
    return 'explorer';
  }
  if (pathname === '/wallet' || pathname.startsWith('/wallet/')) {
    return 'wallet';
  }
  if (isWalletHost() && (pathname === '/' || pathname === '')) {
    return 'wallet';
  }
  return 'home';
}

// Handle browser back/forward buttons
if (typeof window !== 'undefined') {
  window.addEventListener('popstate', (event) => {
    const route = (event.state?.route as Route | undefined) || parseRoute(window.location.pathname);
    currentRoute.set(route);
  });

  // Set initial route based on current path
  currentRoute.set(parseRoute(window.location.pathname));
}