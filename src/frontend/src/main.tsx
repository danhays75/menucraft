import { SplashScreen } from "@/components/SplashScreen";
import { useAuth } from "@/hooks/useAuth";
import { InternetIdentityProvider } from "@caffeineai/core-infrastructure";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

BigInt.prototype.toJSON = function () {
  return this.toString();
};

declare global {
  interface BigInt {
    toJSON(): string;
  }
}

const queryClient = new QueryClient();

function Root() {
  // Gate the app behind the branded splash. The splash holds ~1.5s then
  // either fades out (if authenticated) or transitions into a landing/login
  // state (if not). We only render the full App once the splash has faded
  // AND the user is authenticated — unauthenticated visitors stay on the
  // landing/login screen and never see app content.
  const { isAuthenticated } = useAuth();
  const [splashDone, setSplashDone] = useState(false);
  const showApp = splashDone && isAuthenticated;

  return (
    <QueryClientProvider client={queryClient}>
      <InternetIdentityProvider>
        {!showApp && <SplashScreen onComplete={() => setSplashDone(true)} />}
        {showApp && <App />}
      </InternetIdentityProvider>
    </QueryClientProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(<Root />);
