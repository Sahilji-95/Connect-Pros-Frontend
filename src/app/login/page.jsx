"use client";

import React, { useEffect, useRef, useState } from "react";
import Script from "next/script";
import UserLayOut from "@/layout/UserLayout/Index";
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

import {
  loginUser,
  googleLogin,
  sendGoogleLinkOtp,
  verifyGoogleLinkOtp,
  getAboutUser,
  sendEmailOtp,
  verifyEmailOtp,
  resendEmailOtp,
} from "@/config/redux/action/authAction";

import { emptyMessage } from "@/config/redux/reducer/authReducer";

const inputClass =
  "h-11 w-full rounded-control border border-border bg-app px-3.5 text-sm text-text outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/25 disabled:cursor-not-allowed disabled:opacity-50";

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
  const [showGoogleLinkOtpScreen, setShowGoogleLinkOtpScreen] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
  });

  const [otp, setOtp] = useState("");
  const [googleLinkOtp, setGoogleLinkOtp] = useState("");

  const [googleChallengeId, setGoogleChallengeId] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const [notice, setNotice] = useState({
    message: "",
    isError: false,
  });

  const [loadingAction, setLoadingAction] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [googleScriptLoaded, setGoogleScriptLoaded] = useState(false);
  const [googleInitialized, setGoogleInitialized] = useState(false);

  // Google references
  const googleButtonRef = useRef(null);
  const googleLoadingRef = useRef(false);

  // Authenticated user redirect
  useEffect(() => {
    if (authState.laggedIn && authState.profileFetched) {
      router.replace("/dashboard");
    }
  }, [authState.laggedIn, authState.profileFetched, router]);

  useEffect(() => {
    dispatch(emptyMessage());
  }, [userLoginMethod, dispatch]);

  // OTP countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;

    const timer = setTimeout(() => {
      setResendCooldown((previous) => Math.max(0, previous - 1));
    }, 1000);

    return () => clearTimeout(timer);
  }, [resendCooldown]);

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

  // Signup validation
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

  // Normal signup - send OTP
  const handleRegister = async (e) => {
    e.preventDefault();

    if (loadingAction || !validateSignup()) return;

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

  // Normal signup OTP verification
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

  // Resend normal signup OTP
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

        if (retryAfter > 0) setResendCooldown(retryAfter);

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

  // Normal email/password login
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
              profileResult.payload?.message || "Unable to load your profile.",
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

  // Google login callback
  const handleGoogleResponse = async (response) => {
    if (!response?.credential || googleLoadingRef.current) return;

    googleLoadingRef.current = true;
    setLoadingAction("google");
    setNotice({ message: "", isError: false });

    try {
      const result = await dispatch(googleLogin(response.credential));

      if (googleLogin.fulfilled.match(result)) {
        const profileResult = await dispatch(getAboutUser());

        if (getAboutUser.fulfilled.match(profileResult)) {
          router.replace("/dashboard");
        } else {
          setNotice({
            message:
              profileResult.payload?.message || "Unable to load your profile.",
            isError: true,
          });
        }

        return;
      }

      // Existing account found - send linking OTP
      if (result.payload?.code === "ACCOUNT_LINK_REQUIRED") {
        const otpResult = await dispatch(
          sendGoogleLinkOtp(response.credential),
        );

        if (sendGoogleLinkOtp.fulfilled.match(otpResult)) {
          if (!otpResult.payload?.challengeId) {
            setNotice({
              message: "OTP challenge was not returned by the server.",
              isError: true,
            });
            return;
          }

          setGoogleChallengeId(otpResult.payload.challengeId);
          setGoogleLinkOtp("");
          setShowGoogleLinkOtpScreen(true);

          setNotice({
            message:
              otpResult.payload?.message ||
              "Verification OTP sent to your registered email.",
            isError: false,
          });
        } else {
          setNotice({
            message:
              otpResult.payload?.message ||
              "Unable to send account linking OTP.",
            isError: true,
          });
        }

        return;
      }

      setNotice({
        message: result.payload?.message || "Google login failed.",
        isError: true,
      });
    } catch (error) {
      console.error("Google authentication error:", error);

      setNotice({
        message: "Google login failed. Please try again.",
        isError: true,
      });
    } finally {
      googleLoadingRef.current = false;
      setLoadingAction("");
    }
  };

  // Keep GIS callback pointed at the latest handler of the mounted component.
  // Done in an effect (not during render) so it is SSR-safe (no `window` on server).
  useEffect(() => {
    window.__gisResponseHandler = handleGoogleResponse;
  });

  // Clear the handler when this component unmounts so a stale component
  // never receives a Google response.
  useEffect(() => {
    return () => {
      window.__gisResponseHandler = null;
    };
  }, []);

  // Google Identity Services initialization - exactly once per page load.
  useEffect(() => {
    if (!googleScriptLoaded) return;

    if (!window.google?.accounts?.id) return;

    // Already initialized (remount / HMR / Strict Mode) - just reuse it.
    if (window.__gisInitialized) {
      setGoogleInitialized(true);
      return;
    }

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

    if (!clientId) {
      setNotice({
        message: "Google Client ID is missing from frontend environment.",
        isError: true,
      });
      return;
    }

    // Set the flag BEFORE initialize() so a second effect run cannot re-enter.
    window.__gisInitialized = true;

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (response) => {
        // Always call the latest handler, even after HMR / remount.
        window.__gisResponseHandler?.(response);
      },
      auto_select: false,
      cancel_on_tap_outside: true,
    });

    setGoogleInitialized(true);
  }, [googleScriptLoaded]);

  // Google button rendering - both login and signup
  useEffect(() => {
    if (
      !googleScriptLoaded ||
      !googleInitialized ||
      showOtpScreen ||
      showGoogleLinkOtpScreen ||
      !window.google?.accounts?.id ||
      !googleButtonRef.current
    ) {
      return;
    }

    const container = googleButtonRef.current;

    const renderGoogleButton = () => {
      if (!container.isConnected) return;

      const width = Math.floor(Math.min(container.clientWidth, 400));

      if (!width) return;

      container.innerHTML = "";

      window.google.accounts.id.renderButton(container, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: "continue_with",
        shape: "rectangular",
        logo_alignment: "left",
        width,
      });
    };

    renderGoogleButton();

    const observer =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(renderGoogleButton)
        : null;

    observer?.observe(container);

    return () => {
      observer?.disconnect();
      container.innerHTML = "";
    };
  }, [
    googleScriptLoaded,
    googleInitialized,
    showOtpScreen,
    showGoogleLinkOtpScreen,
  ]);

  // Verify Google account linking OTP
  const handleGoogleLinkVerify = async (e) => {
    e.preventDefault();

    if (loadingAction) return;

    if (!googleChallengeId) {
      setNotice({
        message: "OTP session expired. Please start Google login again.",
        isError: true,
      });
      return;
    }

    if (!/^\d{6}$/.test(googleLinkOtp)) {
      setNotice({
        message: "Please enter a valid 6-digit OTP.",
        isError: true,
      });
      return;
    }

    setLoadingAction("google-verify");
    setNotice({ message: "", isError: false });

    try {
      const result = await dispatch(
        verifyGoogleLinkOtp({
          challengeId: googleChallengeId,
          otp: googleLinkOtp,
        }),
      );

      if (verifyGoogleLinkOtp.fulfilled.match(result)) {
        const profileResult = await dispatch(getAboutUser());

        if (getAboutUser.fulfilled.match(profileResult)) {
          router.replace("/dashboard");
        } else {
          setNotice({
            message:
              profileResult.payload?.message ||
              "Account linked, but profile could not be loaded.",
            isError: true,
          });
        }
      } else {
        setNotice({
          message: result.payload?.message || "OTP verification failed.",
          isError: true,
        });
      }
    } catch (error) {
      console.error("Google link verification error:", error);

      setNotice({
        message: "Unable to verify OTP. Please try again.",
        isError: true,
      });
    } finally {
      setLoadingAction("");
    }
  };

  // Switch between login and signup
  const handleSwitchMethod = () => {
    setUserLoginMethod((previous) => !previous);

    setShowOtpScreen(false);
    setShowGoogleLinkOtpScreen(false);

    setOtp("");
    setGoogleLinkOtp("");
    setGoogleChallengeId("");

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

  const handleBackFromGoogleLink = () => {
    setShowGoogleLinkOtpScreen(false);
    setGoogleLinkOtp("");
    setGoogleChallengeId("");
    setNotice({ message: "", isError: false });
  };

  const isLoading = Boolean(loadingAction);

  const FieldError = ({ error }) =>
    error ? (
      <p className="mt-1.5 text-xs text-danger" role="alert">
        {error}
      </p>
    ) : null;

  return (
    <UserLayOut>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onReady={() => {
          if (window.google?.accounts?.id) {
            setGoogleScriptLoaded(true);
          }
        }}
        onError={() =>
          setNotice({
            message: "Google Sign-In could not be loaded. Please try again.",
            isError: true,
          })
        }
      />

      <div className="flex min-h-[calc(100dvh-76px)] items-center justify-center bg-app px-3 py-6 text-text sm:px-6 sm:py-10">
        <div className="grid w-full max-w-[920px] overflow-hidden rounded-panel border border-border bg-surface shadow-md lg:grid-cols-[1.25fr_1fr]">
          {/* Form side */}
          <div className="min-w-0 p-5 sm:p-8 md:p-10">
            <h1 className="break-words font-serif text-2xl font-bold tracking-tight text-text sm:text-3xl">
              {showGoogleLinkOtpScreen
                ? "Link Google Account"
                : showOtpScreen
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

            {/* GOOGLE ACCOUNT LINK OTP */}
            {showGoogleLinkOtpScreen ? (
              <form
                className="mt-6 flex flex-col gap-4"
                onSubmit={handleGoogleLinkVerify}
                noValidate
              >
                <div>
                  <h2 className="text-base font-semibold text-text">
                    Verify account ownership
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-muted">
                    This email already has a Connect Pros account. Enter the
                    6-digit verification code sent to your registered email
                    address to securely link your Google account.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="googleLinkOtp"
                    className="mb-1.5 block text-xs font-semibold text-text"
                  >
                    Verification code
                  </label>

                  <input
                    id="googleLinkOtp"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    placeholder="Enter 6-digit OTP"
                    value={googleLinkOtp}
                    onChange={(e) => {
                      setGoogleLinkOtp(
                        e.target.value.replace(/\D/g, "").slice(0, 6),
                      );
                      setNotice({ message: "", isError: false });
                    }}
                    className={`${inputClass} text-center text-lg font-semibold tracking-[0.5em] placeholder:text-sm placeholder:font-normal placeholder:tracking-normal`}
                    disabled={isLoading}
                  />
                </div>

                <button
                  type="submit"
                  className={primaryButtonClass}
                  disabled={isLoading || googleLinkOtp.length !== 6}
                >
                  {loadingAction === "google-verify"
                    ? "Verifying..."
                    : "Verify & Link Account"}
                </button>

                <button
                  type="button"
                  className="self-start text-xs font-medium text-muted transition hover:text-text"
                  onClick={handleBackFromGoogleLink}
                  disabled={isLoading}
                >
                  ← Back to login
                </button>
              </form>
            ) : showOtpScreen ? (
              /* NORMAL SIGNUP OTP */
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
                    disabled={isLoading}
                  />

                  {notice.isError && (
                    <p className="mt-1.5 text-xs text-danger" role="alert">
                      {notice.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  className={primaryButtonClass}
                  disabled={isLoading || otp.length !== 6}
                >
                  {loadingAction === "verify" ? "Verifying..." : "Verify Email"}
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
                  className="self-start text-xs font-medium text-muted transition hover:text-text"
                  onClick={handleBackToSignup}
                  disabled={isLoading}
                >
                  ← Back to signup
                </button>
              </form>
            ) : (
              <>
                {/* LOGIN / SIGNUP */}
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
                        disabled={isLoading}
                      />

                      <button
                        type="button"
                        onClick={() => setShowPassword((previous) => !previous)}
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                        disabled={isLoading}
                        className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted transition hover:bg-surface-muted hover:text-text"
                      >
                        {showPassword ? (
                          <EyeOff size={17} />
                        ) : (
                          <Eye size={17} />
                        )}
                      </button>
                    </div>

                    <FieldError error={fieldErrors.password} />
                  </div>

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
                    {loadingAction === "send"
                      ? "Sending OTP..."
                      : loadingAction === "login"
                        ? "Signing in..."
                        : userLoginMethod
                          ? "Sign In"
                          : "Sign Up & Verify Email"}
                  </button>
                </form>

                {/* GOOGLE BUTTON - BOTH SIGNUP AND LOGIN */}
                <div className="mt-5 w-full">
                  <div className="relative mb-5 flex items-center">
                    <div className="h-px flex-1 bg-border" />

                    <span className="px-3 text-xs font-medium text-muted">
                      OR CONTINUE WITH
                    </span>

                    <div className="h-px flex-1 bg-border" />
                  </div>

                  <div
                    ref={googleButtonRef}
                    className={`flex min-h-11 w-full justify-center overflow-hidden ${
                      isLoading ? "pointer-events-none opacity-60" : ""
                    }`}
                  />

                  {!googleScriptLoaded && (
                    <p className="mt-2 text-center text-xs text-muted">
                      Loading Google Sign-In...
                    </p>
                  )}

                  {loadingAction === "google" && (
                    <p className="mt-2 text-center text-xs text-muted">
                      Signing in with Google...
                    </p>
                  )}
                </div>
              </>
            )}
          </div>

          {/* SWITCH SIDE */}
          <div className="flex items-center justify-center border-t border-border bg-primary p-6 text-center text-white dark:text-[#12141A] sm:p-8 lg:border-l lg:border-t-0 lg:p-10">
            <div className="flex max-w-[240px] flex-col items-center gap-5">
              <p className="font-serif text-xl font-bold leading-snug">
                {showGoogleLinkOtpScreen
                  ? "One more step to secure your account"
                  : showOtpScreen
                    ? "Check your inbox for the code"
                    : userLoginMethod
                      ? "Don't have an Account?"
                      : "Already have an Account?"}
              </p>

              {!showOtpScreen && !showGoogleLinkOtpScreen && (
                <button
                  type="button"
                  onClick={handleSwitchMethod}
                  disabled={isLoading}
                  className="flex h-11 w-full items-center justify-center rounded-control border border-current/60 px-5 text-sm font-semibold transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-black/10"
                >
                  {userLoginMethod ? "Sign Up" : "Sign In"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </UserLayOut>
  );
}

export default Login;
