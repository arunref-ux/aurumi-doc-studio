import type { ReactNode } from "react";
import { useAuthorization } from "@/auth/AuthorizationContext";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { GUIDE_ACTIONS, PERMISSION_LABELS, type GuideActionKey } from "@/domain/permissions";
import { cn } from "@/lib/utils";

/**
 * Renders children only when the current user is authorized for the action.
 * Components must never compute authorization themselves.
 */
export function PermissionGate({
  action,
  mode = "hide",
  children,
}: {
  action: GuideActionKey;
  /** hide = render nothing; disable = render children in a disabled wrapper. */
  mode?: "hide" | "disable";
  children: ReactNode;
}) {
  const { canRunAction } = useAuthorization();
  const allowed = canRunAction(action);

  if (allowed) return <>{children}</>;
  if (mode === "hide") return null;

  return (
    <span
      aria-disabled
      title={`Requires ${GUIDE_ACTIONS[action].requires.map((p) => PERMISSION_LABELS[p]).join(" or ")}`}
      className="pointer-events-none opacity-40"
    >
      {children}
    </span>
  );
}

/**
 * Permission-aware action button. Build-2 actions stay disabled placeholders,
 * but their permission requirement is enforced from the action definition.
 */
export function ActionButton({
  action,
  className,
  icon,
  onClick,
  variant = "outline",
  size = "sm",
}: {
  action: GuideActionKey;
  className?: string;
  icon?: ReactNode;
  onClick?: () => void;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "sm" | "default";
}) {
  const definition = GUIDE_ACTIONS[action];
  const pending = definition.availableInBuild > 1;
  const requirement = definition.requires.map((p) => `${p}`).join(" or ");

  return (
    <PermissionGate action={action}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={variant}
            size={size}
            disabled={pending || !onClick}
            onClick={onClick}
            className={cn(className)}
          >
            {icon}
            {definition.label}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-mono text-[0.6875rem]">{requirement}</p>
          {pending ? <p className="text-[0.6875rem]">Workflow arrives in Build 2</p> : null}
        </TooltipContent>
      </Tooltip>
    </PermissionGate>
  );
}
