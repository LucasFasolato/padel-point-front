'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { PublicTopBar } from '@/app/components/public/public-topbar';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { useCreateMiniLeague } from '@/hooks/use-leagues';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_INVITES = 10;

function parseEmailTokens(raw: string): string[] {
  return raw
    .split(/[\s,;]+/)
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function getNameError(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return 'League name is required';
  if (trimmed.length < 3) return 'Use at least 3 characters';
  return '';
}

export default function NewMiniLeaguePage() {
  const router = useRouter();
  const { mutateAsync, isPending } = useCreateMiniLeague();

  const [name, setName] = useState('');
  const [nameTouched, setNameTouched] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [emails, setEmails] = useState<string[]>([]);
  const [emailError, setEmailError] = useState('');

  const nameError = nameTouched ? getNameError(name) : '';

  const addEmailsFromInput = (raw: string) => {
    const tokens = parseEmailTokens(raw);
    if (tokens.length === 0) return;

    const seen = new Set(emails);
    const next = [...emails];
    let invalidCount = 0;
    let skippedCount = 0;

    for (const token of tokens) {
      if (!EMAIL_RE.test(token)) {
        invalidCount += 1;
        continue;
      }
      if (seen.has(token) || next.length >= MAX_INVITES) {
        skippedCount += 1;
        continue;
      }

      seen.add(token);
      next.push(token);
    }

    setEmails(next);
    setEmailInput('');

    if (invalidCount > 0 || skippedCount > 0) {
      setEmailError('Some emails were skipped (invalid, duplicate, or over limit).');
      return;
    }

    setEmailError('');
  };

  const removeEmail = (target: string) => {
    setEmails((prev) => prev.filter((email) => email !== target));
    setEmailError('');
  };

  const handleEmailKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addEmailsFromInput(emailInput);
    }
  };

  const createMiniLeague = async (skipInvites: boolean) => {
    const nextNameError = getNameError(name);
    setNameTouched(true);

    if (nextNameError) return;

    try {
      const response = await mutateAsync({
        name: name.trim(),
        inviteEmails: skipInvites || emails.length === 0 ? undefined : emails,
      });

      toast.success('MiniLeague created');

      if (response.invitedExistingUsers + response.invitedByEmailOnly > 0) {
        toast.success('Invites sent');
      }

      if (response.skipped > 0) {
        toast.message('Some emails were skipped (duplicates/limit).');
      }

      router.push(`/leagues/${response.leagueId}?tab=tabla`);
    } catch {
      toast.error('Could not create the MiniLeague. Please try again.');
    }
  };

  return (
    <>
      <PublicTopBar title="Create MiniLeague" backHref="/leagues" />

      <div className="px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Create MiniLeague</h1>
          <p className="mt-1 text-sm text-slate-600">
            Start a mini league with friends in ~60s
          </p>
        </div>

        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            createMiniLeague(false);
          }}
        >
          <fieldset disabled={isPending} className="space-y-5 disabled:opacity-100">
            <Input
              label="League name"
              required
              placeholder="e.g. Sunday Padel Crew"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (nameTouched) setNameTouched(true);
              }}
              onBlur={() => setNameTouched(true)}
              error={nameError}
            />

            <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-900">Invite emails (optional)</h2>
                <span className="text-xs font-medium text-slate-500">
                  {emails.length}/{MAX_INVITES}
                </span>
              </div>

              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="friend@email.com"
                  value={emailInput}
                  onChange={(e) => {
                    setEmailInput(e.target.value);
                    if (emailError) setEmailError('');
                  }}
                  onKeyDown={handleEmailKeyDown}
                  className="bg-white"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => addEmailsFromInput(emailInput)}
                  className="shrink-0"
                  disabled={emails.length >= MAX_INVITES || !emailInput.trim()}
                  aria-label="Add email"
                >
                  <Plus size={16} />
                </Button>
              </div>

              <p className="text-xs text-slate-500">
                Add up to 10 emails. Press Enter or comma to add quickly.
              </p>

              {emails.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-200 bg-white px-3 py-4 text-sm text-slate-500">
                  No invites yet. Add friends now or use Skip invites.
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {emails.map((email) => (
                    <span
                      key={email}
                      className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-sm text-slate-700"
                    >
                      <Mail size={12} className="text-slate-400" />
                      {email}
                      <button
                        type="button"
                        onClick={() => removeEmail(email)}
                        className="rounded-full p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                        aria-label={`Remove ${email}`}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {emailError && <p className="text-xs text-rose-600">{emailError}</p>}
            </div>

            <Button type="submit" fullWidth size="lg" loading={isPending}>
              Create
            </Button>

            <Button
              type="button"
              fullWidth
              size="lg"
              variant="outline"
              onClick={() => createMiniLeague(true)}
              disabled={isPending}
            >
              Skip invites
            </Button>
          </fieldset>
        </form>
      </div>
    </>
  );
}
