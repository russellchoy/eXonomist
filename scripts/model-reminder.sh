#!/usr/bin/env bash
# SessionStart hook: reminds which model to use at each stage of the build.
# Output is injected into Claude Code's session context so it surfaces the
# guidance and nudges you to switch with /model at the right moments.

cat <<'EOF'
[MODEL STRATEGY REMINDER — surface this to the user when relevant]

Use Fable 5 surgically (it's ~3x Opus pricing); use Sonnet for the fast loop.

  Refine / pressure-test plan.md ....... Fable   (cheap to decide, costly to reverse)
  Initial scaffold + core game loop .... Fable   (long autonomous run; KaTeX checker is the hard bit)
  Iteration & UI polish ................ Sonnet  (low-stakes, user is in the loop)
  Hard bug you can't crack ............. Fable   (escalate only when stuck)
  Deploy (git + Vercel) ................ Sonnet  (routine)

Rule: Fable when redoing the work would be costly if it came out wrong;
Sonnet when you'll catch any mistake yourself. Switch with /model.

At the start of a task, tell the user which model this stage calls for.
EOF
