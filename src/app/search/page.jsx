"use client";
import { getAllUsers, getAboutUser } from "@/config/redux/action/authAction";
import DashboardLayout from "@/layout/DashboardLayout/Index";
import UserLayOut from "@/layout/UserLayout/Index";
import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { BASE_URl } from "@/config";
import styles from "./search.module.css";
import { useRouter } from "next/navigation";

export default function Search() {
  const authState = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const router = useRouter();

  useEffect(() => {
    dispatch(getAboutUser());
  }, [dispatch]);

  useEffect(() => {
    if (!authState.all_profiles_fetched) {
      dispatch(getAllUsers());
    }
  }, []);
  return (
    <UserLayOut>
      <DashboardLayout>
        <div className={styles.searchPage}>
          <div className={styles.header}>
            <h2 className={styles.title}>Discover People</h2>
            <p className={styles.subtitle}>
              Find people and explore their profiles.
            </p>
          </div>

          <div className={styles.userGrid}>
            {authState.all_profiles?.map((user) => (
              <div className={styles.userCard} key={user._id}>
                <div className={styles.cardTop}>
                  <div className={styles.avatarWrapper}>
                    <img
                      className={styles.avatar}
                      src={
                        user.userId?.profilePicture
                          ? user.userId.profilePicture
                          : "/default-avatar.png"
                      }
                      alt={user.userId?.name || "User"}
                    />
                  </div>

                  <div className={styles.userInfo}>
                    <h3 className={styles.name}>
                      {user.userId?.name || "Unknown User"}
                    </h3>
                    <p className={styles.username}>
                      @{user.userId?.username || "username"}
                    </p>
                  </div>
                </div>

                <div className={styles.postSection}>
                  <span className={styles.postLabel}>Current post</span>
                  <p className={styles.currentPost}>
                    {user.currentPost || "No post available yet."}
                  </p>
                </div>

                <div
                  className={styles.viewButton}
                  onClick={() =>
                    router.push(`/view_profile/${user.userId?.username}`)
                  }
                >
                  View Profile <span>↗</span>
                </div>
              </div>
            ))}
          </div>

          {authState.all_profiles_fetched &&
            authState.all_profiles?.length === 0 && (
              <div className={styles.emptyState}>
                <h3>No users found</h3>
                <p>There are no profiles to display right now.</p>
              </div>
            )}
        </div>
      </DashboardLayout>
    </UserLayOut>
  );
}
