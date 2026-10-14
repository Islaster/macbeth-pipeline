import { useState } from "react";
import type { CreatedInvite } from "../../../../shared/types/user";
import { useAuth } from "../auth/hooks/useAuth";
import { InviteForm } from "./components/InviteForm";
import { InviteLinkResult } from "./components/InviteLinkResult";
import { getCreatableRoles } from "./helpers/roles";
import "./team.css";

export function TeamPage() {
  const { user } = useAuth();
  const [latestInvite, setLatestInvite] = useState<{
    invite: CreatedInvite;
    name: string;
  } | null>(null);
  const creatableRoles = user ? getCreatableRoles(user.role) : [];

  if (creatableRoles.length === 0) {
    return (
      <main className="team-page">
        <h1>Team</h1>
        <p className="team-page__intro">
          Only creative leads can create accounts.
        </p>
      </main>
    );
  }

  return (
    <main className="team-page">
      <h1>Team</h1>
      <p className="team-page__intro">
        Create an account by inviting someone. They set their own password from
        the link.
      </p>
      <InviteForm
        creatableRoles={creatableRoles}
        onInviteCreated={(invite, name) => setLatestInvite({ invite, name })}
      />
      {latestInvite && (
        <InviteLinkResult
          key={latestInvite.invite.inviteLink}
          invite={latestInvite.invite}
          name={latestInvite.name}
        />
      )}
    </main>
  );
}
