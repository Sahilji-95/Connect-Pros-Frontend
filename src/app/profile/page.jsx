"use client";

import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { LoaderCircle, Pencil } from "lucide-react";

import {
  getAboutUser,
  uploadProfilePicture,
} from "@/config/redux/action/authAction";

// Shared style tokens
const sectionCard = "rounded-card border border-border bg-surface p-5 sm:p-6";

const sectionTitle = "font-serif text-xl font-bold text-text";

const detailLabel = "text-xs font-semibold text-muted";

const detailValue = "mt-1 break-words text-sm text-text";

export default function Profile() {
  const dispatch = useDispatch();
  const router = useRouter();
  const authState = useSelector((state) => state.auth);

  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    dispatch(getAboutUser());
  }, [dispatch]);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const user = authState.user?.userId;

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be smaller than 5 MB.");
      return;
    }

    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
    setError("");
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setUploading(true);
      setError("");

      await dispatch(uploadProfilePicture(selectedFile)).unwrap();

      setSelectedFile(null);
      setPreview(null);
    } catch (err) {
      setError(err?.message || "Failed to upload profile picture.");
    } finally {
      setUploading(false);
    }
  };

  if (authState.isLoading && !user) {
    return (
      <main
        role="status"
        className="flex min-h-screen flex-col items-center justify-center gap-3 bg-app text-text"
      >
        <LoaderCircle size={24} className="animate-spin text-primary" />
        <p className="text-sm text-muted">Loading your profile...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-app text-text">
      <div className="mx-auto flex w-full max-w-[920px] flex-col gap-5 px-4 py-8 sm:px-6 sm:py-12">
        {/* Page header */}
        <header className="flex items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl font-bold tracking-tight text-text sm:text-3xl">
              My Profile
            </h1>

            <p className="mt-1 text-sm text-muted">
              Manage your personal information and profile picture.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              router.push("/profile/edit-profile");
            }}
            className="inline-flex h-10 shrink-0 items-center gap-2 rounded-control border border-border bg-surface px-4 text-sm font-semibold text-text transition hover:border-primary/40 hover:text-primary"
          >
            <Pencil size={15} />
            Edit Profile
          </button>
        </header>

        {/* Profile + picture upload */}
        <section className={sectionCard}>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <img
              src={preview || user?.profilePicture || "/default.png"}
              alt="Profile"
              className="h-24 w-24 shrink-0 rounded-full border border-border object-cover sm:h-28 sm:w-28"
            />

            <div className="min-w-0">
              <h2 className="break-words font-serif text-2xl font-bold tracking-tight text-text">
                {user?.name || "Your Name"}
              </h2>

              <p className="mt-1 text-sm text-muted">
                @{user?.username || "username"}
              </p>
            </div>
          </div>

          <div className="mt-6 border-t border-border pt-5">
            <label
              htmlFor="profilePicture"
              className="block text-sm font-semibold text-text"
            >
              Choose a new profile picture
            </label>

            <input
              id="profilePicture"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="mt-2.5 block w-full max-w-md cursor-pointer text-sm text-muted file:mr-3 file:cursor-pointer file:rounded-control file:border-0 file:bg-primary-soft file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary hover:file:bg-primary-soft/70"
            />

            <p className="mt-2 text-xs text-muted">
              JPG, PNG or other supported image formats. Maximum 5 MB.
            </p>

            {selectedFile && (
              <button
                type="button"
                onClick={handleUpload}
                disabled={uploading}
                className="mt-4 inline-flex h-10 items-center gap-2 rounded-control bg-primary px-5 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60 dark:text-[#12141A]"
              >
                {uploading && (
                  <LoaderCircle size={15} className="animate-spin" />
                )}
                {uploading ? "Uploading..." : "Save Picture"}
              </button>
            )}

            {error && (
              <p className="mt-3 text-xs text-danger" role="alert">
                {error}
              </p>
            )}

            {authState.isError && authState.message && (
              <p className="mt-3 text-xs text-danger" role="alert">
                {typeof authState.message === "string"
                  ? authState.message
                  : authState.message?.message}
              </p>
            )}
          </div>
        </section>

        {/* Personal information */}
        <section className={sectionCard}>
          <h2 className={sectionTitle}>Personal Information</h2>

          <dl className="mt-4 grid gap-5 sm:grid-cols-3">
            <div className="min-w-0">
              <dt className={detailLabel}>Full Name</dt>
              <dd className={detailValue}>{user?.name || "Not provided"}</dd>
            </div>

            <div className="min-w-0">
              <dt className={detailLabel}>Username</dt>
              <dd className={detailValue}>
                {user?.username ? `@${user.username}` : "Not provided"}
              </dd>
            </div>

            <div className="min-w-0">
              <dt className={detailLabel}>Email Address</dt>
              <dd className={detailValue}>{user?.email || "Not provided"}</dd>
            </div>
          </dl>
        </section>

        {/* About */}
        <section className={sectionCard}>
          <h2 className={sectionTitle}>About</h2>

          <dl className="mt-4 grid gap-5 sm:grid-cols-2">
            <div className="min-w-0">
              <dt className={detailLabel}>Bio</dt>
              <dd className={`${detailValue} whitespace-pre-wrap leading-6`}>
                {authState.user?.bio || "No bio added yet."}
              </dd>
            </div>

            <div className="min-w-0">
              <dt className={detailLabel}>Current Post</dt>
              <dd className={detailValue}>
                {authState.user?.currentPost || "Not specified"}
              </dd>
            </div>
          </dl>
        </section>

        {/* Education */}
        <section className={sectionCard}>
          <h2 className={sectionTitle}>Education</h2>

          {authState.user?.education?.length > 0 ? (
            <div className="ml-1.5 mt-5 border-l border-border">
              {authState.user.education.map((item, index) => (
                <div
                  className="relative pb-6 pl-6 last:pb-0"
                  key={item._id || index}
                >
                  <span
                    aria-hidden="true"
                    className="absolute -left-[5.5px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-surface"
                  />

                  <h3 className="break-words text-base font-semibold text-text">
                    {item.school ||
                      item.institution ||
                      item.college ||
                      "Institution"}
                  </h3>

                  <p className="mt-0.5 text-sm text-text">
                    {item.degree ||
                      item.qualification ||
                      "Degree not specified"}
                  </p>

                  {(item.fieldOfStudy || item.description) && (
                    <p className="mt-0.5 text-xs text-muted">
                      {item.fieldOfStudy || item.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted">
              No education details added yet.
            </p>
          )}
        </section>

        {/* Past work */}
        <section className={sectionCard}>
          <h2 className={sectionTitle}>Past Work</h2>

          {authState.user?.pastWork?.length > 0 ? (
            <div className="ml-1.5 mt-5 border-l border-border">
              {authState.user.pastWork.map((item, index) => (
                <div
                  className="relative pb-6 pl-6 last:pb-0"
                  key={item._id || index}
                >
                  <span
                    aria-hidden="true"
                    className="absolute -left-[5.5px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-surface"
                  />

                  <h3 className="break-words text-base font-semibold text-text">
                    {item.pastWork || "Organization"}
                  </h3>

                  <p className="mt-0.5 text-sm text-text">
                    {item.position || "Role not specified"}
                  </p>

                  {item.years && (
                    <p className="mt-0.5 text-xs text-muted">
                      Duration: {item.years}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted">
              No past work details added yet.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
