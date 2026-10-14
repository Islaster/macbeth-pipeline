import { useState } from "react";
import type { CreatedInvite, UserRole } from "../../../../../shared/types/user";
import { createInvite } from "../../auth/api/authApi";
import { roleLabels } from "../helpers/roles";

interface InviteFormProps {
  creatableRoles: UserRole[];
  onInviteCreated: (invite: CreatedInvite, name: string) => void;
}

export function InviteForm({
  creatableRoles,
  onInviteCreated,
}: InviteFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("artist"); // everyone who can invite can invite artists
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit() {
    setError(null);
    setIsSubmitting(true);
    try {
      const invite = await createInvite({ name, email, role });
      onInviteCreated(invite, name);
      setName("");
      setEmail("");
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not create the invite."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      className="invite-form"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <label className="form-field">
        Name
        <input
          className="text-input"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </label>
      <label className="form-field">
        Email
        <input
          className="text-input"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </label>
      <label className="form-field">
        Role
        <select
          className="text-input"
          value={role}
          onChange={(event) => setRole(event.target.value as UserRole)}
        >
          {creatableRoles.map((option) => (
            <option key={option} value={option}>
              {roleLabels[option]}
            </option>
          ))}
        </select>
      </label>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <button type="submit" className="primary-button" disabled={isSubmitting}>
        {isSubmitting ? "Creating invite…" : "Create invite"}
      </button>
    </form>
  );
}
