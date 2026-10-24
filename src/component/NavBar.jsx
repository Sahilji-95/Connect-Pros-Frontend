"use client";

import React from "react";
import styles from "./navbar.module.css";
import { useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { logoutUser } from "@/config/redux/action/authAction/index.js";

export default function NavBar() {
  const router = useRouter();
  const authState = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      router.replace("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className={styles.container}>
      <nav className={styles.navbar}>
        <h1 style={{ cursor: "pointer" }} onClick={() => router.push("/")}>
          Connect Pro's
        </h1>

        {authState.profileFetched && (
          <div style={{ display: "flex", gap: "1.2rem" }}>
            <p>Hey {authState.user?.userId?.name}</p>

            <p
              style={{ fontWeight: "bold", cursor: "pointer" }}
              onClick={() => router.push("/profile")}
            >
              Profile
            </p>

            <button
              type="button"
              onClick={handleLogout}
              disabled={authState.loading}
              className={styles.logout}
            >
              {authState.loading ? "Logging out..." : "Logout"}
            </button>
          </div>
        )}

        {!authState.profileFetched && (
          <div className={styles.navbarOptionContainer}>
            <div className={styles.joinButton}>
              <button onClick={() => router.push("/login")}>Be a part</button>
            </div>
          </div>
        )}
      </nav>
    </div>
  );
}
