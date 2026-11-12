"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import UserLayOut from "@/layout/UserLayout/Index";
import { getAboutUser } from "@/config/redux/action/authAction";
import { ArrowRight, LoaderCircle } from "lucide-react";

export default function Index() {
  const router = useRouter();
  const dispatch = useDispatch();

  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let active = true;

    const checkSession = async () => {
      try {
        // Backend existing HttpOnly cookie se user verify karega
        await dispatch(getAboutUser()).unwrap();

        if (active) {
          router.replace("/dashboard");
        }
      } catch (error) {
        // Session invalid hai ya user logged in nahi hai
        if (active) {
          setCheckingSession(false);
        }
      }
    };

    checkSession();

    return () => {
      active = false;
    };
  }, [dispatch, router]);

  if (checkingSession) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex min-h-screen flex-col items-center justify-center gap-3 bg-app text-text"
      >
        <LoaderCircle size={24} className="animate-spin text-primary" />
        <p className="text-sm text-muted">Checking your session...</p>
      </div>
    );
  }

  return (
    <UserLayOut>
      <div className="min-h-[calc(100vh-76px)] bg-app text-text">
        <div className="mx-auto grid w-full max-w-[1200px] items-center gap-12 px-4 py-14 sm:px-6 lg:min-h-[calc(100vh-76px)] lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:px-8 lg:py-20">
          {/* Left: message */}
          <div className="max-w-xl">
            <h1 className="font-serif text-4xl font-bold leading-[1.1] tracking-tight text-text sm:text-5xl lg:text-6xl">
              Connect with friends.{" "}
              <span className="text-primary">Stay real.</span>
            </h1>

            <p className="mt-6 text-base leading-7 text-muted sm:text-lg sm:leading-8">
              A true social media platform where stories are real, connections
              are meaningful, and there is no bluff.
            </p>

            <div className="mt-9">
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="group inline-flex h-12 items-center gap-2 rounded-control bg-primary px-7 text-sm font-semibold text-white transition hover:bg-primary-hover dark:text-[#12141A]"
              >
                Join
                <ArrowRight
                  size={17}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </button>
            </div>
          </div>

          {/* Right: image */}
          <div className="relative mx-auto w-full max-w-[520px] lg:max-w-none">
            {/* Offset backdrop for depth */}
            <div
              aria-hidden="true"
              className="absolute -bottom-4 -right-4 h-full w-full rounded-panel bg-accent-soft"
            />

            <div className="relative overflow-hidden rounded-panel border border-border bg-surface shadow-md">
              <img
                src="/images/mainImage.png"
                alt=""
                className="h-auto w-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </UserLayOut>
  );
}
