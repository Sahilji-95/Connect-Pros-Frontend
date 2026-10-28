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
import styles from "./search.module.css";
import { Search as SearchIcon, LoaderCircle } from "lucide-react";

export default function Search() {
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

  // Debounced global username search.
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
    <img
      className={styles.avatar}
      src={src || "/default-avatar.png"}
      alt={`${name || "User"}'s profile`}
      loading="lazy"
      onError={(event) => {
        event.currentTarget.onerror = null;
        event.currentTarget.src = "/default-avatar.png";
      }}
    />
  );

  return (
    <UserLayOut>
      <DashboardLayout>
        <main className={styles.searchPage}>
          <header className={styles.header}>
            <h2 className={styles.title}>Discover People</h2>
            <p className={styles.subtitle}>
              Find people and explore their profiles.
            </p>
          </header>

          <div className={styles.searchToolbar}>
            <div className={styles.searchInputWrapper}>
              <SearchIcon
                className={styles.searchIcon}
                size={20}
                aria-hidden="true"
              />

              <input
                className={styles.searchInput}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search users by username..."
                aria-label="Search users by username"
                autoComplete="off"
                maxLength={30}
              />

              {query && (
                <button
                  type="button"
                  className={styles.clearSearch}
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                >
                  Clear
                </button>
              )}
            </div>

            <p className={styles.searchHint}>
              {isSearching
                ? "Searching usernames across Connect Pros"
                : "Enter a username to discover people"}
            </p>
          </div>

          {/* GLOBAL USER SEARCH */}
          {isSearching ? (
            <section
              className={styles.resultsSection}
              aria-label="Username search results"
              aria-busy={searchLoading || searchMoreLoading}
            >
              <div className={styles.resultsHeading}>
                <h3 className={styles.sectionTitle}>Search Results</h3>
              </div>

              {searchLoading ? (
                <div className={styles.statusState}>
                  <LoaderCircle className={styles.spinner} size={24} />
                  <p>Searching users...</p>
                </div>
              ) : searchError && searchResults.length === 0 ? (
                <div className={styles.statusState} role="alert">
                  <h3>Search failed</h3>
                  <p>{searchError}</p>
                  <button
                    type="button"
                    className={styles.retryButton}
                    onClick={() =>
                      dispatch(
                        searchUsers({
                          q: normalizedQuery,
                          append: false,
                        }),
                      )
                    }
                  >
                    Try Again
                  </button>
                </div>
              ) : searchResults.length === 0 ? (
                <div className={styles.emptyState}>
                  <h3>No users found</h3>
                  <p>
                    No usernames match &quot;{normalizedQuery}&quot;. Try
                    another username.
                  </p>
                </div>
              ) : (
                <>
                  <div className={styles.userGrid}>
                    {searchResults.map((user) => (
                      <article className={styles.userCard} key={user._id}>
                        <div className={styles.cardTop}>
                          <div className={styles.avatarWrapper}>
                            {renderAvatar(user.profilePicture, user.name)}
                          </div>

                          <div className={styles.userInfo}>
                            <h3 className={styles.name}>
                              {user.name || "Unknown User"}
                            </h3>
                            <p className={styles.username}>@{user.username}</p>
                          </div>
                        </div>

                        <div className={styles.postSection}>
                          <span className={styles.postLabel}>
                            Connect Pros member
                          </span>
                          <p className={styles.currentPost}>
                            Explore this user's profile and activity.
                          </p>
                        </div>

                        <button
                          type="button"
                          className={styles.viewButton}
                          onClick={() => openProfile(user.username)}
                        >
                          View Profile <span>↗</span>
                        </button>
                      </article>
                    ))}
                  </div>

                  {searchError && (
                    <p className={styles.inlineError} role="alert">
                      {searchError}
                    </p>
                  )}

                  {searchHasMore && (
                    <div className={styles.showMoreWrapper}>
                      <button
                        type="button"
                        className={styles.showMoreButton}
                        onClick={handleShowMore}
                        disabled={searchLoading || searchMoreLoading}
                      >
                        {searchMoreLoading ? (
                          <>
                            <LoaderCircle
                              className={styles.spinner}
                              size={18}
                            />
                            Loading more users...
                          </>
                        ) : (
                          "Show More"
                        )}
                      </button>
                    </div>
                  )}

                  {!searchHasMore && (
                    <p className={styles.endMessage}>
                      You&apos;ve reached the end of the results.
                    </p>
                  )}
                </>
              )}
            </section>
          ) : (
            /* EXISTING DISCOVER PEOPLE DIRECTORY */
            <section aria-label="Discover all profiles">
              {!authState.all_profiles_fetched ? (
                <div className={styles.statusState}>
                  <LoaderCircle className={styles.spinner} size={24} />
                  <p>Loading people...</p>
                </div>
              ) : authState.all_profiles?.length > 0 ? (
                <div className={styles.userGrid}>
                  {authState.all_profiles.map((profile) => {
                    const user = profile.userId;

                    if (!user) return null;

                    return (
                      <article className={styles.userCard} key={profile._id}>
                        <div className={styles.cardTop}>
                          <div className={styles.avatarWrapper}>
                            {renderAvatar(user.profilePicture, user.name)}
                          </div>

                          <div className={styles.userInfo}>
                            <h3 className={styles.name}>
                              {user.name || "Unknown User"}
                            </h3>
                            <p className={styles.username}>
                              @{user.username || "username"}
                            </p>
                          </div>
                        </div>

                        <div className={styles.postSection}>
                          <span className={styles.postLabel}>Current post</span>
                          <p className={styles.currentPost}>
                            {profile.currentPost || "No post available yet."}
                          </p>
                        </div>

                        <button
                          type="button"
                          className={styles.viewButton}
                          onClick={() => openProfile(user.username)}
                        >
                          View Profile <span>↗</span>
                        </button>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <h3>No users found</h3>
                  <p>There are no profiles to display right now.</p>
                </div>
              )}
            </section>
          )}
        </main>
      </DashboardLayout>
    </UserLayOut>
  );
}
