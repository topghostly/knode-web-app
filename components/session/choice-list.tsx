"use client";

/** Four plain rows with a radio. Selection is an ink border, nothing louder. */
export function ChoiceList({
  name,
  options,
  value,
  onChange,
}: {
  name: string;
  options: string[];
  value: string;
  onChange: (option: string) => void;
}) {
  return (
    <div role="radiogroup" aria-label="Options" className="flex flex-col gap-2">
      {options.map((option) => {
        const selected = option === value;
        return (
          <label
            key={option}
            className={`flex cursor-pointer items-start gap-3.5 rounded-xl border px-4 py-3.5 text-[15px] leading-relaxed transition-colors duration-150 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-brand ${
              selected ? "border-ink bg-surface text-ink" : "border-ink/12 bg-transparent text-ink/80 hover:border-ink/30"
            }`}
          >
            <input
              type="radio"
              name={name}
              value={option}
              checked={selected}
              onChange={() => onChange(option)}
              className="sr-only"
            />
            <span
              aria-hidden
              className={`mt-1.5 grid size-4 shrink-0 place-items-center rounded-full border transition-colors duration-150 ${
                selected ? "border-ink" : "border-ink/35"
              }`}
            >
              <span className={`size-2 rounded-full bg-ink transition-transform duration-150 ${selected ? "scale-100" : "scale-0"}`} />
            </span>
            <span>{option}</span>
          </label>
        );
      })}
    </div>
  );
}
