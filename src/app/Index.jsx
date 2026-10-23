"use client";
import React from "react";
import { useRouter } from "next/navigation";
import styles from "./home.module.css";
import UserLayOut from "@/layout/UserLayout/Index";

export default function Index() {
  const router = useRouter();
  return (
    <UserLayOut>
      <div className={styles.container}>
        <div className={styles.mainContainer}>
          <div className={styles.mainContainer_left}>
            <p>Connect with friends. Stay real.</p>

            <p>
              A true social media platform where stories are real, connections
              are meaningful, and there is no bluff.
            </p>

            <div className={styles.joinButton}>
              <button
                onClick={() => {
                  router.push("/login");
                }}
              >
                Join
              </button>
            </div>
          </div>
          <div className={styles.mainContainer_right}>
            <img src="images/mainImage.png" alt="" />
          </div>
        </div>
      </div>
    </UserLayOut>
  );
}
