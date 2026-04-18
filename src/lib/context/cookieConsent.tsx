'use client';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

export type ConsentCategory = 'necessary' | 'analytics';

export type ConsentState = {
  necessary: true;
  analytics: boolean;
  decided: boolean;
};

type ConsentContextValue = {
  consent: ConsentState;
  acceptAll: () => void;
  rejectAll: () => void;
};

// ─── Storage ─────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'shamanicca-cookie-consent';
const CONSENT_VERSION = 1;

const DEFAULT_CONSENT: ConsentState = {
  necessary: true,
  analytics: false,
  decided: false,
};

type StoredConsent = {
  version: number;
  analytics: boolean;
  timestamp: string;
};

function readStored(): ConsentState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: StoredConsent = JSON.parse(raw);
    if (parsed.version !== CONSENT_VERSION) return null;
    return { necessary: true, analytics: Boolean(parsed.analytics), decided: true };
  } catch {
    return null;
  }
}

function persist(analytics: boolean) {
  const payload: StoredConsent = {
    version: CONSENT_VERSION,
    analytics,
    timestamp: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

// ─── GA Consent Mode v2 ───────────────────────────────────────────────────────

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}

function pushGtagConsent(analytics: boolean) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  window.gtag('consent', 'update', {
    analytics_storage: analytics ? 'granted' : 'denied',
    ad_storage: 'denied',
  });
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ConsentContext = createContext<ConsentContextValue | undefined>(undefined);

export function CookieConsentProvider({ children }: { children: React.ReactNode }) {
  const [consent, setConsent] = useState<ConsentState>(DEFAULT_CONSENT);

  useEffect(() => {
    const stored = readStored();
    if (stored) {
      setConsent(stored);
      pushGtagConsent(stored.analytics);
    }
  }, []);

  const acceptAll = useCallback(() => {
    const next: ConsentState = { necessary: true, analytics: true, decided: true };
    setConsent(next);
    persist(true);
    pushGtagConsent(true);
  }, []);

  const rejectAll = useCallback(() => {
    const next: ConsentState = { necessary: true, analytics: false, decided: true };
    setConsent(next);
    persist(false);
    pushGtagConsent(false);
  }, []);

  return (
    <ConsentContext.Provider value={{ consent, acceptAll, rejectAll }}>
      {children}
    </ConsentContext.Provider>
  );
}

export function useCookieConsent() {
  const ctx = useContext(ConsentContext);
  if (!ctx) throw new Error('useCookieConsent must be used within CookieConsentProvider');
  return ctx;
}
