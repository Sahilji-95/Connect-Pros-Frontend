"use client";

import React, { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import Link from "next/link";

import { logoutUser } from "@/config/redux/action/authAction/index.js";
import { useTheme } from "@/component/ThemeProvider";

function Icon({ name, size = 20 }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  const paths = {
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    bell: (
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M10 21h4" />
      </>
    ),
    sun: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
      </>
    ),
    moon: (
      <path d="M20.5 15.5A8.5 8.5 0 0 1 8.5 3.5 8.5 8.5 0 1 0 20.5 15.5Z" />
    ),
    chevron: <path d="m7 10 5 5 5-5" />,
    menu: (
      <>
        <path d="M4 7h16M4 12h16M4 17h16" />
      </>
    ),
    close: <path d="m18 6-12 12M6 6l12 12" />,
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M5 21a7 7 0 0 1 14 0" />
      </>
    ),
  };

  return <svg {...common}>{paths[name]}</svg>;
}

const navigation = [
  { label: "Home", href: "/dashboard" },
  { label: "Discover", href: "/search" },
  { label: "Connections", href: "/connections" },
];

export default function NavBar() {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch();

  const authState = useSelector((state) => state.auth);
  const notificationState = useSelector((state) => state.notification);

  const { theme, toggleTheme, mounted } = useTheme();

  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAuthenticated = Boolean(authState?.profileFetched);
  const user = authState?.user?.userId;

  const notificationCount = notificationState?.unreadCount ?? 0;
  const formatCount = (count) => (count > 99 ? "99+" : count);

  const isActive = (href) =>
    href === "/dashboard" ? pathname === href : pathname?.startsWith(href);

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      setProfileOpen(false);
      router.replace("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleNavigation = (href) => {
    setMobileOpen(false);
    setProfileOpen(false);
    router.push(href);
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border bg-app/95 backdrop-blur-xl">
      <div className="mx-auto flex h-[76px] max-w-[1600px] items-center justify-between px-4 sm:px-6 lg:px-10">
        {/* Brand */}
        <Link
          href={isAuthenticated ? "/dashboard" : "/"}
          className="group flex shrink-0 items-center gap-3"
          aria-label="Connect Pros home"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white dark:text-[#12141A]">
            <span className="font-serif text-2xl font-bold">C</span>
          </div>

          <div className="flex flex-col">
            <span className="text-[19px] font-extrabold leading-none tracking-[-1px] text-text sm:text-[21px]">
              connect<span className="text-primary">pros</span>
              <span className="text-accent">.</span>
            </span>
          </div>
        </Link>

        {/* Desktop navigation */}
        {isAuthenticated && (
          <nav
            aria-label="Main navigation"
            className="hidden items-center gap-8 lg:flex"
          >
            {navigation.map((item) => {
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`relative py-2 text-[13px] font-semibold transition-colors ${
                    active ? "text-primary" : "text-muted hover:text-text"
                  }`}
                >
                  {item.label}

                  {active && (
                    <span className="absolute -bottom-[17px] left-0 h-[2px] w-full rounded-full bg-primary" />
                  )}
                </Link>
              );
            })}
          </nav>
        )}

        {/* Right actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Theme toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            disabled={!mounted}
            aria-label={
              theme === "dark"
                ? "Switch to light theme"
                : "Switch to dark theme"
            }
            title="Change theme"
            className="flex h-10 w-10 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-muted hover:text-text disabled:opacity-50"
          >
            {mounted && <Icon name={theme === "dark" ? "sun" : "moon"} />}
          </button>

          {isAuthenticated ? (
            <>
              {/* Search */}
              <button
                type="button"
                onClick={() => handleNavigation("/search")}
                aria-label="Search people"
                className="hidden h-10 w-10 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-muted hover:text-text sm:flex"
              >
                <Icon name="search" />
              </button>

              {/* Notifications */}
              <button
                type="button"
                onClick={() => handleNavigation("/notifications")}
                aria-label={`Notifications${notificationCount ? `, ${notificationCount} unread` : ""}`}
                className="relative flex h-10 w-10 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-muted hover:text-text"
              >
                <Icon name="bell" />

                {notificationCount > 0 && (
                  <span className="absolute right-0.5 top-0.5 flex h-[17px] min-w-[17px] items-center justify-center rounded-full border-2 border-app bg-accent px-1 text-[9px] font-bold text-white">
                    {formatCount(notificationCount)}
                  </span>
                )}
              </button>

              {/* Profile dropdown */}
              <div className="relative ml-1">
                <button
                  type="button"
                  onClick={() => setProfileOpen((prev) => !prev)}
                  aria-expanded={profileOpen}
                  aria-label="Open profile menu"
                  className="flex items-center gap-2 rounded-full border border-border p-1 pr-2 transition-colors hover:bg-surface-muted"
                >
                  <img
                    src={user?.profilePicture || "/default-avatar.png"}
                    alt=""
                    className="h-8 w-8 rounded-full object-cover"
                  />

                  <span className="hidden max-w-[100px] truncate text-xs font-semibold text-text md:block">
                    {user?.name || "My account"}
                  </span>

                  <span className="hidden text-muted sm:block">
                    <Icon name="chevron" size={15} />
                  </span>
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-[calc(100%+14px)] z-50 w-56 overflow-hidden rounded-xl border border-border bg-surface p-2 shadow-lg">
                    <div className="border-b border-border px-3 py-3">
                      <p className="truncate text-sm font-bold text-text">
                        {user?.name || "My account"}
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        Your Connect Pros account
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleNavigation("/profile")}
                      className="mt-2 w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-text transition-colors hover:bg-surface-muted"
                    >
                      My profile
                    </button>

                    <button
                      type="button"
                      onClick={handleLogout}
                      disabled={authState.loading}
                      className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-danger transition-colors hover:bg-surface-muted disabled:opacity-50"
                    >
                      {authState.loading ? "Logging out..." : "Logout"}
                    </button>
                  </div>
                )}
              </div>

              {/* Mobile menu toggle */}
              <button
                type="button"
                onClick={() => setMobileOpen((prev) => !prev)}
                aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
                aria-expanded={mobileOpen}
                className="flex h-10 w-10 items-center justify-center rounded-full text-text hover:bg-surface-muted lg:hidden"
              >
                <Icon name={mobileOpen ? "close" : "menu"} />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="px-3 py-2 text-sm font-semibold text-text hover:text-primary"
              >
                Sign in
              </button>

              <button
                type="button"
                onClick={() => router.push("/login")}
                className="rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover dark:text-[#12141A]"
              >
                Get started
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile navigation */}
      {isAuthenticated && mobileOpen && (
        <div className="border-t border-border bg-surface px-5 py-4 lg:hidden">
          <nav aria-label="Mobile navigation" className="flex flex-col gap-1">
            {navigation.map((item) => {
              const active = isActive(item.href);

              return (
                <button
                  key={item.href}
                  type="button"
                  onClick={() => handleNavigation(item.href)}
                  className={`flex items-center justify-between rounded-lg px-4 py-3 text-left text-sm font-semibold transition-colors ${
                    active
                      ? "bg-primary-soft text-primary"
                      : "text-muted hover:bg-surface-muted hover:text-text"
                  }`}
                >
                  {item.label}
                  {active && (
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  )}
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => handleNavigation("/chat")}
              className="rounded-lg px-4 py-3 text-left text-sm font-semibold text-muted hover:bg-surface-muted hover:text-text"
            >
              Messages
            </button>

            <button
              type="button"
              onClick={() => handleNavigation("/notifications")}
              className="rounded-lg px-4 py-3 text-left text-sm font-semibold text-muted hover:bg-surface-muted hover:text-text"
            >
              Notifications
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
