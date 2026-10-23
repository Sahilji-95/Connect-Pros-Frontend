"use client";
import React, { useEffect, useState } from "react";
import UserLayOut from "@/layout/UserLayout/Index";
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import styles from "./login.module.css";
// import { loginUser, registerUser } from "@/config/redux/action/authAction";
import {
  loginUser,
  registerUser,
  getAboutUser,
} from "@/config/redux/action/authAction";
import { emptyMessage } from "@/config/redux/reducer/authReducer";

function Login() {
  const authState = useSelector((state) => state.auth);

  const router = useRouter();
  const dispath = useDispatch();

  const [userLoginMethod, setUserLoginMethod] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
  });

  // useEffect(() => {
  //   if (authState.loggedIn) {
  //     router.push("/dashboard");
  //   }
  // }, [authState.loggedIn]);

  // useEffect(() => {
  //   dispath(emptyMessage());
  // }, [userLoginMethod]);

  useEffect(() => {
    if (authState.laggedIn && authState.profileFetched) {
      router.replace("/dashboard");
    }
  }, [authState.laggedIn, authState.profileFetched, router]);

  useEffect(() => {
    dispath(emptyMessage());
  }, [userLoginMethod, dispath]);

  // useEffect(() => {
  //   if (localStorage.getItem("token")) {
  //     router.push("/dashboard");
  //   }
  // });

  const handleOnChage = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleRegistr = () => {
    dispath(
      registerUser({
        ...formData,
      }),
    );
    setFormData({
      name: "",
      username: "",
      email: "",
      password: "",
    });
  };

  // const handleLogin = () => {
  //   dispath(
  //     loginUser({
  //       email: formData.email,
  //       password: formData.password,
  //     }),
  //   );
  //   setFormData({
  //     email: "",
  //     password: "",
  //   });
  // };

  const handleLogin = async () => {
    const result = await dispath(
      loginUser({
        email: formData.email,
        password: formData.password,
      }),
    );

    if (loginUser.fulfilled.match(result)) {
      const profileResult = await dispath(getAboutUser());

      if (getAboutUser.fulfilled.match(profileResult)) {
        router.replace("/dashboard");
      }
    }

    setFormData({
      email: "",
      password: "",
    });
  };

  return (
    <UserLayOut>
      <div className={styles.container}>
        <div className={styles.cardContainer}>
          <div className={styles.cardContainer_left}>
            <p className={styles.cardLeftHeading}>
              {userLoginMethod ? "Sign in" : "Sign up"}
            </p>
            {authState.message?.message && (
              <p
                className={styles.message}
                style={{
                  color: authState.isError ? "red" : "green",
                  backgroundColor: authState.isError ? "#fef2f2" : "#f0fdf4",
                  border: authState.isError
                    ? "1px solid #fecaca"
                    : "1px solid #7fdb4dff",
                }}
              >
                {authState.message.message}
              </p>
            )}{" "}
            <div className={styles.inputContainer}>
              {!userLoginMethod && (
                <div className={styles.inputRow}>
                  <input
                    type="text"
                    name="name"
                    placeholder="Enter your name"
                    className={styles.inputFiled}
                    value={formData.name || ""}
                    onChange={handleOnChage}
                  />
                  <input
                    type="text"
                    name="username"
                    placeholder="Enter your username"
                    className={styles.inputFiled}
                    value={formData.username || ""}
                    onChange={handleOnChage}
                  />
                </div>
              )}
              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                className={styles.inputFiled}
                value={formData.email || ""}
                onChange={handleOnChage}
              />

              <input
                type="password"
                name="password"
                placeholder="Enter your password"
                className={styles.inputFiled}
                value={formData.password || ""}
                onChange={handleOnChage}
              />

              <div
                className={styles.button}
                onClick={() => {
                  if (userLoginMethod) {
                    handleLogin();
                  } else {
                    handleRegistr();
                  }
                }}
              >
                <p>{userLoginMethod ? "Sign In" : " Sing Up"}</p>
              </div>
            </div>
          </div>

          <div className={styles.cardContainer_right}>
            <div>
              <p>
                {!userLoginMethod
                  ? "Already have an Account"
                  : "Don't have an Account"}
              </p>
              <div
                className={styles.button}
                style={{ background: "#00376b" }}
                onClick={() => {
                  setUserLoginMethod(!userLoginMethod);
                }}
              >
                <p>{userLoginMethod ? "Sign Up" : " Sing In"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </UserLayOut>
  );
}

export default Login;
