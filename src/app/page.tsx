"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import HomeHeader from "@/components/home/HomeHeader";
import HeroSection from "@/components/home/HeroSection";
import AboutSection from "@/components/home/AboutSection";
import RecommendSection from "@/components/home/RecommendSection";
import SearchSection from "@/components/home/SearchSection";
import ContactSection from "@/components/home/ContactSection";

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeSection, setActiveSection] = useState("hero");

  useEffect(() => {
    if (containerRef.current) containerRef.current.scrollTop = 0;
    // Back navigation: popstate fires when browser back/forward is used.
    // If the destination is home (/), force a full reload.
    const handlePopState = () => {
      if (window.location.pathname === "/") {
        window.location.reload();
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    const sections = ["hero", "about", "recommend", "search", "contact"];
    const observers: IntersectionObserver[] = [];
    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([e]) => { if (e.isIntersecting) setActiveSection(id); },
        { root: containerRef.current, threshold: 0.5 }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  const scrollTo = useCallback((id: string) => {
    const el = document.getElementById(id);
    const container = containerRef.current;
    if (!el || !container) return;
    container.scrollTo({ top: el.offsetTop, behavior: "smooth" });
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        height: "100vh",
        overflowY: "scroll",
        scrollSnapType: "y mandatory",
        background: "var(--bg)",
      }}
    >
      {/* Background glow */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
        }}
      >
        {/* Top center — main purple glow */}
        <div style={{
          position: "absolute",
          width: 900,
          height: 700,
          borderRadius: "50%",
          filter: "blur(120px)",
          background: "rgba(124,106,247,0.22)",
          top: "-10%",
          left: "50%",
          transform: "translateX(-50%)",
        }} />
        {/* Bottom right — cyan glow */}
        <div style={{
          position: "absolute",
          width: 600,
          height: 600,
          borderRadius: "50%",
          filter: "blur(100px)",
          background: "rgba(79,195,247,0.13)",
          bottom: "-5%",
          right: "-5%",
        }} />
        {/* Bottom left — deep purple */}
        <div style={{
          position: "absolute",
          width: 500,
          height: 500,
          borderRadius: "50%",
          filter: "blur(120px)",
          background: "rgba(167,139,250,0.1)",
          bottom: "20%",
          left: "-5%",
        }} />
        {/* Subtle grid overlay */}
        <div style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "linear-gradient(rgba(124,106,247,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(124,106,247,0.04) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }} />
      </div>

      <HomeHeader scrollTo={scrollTo} activeSection={activeSection} />
      <HeroSection />
      <AboutSection />
      <RecommendSection scrollTo={scrollTo} />
      <SearchSection />
      <ContactSection />
    </div>
  );
}
