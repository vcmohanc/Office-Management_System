---
name: Expense Routing Specialist
description: Classify expense items against the standard category table, assign the default advancer routing, and escalate project-specific cases when the rule requires manual selection.
---

# Expense Routing Specialist

## Purpose
Use this skill whenever a user provides an expense item and needs it mapped to the standard internal processing rules. The goal is to identify the correct expense type, assign the fixed advancer category, default bearing party, and advancer method, and then ask for project-specific details only when the rule explicitly calls for them.

## Workflow
1. Read the expense item and normalize the label.
2. Match the item to the closest official expense type in the rule table.
3. Apply the fixed values from the matching row without improvising additional routing.
4. If the row says "Select for each project", pause and ask for the relevant project information before finalizing.
5. Return the result in a clean structured format such as JSON or a table.

## Decision logic
- If the item is Postage:
  - Advancer Category: Service staff
  - Bearing Party: VC
  - Advancer Name: Transfer to the person concerned
- If the item is Transportation expenses:
  - Advancer Category: Service staff
  - Bearing Party: VC
  - Advancer Name: Transfer to the person concerned
- If the item is Flight cost:
  - Advancer Category: Service staff
  - Bearing Party: VC
  - Advancer Name: Bank transfer or automatic deduction
- If the item is Visa application fee:
  - Advancer Category: Service staff
  - Bearing Party: VC
  - Advancer Name: Salary deduction
- If the item is Waiting dormitory:
  - Advancer Category: Service staff
  - Bearing Party: Service staff
  - Advancer Name: Salary deduction
- If the item is Equipment:
  - Advancer Category: Select for each project
  - Bearing Party: Select for each project
  - Advancer Name: —
- If the item is WIFI:
  - Advancer Category: Dispatch destination: Farm
  - Bearing Party: Dispatch destination: Farm
  - Advancer Name: Invoice from the client company
- If the item is Hospital expenses:
  - Advancer Category: Service staff
  - Bearing Party: Service staff
  - Advancer Name: Salary deduction
- If the item is Others:
  - Advancer Category: Select for each project
  - Bearing Party: Select for each project
  - Advancer Name: —
- If the item does not match any listed category:
  - Ask for clarification
  - Do not guess a mapping

## Required output format
Return a structured result with the following fields when applicable:
- expense_type
- advancer_category
- bearing_party
- advancer_name
- project_details_required
- notes

Example JSON:
```json
{
  "expense_type": "Flight cost",
  "advancer_category": "Service staff",
  "bearing_party": "VC",
  "advancer_name": "Bank transfer or automatic deduction",
  "project_details_required": false,
  "notes": "Matched by default routing rule."
}
```

## Quality checks
- Match the expense type exactly against the official rule set.
- Do not override fixed defaults with assumptions.
- Only ask for project details when the row explicitly requires it.
- Keep the final output concise, deterministic, and rule-based.
- If a category is ambiguous, request the missing information rather than making a guess.

## Example prompts
- "Expense item: postage for courier delivery"
- "Classify a flight booking expense"
- "Map visa application fee to the standard routing"
- "Determine the rule for equipment purchase"
- "Process hospital expense under default advancer settings"

## Related customizations
- Create a variant for project-specific expense approval flows.
- Add a stricter validation checklist for missing fields before submission.
- Extend this into a reusable expense approval assistant that produces both classification and approval notes.
