import type { Choice } from "@/types/paragraph";

interface ChoiceButtonProps {
  choice: Choice;
  disabled?: boolean;
  onChoose: (choiceId: string) => void;
}

export default function ChoiceButton({ choice, disabled = false, onChoose }: ChoiceButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChoose(choice.id)}
      className="choice-row disabled:cursor-not-allowed disabled:opacity-45"
    >
      {choice.label}
    </button>
  );
}
