"use client";
import React from "react";
import styles from "./dashboard.module.css";
import { useRouter, usePathname } from "next/navigation";
import { useSelector } from "react-redux";

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const authState = useSelector((state) => state.auth);

  const isChat = pathname?.startsWith("/chat");
  const isHome = pathname === "/dashboard";
  const isSearch = pathname?.startsWith("/search");
  const isConnections = pathname?.startsWith("/connections");

  return (
    <div>
      <div className={styles.container}>
        <div
          className={`${styles.homeContainer} ${isChat ? styles.chatMode : ""}`}
        >
          <div className={styles.left}>
            <div
              className={`${styles.sideBarOption} ${isHome ? styles.active : ""}`}
              onClick={() => router.push("/dashboard")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="size-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
                />
              </svg>
              <p>Home</p>
            </div>

            <div
              className={`${styles.sideBarOption} ${isSearch ? styles.active : ""}`}
              onClick={() => router.push("/search")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="size-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                />
              </svg>
              <p>Discover</p>
            </div>

            <div
              className={`${styles.sideBarOption} ${isConnections ? styles.active : ""}`}
              onClick={() => router.push("/connections")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="size-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                />
              </svg>
              <p>Connections</p>
            </div>

            <div
              className={`${styles.sideBarOption} ${isChat ? styles.active : ""}`}
              onClick={() => router.push("/chat")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="size-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"
                />
              </svg>
              <p>Messages</p>
            </div>
          </div>

          <div className={styles.feed}>{children}</div>

          {!isChat && (
            <div className={styles.right}>
              <h1 className={styles.rightTitle}>Top Profiles</h1>

              <div className={styles.profileList}>
                {authState.all_profiles_fetched &&
                  authState.all_profiles?.map((profile) => (
                    <div
                      className={styles.profileCard}
                      key={profile._id}
                      onClick={() =>
                        router.push(`/view_profile/${profile.userId.username}`)
                      }
                    >
                      <img
                        className={styles.profileImage}
                        src={
                          profile.userId?.profilePicture
                            ? profile.userId.profilePicture
                            : "/default-avatar.png"
                        }
                        alt={profile.userId?.name || "Profile"}
                      />

                      <div className={styles.profileInfo}>
                        <p className={styles.profileName}>
                          {profile.userId?.name || "Unknown User"}
                        </p>
                        <p className={styles.profileUsername}>
                          @{profile.userId?.username || "username"}
                        </p>
                      </div>

                      <span className={styles.profileArrow}>↗</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
