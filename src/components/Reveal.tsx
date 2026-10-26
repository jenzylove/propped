"use client";
import { useEffect } from "react";

/** Adds `is-in` to every `.rv` element as it scrolls into view. */
export function Reveal() {
  useEffect(() => {
    const all = () => document.querySelectorAll(".rv:not(.is-in)");
    if (typeof IntersectionObserver === "undefined") {
      all().forEach((el) => el.classList.add("is-in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        }),
      { rootMargin: "0px 0px -8% 0px" },
    );
    all().forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return null;
}
