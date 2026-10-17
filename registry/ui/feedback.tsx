import { CircleCheck, CircleX, Info, LoaderCircle, TriangleAlert } from "lucide-react";
import "./feedback.css";

export type FeedbackVariant = "neutral" | "success" | "warning" | "error";

const icons = {
  neutral: Info,
  success: CircleCheck,
  warning: TriangleAlert,
  error: CircleX,
};

export function FeedbackIcon({
  variant,
  loading = false,
}: {
  variant: FeedbackVariant;
  loading?: boolean;
}) {
  const Icon = loading ? LoaderCircle : icons[variant];
  return (
    <span data-slot="feedback-icon" aria-hidden="true">
      <span data-slot="feedback-symbol" key={loading ? "loading" : variant}>
        <Icon data-slot={loading ? "loading-indicator" : undefined} />
      </span>
    </span>
  );
}
