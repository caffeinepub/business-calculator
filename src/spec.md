# Specification

## Summary
**Goal:** Add SOR Date and Order Date fields to business calculation records and display them as new fixed columns in the main table with inline add/edit support.

**Planned changes:**
- Add two new fixed date columns to the main Business Calculations table UI: “SOR Date” immediately before “SOR No”, and “Order Date” immediately before “Order No”, matching existing inline edit/add behaviors and styling.
- Extend frontend types and data flow to include `sorDate` and `orderDate` in `BusinessRecord`/`BusinessRecordInput`, including create/update flows and mock seed data.
- Update backend persistence schema and CRUD round-tripping to store/return `sorDate` and `orderDate`, adding a conditional migration only if required to preserve existing stored records during upgrade.

**User-visible outcome:** Users can view, enter, and edit SOR Date and Order Date directly in the main business table, with the columns appearing in the requested positions and persisting correctly.
