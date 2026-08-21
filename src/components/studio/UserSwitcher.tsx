import { ChevronsUpDown, FlaskConical, ShieldCheck } from "lucide-react";
import { useAuthorization } from "@/auth/AuthorizationContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PERMISSION_LABELS } from "@/domain/permissions";

/**
 * Prototype-only control. Switching identity changes the effective permissions
 * that every authorization check in the app consumes.
 */
export function UserSwitcher() {
  const { user, isLoading, simulation, isGuideAdmin } = useAuthorization();

  if (isLoading || !user) {
    return <span className="text-xs text-muted-foreground">Loading access…</span>;
  }

  const initials = user.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-9 gap-2 px-2">
          <span className="flex size-7 items-center justify-center rounded-full bg-primary text-[0.6875rem] font-semibold text-primary-foreground">
            {initials}
          </span>
          <span className="hidden text-left leading-tight sm:block">
            <span className="block text-xs font-medium text-foreground">{user.name}</span>
            <span className="block text-[0.6875rem] text-muted-foreground">
              {user.baseRole} · {user.permissionProfileLabel}
            </span>
          </span>
          <ChevronsUpDown className="size-3.5 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center gap-1.5 text-[0.6875rem] font-medium uppercase tracking-wide text-muted-foreground">
          <FlaskConical className="size-3.5" /> Prototype permission switcher
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <div className="px-2 py-1.5 text-xs">
          <p className="font-medium">{user.name}</p>
          <p className="text-muted-foreground">Base Role: {user.baseRole}</p>
          <p className="text-muted-foreground">
            Permission Profile: {user.permissionProfileLabel}
          </p>
          <ul className="mt-1.5 space-y-0.5">
            {isGuideAdmin() ? (
              <li className="flex items-center gap-1.5 text-foreground">
                <ShieldCheck className="size-3.5" /> guide.admin — all actions authorized
              </li>
            ) : (
              user.effectivePermissions.map((permission) => (
                <li key={permission} className="font-mono text-[0.6875rem] text-muted-foreground">
                  {permission}{" "}
                  <span className="font-sans">· {PERMISSION_LABELS[permission]}</span>
                </li>
              ))
            )}
          </ul>
        </div>

        {simulation.supported ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-[0.6875rem] uppercase tracking-wide text-muted-foreground">
              Simulate effective permissions
            </DropdownMenuLabel>
            {simulation.users.map((candidate) => (
              <DropdownMenuItem
                key={candidate.id}
                onSelect={() => simulation.switchUser(candidate.id)}
                className="flex flex-col items-start gap-0.5"
              >
                <span className="text-xs font-medium">
                  {candidate.name}
                  {candidate.id === user.id ? " · active" : ""}
                </span>
                <span className="text-[0.6875rem] text-muted-foreground">
                  Base Role: {candidate.baseRole} · {candidate.permissionProfileLabel}
                </span>
              </DropdownMenuItem>
            ))}
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
