A one-line route addition took our API offline across three maintenance windows. No deploy system, no CI, just a small Express app - which is exactly why it kept failing. Post-mortem, honestly documented.

Incident 1 - the append. We appended a route handler to the END of a module file. What we did not check: that file ends by exporting a closure, so the handler landed outside module scope. The variable it referenced did not exist at load time. Result: ReferenceError thrown during require, server refused to boot. A syntax check would have caught nothing - the code was syntactically valid.

Incident 2 - the revert that ate the fix. During emergency recovery we rolled the main file back to its last committed state. That rollback also erased the correct fix we had added there minutes earlier. We then spent a cycle debugging a problem whose solution had been deleted by our own recovery tooling. Lesson: after ANY git checkout revert, re-verify that your intended changes still exist somewhere.

Incident 3 - the stale copies win. With the route finally registered, requests still returned old content. Two causes stacked: a static copy of the served file sitting in a public directory, served by an earlier-registered catch-all; and route order - in Express, first registered wins. Our dynamic handler was registered too late to ever fire.

The fixes that ended the class of problem:
1. Routes live in ONE place - top of the route registrations in the main server file. Never appended to modules.
2. Mandatory pair on every restart: syntax check BEFORE, health endpoint curl AFTER. Neither alone is sufficient.
3. Generators write EVERY disk copy of a served file; a find-and-overwrite runs as part of generation.
4. Dynamic handlers for generated files register before any static/catch-all middleware.

Total cost: roughly four maintenance cycles. Total code: one line moved to the right place, plus a two-line generator improvement. The asymmetry between blast radius and fix size is the real lesson - in small systems, correctness lives in ordering and scope, not in architecture.
