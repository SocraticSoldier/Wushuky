"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/Button";

const THEME_EVENT = "wushuky:themechange";

function subscribe(callback: () => void) {
  window.addEventListener(THEME_EVENT, callback);
  return () => window.removeEventListener(THEME_EVENT, callback);
}

function getSnapshot(): "light" | "dark" {
  return document.documentElement.classList.contains("dark")
    ? "dark"
    : "light";
}

// Server always renders the light state; the inline script in the root layout
// applies the persisted theme before hydration, and the store re-reads the DOM
// on the client immediately after.
function getServerSnapshot(): "light" | "dark" {
  return "light";
}

/**
 * Toggles between light and dark themes by adding/removing the `dark` class on
 * the document root and persisting the choice to localStorage. Reads current
 * state directly from the DOM via `useSyncExternalStore` so there is no flash
 * and no hydration mismatch. Pairs with the `@custom-variant dark` rule in
 * globals.css and the no-flash script in the root layout.
 */
export function ThemeToggle() {
  const theme = React.useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.classList.toggle("dark", next === "dark");
    try {
      window.localStorage.setItem("theme", next);
    } catch {
      // Ignore storage failures (e.g. private mode); the class still applies.
    }
    window.dispatchEvent(new Event(THEME_EVENT));
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggle}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
      className="w-9 px-0"
    >
      {theme === "dark" ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </Button>
  );
}
