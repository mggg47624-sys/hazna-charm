# Architecture
- Keep Consumer Finance isolated behind `cf:*` access sections and `cf` query keys; existing QA, TeleSales and Manager behavior must remain unchanged.
- CF mock sign-in uses a dedicated role marker and placeholder token only when mock mode is enabled; ordinary login continues to use the existing API.
- Initialize CF mock records lazily on access, not at module evaluation, so SSR remains compatible with the Worker runtime.
- Keep presentation-only TeleSales monthly reports isolated in a shared reporting view with a dedicated admin/team-leader permission section, preserving operational workflows.