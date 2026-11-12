"use client";

import React, { useEffect, useState } from "react";
import UserLayOut from "@/layout/UserLayout/Index";
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

import {
  loginUser,
  getAboutUser,
  sendEmailOtp,
  verifyEmailOtp,
  resendEmailOtp,
} from "@/config/redux/action/authAction";

import { emptyMessage } from "@/config/redux/reducer/authReducer";

// Shared style tokens
const inputClass =
  "h-11 w-full rounded-control border border-border bg-app px-3.5 text-sm text-text outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/25 aria-invalid:border-danger aria-invalid:focus:ring-danger/25 disabled:cursor-not-allowed disabled:opacity-50";

const primaryButtonClass =
  "flex h-11 w-full items-center justify-center rounded-control bg-primary px-5 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50 dark:text-[#12141A]";

const linkButtonClass =
  "text-xs font-semibold text-primary transition hover:text-primary-hover disabled:cursor-not-allowed disabled:opacity-50";

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

  const [showPassword, setShowPassword] = useState(false);
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
    setShowPassword(false);
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
      <p className="mt-1.5 text-xs text-danger" role="alert">
        {error}
      </p>
    ) : null;

  return (
    <UserLayOut>
      <div className="flex min-h-[calc(100vh-76px)] items-center justify-center bg-app px-4 py-10 text-text sm:px-6">
        <div className="grid w-full max-w-[920px] overflow-hidden rounded-panel border border-border bg-surface shadow-md lg:grid-cols-[1.25fr_1fr]">
          {/* Form side */}
          <div className="p-6 sm:p-10">
            <h1 className="font-serif text-3xl font-bold tracking-tight text-text">
              {showOtpScreen
                ? "Verify your email"
                : userLoginMethod
                  ? "Sign in"
                  : "Sign up"}
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

            {/* Email OTP verification screen */}
            {showOtpScreen ? (
              <form
                className="mt-6 flex flex-col gap-4"
                onSubmit={handleVerifyOtp}
                noValidate
              >
                <div>
                  <p className="text-sm text-muted">
                    We sent a 6-digit verification code to
                  </p>

                  <p className="mt-1 break-all text-sm font-semibold text-text">
                    {formData.email}
                  </p>
                </div>

                <div>
                  <label
                    className="mb-1.5 block text-xs font-semibold text-text"
                    htmlFor="emailOtp"
                  >
                    Verification code
                  </label>

                  <input
                    id="emailOtp"
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
                    aria-invalid={Boolean(notice.isError && otp.length !== 6)}
                    aria-describedby="otp-error"
                    disabled={isLoading}
                  />

                  {notice.isError && (
                    <p
                      id="otp-error"
                      className="mt-1.5 text-xs text-danger"
                      role="alert"
                    >
                      {notice.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  className={primaryButtonClass}
                  disabled={isLoading || otp.length !== 6}
                >
                  <span>
                    {loadingAction === "verify"
                      ? "Verifying..."
                      : "Verify Email"}
                  </span>
                </button>

                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
                  <span>Didn't receive the code?</span>

                  <button
                    type="button"
                    className={linkButtonClass}
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
                  className="self-start text-xs font-medium text-muted transition hover:text-text disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={handleBackToSignup}
                  disabled={isLoading}
                >
                  ← Back to signup
                </button>
              </form>
            ) : (
              /* Signup and login form */
              <form
                className="mt-6 flex flex-col gap-4"
                onSubmit={userLoginMethod ? handleLogin : handleRegister}
                noValidate
              >
                {!userLoginMethod && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <input
                        type="text"
                        name="name"
                        placeholder="Enter your name"
                        className={inputClass}
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

                    <div>
                      <input
                        type="text"
                        name="username"
                        placeholder="Enter your username"
                        className={inputClass}
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

                <div>
                  <input
                    type="text"
                    name="email"
                    placeholder="Enter your email"
                    className={inputClass}
                    value={formData.email}
                    onChange={handleOnChange}
                    autoComplete="email"
                    aria-invalid={Boolean(fieldErrors.email)}
                    aria-describedby="email-error"
                    disabled={isLoading}
                  />
                  <FieldError error={fieldErrors.email} />
                </div>

                <div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder={
                        userLoginMethod
                          ? "Enter your password"
                          : "Create a password (min. 8 characters)"
                      }
                      className={`${inputClass} pr-11`}
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

                    <button
                      type="button"
                      onClick={() => setShowPassword((previous) => !previous)}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      aria-pressed={showPassword}
                      disabled={isLoading}
                      className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted transition hover:bg-surface-muted hover:text-text disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>

                  <FieldError error={fieldErrors.password} />
                </div>

                {/* Added: Forgot Password link; visible only in Sign In mode */}
                {userLoginMethod && (
                  <div className="-mt-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => router.push("/forget-password")}
                      className={linkButtonClass}
                    >
                      Forgot Password?
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  className={primaryButtonClass}
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

          {/* Switch side */}
          <div className="flex items-center justify-center border-t border-border bg-primary p-8 text-center text-white dark:text-[#12141A] lg:border-l lg:border-t-0 lg:p-10">
            <div className="flex max-w-[240px] flex-col items-center gap-5">
              <p className="font-serif text-xl font-bold leading-snug">
                {showOtpScreen
                  ? "Check your inbox for the code"
                  : userLoginMethod
                    ? "Don't have an Account?"
                    : "Already have an Account?"}
              </p>

              <button
                type="button"
                onClick={handleSwitchMethod}
                disabled={isLoading}
                className="flex h-11 w-full items-center justify-center rounded-control border border-current/60 px-5 text-sm font-semibold transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-black/10"
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
