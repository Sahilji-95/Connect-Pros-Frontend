"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { LoaderCircle, Plus, Trash2 } from "lucide-react";

import {
  getAboutUser,
  updateUserProfile,
  updateProfileData,
} from "@/config/redux/action/authAction";

// Shared style tokens
const sectionCard = "rounded-card border border-border bg-surface p-5 sm:p-6";

const sectionTitle = "font-serif text-xl font-bold text-text";

const labelClass = "mb-1.5 block text-xs font-semibold text-text";

const inputClass =
  "h-11 w-full rounded-control border border-border bg-app px-3.5 text-sm text-text outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/25 disabled:cursor-not-allowed disabled:opacity-50";

const textareaClass =
  "w-full resize-y rounded-control border border-border bg-app px-3.5 py-3 text-sm leading-6 text-text outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/25 disabled:cursor-not-allowed disabled:opacity-50";

const outlineButton =
  "inline-flex h-10 items-center justify-center gap-2 rounded-control border border-border bg-surface px-4 text-sm font-semibold text-text transition hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50";

const primaryButton =
  "inline-flex h-10 items-center justify-center gap-2 rounded-control bg-primary px-5 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60 dark:text-[#12141A]";

const removeButton =
  "inline-flex h-8 items-center gap-1.5 rounded-lg border border-danger/30 bg-surface px-3 text-xs font-semibold text-danger transition hover:bg-danger/5 disabled:cursor-not-allowed disabled:opacity-50";

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
      <main className="flex min-h-screen items-center justify-center bg-app px-4 text-text">
        <div className="flex flex-col items-center gap-4 text-center">
          {authState.isLoading && (
            <LoaderCircle size={24} className="animate-spin text-primary" />
          )}

          <p className="text-sm text-muted">
            {authState.isLoading
              ? "Loading profile..."
              : "Profile data is not available."}
          </p>

          <button
            type="button"
            className={outlineButton}
            onClick={() => router.push("/profile")}
          >
            Back to Profile
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-app text-text">
      <div className="mx-auto w-full max-w-[920px] px-4 py-8 sm:px-6 sm:py-12">
        <header className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl font-bold tracking-tight text-text sm:text-3xl">
              Edit Profile
            </h1>

            <p className="mt-1 text-sm text-muted">
              Update your personal and professional information.
            </p>
          </div>

          <button
            type="button"
            className={`${outlineButton} shrink-0`}
            onClick={() => router.push("/profile")}
            disabled={loading}
          >
            Cancel
          </button>
        </header>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Personal information */}
          <section className={sectionCard}>
            <h2 className={sectionTitle}>Personal Information</h2>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className={labelClass}>
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label htmlFor="username" className={labelClass}>
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className={labelClass}>
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label htmlFor="currentPost" className={labelClass}>
                  Current Position
                </label>
                <input
                  id="currentPost"
                  name="currentPost"
                  value={form.currentPost}
                  onChange={handleChange}
                  placeholder="e.g. Full Stack Developer"
                  className={inputClass}
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="bio" className={labelClass}>
                  Bio
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  rows={4}
                  value={form.bio}
                  onChange={handleChange}
                  placeholder="Write something about yourself..."
                  className={textareaClass}
                />
              </div>
            </div>
          </section>

          {/* Education */}
          <section className={sectionCard}>
            <div className="flex items-center justify-between gap-4">
              <h2 className={sectionTitle}>Education</h2>

              <button
                type="button"
                className={outlineButton}
                onClick={addEducation}
                disabled={loading}
              >
                <Plus size={16} />
                Add Education
              </button>
            </div>

            {form.education.length === 0 && (
              <p className="mt-4 text-sm text-muted">
                No education details added yet.
              </p>
            )}

            <div className="mt-4 flex flex-col gap-4">
              {form.education.map((item, index) => (
                <div
                  className="rounded-control border border-border bg-app p-4"
                  key={item._id || `education-${index}`}
                >
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold text-text">
                      Education {index + 1}
                    </h3>

                    <button
                      type="button"
                      className={removeButton}
                      onClick={() => removeEducation(index)}
                      disabled={loading}
                    >
                      <Trash2 size={13} />
                      Remove
                    </button>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor={`school-${index}`} className={labelClass}>
                        School / College
                      </label>
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
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label htmlFor={`degree-${index}`} className={labelClass}>
                        Degree
                      </label>
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
                        className={inputClass}
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label
                        htmlFor={`fieldOfStudy-${index}`}
                        className={labelClass}
                      >
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
                        className={inputClass}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Past work */}
          <section className={sectionCard}>
            <div className="flex items-center justify-between gap-4">
              <h2 className={sectionTitle}>Past Work</h2>

              <button
                type="button"
                className={outlineButton}
                onClick={addWork}
                disabled={loading}
              >
                <Plus size={16} />
                Add Experience
              </button>
            </div>

            {form.pastWork.length === 0 && (
              <p className="mt-4 text-sm text-muted">
                No work experience added yet.
              </p>
            )}

            <div className="mt-4 flex flex-col gap-4">
              {form.pastWork.map((item, index) => (
                <div
                  className="rounded-control border border-border bg-app p-4"
                  key={item._id || `work-${index}`}
                >
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold text-text">
                      Experience {index + 1}
                    </h3>

                    <button
                      type="button"
                      className={removeButton}
                      onClick={() => removeWork(index)}
                      disabled={loading}
                    >
                      <Trash2 size={13} />
                      Remove
                    </button>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor={`pastWork-${index}`}
                        className={labelClass}
                      >
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
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label
                        htmlFor={`position-${index}`}
                        className={labelClass}
                      >
                        Position
                      </label>
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
                        className={inputClass}
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label htmlFor={`years-${index}`} className={labelClass}>
                        Duration
                      </label>
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
                        className={inputClass}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {error && (
            <p
              className="rounded-control border border-danger/30 bg-danger/5 px-3.5 py-2.5 text-xs leading-5 text-danger"
              role="alert"
            >
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              className={outlineButton}
              onClick={() => router.push("/profile")}
              disabled={loading}
            >
              Cancel
            </button>

            <button type="submit" className={primaryButton} disabled={loading}>
              {loading && <LoaderCircle size={15} className="animate-spin" />}
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
