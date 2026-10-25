"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";

import UserLayOut from "@/layout/UserLayout/Index";
import { resetPassword } from "@/config/redux/action/authAction";
import styles from "./reset-password.module.css";

export default function ResetPasswordPage() {
  const dispatch = useDispatch();
  const router = useRouter();

  const authState = useSelector((state) => state.auth);

  const [resetToken, setResetToken] = useState("");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loadingToken, setLoadingToken] = useState(true);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [notice, setNotice] = useState({
    message: "",
    isError: false,
  });

  // Read the short-lived token created after successful OTP verification.
  useEffect(() => {
    try {
      const storedToken = sessionStorage.getItem("passwordResetToken");
      const storedEmail = sessionStorage.getItem("passwordResetEmail");

      if (!storedToken) {
        router.replace("/forget-password");
        return;
      }

      setResetToken(storedToken);
      setEmail(storedEmail || "");
    } catch {
      router.replace("/forget-password");
    } finally {
      setLoadingToken(false);
    }
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading || !resetToken) return;

    const errors = {};

    if (newPassword.length < 8 || newPassword.length > 72) {
      errors.newPassword = "Password must contain 8–72 characters.";
    }

    if (confirmPassword !== newPassword) {
      errors.confirmPassword = "Passwords do not match.";
    }

    setFieldErrors(errors);
    setNotice({ message: "", isError: false });

    if (Object.keys(errors).length > 0) return;

    setLoading(true);

    try {
      const result = await dispatch(
        resetPassword({
          resetToken,
          newPassword,
          confirmPassword,
        }),
      );

      if (resetPassword.fulfilled.match(result)) {
        // Remove the sensitive token only after successful password reset.
        sessionStorage.removeItem("passwordResetToken");
        sessionStorage.removeItem("passwordResetEmail");

        setResetToken("");
        setNewPassword("");
        setConfirmPassword("");

        setNotice({
          message:
            result.payload?.message ||
            "Password reset successfully. Please log in.",
          isError: false,
        });

        // Give the user a moment to read the success message.
        window.setTimeout(() => {
          router.replace("/login");
        }, 1200);
      } else {
        const message = result.payload?.message || "Unable to reset password.";

        setNotice({
          message,
          isError: true,
        });

        // A rejected/expired reset token requires a fresh OTP verification.
        if (
          /token.*invalid|token.*expired|verify your otp again/i.test(message)
        ) {
          sessionStorage.removeItem("passwordResetToken");
          sessionStorage.removeItem("passwordResetEmail");
          setResetToken("");
        }
      }
    } catch {
      setNotice({
        message: "Something went wrong. Please try again.",
        isError: true,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loadingToken) {
    return (
      <UserLayOut>
        <div className={styles.container}>
          <div className={styles.cardContainer}>
            <div className={styles.cardContainer_left}>
              <p className={styles.otpDescription}>
                Preparing your password reset...
              </p>
            </div>
          </div>
        </div>
      </UserLayOut>
    );
  }

  if (!resetToken) {
    return (
      <UserLayOut>
        <div className={styles.container}>
          <div className={styles.cardContainer}>
            <div className={styles.cardContainer_left}>
              <h1 className={styles.cardLeftHeading}>Reset link unavailable</h1>

              <p className={styles.otpDescription}>
                Your reset token is missing or has expired. Request a new OTP
                and verify it to continue.
              </p>

              <button
                type="button"
                className={styles.button}
                onClick={() => router.replace("/forget-password")}
              >
                Request a new OTP
              </button>
            </div>
          </div>
        </div>
      </UserLayOut>
    );
  }

  return (
    <UserLayOut>
      <div className={styles.container}>
        <div className={styles.cardContainer}>
          <div className={styles.cardContainer_left}>
            <h1 className={styles.cardLeftHeading}>Reset Password</h1>

            <p className={styles.otpDescription}>
              Choose a strong new password for your account.
            </p>

            {email && <p className={styles.otpEmail}>{email}</p>}

            {notice.message && (
              <p
                className={styles.message}
                role={notice.isError ? "alert" : "status"}
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

            <form
              className={styles.inputContainer}
              onSubmit={handleSubmit}
              noValidate
            >
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel} htmlFor="newPassword">
                  New password
                </label>

                <div className={styles.passwordWrapper}>
                  <input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Enter new password"
                    className={styles.inputFiled}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setFieldErrors((previous) => ({
                        ...previous,
                        newPassword: "",
                      }));
                      setNotice({ message: "", isError: false });
                    }}
                    minLength={8}
                    maxLength={72}
                    required
                    aria-invalid={Boolean(fieldErrors.newPassword)}
                    disabled={loading}
                  />

                  <button
                    type="button"
                    className={styles.passwordToggle}
                    onClick={() => setShowPassword((previous) => !previous)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    disabled={loading}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>

                {fieldErrors.newPassword && (
                  <p className={styles.fieldError} role="alert">
                    {fieldErrors.newPassword}
                  </p>
                )}
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel} htmlFor="confirmPassword">
                  Confirm password
                </label>

                <div className={styles.passwordWrapper}>
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Confirm new password"
                    className={styles.inputFiled}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setFieldErrors((previous) => ({
                        ...previous,
                        confirmPassword: "",
                      }));
                      setNotice({ message: "", isError: false });
                    }}
                    maxLength={72}
                    required
                    aria-invalid={Boolean(fieldErrors.confirmPassword)}
                    disabled={loading}
                  />

                  <button
                    type="button"
                    className={styles.passwordToggle}
                    onClick={() =>
                      setShowConfirmPassword((previous) => !previous)
                    }
                    aria-label={
                      showConfirmPassword
                        ? "Hide confirm password"
                        : "Show confirm password"
                    }
                    disabled={loading}
                  >
                    {showConfirmPassword ? "Hide" : "Show"}
                  </button>
                </div>

                {fieldErrors.confirmPassword && (
                  <p className={styles.fieldError} role="alert">
                    {fieldErrors.confirmPassword}
                  </p>
                )}
              </div>

              <p className={styles.passwordHint}>
                Use 8–72 characters. Both password fields must match.
              </p>

              <button
                type="submit"
                className={styles.button}
                disabled={loading || !newPassword || !confirmPassword}
              >
                <span>
                  {loading ? "Resetting password..." : "Reset Password"}
                </span>
              </button>

              <button
                type="button"
                className={styles.backButton}
                onClick={() => router.replace("/forget-password")}
                disabled={loading}
              >
                ← Start again
              </button>
            </form>
          </div>

          <div className={styles.cardContainer_right}>
            <div>
              <p>
                {authState.resetPasswordLoading
                  ? "Securing your account..."
                  : "Create a new password and get back to your account."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </UserLayOut>
  );
}
