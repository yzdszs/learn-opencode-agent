# Add Supplemental Practice Metadata Checks

## Goal

Make P24-P28 supplemental practice pages fully usable by adding their project metadata and preventing future practice pages from referencing missing `project-id` values.

## What I already know

* `docs/practice/p24-*` through `docs/practice/p28-*` exist and use `PracticeProjectGuide`, `PracticeProjectSourceFiles`, and `PracticeProjectActionPanel`.
* `.vitepress/theme/data/practice-projects.ts` currently defines project metadata only through P23.
* `scripts/check-practice-entries.mjs` currently checks referenced `pNN-*.ts` script files but does not validate `project-id` metadata references.
* The repository uses `pnpm.cmd run check:practice` as the targeted practice validation command on Windows.

## Requirements

* Add `PracticeProjectDefinition` metadata for P24-P28.
* Place P24-P28 in the existing practice phase model so `PracticeProjectSyllabus` and related components can resolve them.
* Enhance `check:practice` so every `project-id` used by practice guide/source/action components resolves to metadata.
* Keep the check focused on practice pages and the existing data file; do not broaden it into unrelated content validation.
* Preserve current content style and avoid unrelated copy rewrites.

## Acceptance Criteria

* [ ] `pnpm.cmd run check:practice` fails before metadata is added when P24-P28 are referenced but undefined.
* [ ] After implementation, `pnpm.cmd run check:practice` passes.
* [ ] P24-P28 can be resolved by `getPracticeProjectById`.
* [ ] Existing type-check passes for `.vitepress`.

## Definition of Done

* Targeted validation command passes.
* TypeScript check passes or any pre-existing failure is clearly identified.
* Changes are narrow and reviewable.

## Out of Scope

* Redesigning the practice landing page layout.
* Cleaning old TODO hits in unrelated docs.
* Committing Trellis/bootstrap initialization files.

## Technical Notes

* Likely files: `.vitepress/theme/data/practice-projects.ts`, `.vitepress/theme/data/learning-paths.data.ts`, `scripts/check-practice-entries.mjs`.
* Existing project definitions provide the local copy style for titles, summaries, learning goals, prerequisites, completion signals, and related theory links.
