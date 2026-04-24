"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Invalid email or password.");
      } else {
        window.location.href = "/admin";
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full px-3 py-2 border rounded-[var(--radius-sm)] text-sm transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent";

  const inputStyle: React.CSSProperties = {
    background: "var(--bg-surface)",
    borderColor: "var(--border-subtle)",
    color: "var(--text-primary)",
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "var(--bg-primary)" }}
    >
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-12 h-12 rounded-[var(--radius-md)] font-bold text-xl mb-4"
            style={{
              background: "var(--gradient-hero)",
              color: "var(--text-on-accent)",
              boxShadow: "var(--shadow-glow-blue)",
            }}
          >
            A
          </div>
          <h1
            className="text-2xl font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            Admin Login
          </h1>
          <p
            className="text-sm mt-1"
            style={{ color: "var(--text-secondary)" }}
          >
            Sign in to manage your surveys
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-[var(--radius-md)] border p-6 space-y-4"
          style={{
            background: "var(--bg-surface)",
            borderColor: "var(--border-subtle)",
            boxShadow: "var(--shadow-card)",
          }}
        >
          {error && (
            <div
              className="border text-sm rounded-[var(--radius-sm)] px-4 py-3"
              style={{
                background: "var(--accent-danger-soft)",
                borderColor:
                  "color-mix(in srgb, var(--accent-danger) 25%, transparent)",
                color: "var(--accent-danger)",
              }}
            >
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium mb-1.5"
              style={{ color: "var(--text-primary)" }}
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              style={inputStyle}
              placeholder="admin@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium mb-1.5"
              style={{ color: "var(--text-primary)" }}
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
              style={inputStyle}
              placeholder="••••••••"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            loading={loading}
            variant="primary"
            size="lg"
            className="w-full"
            style={loading ? undefined : { background: "var(--gradient-hero)" }}
          >
            {loading ? "Signing in…" : "Sign In"}
          </Button>
        </form>

        <p
          className="text-center text-xs mt-6"
          style={{ color: "var(--text-tertiary)" }}
        >
          <Link href="/" className="hover:underline">
            &larr; Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
