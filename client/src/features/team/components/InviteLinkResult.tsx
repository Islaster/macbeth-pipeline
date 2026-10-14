import { useState } from "react";
import type { CreatedInvite } from "../../../../../shared/types/user";

interface InviteLinkResultProps {
  invite: CreatedInvite;
  name: string;
}

export function InviteLinkResult({ invite, name }: InviteLinkResultProps) {
  const [isCopied, setIsCopied] = useState(false);

  async function copyLink() {
    await navigator.clipboard.writeText(invite.inviteLink);
    setIsCopied(true);
  }

  return (
    <section className="invite-result">
      <strong>Invite ready for {name}</strong>
      <code className="invite-result__link">{invite.inviteLink}</code>
      <button
        type="button"
        className="primary-button"
        onClick={() => void copyLink()}
      >
        {isCopied ? "Copied" : "Copy link"}
      </button>
      <p className="invite-result__note">
        Send this link to {name}. It works once and expires on{" "}
        {new Date(invite.expiresAt).toLocaleDateString()}. It won't be shown
        again.
      </p>
    </section>
  );
}
