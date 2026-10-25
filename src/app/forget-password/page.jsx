"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";

import UserLayOut from "@/layout/UserLayout/Index";
import {
  forgotPassword,
  verifyResetOTP,
  resendResetOTP,
} from "@/config/redux/action/authAction";

// Is path ko apni CSS module file ke actual path ke according set karo.
import styles from "./forget-password.module.css";

export default function ForgetPassword() {
  const dispatch = useDispatch();
  const router = useRouter();

  const authState = useSelector((state) => state.auth);

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [showOtpScreen, setShowOtpScreen] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [loadingAction, setLoadingAction] = useState("");
  const [notice, setNotice] = useState({
    message: "",
    isError: false,
  });

  // Resend countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;

    const timer = setTimeout(() => {
      setResendCooldown((previous) => Math.max(0, previous - 1));
    }, 1000);

    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleEmailSubmit = async (e) => {
    e.preventDefault();

    if (loadingAction) return;

    const normalizedEmail = email.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setNotice({
        message: "Please enter a valid email address.",
        isError: true,
      });
      return;
    }

    setLoadingAction("send");
    setNotice({ message: "", isError: false });

    try {
      const result = await dispatch(forgotPassword({ email: normalizedEmail }));

      if (forgotPassword.fulfilled.match(result)) {
        setEmail(normalizedEmail);
        setOtp("");
        setShowOtpScreen(true);
        setResendCooldown(result.payload?.retryAfter || 60);

        setNotice({
          message: result.payload?.message || "Reset OTP sent to your email.",
          isError: false,
        });
      } else {
        setNotice({
          message: result.payload?.message || "Unable to send reset OTP.",
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

  const handleVerifyOTP = async (e) => {
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
        verifyResetOTP({
          email: email.trim().toLowerCase(),
          otp,
        }),
      );

      if (verifyResetOTP.fulfilled.match(result)) {
        const resetToken = result.payload?.resetToken;

        if (!resetToken) {
          setNotice({
            message: "Reset token was not received. Please try again.",
            isError: true,
          });
          return;
        }

        // Short-lived token stays out of the URL.
        // The reset page will read and remove it after use.
        sessionStorage.setItem("passwordResetToken", resetToken);
        sessionStorage.setItem(
          "passwordResetEmail",
          email.trim().toLowerCase(),
        );

        router.push("/forget-password/reset-password");
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

  const handleResendOTP = async () => {
    if (loadingAction || resendCooldown > 0) return;

    setLoadingAction("resend");
    setNotice({ message: "", isError: false });

    try {
      const result = await dispatch(
        resendResetOTP({
          email: email.trim().toLowerCase(),
        }),
      );

      if (resendResetOTP.fulfilled.match(result)) {
        setOtp("");
        setResendCooldown(result.payload?.retryAfter || 60);

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

  const isLoading = Boolean(loadingAction);

  return (
    <UserLayOut>
      <div className={styles.container}>
        <div className={styles.cardContainer}>
          <div className={styles.cardContainer_left}>
            <h1 className={styles.cardLeftHeading}>
              {showOtpScreen ? "Verify OTP" : "Forgot Password"}
            </h1>

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

            {!showOtpScreen ? (
              <form
                className={styles.inputContainer}
                onSubmit={handleEmailSubmit}
                noValidate
              >
                <p className={styles.otpDescription}>
                  Enter your registered email address. We will send you a
                  password reset code.
                </p>

                <label className={styles.fieldLabel} htmlFor="resetEmail">
                  Email address
                </label>

                <input
                  id="resetEmail"
                  type="email"
                  name="email"
                  autoComplete="email"
                  placeholder="Enter your registered email"
                  className={styles.inputFiled}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setNotice({ message: "", isError: false });
                  }}
                  maxLength={254}
                  required
                  disabled={isLoading}
                />

                <button
                  type="submit"
                  className={styles.button}
                  disabled={isLoading}
                >
                  <span>
                    {loadingAction === "send"
                      ? "Sending OTP..."
                      : "Send Reset OTP"}
                  </span>
                </button>

                <button
                  type="button"
                  className={styles.backButton}
                  onClick={() => router.push("/login")}
                  disabled={isLoading}
                >
                  ← Back to login
                </button>
              </form>
            ) : (
              <form
                className={styles.inputContainer}
                onSubmit={handleVerifyOTP}
                noValidate
              >
                <p className={styles.otpDescription}>
                  Enter the 6-digit code sent to:
                </p>

                <p className={styles.otpEmail}>{email}</p>

                <label className={styles.fieldLabel} htmlFor="resetOtp">
                  Verification code
                </label>

                <input
                  id="resetOtp"
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
                  required
                  aria-invalid={notice.isError}
                  disabled={isLoading}
                />

                <button
                  type="submit"
                  className={styles.button}
                  disabled={isLoading || otp.length !== 6}
                >
                  <span>
                    {loadingAction === "verify" ? "Verifying..." : "Verify OTP"}
                  </span>
                </button>

                <div className={styles.resendContainer}>
                  <span>Didn't receive the code?</span>

                  <button
                    type="button"
                    className={styles.textButton}
                    onClick={handleResendOTP}
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
                  onClick={() => {
                    setShowOtpScreen(false);
                    setOtp("");
                    setNotice({ message: "", isError: false });
                  }}
                  disabled={isLoading}
                >
                  ← Change email
                </button>
              </form>
            )}
          </div>

          <div className={styles.cardContainer_right}>
            <div>
              <p>
                {showOtpScreen
                  ? "One more step to secure your account"
                  : "Forgot your password? No worries. Let's get you back in."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </UserLayOut>
  );
}
