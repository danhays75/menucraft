// SplashScreen — branded Bubba's 33 roadhouse splash shown on app startup.
// Dual-purpose:
//   1. HOLD phase (~1.5s): branding + indeterminate red loading bar + the
//      "Loading Legendary" caption. Pure visual branding hold.
//   2. After the hold, if the user is NOT authenticated, transition into a
//      LANDING/LOGIN state: same emblem + "BUBBA'S 33" wordmark + "ROADIE
//      TRAINING" label, plus a prominent "Sign In" button (calls login() from
//      useAuth) and the "Let's be Legendary" tagline beneath it.
//   3. If the user IS authenticated after the hold, fade out and call
//      onComplete so main.tsx renders the full App.
//
// If an admin has uploaded a logo via theme settings (exposed as data-logo-url
// on the document element by useThemeSettings), the logo is shown instead of
// the "33" text emblem. No routing/data/logic changes — pure visual layer.

import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

// The placeholder fallback used by lib/blob.ts when no logo is uploaded.
// We treat this URL as "no real logo" so the branded "33" emblem shows.
const LOGO_PLACEHOLDER = "/assets/images/placeholder.svg";

// Minimum time the splash stays visible so the brand registers (~1.5s).
const MIN_HOLD_MS = 1500;
// Fade-out duration must match the CSS transition on the root element.
const FADE_MS = 600;

type SplashPhase = "holding" | "fading" | "done";

/**
 * Resolve the admin-uploaded logo URL, if any.
 * useThemeSettings writes data-logo-url onto <html>. When no logo is uploaded
 * the value is the placeholder fallback, which we treat as "no logo".
 */
function readLogoUrl(): string | null {
  if (typeof document === "undefined") return null;
  const url = document.documentElement.getAttribute("data-logo-url");
  if (!url || url === LOGO_PLACEHOLDER) return null;
  return url;
}

export interface SplashScreenProps {
  /** Called once the splash has fully faded out (only when authenticated). */
  onComplete?: () => void;
  /** Optional external "ready" signal; splash holds at least MIN_HOLD_MS. */
  ready?: boolean;
}

