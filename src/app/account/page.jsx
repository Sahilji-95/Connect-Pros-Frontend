"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import {
  UserRound,
  Mail,
  LockKeyhole,
  ShieldCheck,
  Eye,
  EyeOff,
  LoaderCircle,
  CheckCircle2,
  AlertCircle,
  AtSign,
  RefreshCw,
} from "lucide-react";

import {
  getAboutUser,
  updateUserProfile,
  changePassword,
  setGoogleAccountPassword,
  sendEmailChangeOtp,
  verifyEmailChangeOtp,
} from "@/config/redux/action/authAction";

// ---------------- REUSABLE STYLES ----------------

const inputClass =
  "h-12 w-full rounded-xl border border-border bg-app px-4 text-sm text-text outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60";

const labelClass = "mb-2 block text-sm font-semibold text-text";

const primaryButton =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50 dark:text-[#12141A]";

const secondaryButton =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-5 py-3 text-sm font-semibold text-text transition hover:bg-app disabled:cursor-not-allowed disabled:opacity-50";

const sectionClass =
  "rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-7";

// ---------------- HELPER COMPONENTS ----------------

function Notice({ type = "success", message }) {
  if (!message) return null;

  const isSuccess = type === "success";

  return (
    <div
      role="status"
      className={`flex items-start gap-2 rounded-xl border p-3 text-sm ${
        isSuccess
          ? "border-success/20 bg-success/5 text-success"
          : "border-danger/20 bg-danger/5 text-danger"
      }`}
    >
      {isSuccess ? (
        <CheckCircle2 size={17} className="mt-0.5 shrink-0" />
      ) : (
        <AlertCircle size={17} className="mt-0.5 shrink-0" />
      )}

      <span>{message}</span>
    </div>
  );
}

function PasswordInput({
  label,
  value,
  onChange,
  placeholder = "Enter password",
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label className={labelClass}>{label}</label>

      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`${inputClass} pr-12`}
          autoComplete="new-password"
        />

        <button
          type="button"
          onClick={() => setVisible((prev) => !prev)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-muted transition hover:text-text"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
}

function SectionHeader({ icon: Icon, title, description }) {
  return (
    <div className="mb-6 flex items-start gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon size={21} />
      </div>

      <div>
        <h2 className="text-lg font-bold text-text">{title}</h2>
        <p className="mt-1 text-sm text-muted">{description}</p>
      </div>
    </div>
  );
}

// ---------------- MAIN COMPONENT ----------------

export default function Account() {
  const dispatch = useDispatch();
  const router = useRouter();

  const auth = useSelector((state) => state.auth);

  const profile = auth.user;
  const userInfo = profile?.userId;

  const hasPassword = userInfo?.hasPassword;
  const isGoogleAccount = userInfo?.isGoogleAccount;

  // Redux states
  const {
    profileFetched,

    changePasswordLoading,
    changePasswordError,
    changePasswordMessage,

    setGooglePasswordLoading,
    setGooglePasswordError,
    setGooglePasswordMessage,

    sendEmailOtpLoading,
    sendEmailOtpError,
    sendEmailOtpMessage,

    verifyEmailOtpLoading,
    verifyEmailOtpError,
    verifyEmailOtpMessage,
    verifyEmailOtpAttemptsRemaining,
  } = auth;

  // Username states
  const [newUsername, setNewUsername] = useState("");
  const [usernameLoading, setUsernameLoading] = useState(false);
  const [usernameError, setUsernameError] = useState("");
  const [usernameMessage, setUsernameMessage] = useState("");

  // Email states
  const [newEmail, setNewEmail] = useState("");
  const [emailOtp, setEmailOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [emailValidationError, setEmailValidationError] = useState("");

  // Password states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Google password states
  const [googleNewPassword, setGoogleNewPassword] = useState("");
  const [googleConfirmPassword, setGoogleConfirmPassword] = useState("");

  // ---------------- LOAD PROFILE ----------------

  useEffect(() => {
    if (!profileFetched) {
      dispatch(getAboutUser());
    }
  }, [dispatch, profileFetched]);

  useEffect(() => {
    if (userInfo?.username) {
      setNewUsername(userInfo.username);
    }

    if (userInfo?.email) {
      setNewEmail(userInfo.email);
    }
  }, [userInfo?.username, userInfo?.email]);

  // ---------------- USERNAME UPDATE ----------------

  const handleUsernameUpdate = async (e) => {
    e.preventDefault();

    setUsernameError("");
    setUsernameMessage("");

    const normalizedUsername = newUsername.trim().toLowerCase();

    if (!/^[a-z0-9_]{3,30}$/.test(normalizedUsername)) {
      setUsernameError(
        "Username must be 3-30 characters and contain only lowercase letters, numbers and underscores.",
      );
      return;
    }

    if (normalizedUsername === userInfo?.username) {
      setUsernameError("Please enter a different username.");
      return;
    }

    try {
      setUsernameLoading(true);

      const result = await dispatch(
        updateUserProfile({
          username: normalizedUsername,
        }),
      ).unwrap();

      setUsernameMessage(result?.message || "Username updated successfully.");

      await dispatch(getAboutUser()).unwrap();
    } catch (error) {
      setUsernameError(error?.message || "Unable to update username.");
    } finally {
      setUsernameLoading(false);
    }
  };

  // ---------------- SEND EMAIL OTP ----------------

  const handleSendEmailOtp = async (e) => {
    e?.preventDefault();

    setEmailValidationError("");

    const normalizedEmail = newEmail.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setEmailValidationError("Please enter a valid email address.");
      return;
    }

    if (normalizedEmail === userInfo?.email?.toLowerCase()) {
      setEmailValidationError("Please enter a different email address.");
      return;
    }

    try {
      await dispatch(
        sendEmailChangeOtp({
          email: normalizedEmail,
        }),
      ).unwrap();

      setOtpSent(true);
      setEmailOtp("");
    } catch {
      // Redux slice handles the error.
      // Do not use console.error here.
    }
  };

  // ---------------- VERIFY EMAIL OTP ----------------

  const handleVerifyEmailOtp = async (e) => {
    e.preventDefault();

    if (emailOtp.length !== 6) return;

    try {
      await dispatch(
        verifyEmailChangeOtp({
          otp: emailOtp.trim(),
        }),
      ).unwrap();

      setOtpSent(false);
      setEmailOtp("");

      await dispatch(getAboutUser()).unwrap();
    } catch {
      // Expected verification errors are shown in the UI
      // through verifyEmailOtpError from Redux.
    }
  };

  // ---------------- CHANGE PASSWORD ----------------

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) return;

    try {
      await dispatch(
        changePassword({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      ).unwrap();

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      router.replace("/login");
    } catch {
      // Redux slice handles the error.
    }
  };

  // ---------------- SET GOOGLE PASSWORD ----------------

  const handleSetGooglePassword = async (e) => {
    e.preventDefault();

    if (googleNewPassword !== googleConfirmPassword) return;

    try {
      await dispatch(
        setGoogleAccountPassword({
          newPassword: googleNewPassword,
          confirmPassword: googleConfirmPassword,
        }),
      ).unwrap();

      setGoogleNewPassword("");
      setGoogleConfirmPassword("");

      await dispatch(getAboutUser()).unwrap();
    } catch {
      // Redux slice handles the error.
    }
  };

  // ---------------- ERROR MESSAGE HELPER ----------------

  const getErrorMessage = (error) => {
    if (!error) return "";
    if (typeof error === "string") return error;
    return error.message || "Something went wrong.";
  };

  // ---------------- RENDER ----------------

  return (
    <div className="min-h-screen bg-app px-4 py-6 text-text sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        {/* PAGE HEADER */}

        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">
            Account Settings
          </h1>

          <p className="mt-2 text-sm text-muted sm:text-base">
            Manage your username, email address and account security.
          </p>
        </div>

        <div className="space-y-6">
          {/* USERNAME SECTION */}

          <section className={sectionClass}>
            <SectionHeader
              icon={UserRound}
              title="Username"
              description="Manage your public Connect Pros username."
            />

            <form onSubmit={handleUsernameUpdate} className="space-y-4">
              <div>
                <label className={labelClass}>Username</label>

                <div className="relative">
                  <AtSign
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-muted"
                  />

                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => {
                      setNewUsername(
                        e.target.value.toLowerCase().replace(/\s/g, ""),
                      );

                      setUsernameError("");
                      setUsernameMessage("");
                    }}
                    placeholder="Enter username"
                    maxLength={30}
                    className={`${inputClass} pl-11`}
                  />
                </div>

                <p className="mt-2 text-xs text-muted">
                  3-30 characters. Only lowercase letters, numbers and
                  underscores.
                </p>
              </div>

              <Notice type="success" message={usernameMessage} />

              <Notice type="error" message={usernameError} />

              <button
                type="submit"
                disabled={
                  usernameLoading ||
                  !newUsername.trim() ||
                  newUsername.trim().toLowerCase() === userInfo?.username
                }
                className={primaryButton}
              >
                {usernameLoading && (
                  <LoaderCircle size={17} className="animate-spin" />
                )}
                Update Username
              </button>
            </form>
          </section>

          {/* EMAIL SECTION */}

          <section className={sectionClass}>
            <SectionHeader
              icon={Mail}
              title="Email Address"
              description="Change your registered email using OTP verification."
            />

            <div className="mb-5">
              <label className={labelClass}>Current Email</label>

              <input
                type="email"
                value={userInfo?.email || ""}
                disabled
                className={inputClass}
              />
            </div>

            <form onSubmit={handleSendEmailOtp} className="space-y-4">
              <div>
                <label className={labelClass}>New Email Address</label>

                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => {
                    setNewEmail(e.target.value);
                    setOtpSent(false);
                    setEmailOtp("");
                    setEmailValidationError("");
                  }}
                  placeholder="Enter new email address"
                  className={inputClass}
                  required
                />
              </div>

              <Notice type="error" message={emailValidationError} />

              <Notice type="success" message={sendEmailOtpMessage} />

              <Notice type="error" message={sendEmailOtpError} />

              <button
                type="submit"
                disabled={
                  sendEmailOtpLoading ||
                  !newEmail.trim() ||
                  newEmail.trim().toLowerCase() ===
                    userInfo?.email?.toLowerCase()
                }
                className={primaryButton}
              >
                {sendEmailOtpLoading ? (
                  <LoaderCircle size={17} className="animate-spin" />
                ) : (
                  <Mail size={17} />
                )}
                Send OTP
              </button>
            </form>

            {/* OTP VERIFICATION */}

            {otpSent && (
              <form
                onSubmit={handleVerifyEmailOtp}
                className="mt-6 space-y-4 border-t border-border pt-6"
              >
                <div>
                  <label className={labelClass}>Enter 6-digit OTP</label>

                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={emailOtp}
                    onChange={(e) =>
                      setEmailOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    placeholder="Enter OTP"
                    className={inputClass}
                    required
                  />

                  <p className="mt-2 text-xs text-muted">
                    Enter the OTP sent to your new email address.
                  </p>
                </div>

                <Notice type="success" message={verifyEmailOtpMessage} />

                {/* INVALID OTP ERROR */}

                {verifyEmailOtpError && (
                  <div
                    role="alert"
                    className="rounded-xl border border-danger/20 bg-danger/5 p-3"
                  >
                    <div className="flex items-start gap-2 text-danger">
                      <AlertCircle size={17} className="mt-0.5 shrink-0" />

                      <div className="min-w-0">
                        <p className="text-sm font-semibold">
                          {getErrorMessage(verifyEmailOtpError)}
                        </p>

                        {verifyEmailOtpAttemptsRemaining !== null &&
                          verifyEmailOtpAttemptsRemaining !== undefined && (
                            <p className="mt-1 text-xs text-muted">
                              Attempts remaining:{" "}
                              {verifyEmailOtpAttemptsRemaining}
                            </p>
                          )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="submit"
                    disabled={verifyEmailOtpLoading || emailOtp.length !== 6}
                    className={primaryButton}
                  >
                    {verifyEmailOtpLoading && (
                      <LoaderCircle size={17} className="animate-spin" />
                    )}
                    Verify OTP
                  </button>

                  <button
                    type="button"
                    onClick={handleSendEmailOtp}
                    disabled={sendEmailOtpLoading}
                    className={secondaryButton}
                  >
                    {sendEmailOtpLoading ? (
                      <LoaderCircle size={16} className="animate-spin" />
                    ) : (
                      <RefreshCw size={16} />
                    )}
                    Resend OTP
                  </button>
                </div>
              </form>
            )}
          </section>

          {/* PASSWORD SECTION */}

          <section className={sectionClass}>
            <SectionHeader
              icon={LockKeyhole}
              title="Password & Security"
              description="Manage your account password and login security."
            />

            {/* NORMAL ACCOUNT */}

            {hasPassword === true && (
              <form onSubmit={handleChangePassword} className="space-y-4">
                <PasswordInput
                  label="Current Password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                />

                <PasswordInput
                  label="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                />

                <PasswordInput
                  label="Confirm New Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                />

                {newPassword &&
                  confirmPassword &&
                  newPassword !== confirmPassword && (
                    <Notice
                      type="error"
                      message="New password and confirm password do not match."
                    />
                  )}

                <Notice
                  type="error"
                  message={getErrorMessage(changePasswordError)}
                />

                <button
                  type="submit"
                  disabled={
                    changePasswordLoading ||
                    !currentPassword ||
                    !newPassword ||
                    !confirmPassword ||
                    newPassword !== confirmPassword
                  }
                  className={primaryButton}
                >
                  {changePasswordLoading && (
                    <LoaderCircle size={17} className="animate-spin" />
                  )}
                  Change Password
                </button>

                <p className="text-sm text-muted">
                  Forgot your current password?{" "}
                  <button
                    type="button"
                    onClick={() => router.push("/forget-password")}
                    className="font-semibold text-primary hover:underline"
                  >
                    Reset password
                  </button>
                </p>
              </form>
            )}

            {/* GOOGLE ACCOUNT */}

            {hasPassword === false && isGoogleAccount === true && (
              <form onSubmit={handleSetGooglePassword} className="space-y-4">
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-text">
                  Your account uses Google sign-in. You can set a password to
                  enable email and password login.
                </div>

                <PasswordInput
                  label="New Password"
                  value={googleNewPassword}
                  onChange={(e) => setGoogleNewPassword(e.target.value)}
                />

                <PasswordInput
                  label="Confirm Password"
                  value={googleConfirmPassword}
                  onChange={(e) => setGoogleConfirmPassword(e.target.value)}
                />

                {googleNewPassword &&
                  googleConfirmPassword &&
                  googleNewPassword !== googleConfirmPassword && (
                    <Notice type="error" message="Passwords do not match." />
                  )}

                <Notice type="success" message={setGooglePasswordMessage} />

                <Notice
                  type="error"
                  message={getErrorMessage(setGooglePasswordError)}
                />

                <button
                  type="submit"
                  disabled={
                    setGooglePasswordLoading ||
                    !googleNewPassword ||
                    !googleConfirmPassword ||
                    googleNewPassword !== googleConfirmPassword
                  }
                  className={primaryButton}
                >
                  {setGooglePasswordLoading && (
                    <LoaderCircle size={17} className="animate-spin" />
                  )}
                  Set Password
                </button>
              </form>
            )}

            {/* UNKNOWN ACCOUNT STATUS */}

            {hasPassword === false && isGoogleAccount !== true && (
              <Notice
                type="error"
                message="Unable to determine your account password status. Please refresh your profile."
              />
            )}

            {hasPassword === undefined && (
              <div className="flex items-center gap-2 text-sm text-muted">
                <LoaderCircle size={17} className="animate-spin" />
                Loading account security information...
              </div>
            )}
          </section>

          {/* SECURITY INFORMATION */}

          <section className={sectionClass}>
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <ShieldCheck size={21} />
              </div>

              <div>
                <h2 className="text-lg font-bold text-text">
                  Account Protection
                </h2>

                <p className="mt-1 text-sm leading-6 text-muted">
                  Keep your email address and password secure. Never share your
                  OTP or login credentials with anyone.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
