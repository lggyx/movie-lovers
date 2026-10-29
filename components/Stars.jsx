"use client";

export default function Stars({ value = 0, onChange, size = "text-2xl" }) {
  return (
    <div className={`flex items-center gap-0.5 ${size}`} role="radiogroup" aria-label="Your rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(n)}
          aria-label={`Rate ${n} star${n > 1 ? "s" : ""}`}
          className={[
            n <= value ? "text-amber-400" : "text-slate-600",
            onChange ? "cursor-pointer hover:scale-110" : "cursor-default",
            "transition",
          ].join(" ")}
        >
          ★
        </button>
      ))}
    </div>
  );
}
