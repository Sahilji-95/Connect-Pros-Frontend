import React from "react";
import styles from "./navbar.module.css";
import { useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { reset } from "@/config/redux/reducer/authReducer";

export default function NavBar() {
  const router = useRouter();
  const authState = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  return (
    <div className={styles.container}>
      <nav className={styles.navbar}>
        <h1
          style={{ cursor: "pointer" }}
          onClick={() => {
            router.push("/");
          }}
        >
          Connect Pro's
        </h1>

        {authState.profileFetched && (
          <div style={{ display: "flex", gap: "1.2rem" }}>
            <p>Hey {authState.user.userId.name}</p>
            <p
              style={{ fontWeight: "bold", cursor: "pointer" }}
              onClick={() => {
                router.push("/profile");
              }}
            >
              Profile
            </p>

            <p
              style={{ fontWeight: "bold", cursor: "pointer" }}
              onClick={() => {
                localStorage.removeItem("token");
                dispatch(reset());
                router.push("/");
              }}
            >
              Logout
            </p>
          </div>
        )}
        {!authState.profileFetched && (
          <div className={styles.navbarOptionContainer}>
            <div className={styles.joinButton}>
              <button
                onClick={() => {
                  router.push("/login");
                }}
              >
                Be a part
              </button>
            </div>
          </div>
        )}
      </nav>
    </div>
  );
}
