"use client";

import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import {
  getAllUsers,
  getAboutUser,
  searchUsers,
} from "@/config/redux/action/authAction";
import DashboardLayout from "@/layout/DashboardLayout/Index";
import UserLayOut from "@/layout/UserLayout/Index";
import { Search, LoaderCircle, X, ArrowUpRight, Users } from "lucide-react";

export default function SearchPage() {
  const authState = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const router = useRouter();

  const [query, setQuery] = useState("");

  const {
    searchUsers: searchResults = [],
    searchLoading = false,
    searchMoreLoading = false,
    searchHasMore = false,
    searchNextCursor = null,
    searchError = null,
  } = authState;

  const normalizedQuery = query.trim();
  const isSearching = normalizedQuery.length > 0;

  useEffect(() => {
    dispatch(getAboutUser());
  }, [dispatch]);

  useEffect(() => {
    if (!authState.all_profiles_fetched) {
      dispatch(getAllUsers());
    }
  }, [authState.all_profiles_fetched, dispatch]);

  // Debounced username search
  useEffect(() => {
    if (!normalizedQuery) return;

    const timeoutId = setTimeout(() => {
      dispatch(
        searchUsers({
          q: normalizedQuery,
          append: false,
        }),
      );
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [normalizedQuery, dispatch]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();

    if (!normalizedQuery) return;

    dispatch(
      searchUsers({
        q: normalizedQuery,
        append: false,
      }),
    );
  };

  const handleShowMore = () => {
    if (
      !searchHasMore ||
      !searchNextCursor ||
      searchLoading ||
      searchMoreLoading
    ) {
      return;
    }

    dispatch(
      searchUsers({
        q: normalizedQuery,
        cursor: searchNextCursor,
        append: true,
      }),
    );
  };

  const openProfile = (username) => {
    if (!username) return;

    router.push(`/view_profile/${encodeURIComponent(username)}`);
  };

  const renderAvatar = (src, name) => (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-soft text-sm font-bold text-primary sm:h-12 sm:w-12">
      {src ? (
        <img
          src={src}
          alt={`${name || "User"}'s profile`}
          loading="lazy"
          className="h-full w-full object-cover"
          onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.style.display = "none";
          }}
        />
      ) : (
        (name || "U").charAt(0).toUpperCase()
      )}
    </div>
  );

  const renderUserRow = (user, key, description) => (
    <article
      key={key}
      className="flex min-w-0 flex-col gap-3 rounded-xl border border-border bg-surface p-3 transition-colors hover:border-primary/40 sm:flex-row sm:items-center sm:gap-4 sm:px-4 sm:py-3"
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {renderAvatar(user.profilePicture, user.name)}

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-text">
            {user.name || "Unknown User"}
          </h3>

          <p className="mt-0.5 truncate text-xs text-muted">
            @{user.username || "username"}
          </p>

          <p className="mt-1 truncate text-xs text-muted">{description}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => openProfile(user.username)}
        disabled={!user.username}
        className="flex min-h-9 w-full shrink-0 items-center justify-center gap-2 rounded-lg border border-primary/40 bg-primary px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:min-w-[120px]"
      >
        View Profile
        <ArrowUpRight size={15} />
      </button>
    </article>
  );

  return (
    <UserLayOut>
      <DashboardLayout>
        <main className="min-h-screen min-w-0 bg-app px-3 py-5 text-text sm:px-5 sm:py-7 lg:px-7">
          {/* Header */}
          <header className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">
              Discover People
            </h1>

            <p className="mt-1.5 text-xs text-muted sm:text-sm">
              Find and connect with people in your network.
            </p>
          </header>

          {/* Search */}
          <form
            onSubmit={handleSearchSubmit}
            className="mb-5 flex w-full items-center gap-2"
          >
            <div className="flex h-11 min-w-0 flex-1 items-center gap-2.5 rounded-xl border border-border bg-surface px-3 transition focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10">
              <Search size={18} className="shrink-0 text-muted" />

              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search people, usernames..."
                aria-label="Search people by username"
                autoComplete="off"
                maxLength={30}
                className="min-w-0 flex-1 bg-transparent text-sm text-text outline-none placeholder:text-muted"
              />

              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted hover:bg-app hover:text-text"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={!normalizedQuery || searchLoading}
              aria-label="Search"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Search size={19} />
            </button>
          </form>

          {/* Search results */}
          {isSearching ? (
            <section aria-busy={searchLoading || searchMoreLoading}>
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-xs font-medium text-muted">
                  {searchLoading
                    ? "Searching..."
                    : `${searchResults.length} results for "${normalizedQuery}"`}
                </p>
              </div>

              {searchLoading ? (
                <div className="flex min-h-36 flex-col items-center justify-center gap-3 rounded-xl border border-border bg-surface">
                  <LoaderCircle
                    size={24}
                    className="animate-spin text-primary"
                  />
                  <p className="text-xs text-muted">Finding people...</p>
                </div>
              ) : searchError && searchResults.length === 0 ? (
                <div
                  className="rounded-xl border border-border bg-surface px-4 py-10 text-center"
                  role="alert"
                >
                  <p className="text-sm font-semibold text-text">
                    Search failed
                  </p>
                  <p className="mt-2 break-words text-xs text-muted">
                    {searchError}
                  </p>

                  <button
                    type="button"
                    onClick={handleSearchSubmit}
                    className="mt-4 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white"
                  >
                    Try Again
                  </button>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-surface px-4 py-12 text-center">
                  <Users size={25} className="mx-auto text-muted" />
                  <h3 className="mt-3 text-sm font-semibold text-text">
                    No people found
                  </h3>
                  <p className="mt-1 text-xs text-muted">
                    Try another username.
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-2.5">
                    {searchResults.map((user) =>
                      renderUserRow(
                        user,
                        user._id,
                        "Explore this user's profile and activity.",
                      ),
                    )}
                  </div>

                  {searchError && (
                    <p className="mt-3 text-center text-xs text-danger">
                      {searchError}
                    </p>
                  )}

                  {searchHasMore && (
                    <div className="mt-5 flex justify-center">
                      <button
                        type="button"
                        onClick={handleShowMore}
                        disabled={searchMoreLoading || searchLoading}
                        className="flex min-h-10 w-full max-w-xs items-center justify-center gap-2 rounded-lg border border-primary bg-primary px-5 py-2 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                      >
                        {searchMoreLoading ? (
                          <>
                            <LoaderCircle size={16} className="animate-spin" />
                            Loading...
                          </>
                        ) : (
                          "Show More"
                        )}
                      </button>
                    </div>
                  )}

                  {!searchHasMore && (
                    <p className="mt-5 text-center text-xs text-muted">
                      You've reached the end of the results.
                    </p>
                  )}
                </>
              )}
            </section>
          ) : (
            /* Existing discover directory */
            <section>
              <div className="mb-3 flex items-center gap-2">
                <Users size={16} className="text-primary" />
                <h2 className="text-sm font-semibold text-text">
                  People on Connect Pros
                </h2>
              </div>

              {!authState.all_profiles_fetched ? (
                <div className="flex min-h-36 flex-col items-center justify-center gap-3 rounded-xl border border-border bg-surface">
                  <LoaderCircle
                    size={24}
                    className="animate-spin text-primary"
                  />
                  <p className="text-xs text-muted">Loading people...</p>
                </div>
              ) : authState.all_profiles?.length > 0 ? (
                <div className="space-y-2.5">
                  {authState.all_profiles.map((profile) => {
                    const user = profile.userId;

                    if (!user) return null;

                    return renderUserRow(
                      user,
                      profile._id,
                      profile.currentPost || "No post available yet.",
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border bg-surface px-4 py-12 text-center">
                  <Users size={25} className="mx-auto text-muted" />
                  <h3 className="mt-3 text-sm font-semibold text-text">
                    No profiles available
                  </h3>
                  <p className="mt-1 text-xs text-muted">
                    There are no profiles to display right now.
                  </p>
                </div>
              )}
            </section>
          )}
        </main>
      </DashboardLayout>
    </UserLayOut>
  );
}
