import { Link } from "react-router-dom";

export const Logo = ({
  size = "md",
  theme = "auto",
  withTagline = false,
  linkToHome = true,
  className = ""
}) => {
  const iconSize =
    size === "sm"
      ? "w-7 h-7"
      : size === "lg"
      ? "w-12 h-12"
      : size === "xl"
      ? "w-16 h-16"
      : "w-9 h-9";

  const textClass =
    size === "sm"
      ? "text-lg"
      : size === "lg"
      ? "text-3xl"
      : size === "xl"
      ? "text-4xl"
      : "text-xl";

  const isDark = theme === "dark";

  const content = (
    <div className={`flex items-center gap-2.5 group ${className}`}>
      {/* 4-Pointed Glowing Cyan & Blue Crystal Star Emblem */}
      <div className={`relative ${iconSize} flex-shrink-0 transition-transform duration-300 group-hover:scale-105`}>
        <img
          src="/logo.png"
          alt="SYNORA Brand Emblem"
          className="w-full h-full object-contain rounded-xl drop-shadow-[0_0_12px_rgba(6,182,212,0.65)]"
        />
      </div>

      <div className="flex flex-col leading-tight">
        <div className="flex items-center gap-1.5">
          <span
            className={`font-black tracking-tight ${textClass} ${
              isDark ? "text-white" : "text-slate-900"
            }`}
          >
            SYN
            <span className={isDark ? "text-cyan-400" : "text-cyan-600"}>
              ORA
            </span>
          </span>
          <span
            className={`text-[10px] uppercase font-extrabold tracking-wider px-1.5 py-0.5 rounded border transition-colors ${
              isDark
                ? "bg-cyan-500/20 text-cyan-300 border-cyan-400/40"
                : "bg-blue-100/90 text-blue-800 border-blue-200"
            }`}
          >
            AICTE
          </span>
        </div>
        {withTagline && (
          <span
            className={`text-xs font-medium tracking-tight mt-0.5 ${
              isDark ? "text-slate-300" : "text-slate-500"
            }`}
          >
            Intelligent Oversight. Transparent Resolution.
          </span>
        )}
      </div>
    </div>
  );

  if (linkToHome) {
    return (
      <Link to="/" className="inline-block focus:outline-none">
        {content}
      </Link>
    );
  }

  return content;
};
