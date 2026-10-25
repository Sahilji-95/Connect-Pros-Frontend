"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import styles from "./home.module.css";
import UserLayOut from "@/layout/UserLayout/Index";
import { getAboutUser } from "@/config/redux/action/authAction";

export default function Index() {
  const router = useRouter();
  const dispatch = useDispatch();

  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let active = true;

    const checkSession = async () => {
      try {
        // Backend existing HttpOnly cookie se user verify karega
        await dispatch(getAboutUser()).unwrap();

        if (active) {
          router.replace("/dashboard");
        }
      } catch (error) {
        // Session invalid hai ya user logged in nahi hai
        if (active) {
          setCheckingSession(false);
        }
      }
    };

    checkSession();

    return () => {
      active = false;
    };
  }, [dispatch, router]);

  if (checkingSession) {
    return (
      <div className={styles.container}>
        <p>Checking your session...</p>
      </div>
    );
  }

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
              <button onClick={() => router.push("/login")}>Join</button>
            </div>
          </div>

          <div className={styles.mainContainer_right}>
            <img src="/images/mainImage.png" alt="" />
          </div>
        </div>
      </div>
    </UserLayOut>
  );
}
