# Architecture
- Keep Consumer Finance isolated behind `cf:*` access sections and `cf` query keys; existing QA, TeleSales and Manager behavior must remain unchanged.
- CF hooks use the shared API helper exclusively, preserving .NET endpoint contracts and isolating CF query invalidation.
- CF field labels are shared between rejected-registration editing and reviewer reasons to keep permissions legible and consistent.
- Keep presentation-only TeleSales monthly reports isolated in a shared reporting view with a dedicated admin/team-leader permission section, preserving operational workflows.