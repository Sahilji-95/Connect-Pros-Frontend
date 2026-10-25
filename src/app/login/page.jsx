"use client";

import React, { useEffect, useState } from "react";
import UserLayOut from "@/layout/UserLayout/Index";
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import styles from "./login.module.css";

import {
  loginUser,
  getAboutUser,
  sendEmailOtp,
  verifyEmailOtp,
  resendEmailOtp,
} from "@/config/redux/action/authAction";

import { emptyMessage } from "@/config/redux/reducer/authReducer";

function Login() {
  const authState = useSelector((state) => state.auth);
  const router = useRouter();
  const dispatch = useDispatch();

  const [userLoginMethod, setUserLoginMethod] = useState(false);
  const [showOtpScreen, setShowOtpScreen] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
  });

  const [otp, setOtp] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [notice, setNotice] = useState({
    message: "",
    isError: false,
  });

  const [loadingAction, setLoadingAction] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  // Redirect after successful login and profile fetch
  useEffect(() => {
    if (authState.laggedIn && authState.profileFetched) {
      router.replace("/dashboard");
    }
  }, [authState.laggedIn, authState.profileFetched, router]);

  // Clear old Redux messages when switching login/signup
  useEffect(() => {
    dispatch(emptyMessage());
  }, [userLoginMethod, dispatch]);

  // OTP resend countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;

    const timer = setTimeout(() => {
      setResendCooldown((previous) => Math.max(0, previous - 1));
    }, 1000);

    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // Update form values and clear the changed field's error
  const handleOnChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setFieldErrors((previous) => ({
      ...previous,
      [name]: "",
    }));

    setNotice({ message: "", isError: false });
  };

  // Custom signup validation
  const validateSignup = () => {
    const errors = {};

    if (!formData.name.trim() || formData.name.trim().length < 2) {
      errors.name = "Name must contain at least 2 characters.";
    } else if (formData.name.trim().length > 60) {
      errors.name = "Name cannot exceed 60 characters.";
    }

    if (!/^[a-zA-Z0-9_-]{3,20}$/.test(formData.username.trim())) {
      errors.username = "Use 3–20 letters, numbers, underscores, or hyphens.";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = "Please enter a valid email address.";
    }

    if (formData.password.length < 8 || formData.password.length > 72) {
      errors.password = "Password must contain 8–72 characters.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Step 1: Submit signup details and send OTP
  const handleRegister = async (e) => {
    e.preventDefault();

    if (loadingAction) return;
    if (!validateSignup()) return;

    setLoadingAction("send");
    setNotice({ message: "", isError: false });

    try {
      const result = await dispatch(
        sendEmailOtp({
          name: formData.name.trim(),
          username: formData.username.trim(),
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
        }),
      );

      if (sendEmailOtp.fulfilled.match(result)) {
        setShowOtpScreen(true);
        setOtp("");
        setResendCooldown(60);

        setNotice({
          message:
            result.payload?.message || "Verification code sent to your email.",
          isError: false,
        });
      } else {
        setNotice({
          message:
            result.payload?.message || "Unable to send verification code.",
          isError: true,
        });
      }
    } catch {
      setNotice({
        message: "Something went wrong. Please try again.",
        isError: true,
      });
    } finally {
      setLoadingAction("");
    }
  };

  // Step 2: Verify the email OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    if (loadingAction) return;

    if (!/^\d{6}$/.test(otp)) {
      setNotice({
        message: "Please enter a valid 6-digit OTP.",
        isError: true,
      });
      return;
    }

    setLoadingAction("verify");
    setNotice({ message: "", isError: false });

    try {
      const result = await dispatch(
        verifyEmailOtp({
          email: formData.email.trim().toLowerCase(),
          otp,
        }),
      );

      if (verifyEmailOtp.fulfilled.match(result)) {
        setShowOtpScreen(false);
        setUserLoginMethod(true);
        setOtp("");

        setFormData((previous) => ({
          ...previous,
          password: "",
        }));

        setFieldErrors({});

        setNotice({
          message:
            result.payload?.message ||
            "Email verified successfully. Please log in.",
          isError: false,
        });
      } else {
        setNotice({
          message: result.payload?.message || "OTP verification failed.",
          isError: true,
        });
      }
    } catch {
      setNotice({
        message: "Unable to verify OTP. Please try again.",
        isError: true,
      });
    } finally {
      setLoadingAction("");
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (loadingAction || resendCooldown > 0) return;

    setLoadingAction("resend");
    setNotice({ message: "", isError: false });

    try {
      const result = await dispatch(
        resendEmailOtp({
          email: formData.email.trim().toLowerCase(),
        }),
      );

      if (resendEmailOtp.fulfilled.match(result)) {
        setOtp("");
        setResendCooldown(60);

        setNotice({
          message: result.payload?.message || "A new OTP has been sent.",
          isError: false,
        });
      } else {
        const retryAfter = Number(result.payload?.retryAfter);

        if (retryAfter > 0) {
          setResendCooldown(retryAfter);
        }

        setNotice({
          message: result.payload?.message || "Unable to resend OTP.",
          isError: true,
        });
      }
    } catch {
      setNotice({
        message: "Unable to resend OTP. Please try again.",
        isError: true,
      });
    } finally {
      setLoadingAction("");
    }
  };

  // Existing login functionality
  const handleLogin = async (e) => {
    e.preventDefault();

    if (loadingAction) return;

    const errors = {};

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = "Please enter a valid email address.";
    }

    if (!formData.password) {
      errors.password = "Please enter your password.";
    }

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) return;

    setLoadingAction("login");
    setNotice({ message: "", isError: false });

    try {
      const result = await dispatch(
        loginUser({
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
        }),
      );

      if (loginUser.fulfilled.match(result)) {
        const profileResult = await dispatch(getAboutUser());

        if (getAboutUser.fulfilled.match(profileResult)) {
          router.replace("/dashboard");
        } else {
          setNotice({
            message:
              profileResult.payload?.message ||
              "Logged in, but unable to load your profile.",
            isError: true,
          });
        }
      } else {
        setNotice({
          message: result.payload?.message || "Unable to log in.",
          isError: true,
        });
      }
    } catch {
      setNotice({
        message: "Something went wrong. Please try again.",
        isError: true,
      });
    } finally {
      setLoadingAction("");
    }
  };

  const handleSwitchMethod = () => {
    setUserLoginMethod((previous) => !previous);
    setShowOtpScreen(false);
    setOtp("");
    setResendCooldown(0);
    setFieldErrors({});
    setNotice({ message: "", isError: false });

    setFormData({
      name: "",
      username: "",
      email: "",
      password: "",
    });
  };

  const handleBackToSignup = () => {
    setShowOtpScreen(false);
    setOtp("");
    setFieldErrors({});
    setNotice({ message: "", isError: false });
  };

  const isLoading = Boolean(loadingAction);

  // Reusable custom field error
  const FieldError = ({ error }) =>
    error ? (
      <p className={styles.fieldError} role="alert">
        {error}
      </p>
    ) : null;

  return (
    <UserLayOut>
      <div className={styles.container}>
        <div className={styles.cardContainer}>
          <div className={styles.cardContainer_left}>
            <p className={styles.cardLeftHeading}>
              {showOtpScreen
                ? "Verify your email"
                : userLoginMethod
                  ? "Sign in"
                  : "Sign up"}
            </p>

            {notice.message && (
              <p
                className={styles.message}
                role="status"
                aria-live="polite"
                style={{
                  color: notice.isError ? "#c7d2fe" : "#86efac",
                  backgroundColor: notice.isError
                    ? "rgba(99, 102, 241, 0.10)"
                    : "rgba(34, 197, 94, 0.08)",
                  border: notice.isError
                    ? "1px solid rgba(99, 102, 241, 0.45)"
                    : "1px solid rgba(34, 197, 94, 0.35)",
                }}
              >
                {notice.message}
              </p>
            )}

            {/* Email OTP verification screen */}
            {showOtpScreen ? (
              <form
                className={styles.inputContainer}
                onSubmit={handleVerifyOtp}
                noValidate
              >
                <p className={styles.otpDescription}>
                  We sent a 6-digit verification code to
                </p>

                <p className={styles.otpEmail}>{formData.email}</p>

                <label className={styles.fieldLabel} htmlFor="emailOtp">
                  Verification code
                </label>

                <input
                  id="emailOtp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="Enter 6-digit OTP"
                  className={`${styles.inputFiled} ${styles.otpInput}`}
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value.replace(/\D/g, "").slice(0, 6));
                    setNotice({ message: "", isError: false });
                  }}
                  aria-invalid={Boolean(notice.isError && otp.length !== 6)}
                  aria-describedby="otp-error"
                  disabled={isLoading}
                />

                {notice.isError && (
                  <p id="otp-error" className={styles.fieldError} role="alert">
                    {notice.message}
                  </p>
                )}

                <button
                  type="submit"
                  className={styles.button}
                  disabled={isLoading || otp.length !== 6}
                >
                  <span>
                    {loadingAction === "verify"
                      ? "Verifying..."
                      : "Verify Email"}
                  </span>
                </button>

                <div className={styles.resendContainer}>
                  <span>Didn't receive the code?</span>

                  <button
                    type="button"
                    className={styles.textButton}
                    onClick={handleResendOtp}
                    disabled={isLoading || resendCooldown > 0}
                  >
                    {loadingAction === "resend"
                      ? "Sending..."
                      : resendCooldown > 0
                        ? `Resend OTP in ${resendCooldown}s`
                        : "Resend OTP"}
                  </button>
                </div>

                <button
                  type="button"
                  className={styles.backButton}
                  onClick={handleBackToSignup}
                  disabled={isLoading}
                >
                  ← Back to signup
                </button>
              </form>
            ) : (
              /* Signup and login form */
              <form
                className={styles.inputContainer}
                onSubmit={userLoginMethod ? handleLogin : handleRegister}
                noValidate
              >
                {!userLoginMethod && (
                  <div className={styles.inputRow}>
                    <div className={styles.fieldGroup}>
                      <input
                        type="text"
                        name="name"
                        placeholder="Enter your name"
                        className={styles.inputFiled}
                        value={formData.name}
                        onChange={handleOnChange}
                        autoComplete="name"
                        maxLength={60}
                        aria-invalid={Boolean(fieldErrors.name)}
                        aria-describedby="name-error"
                        disabled={isLoading}
                      />
                      <FieldError error={fieldErrors.name} />
                    </div>

                    <div className={styles.fieldGroup}>
                      <input
                        type="text"
                        name="username"
                        placeholder="Enter your username"
                        className={styles.inputFiled}
                        value={formData.username}
                        onChange={handleOnChange}
                        autoComplete="username"
                        maxLength={20}
                        aria-invalid={Boolean(fieldErrors.username)}
                        aria-describedby="username-error"
                        disabled={isLoading}
                      />
                      <FieldError error={fieldErrors.username} />
                    </div>
                  </div>
                )}

                <div className={styles.fieldGroup}>
                  <input
                    type="text"
                    name="email"
                    placeholder="Enter your email"
                    className={styles.inputFiled}
                    value={formData.email}
                    onChange={handleOnChange}
                    autoComplete="email"
                    aria-invalid={Boolean(fieldErrors.email)}
                    aria-describedby="email-error"
                    disabled={isLoading}
                  />
                  <FieldError error={fieldErrors.email} />
                </div>

                <div className={styles.fieldGroup}>
                  <input
                    type="password"
                    name="password"
                    placeholder={
                      userLoginMethod
                        ? "Enter your password"
                        : "Create a password (min. 8 characters)"
                    }
                    className={styles.inputFiled}
                    value={formData.password}
                    onChange={handleOnChange}
                    autoComplete={
                      userLoginMethod ? "current-password" : "new-password"
                    }
                    maxLength={72}
                    aria-invalid={Boolean(fieldErrors.password)}
                    aria-describedby="password-error"
                    disabled={isLoading}
                  />
                  <FieldError error={fieldErrors.password} />
                </div>

                {/* Added: Forgot Password link; visible only in Sign In mode */}
                {userLoginMethod && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      width: "100%",
                      marginTop: "-6px",
                      marginBottom: "8px",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => router.push("/forget-password")}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "#818cf8",
                        fontSize: "13px",
                        fontWeight: 500,
                        cursor: "pointer",
                        padding: "4px 0",
                      }}
                    >
                      Forgot Password?
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  className={styles.button}
                  disabled={isLoading}
                >
                  <span>
                    {loadingAction === "send"
                      ? "Sending OTP..."
                      : loadingAction === "login"
                        ? "Signing in..."
                        : userLoginMethod
                          ? "Sign In"
                          : "Sign Up & Verify Email"}
                  </span>
                </button>
              </form>
            )}
          </div>

          <div className={styles.cardContainer_right}>
            <div>
              <p>
                {showOtpScreen
                  ? "Check your inbox for the code"
                  : userLoginMethod
                    ? "Don't have an Account?"
                    : "Already have an Account?"}
              </p>

              <button
                type="button"
                className={styles.button}
                onClick={handleSwitchMethod}
                disabled={isLoading}
              >
                <span>{userLoginMethod ? "Sign Up" : "Sign In"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </UserLayOut>
  );
}

export default Login;
