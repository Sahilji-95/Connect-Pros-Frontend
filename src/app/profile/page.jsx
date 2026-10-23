"use client";

import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import NavBar from "@/component/NavBar";

import {
  getAboutUser,
  uploadProfilePicture,
} from "@/config/redux/action/authAction";

import styles from "./profile.module.css";

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
      <main className={styles.page}>
        <p className={styles.status}>Loading your profile...</p>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <NavBar />
      <div className={styles.container}>
        <header className={styles.pageHeader}>
          <div>
            <p className={styles.eyebrow}>ACCOUNT</p>
            <h1 className={styles.pageTitle}>My Profile</h1>
            <p className={styles.pageDescription}>
              Manage your personal information and profile picture.
            </p>
          </div>

          <div
            className={styles.editButton}
            onClick={() => {
              router.push("/profile/edit-profile");
            }}
          >
            Edit Profile
          </div>
        </header>

        <section className={styles.profileCard}>
          <div className={styles.profileHeader}>
            <div className={styles.avatarSection}>
              <img
                src={preview || user?.profilePicture || "/default.png"}
                alt="Profile"
                className={styles.avatar}
              />

              <div className={styles.avatarInfo}>
                <h2 className={styles.name}>{user?.name || "Your Name"}</h2>
                <p className={styles.username}>
                  @{user?.username || "username"}
                </p>
              </div>
            </div>

            <span className={styles.profileBadge}>My Account</span>
          </div>

          <div className={styles.uploadSection}>
            <label htmlFor="profilePicture" className={styles.fileLabel}>
              Choose a new profile picture
            </label>

            <input
              id="profilePicture"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className={styles.fileInput}
            />

            <p className={styles.helperText}>
              JPG, PNG or other supported image formats. Maximum 5 MB.
            </p>

            {selectedFile && (
              <button
                type="button"
                onClick={handleUpload}
                disabled={uploading}
                className={styles.primaryButton}
              >
                {uploading ? "Uploading..." : "Save Picture"}
              </button>
            )}

            {error && <p className={styles.error}>{error}</p>}

            {authState.isError && authState.message && (
              <p className={styles.error}>
                {typeof authState.message === "string"
                  ? authState.message
                  : authState.message?.message}
              </p>
            )}
          </div>
        </section>

        <section className={styles.detailsCard}>
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}>Personal Information</h2>
              <p className={styles.sectionDescription}>
                Your basic account details.
              </p>
            </div>
          </div>

          <div className={styles.detailsGrid}>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Full Name</span>
              <p className={styles.detailValue}>
                {user?.name || "Not provided"}
              </p>
            </div>

            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Username</span>
              <p className={styles.detailValue}>
                {user?.username ? `@${user.username}` : "Not provided"}
              </p>
            </div>

            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Email Address</span>
              <p className={styles.detailValue}>
                {user?.email || "Not provided"}
              </p>
            </div>
          </div>
        </section>

        <section className={styles.detailsCard}>
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}>About</h2>
              <p className={styles.sectionDescription}>
                A little more about you.
              </p>
            </div>
          </div>

          <div className={styles.aboutGrid}>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Bio</span>
              <p className={styles.detailValue}>
                {authState.user?.bio || "No bio added yet."}
              </p>
            </div>

            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Current Post</span>
              <p className={styles.detailValue}>
                {authState.user?.currentPost || "Not specified"}
              </p>
            </div>
          </div>
        </section>

        <section className={styles.detailsCard}>
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}>Education</h2>
              <p className={styles.sectionDescription}>
                Your educational background.
              </p>
            </div>
          </div>

          {authState.user?.education?.length > 0 ? (
            <div className={styles.timeline}>
              {authState.user.education.map((item, index) => (
                <div className={styles.timelineItem} key={item._id || index}>
                  <div className={styles.timelineDot} />

                  <div className={styles.timelineContent}>
                    <h3 className={styles.itemTitle}>
                      College / School -{" "}
                      {item.school ||
                        item.institution ||
                        item.college ||
                        "Institution"}
                    </h3>

                    <p className={styles.detailValue}>
                      Degree -{" "}
                      {item.degree ||
                        item.qualification ||
                        "Degree not specified"}
                    </p>

                    {(item.fieldOfStudy || item.description) && (
                      <p className={styles.itemDescription}>
                        Streame - {item.fieldOfStudy || item.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.emptyState}>No education details added yet.</p>
          )}
        </section>

        <section className={styles.detailsCard}>
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}>Past Work</h2>
              <p className={styles.sectionDescription}>
                Your professional experience.
              </p>
            </div>
          </div>

          {authState.user?.pastWork?.length > 0 ? (
            <div className={styles.timeline}>
              {authState.user.pastWork.map((item, index) => (
                <div className={styles.timelineItem} key={item._id || index}>
                  <div className={styles.timelineDot} />

                  <div className={styles.timelineContent}>
                    <h3 className={styles.itemTitle}>
                      Organization - {item.pastWork || "Organization"}
                    </h3>
                    <p className={styles.detailValue}>
                      Position - {item.position || "Role not specified"}
                    </p>
                    Duration -{" "}
                    {item.years && (
                      <span className={styles.itemDate}>{item.years}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.emptyState}>No past work details added yet.</p>
          )}
        </section>
      </div>
    </main>
  );
}
