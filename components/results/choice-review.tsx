/** The four options after grading: the right one in brand, a wrong pick in coral. */
export function ChoiceReview({ options, picked, correct }: { options: string[]; picked: string; correct: string | null }) {
  return (
    <ul className="flex flex-col gap-2">
      {options.map((option) => {
        const isCorrect = option === correct;
        const isPicked = option === picked.trim();
        const tone = isCorrect
          ? "border-brand text-ink"
          : isPicked
            ? "border-accent text-ink"
            : "border-ink/10 text-ink/55";
        const label = isCorrect && isPicked ? "Your pick, correct" : isCorrect ? "Correct" : isPicked ? "Your pick" : null;
        return (
          <li key={option} className={`flex items-start justify-between gap-4 rounded-xl border px-4 py-3 text-[15px] leading-relaxed ${tone}`}>
            <span>{option}</span>
            {label && (
              <span className={`shrink-0 text-[12px] font-medium ${isCorrect ? "text-brand" : "text-accent"}`}>{label}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
