"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

import UserLayOut from "@/layout/UserLayout/Index";
import { resetPassword } from "@/config/redux/action/authAction";

// Shared style tokens
const inputClass =
  "h-11 w-full rounded-control border border-border bg-app px-3.5 text-sm text-text outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/25 aria-invalid:border-danger aria-invalid:focus:ring-danger/25 disabled:cursor-not-allowed disabled:opacity-50";

const primaryButtonClass =
  "flex h-11 w-full items-center justify-center rounded-control bg-primary px-5 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50 dark:text-[#12141A]";

const backButtonClass =
  "self-start text-xs font-medium text-muted transition hover:text-text disabled:cursor-not-allowed disabled:opacity-50";

const toggleButtonClass =
  "absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted transition hover:bg-surface-muted hover:text-text disabled:cursor-not-allowed disabled:opacity-50";

const labelClass = "mb-1.5 block text-xs font-semibold text-text";

// Single centered card used for the loading / unavailable states
function StateCard({ children }) {
  return (
    <UserLayOut>
      <div className="flex min-h-[calc(100vh-76px)] items-center justify-center bg-app px-4 py-10 text-text sm:px-6">
        <div className="w-full max-w-md rounded-panel border border-border bg-surface p-6 shadow-md sm:p-10">
          {children}
        </div>
      </div>
    </UserLayOut>
  );
}

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
      <StateCard>
        <p className="text-sm text-muted">Preparing your password reset...</p>
      </StateCard>
    );
  }

  if (!resetToken) {
    return (
      <StateCard>
        <h1 className="font-serif text-3xl font-bold tracking-tight text-text">
          Reset link unavailable
        </h1>

        <p className="mt-4 text-sm leading-6 text-muted">
          Your reset token is missing or has expired. Request a new OTP and
          verify it to continue.
        </p>

        <button
          type="button"
          className={`${primaryButtonClass} mt-6`}
          onClick={() => router.replace("/forget-password")}
        >
          Request a new OTP
        </button>
      </StateCard>
    );
  }

  return (
    <UserLayOut>
      <div className="flex min-h-[calc(100vh-76px)] items-center justify-center bg-app px-4 py-10 text-text sm:px-6">
        <div className="grid w-full max-w-[920px] overflow-hidden rounded-panel border border-border bg-surface shadow-md lg:grid-cols-[1.25fr_1fr]">
          {/* Form side */}
          <div className="p-6 sm:p-10">
            <h1 className="font-serif text-3xl font-bold tracking-tight text-text">
              Reset Password
            </h1>

            <p className="mt-3 text-sm leading-6 text-muted">
              Choose a strong new password for your account.
            </p>

            {email && (
              <p className="mt-1 break-all text-sm font-semibold text-text">
                {email}
              </p>
            )}

            {notice.message && (
              <p
                className={`mt-5 rounded-control border px-3.5 py-2.5 text-xs leading-5 ${
                  notice.isError
                    ? "border-danger/30 bg-danger/5 text-danger"
                    : "border-success/30 bg-success/10 text-success"
                }`}
                role={notice.isError ? "alert" : "status"}
                aria-live="polite"
              >
                {notice.message}
              </p>
            )}

            <form
              className="mt-6 flex flex-col gap-4"
              onSubmit={handleSubmit}
              noValidate
            >
              <div>
                <label className={labelClass} htmlFor="newPassword">
                  New password
                </label>

                <div className="relative">
                  <input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Enter new password"
                    className={`${inputClass} pr-11`}
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
                    className={toggleButtonClass}
                    onClick={() => setShowPassword((previous) => !previous)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    aria-pressed={showPassword}
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>

                {fieldErrors.newPassword && (
                  <p className="mt-1.5 text-xs text-danger" role="alert">
                    {fieldErrors.newPassword}
                  </p>
                )}
              </div>

              <div>
                <label className={labelClass} htmlFor="confirmPassword">
                  Confirm password
                </label>

                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Confirm new password"
                    className={`${inputClass} pr-11`}
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
                    className={toggleButtonClass}
                    onClick={() =>
                      setShowConfirmPassword((previous) => !previous)
                    }
                    aria-label={
                      showConfirmPassword
                        ? "Hide confirm password"
                        : "Show confirm password"
                    }
                    aria-pressed={showConfirmPassword}
                    disabled={loading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={17} />
                    ) : (
                      <Eye size={17} />
                    )}
                  </button>
                </div>

                {fieldErrors.confirmPassword && (
                  <p className="mt-1.5 text-xs text-danger" role="alert">
                    {fieldErrors.confirmPassword}
                  </p>
                )}
              </div>

              <p className="text-xs leading-5 text-muted">
                Use 8–72 characters. Both password fields must match.
              </p>

              <button
                type="submit"
                className={primaryButtonClass}
                disabled={loading || !newPassword || !confirmPassword}
              >
                <span>
                  {loading ? "Resetting password..." : "Reset Password"}
                </span>
              </button>

              <button
                type="button"
                className={backButtonClass}
                onClick={() => router.replace("/forget-password")}
                disabled={loading}
              >
                ← Start again
              </button>
            </form>
          </div>

          {/* Message side */}
          <div className="flex items-center justify-center border-t border-border bg-primary p-8 text-center text-white dark:text-[#12141A] lg:border-l lg:border-t-0 lg:p-10">
            <p className="max-w-[240px] font-serif text-xl font-bold leading-snug">
              {authState.resetPasswordLoading
                ? "Securing your account..."
                : "Create a new password and get back to your account."}
            </p>
          </div>
        </div>
      </div>
    </UserLayOut>
  );
}
