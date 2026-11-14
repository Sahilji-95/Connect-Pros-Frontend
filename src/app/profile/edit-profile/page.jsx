"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { LoaderCircle, Plus, Trash2 } from "lucide-react";

import {
  getAboutUser,
  updateProfileData,
} from "@/config/redux/action/authAction";

// Shared responsive styles
const sectionCard =
  "min-w-0 rounded-card border border-border bg-surface p-4 sm:p-5 lg:p-6";

const sectionTitle = "font-serif text-lg font-bold text-text sm:text-xl";

const labelClass = "mb-1.5 block text-xs font-semibold text-text sm:text-sm";

const inputClass =
  "h-11 min-w-0 w-full rounded-control border border-border bg-app px-3 text-sm text-text outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/25 disabled:cursor-not-allowed disabled:opacity-50 sm:px-3.5";

const textareaClass =
  "min-h-[110px] min-w-0 w-full resize-y rounded-control border border-border bg-app px-3 py-3 text-sm leading-6 text-text outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/25 disabled:cursor-not-allowed disabled:opacity-50 sm:px-3.5";

const outlineButton =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-control border border-border bg-surface px-3 py-2 text-xs font-semibold text-text transition hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50 sm:px-4 sm:text-sm";

const primaryButton =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-control bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60 dark:text-[#12141A] sm:px-5";

const removeButton =
  "inline-flex min-h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-danger/30 bg-surface px-2.5 py-1.5 text-xs font-semibold text-danger transition hover:bg-danger/5 disabled:cursor-not-allowed disabled:opacity-50 sm:px-3";

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
      // Update Profile document only.
      await dispatch(
        updateProfileData({
          bio: form.bio,
          currentPost: form.currentPost,

          education: form.education.map(({ _id, ...item }) => item),

          pastWork: form.pastWork.map(({ _id, ...item }) => item),
        }),
      ).unwrap();

      // Fetch updated profile into Redux.
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
      <main className="flex min-h-screen items-center justify-center bg-app px-3 text-text sm:px-4">
        <div className="flex w-full max-w-sm flex-col items-center gap-4 text-center">
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
    <main className="min-h-screen w-full overflow-x-hidden bg-app text-text">
      <div className="mx-auto w-full max-w-[1100px] px-3 py-6 min-[375px]:px-4 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        {/* Header */}
        <header className="mb-6 flex flex-col gap-4 min-[480px]:flex-row min-[480px]:items-center min-[480px]:justify-between sm:mb-8">
          <div className="min-w-0">
            <h1 className="font-serif text-2xl font-bold tracking-tight text-text sm:text-3xl lg:text-4xl">
              Edit Profile
            </h1>

            <p className="mt-1.5 max-w-xl text-xs leading-5 text-muted sm:text-sm">
              Update your personal and professional information.
            </p>
          </div>

          <button
            type="button"
            className={`${outlineButton} w-full min-[480px]:w-auto min-[480px]:shrink-0`}
            onClick={() => router.push("/profile")}
            disabled={loading}
          >
            Cancel
          </button>
        </header>

        <form
          onSubmit={handleSubmit}
          className="flex min-w-0 flex-col gap-4 sm:gap-5"
        >
          {/* Personal information */}
          <section className={sectionCard}>
            <h2 className={sectionTitle}>Personal Information</h2>

            <div className="mt-5 grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
              <div className="min-w-0">
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

              <div className="min-w-0">
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

              <div className="min-w-0 sm:col-span-2">
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
            <div className="flex flex-col gap-3 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
              <h2 className={sectionTitle}>Education</h2>

              <button
                type="button"
                className={`${outlineButton} w-full min-[420px]:w-auto`}
                onClick={addEducation}
                disabled={loading}
              >
                <Plus size={16} />
                Add Education
              </button>
            </div>

            {form.education.length === 0 && (
              <p className="mt-4 text-xs leading-5 text-muted sm:text-sm">
                No education details added yet.
              </p>
            )}

            <div className="mt-4 flex min-w-0 flex-col gap-4">
              {form.education.map((item, index) => (
                <div
                  className="min-w-0 rounded-control border border-border bg-app p-3 sm:p-4"
                  key={item._id || `education-${index}`}
                >
                  <div className="mb-4 flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-text sm:text-base">
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

                  <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="min-w-0">
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

                    <div className="min-w-0">
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

                    <div className="min-w-0 sm:col-span-2">
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
            <div className="flex flex-col gap-3 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
              <h2 className={sectionTitle}>Past Work</h2>

              <button
                type="button"
                className={`${outlineButton} w-full min-[420px]:w-auto`}
                onClick={addWork}
                disabled={loading}
              >
                <Plus size={16} />
                Add Experience
              </button>
            </div>

            {form.pastWork.length === 0 && (
              <p className="mt-4 text-xs leading-5 text-muted sm:text-sm">
                No work experience added yet.
              </p>
            )}

            <div className="mt-4 flex min-w-0 flex-col gap-4">
              {form.pastWork.map((item, index) => (
                <div
                  className="min-w-0 rounded-control border border-border bg-app p-3 sm:p-4"
                  key={item._id || `work-${index}`}
                >
                  <div className="mb-4 flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-text sm:text-base">
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

                  <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="min-w-0">
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

                    <div className="min-w-0">
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

                    <div className="min-w-0 sm:col-span-2">
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

          {/* Error message */}
          {error && (
            <p
              className="break-words rounded-control border border-danger/30 bg-danger/5 px-3.5 py-3 text-xs leading-5 text-danger sm:text-sm"
              role="alert"
            >
              {error}
            </p>
          )}

          {/* Form actions */}
          <div className="flex flex-col-reverse gap-3 pb-4 sm:flex-row sm:items-center sm:justify-end">
            <button
              type="button"
              className={`${outlineButton} w-full sm:w-auto`}
              onClick={() => router.push("/profile")}
              disabled={loading}
            >
              Cancel
            </button>

            <button
              type="submit"
              className={`${primaryButton} w-full sm:w-auto`}
              disabled={loading}
            >
              {loading && <LoaderCircle size={15} className="animate-spin" />}

              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
