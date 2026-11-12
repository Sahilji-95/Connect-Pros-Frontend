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

// Shared style tokens
const inputClass =
  "h-11 w-full rounded-control border border-border bg-app px-3.5 text-sm text-text outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/25 aria-invalid:border-danger aria-invalid:focus:ring-danger/25 disabled:cursor-not-allowed disabled:opacity-50";

const primaryButtonClass =
  "flex h-11 w-full items-center justify-center rounded-control bg-primary px-5 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50 dark:text-[#12141A]";

const linkButtonClass =
  "text-xs font-semibold text-primary transition hover:text-primary-hover disabled:cursor-not-allowed disabled:opacity-50";

const backButtonClass =
  "self-start text-xs font-medium text-muted transition hover:text-text disabled:cursor-not-allowed disabled:opacity-50";

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
      <div className="flex min-h-[calc(100vh-76px)] items-center justify-center bg-app px-4 py-10 text-text sm:px-6">
        <div className="grid w-full max-w-[920px] overflow-hidden rounded-panel border border-border bg-surface shadow-md lg:grid-cols-[1.25fr_1fr]">
          {/* Form side */}
          <div className="p-6 sm:p-10">
            <h1 className="font-serif text-3xl font-bold tracking-tight text-text">
              {showOtpScreen ? "Verify OTP" : "Forgot Password"}
            </h1>

            {notice.message && (
              <p
                className={`mt-5 rounded-control border px-3.5 py-2.5 text-xs leading-5 ${
                  notice.isError
                    ? "border-danger/30 bg-danger/5 text-danger"
                    : "border-success/30 bg-success/10 text-success"
                }`}
                role="status"
                aria-live="polite"
              >
                {notice.message}
              </p>
            )}

            {!showOtpScreen ? (
              <form
                className="mt-6 flex flex-col gap-4"
                onSubmit={handleEmailSubmit}
                noValidate
              >
                <p className="text-sm leading-6 text-muted">
                  Enter your registered email address. We will send you a
                  password reset code.
                </p>

                <div>
                  <label
                    className="mb-1.5 block text-xs font-semibold text-text"
                    htmlFor="resetEmail"
                  >
                    Email address
                  </label>

                  <input
                    id="resetEmail"
                    type="email"
                    name="email"
                    autoComplete="email"
                    placeholder="Enter your registered email"
                    className={inputClass}
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setNotice({ message: "", isError: false });
                    }}
                    maxLength={254}
                    required
                    disabled={isLoading}
                  />
                </div>

                <button
                  type="submit"
                  className={primaryButtonClass}
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
                  className={backButtonClass}
                  onClick={() => router.push("/login")}
                  disabled={isLoading}
                >
                  ← Back to login
                </button>
              </form>
            ) : (
              <form
                className="mt-6 flex flex-col gap-4"
                onSubmit={handleVerifyOTP}
                noValidate
              >
                <div>
                  <p className="text-sm text-muted">
                    Enter the 6-digit code sent to:
                  </p>

                  <p className="mt-1 break-all text-sm font-semibold text-text">
                    {email}
                  </p>
                </div>

                <div>
                  <label
                    className="mb-1.5 block text-xs font-semibold text-text"
                    htmlFor="resetOtp"
                  >
                    Verification code
                  </label>

                  <input
                    id="resetOtp"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    placeholder="Enter 6-digit OTP"
                    className={`${inputClass} text-center text-lg font-semibold tracking-[0.5em] placeholder:text-sm placeholder:font-normal placeholder:tracking-normal`}
                    value={otp}
                    onChange={(e) => {
                      setOtp(e.target.value.replace(/\D/g, "").slice(0, 6));
                      setNotice({ message: "", isError: false });
                    }}
                    required
                    aria-invalid={notice.isError}
                    disabled={isLoading}
                  />
                </div>

                <button
                  type="submit"
                  className={primaryButtonClass}
                  disabled={isLoading || otp.length !== 6}
                >
                  <span>
                    {loadingAction === "verify" ? "Verifying..." : "Verify OTP"}
                  </span>
                </button>

                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
                  <span>Didn't receive the code?</span>

                  <button
                    type="button"
                    className={linkButtonClass}
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
                  className={backButtonClass}
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

          {/* Message side */}
          <div className="flex items-center justify-center border-t border-border bg-primary p-8 text-center text-white dark:text-[#12141A] lg:border-l lg:border-t-0 lg:p-10">
            <p className="max-w-[240px] font-serif text-xl font-bold leading-snug">
              {showOtpScreen
                ? "One more step to secure your account"
                : "Forgot your password? No worries. Let's get you back in."}
            </p>
          </div>
        </div>
      </div>
    </UserLayOut>
  );
}