export function SplashScreen({ onComplete, ready = true }: SplashScreenProps) {
  const { isAuthenticated, login, isLoggingIn } = useAuth();
  const [phase, setPhase] = useState<SplashPhase>("holding");
  const [logoUrl, setLogoUrl] = useState<string | null>(() => readLogoUrl());

  // Re-check the logo attribute once shortly after mount — useThemeSettings
  // runs inside the router and may set data-logo-url a tick after first paint.
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      const url = readLogoUrl();
      if (url) setLogoUrl(url);
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  // Hold for MIN_HOLD_MS (and at least until `ready`), then advance. We do NOT
  // auto-fade here — the post-hold decision (login vs. proceed) is made in a
  // separate effect once the hold completes.
  const [holdDone, setHoldDone] = useState(false);
  useEffect(() => {
    if (holdDone) return;
    const mountedAt = Date.now();
    const elapsed = () => Date.now() - mountedAt;

    const finish = () => setHoldDone(true);

    const remaining = Math.max(0, MIN_HOLD_MS - elapsed());
    if (ready) {
      const t = window.setTimeout(finish, remaining);
      return () => window.clearTimeout(t);
    }
    // Not ready yet — poll until ready, then honor the minimum hold.
    const interval = window.setInterval(() => {
      if (ready && elapsed() >= MIN_HOLD_MS) {
        window.clearInterval(interval);
        finish();
      }
    }, 100);
    return () => window.clearInterval(interval);
  }, [holdDone, ready]);

  // After the hold completes, decide what to do:
  //   - Authenticated → fade out and notify (proceed into the app). We do NOT
  //     wait for isInitializing: a restored II session sets
  //     isAuthenticated=true synchronously during the 1.5s MIN_HOLD_MS hold,
  //     so by the time holdDone is true the auth state is final. Waiting on
  //     isInitializing would hang the splash on a black screen forever on a
  //     fresh load (createAuthClient/IndexedDB open can take unbounded time).
  //   - Not authenticated → stay on the landing/login state (no fade). See
  //     showLogin below — also intentionally NOT gated on isInitializing.
  useEffect(() => {
    if (!holdDone || phase !== "holding") return;
    if (isAuthenticated) {
      setPhase("fading");
    }
    // else: remain in the landing/login state until the user signs in.
  }, [holdDone, isAuthenticated, phase]);

  // When the user signs in FROM the landing state, fade out + proceed.
  // Same rationale as above: do NOT wait on isInitializing.
  useEffect(() => {
    if (phase !== "holding" || !holdDone) return;
    if (isAuthenticated) {
      setPhase("fading");
    }
  }, [phase, holdDone, isAuthenticated]);

  // After the fade transition completes, mark done and notify.
  useEffect(() => {
    if (phase !== "fading") return;
    const t = window.setTimeout(() => {
      setPhase("done");
      onComplete?.();
    }, FADE_MS);
    return () => window.clearTimeout(t);
  }, [phase, onComplete]);

  if (phase === "done") return null;

  // Landing/login state is shown after the branding hold when unauthenticated.
  // During the hold we show the loading bar + caption; once the hold is done
  // and the user is unauthenticated, we swap the loading bar for the Sign In
  // button + tagline. We intentionally do NOT gate on isInitializing here —
  // see the post-hold effect above for why waiting on isInitializing can hang
  // the splash on a black screen forever on a fresh unauthenticated load.
  const showLogin = holdDone && !isAuthenticated;

  return (
    <div
      data-ocid="splash.screen"
      aria-hidden={phase === "fading"}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center px-6"
      style={{
        backgroundColor: "#141412",
        opacity: phase === "fading" ? 0 : 1,
        transition: `opacity ${FADE_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`,
      }}
    >
      {/* Emblem / Logo -------------------------------------------------- */}
      <div
        className="flex items-center justify-center"
        style={{ marginBottom: "1.75rem" }}
      >
        {logoUrl ? (
          <img
            src={logoUrl}
            alt="Bubba's 33"
            className="h-28 w-28 rounded-2xl object-contain sm:h-32 sm:w-32"
            style={{ maxHeight: "40vh", maxWidth: "70vw" }}
          />
        ) : (
          <div
            data-ocid="splash.emblem"
            className="flex h-28 w-28 items-center justify-center rounded-2xl sm:h-32 sm:w-32"
            style={{
              backgroundColor: "#E4002B",
              boxShadow:
                "0 0 0 4px rgba(228,0,43,0.18), 0 12px 40px rgba(228,0,43,0.35)",
            }}
          >
            <span
              className="font-display leading-none text-white"
              style={{
                fontFamily: '"Anton", "Oswald", sans-serif',
                fontWeight: 700,
                fontSize: "3.25rem",
                letterSpacing: "0.02em",
              }}
            >
              33
            </span>
          </div>
        )}
      </div>

      {/* Wordmark ------------------------------------------------------- */}
      <h1
        className="font-display text-foreground"
        style={{
          fontFamily: '"Anton", "Oswald", sans-serif',
          fontSize: "2.5rem",
          letterSpacing: "0.08em",
          lineHeight: 1,
          marginBottom: "0.6rem",
        }}
      >
        BUBBA&rsquo;S 33
      </h1>

      {/* Roadie training label ----------------------------------------- */}
      <div
        className="font-heading"
        style={{
          fontFamily: '"Oswald", "Barlow", sans-serif',
          fontWeight: 700,
          fontSize: "0.75rem",
          letterSpacing: "0.32em",
          color: "#E4002B",
          marginBottom: showLogin ? "1.75rem" : "2.5rem",
        }}
      >
        ROADIE TRAINING
      </div>

      {showLogin ? (
        /* Landing / Login state -------------------------------------- */
        <div className="flex w-full max-w-xs flex-col items-center">
          <button
            type="button"
            onClick={login}
            disabled={isLoggingIn}
            data-ocid="splash.signin_button"
            aria-label="Sign in with Internet Identity"
            className="font-heading flex w-full items-center justify-center gap-2 rounded-md px-6 py-3 text-base uppercase tracking-[0.18em] transition-smooth disabled:cursor-not-allowed disabled:opacity-70"
            style={{
              fontFamily: '"Oswald", "Barlow", sans-serif',
              fontWeight: 700,
              backgroundColor: "#E4002B",
              color: "#f5f1e8",
              boxShadow: "0 10px 30px rgba(228,0,43,0.35)",
            }}
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="size-5 animate-spin" aria-hidden="true" />
                Connecting…
              </>
            ) : (
              "Sign In"
            )}
          </button>

          <p
            className="font-body text-center"
            style={{
              fontFamily: '"Barlow", "Oswald", sans-serif',
              fontWeight: 500,
              fontSize: "1.05rem",
              letterSpacing: "0.04em",
              color: "#f5f1e8",
              opacity: 0.85,
              marginTop: "1.25rem",
            }}
          >
            Let&rsquo;s be Legendary
          </p>
        </div>
      ) : (
        /* Hold state: loading bar + caption */
        <>
          {/* Thin red loading bar -------------------------------------- */}
          <div
            data-ocid="splash.loading_bar"
            className="overflow-hidden rounded-full"
            style={{
              width: "180px",
              height: "3px",
              backgroundColor: "rgba(228,0,43,0.18)",
            }}
            role="progressbar"
            aria-label="Loading"
            aria-valuenow={0}
            aria-valuemin={0}
            aria-valuemax={100}
            tabIndex={-1}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: "40%",
                backgroundColor: "#E4002B",
                animation: "splash-load 1.4s ease-in-out infinite",
              }}
            />
          </div>

          {/* "Loading Legendary" caption -------------------------------- */}
          <div
            data-ocid="splash.loading_caption"
            className="font-heading"
            style={{
              fontFamily: '"Oswald", "Barlow", sans-serif',
              fontWeight: 700,
              fontSize: "0.7rem",
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              color: "#E4002B",
              marginTop: "1rem",
            }}
          >
            Loading Legendary
          </div>
        </>
      )}

      {/* Keyframes for the indeterminate loading bar. Scoped via a style
          tag so the animation lives only where the splash does. */}
      <style>{`
        @keyframes splash-load {
          0%   { transform: translateX(-120%); }
          100% { transform: translateX(360%); }
        }
        @media (prefers-reduced-motion: reduce) {
          [data-ocid="splash.loading_bar"] > div {
            animation: none;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
