import { writable } from 'svelte/store';

export type Route = 'home' | 'explorer';

export const currentRoute = writable<Route>('home');

export function navigateTo(route: Route) {
  currentRoute.set(route);
  // Update URL without page reload
  const path = route === 'home' ? '/' : `/${route}`;
  window.history.pushState({ route }, '', path);
}

// Handle browser back/forward buttons
if (typeof window !== 'undefined') {
  window.addEventListener('popstate', (event) => {
    const route = event.state?.route || 'home';
    currentRoute.set(route);
  });

  // Set initial route based on current path
  const path = window.location.pathname;
  if (path === '/explorer') {
    currentRoute.set('explorer');
  }
}