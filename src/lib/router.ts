import { writable } from 'svelte/store';

export type Route = 'home' | 'explorer' | 'wallet';

export const currentRoute = writable<Route>('home');

export function navigateTo(route: Route) {
  currentRoute.set(route);
  // Update URL without page reload
  const path = route === 'home' ? '/' : `/${route}`;
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