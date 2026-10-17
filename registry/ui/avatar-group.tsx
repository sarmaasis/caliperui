import { Avatar } from "./avatar";
import { cn } from "./lib/cn";
import "./avatar-group.css";

export type AvatarGroupMember = {
  name: string;
  src?: string;
  status?: "online" | "offline";
};

export function AvatarGroup({
  members,
  max = 4,
  label = "Team members",
  className,
}: {
  members: readonly AvatarGroupMember[];
  max?: number;
  label?: string;
  className?: string;
}) {
  const shown = members.slice(0, Math.max(1, max));
  const extra = Math.max(0, members.length - shown.length);
  return (
    <div role="group" aria-label={label} data-slot="avatar-group" className={cn("inline-flex items-center", className)}>
      {shown.map((member) => (
        <span key={member.name} data-slot="avatar-group-item" className="relative">
          <Avatar name={member.name} src={member.src} className="ring-2 ring-background" />
          {member.status === "online" && (
            <span aria-hidden="true" data-slot="avatar-status" className="absolute right-0 bottom-0 size-2 rounded-full bg-success ring-2 ring-background" />
          )}
        </span>
      ))}
      {extra > 0 && (
        <span role="img" aria-label={`${extra} more`} data-slot="avatar-overflow" className="relative z-10 -ms-2 inline-flex size-8 items-center justify-center rounded-surface bg-muted text-xs font-medium ring-2 ring-background">
          +{extra}
        </span>
      )}
    </div>
  );
}
