"use client";

import { useEffect, useRef } from "react";
import { Toaster, toast as sonnerToast } from "sonner";
import { gsap } from "gsap";

const CustomToastContent = ({ message, type = "info" }: { message: string; type?: "success" | "error" | "info" }) => {
  const toastRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLImageElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!toastRef.current) return;

    gsap.fromTo(toastRef.current, { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 0.4, ease: "back.out" });

    const tl = gsap.timeline();
    tl.to({}, { duration: 4 })
      .to(textRef.current, { opacity: 0, filter: "blur(10px)", duration: 0.5 }, "-=0.3")
      .to(logoRef.current, { scale: 2, rotation: 720, opacity: 0, filter: "blur(15px)", duration: 0.6 }, "-=0.4")
      .to(toastRef.current, { y: 100, opacity: 0, duration: 0.4, ease: "power2.in" }, "-=0.3");
  }, []);

  const bgColor =
    type === "error" ? "bg-red-600/10 border-red-500/20" :
    type === "success" ? "bg-green-600/10 border-green-500/20" :
    type === "info" ? "bg-blue-600/10 border-blue-500/20" :
    "bg-white/5 border-white/10";

  const textColor =
    type === "error" ? "text-red-400" :
    type === "success" ? "text-green-400" :
    type === "info" ? "text-blue-400" :
    "text-white";

  return (
    <div ref={toastRef} className={`flex items-center justify-between gap-4 ${bgColor} border rounded-2xl p-4 backdrop-blur-sm min-w-[300px]`}>
      <div ref={textRef} className="flex-1">
        <p className={`font-bold italic tracking-widest text-sm ${textColor}`}>{message}</p>
      </div>
      <img ref={logoRef} src="/logo2.png" alt="logo" className="w-12 h-12 object-contain flex-shrink-0" />
    </div>
  );
};

export const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
  sonnerToast.custom(() => <CustomToastContent message={message} type={type} />, {
    duration: 5000,
    position: "bottom-right",
  });
};

const ToastProvider = () => <Toaster richColors position="bottom-right" theme="dark" />;

export default ToastProvider;