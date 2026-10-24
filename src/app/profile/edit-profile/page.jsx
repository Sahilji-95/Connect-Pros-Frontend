"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";

import {
  getAboutUser,
  updateUserProfile,
  updateProfileData,
} from "@/config/redux/action/authAction";

import styles from "./editProfile.module.css";

const emptyEducation = () => ({
  school: "",
  degree: "",
  fieldOfStudy: "",
});

const emptyWork = () => ({
  pastWork: "",
  position: "",
  years: "",
});

export default function EditProfile() {
  const dispatch = useDispatch();
  const router = useRouter();

  const authState = useSelector((state) => state.auth);
  const profile = authState.user;
  const user = profile?.userId;

  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    bio: "",
    currentPost: "",
    education: [],
    pastWork: [],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authState.profileFetched) {
      dispatch(getAboutUser());
    }
  }, [dispatch, authState.profileFetched]);

  useEffect(() => {
    if (!profile || !user) return;

    setForm({
      name: user.name || "",
      username: user.username || "",
      email: user.email || "",
      bio: profile.bio || "",
      currentPost: profile.currentPost || "",

      education: (profile.education || []).map((item) => ({
        _id: item._id,
        school: item.school || "",
        degree: item.degree || "",
        fieldOfStudy: item.fieldOfStudy || "",
      })),

      pastWork: (profile.pastWork || []).map((item) => ({
        _id: item._id,
        pastWork: item.pastWork || "",
        position: item.position || "",
        years: item.years || "",
      })),
    });
  }, [profile, user]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleArrayChange = (section, index, field, value) => {
    setForm((previous) => ({
      ...previous,
      [section]: previous[section].map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    }));
  };

  const addEducation = () => {
    setForm((previous) => ({
      ...previous,
      education: [...previous.education, emptyEducation()],
    }));
  };

  const removeEducation = (index) => {
    setForm((previous) => ({
      ...previous,
      education: previous.education.filter(
        (_, itemIndex) => itemIndex !== index,
      ),
    }));
  };

  const addWork = () => {
    setForm((previous) => ({
      ...previous,
      pastWork: [...previous.pastWork, emptyWork()],
    }));
  };

  const removeWork = (index) => {
    setForm((previous) => ({
      ...previous,
      pastWork: previous.pastWork.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      // 1. Update User document
      await dispatch(
        updateUserProfile({
          name: form.name.trim(),
          username: form.username.trim(),
          email: form.email.trim(),
        }),
      ).unwrap();

      // 2. Update Profile document
      await dispatch(
        updateProfileData({
          bio: form.bio,
          currentPost: form.currentPost,

          education: form.education.map(({ _id, ...item }) => item),

          pastWork: form.pastWork.map(({ _id, ...item }) => item),
        }),
      ).unwrap();

      // 3. Fetch updated profile into Redux
      await dispatch(getAboutUser()).unwrap();

      router.push("/profile");
      router.refresh();
    } catch (err) {
      setError(err?.message || "Profile update failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!profile || !user) {
    return (
      <main className={styles.page}>
        <div className={styles.container}>
          <p className={styles.status}>
            {authState.isLoading
              ? "Loading profile..."
              : "Profile data is not available."}
          </p>

          <button
            type="button"
            className={styles.cancelButton}
            onClick={() => router.push("/profile")}
          >
            Back to Profile
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>ACCOUNT SETTINGS</p>
            <h1 className={styles.title}>Edit Profile</h1>
            <p className={styles.subtitle}>
              Update your personal and professional information.
            </p>
          </div>

          <button
            type="button"
            className={styles.cancelButton}
            onClick={() => router.push("/profile")}
            disabled={loading}
          >
            Cancel
          </button>
        </header>

        <form onSubmit={handleSubmit}>
          <section className={styles.card}>
            <h2 className={styles.sectionTitle}>Personal Information</h2>

            <div className={styles.grid}>
              <div className={styles.field}>
                <label htmlFor="name">Full Name</label>
                <input
                  id="name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="username">Username</label>
                <input
                  id="username"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="email">Email Address</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="currentPost">Current Position</label>
                <input
                  id="currentPost"
                  name="currentPost"
                  value={form.currentPost}
                  onChange={handleChange}
                  placeholder="e.g. Full Stack Developer"
                />
              </div>

              <div className={`${styles.field} ${styles.fullWidth}`}>
                <label htmlFor="bio">Bio</label>
                <textarea
                  id="bio"
                  name="bio"
                  rows={4}
                  value={form.bio}
                  onChange={handleChange}
                  placeholder="Write something about yourself..."
                />
              </div>
            </div>
          </section>

          <section className={styles.card}>
            <div className={styles.sectionHeader}>
              <div>
                <h2 className={styles.sectionTitle}>Education</h2>
                <p className={styles.sectionDescription}>
                  Add your school, college or degree.
                </p>
              </div>

              <button
                type="button"
                className={styles.addButton}
                onClick={addEducation}
                disabled={loading}
              >
                + Add Education
              </button>
            </div>

            {form.education.length === 0 && (
              <p className={styles.emptyState}>
                No education details added yet.
              </p>
            )}

            {form.education.map((item, index) => (
              <div
                className={styles.workCard}
                key={item._id || `education-${index}`}
              >
                <div className={styles.workHeader}>
                  <h3>Education {index + 1}</h3>

                  <button
                    type="button"
                    className={styles.removeButton}
                    onClick={() => removeEducation(index)}
                    disabled={loading}
                  >
                    Remove
                  </button>
                </div>

                <div className={styles.grid}>
                  <div className={styles.field}>
                    <label htmlFor={`school-${index}`}>School / College</label>
                    <input
                      id={`school-${index}`}
                      value={item.school}
                      onChange={(event) =>
                        handleArrayChange(
                          "education",
                          index,
                          "school",
                          event.target.value,
                        )
                      }
                      placeholder="School or college name"
                    />
                  </div>

                  <div className={styles.field}>
                    <label htmlFor={`degree-${index}`}>Degree</label>
                    <input
                      id={`degree-${index}`}
                      value={item.degree}
                      onChange={(event) =>
                        handleArrayChange(
                          "education",
                          index,
                          "degree",
                          event.target.value,
                        )
                      }
                      placeholder="e.g. BCA"
                    />
                  </div>

                  <div className={styles.field}>
                    <label htmlFor={`fieldOfStudy-${index}`}>
                      Field of Study
                    </label>
                    <input
                      id={`fieldOfStudy-${index}`}
                      value={item.fieldOfStudy}
                      onChange={(event) =>
                        handleArrayChange(
                          "education",
                          index,
                          "fieldOfStudy",
                          event.target.value,
                        )
                      }
                      placeholder="e.g. Computer Applications"
                    />
                  </div>
                </div>
              </div>
            ))}
          </section>

          <section className={styles.card}>
            <div className={styles.sectionHeader}>
              <div>
                <h2 className={styles.sectionTitle}>Past Work</h2>
                <p className={styles.sectionDescription}>
                  Add your jobs or internships.
                </p>
              </div>

              <button
                type="button"
                className={styles.addButton}
                onClick={addWork}
                disabled={loading}
              >
                + Add Experience
              </button>
            </div>

            {form.pastWork.length === 0 && (
              <p className={styles.emptyState}>No work experience added yet.</p>
            )}

            {form.pastWork.map((item, index) => (
              <div
                className={styles.workCard}
                key={item._id || `work-${index}`}
              >
                <div className={styles.workHeader}>
                  <h3>Experience {index + 1}</h3>

                  <button
                    type="button"
                    className={styles.removeButton}
                    onClick={() => removeWork(index)}
                    disabled={loading}
                  >
                    Remove
                  </button>
                </div>

                <div className={styles.grid}>
                  <div className={styles.field}>
                    <label htmlFor={`pastWork-${index}`}>
                      Company / Organization
                    </label>
                    <input
                      id={`pastWork-${index}`}
                      value={item.pastWork}
                      onChange={(event) =>
                        handleArrayChange(
                          "pastWork",
                          index,
                          "pastWork",
                          event.target.value,
                        )
                      }
                      placeholder="Company name"
                    />
                  </div>

                  <div className={styles.field}>
                    <label htmlFor={`position-${index}`}>Position</label>
                    <input
                      id={`position-${index}`}
                      value={item.position}
                      onChange={(event) =>
                        handleArrayChange(
                          "pastWork",
                          index,
                          "position",
                          event.target.value,
                        )
                      }
                      placeholder="e.g. Developer Intern"
                    />
                  </div>

                  <div className={styles.field}>
                    <label htmlFor={`years-${index}`}>Duration</label>
                    <input
                      id={`years-${index}`}
                      value={item.years}
                      onChange={(event) =>
                        handleArrayChange(
                          "pastWork",
                          index,
                          "years",
                          event.target.value,
                        )
                      }
                      placeholder="e.g. 2025 - 2026"
                    />
                  </div>
                </div>
              </div>
            ))}
          </section>

          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}

          <div className={styles.formActions}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={() => router.push("/profile")}
              disabled={loading}
            >
              Cancel
            </button>

            <button
              type="submit"
              className={styles.saveButton}
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
