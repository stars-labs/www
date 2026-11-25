import { writable } from 'svelte/store';

export type Route = 'home' | 'explorer' | 'wallet';
export type WalletWorkspace = 'sandbox' | 'guides' | 'chains' | 'protocol' | 'faq';

function parseWalletWorkspace(): WalletWorkspace {
  if (typeof window === 'undefined') return 'sandbox';
  const h = window.location.hash.replace(/^#/, '');
  if (h === 'guides' || h === 'chains' || h === 'protocol' || h === 'faq' || h === 'sandbox') {
    return h;
  }
  return 'sandbox';
}

export const walletWorkspace = writable<WalletWorkspace>(parseWalletWorkspace());

export function setWalletWorkspace(ws: WalletWorkspace, scrollToContent = true) {
  walletWorkspace.set(ws);
  if (typeof window !== 'undefined') {
    window.history.replaceState(window.history.state, '', `#${ws}`);
    if (scrollToContent) {
      const el = document.getElementById('wallet-workspace');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}

function isWalletHost(): boolean {
  return typeof window !== 'undefined' && window.location.hostname.startsWith('wallet.');
}

export const currentRoute = writable<Route>(isWalletHost() ? 'wallet' : 'home');

export function navigateTo(route: Route) {
  if (typeof window !== 'undefined') {
    if (window.location.hostname === 'wallet.starslab.qzz.io' && route !== 'wallet') {
      window.location.href = route === 'explorer' ? 'https://starslab.qzz.io/explorer' : 'https://starslab.qzz.io/';
      return;
    }
    if (window.location.hostname === 'starslab.qzz.io' && route === 'wallet') {
      window.location.href = 'https://wallet.starslab.qzz.io/';
      return;
    }
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
  if (isWalletHost()) {
    return 'wallet';
  }
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