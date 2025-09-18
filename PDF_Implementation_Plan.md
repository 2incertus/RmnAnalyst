# PDF Export Implementation Plan

This document outlines the step-by-step plan for implementing the editable PDF export feature.

## 1. Install Dependencies

We will start by installing the necessary libraries for PDF generation:

```bash
npm install jspdf html2canvas
```

## 2. Create the `EditableField` Component

A new file, `components/EditableField.tsx`, will be created with the following logic:

-   It will accept `value`, `isEditing`, and `onChange` as props.
-   It will conditionally render either a `<p>` tag or a `<textarea>` based on the `isEditing` prop.

## 3. Update the `AnalysisDisplay` Component

The `AnalysisDisplay.tsx` component will be significantly updated:

1.  **State Management**: Add `isEditing` and `editableAnalysis` state variables.
2.  **"Edit Mode" Toggle**: Add an "Edit / Save" button that toggles the `isEditing` state.
3.  **Integrate `EditableField`**: Replace all static text elements (like the executive summary and recommendations) with the new `EditableField` component.
4.  **Export Button**: Add an "Export to PDF" button.
5.  **PDF Export Logic**:
    -   Create a new function, `handleExportPDF`.
    -   This function will use `html2canvas` to capture the main report container.
    -   It will then use `jspdf` to create a new PDF and add the captured image to it.
    -   Finally, it will save the PDF with a descriptive filename.

## 4. Refactor `AnalysisDisplay` to use `EditableField`

Here's an example of how the "Executive Summary" section will be modified:

```tsx
// Before
<p className="text-slate-700 leading-relaxed">{analysis.executiveSummary}</p>

// After
<EditableField
  isEditing={isEditing}
  value={editableAnalysis.executiveSummary}
  onChange={(newValue) =>
    setEditableAnalysis({ ...editableAnalysis, executiveSummary: newValue })
  }
/>
```

This pattern will be applied to all text-based sections of the report.

## 5. Implementation Checklist

-   [ ] Install `jspdf` and `html2canvas`.
-   [ ] Create the `components/EditableField.tsx` component.
-   [ ] Add state management for `isEditing` and `editableAnalysis` to `AnalysisDisplay.tsx`.
-   [ ] Add the "Edit / Save" and "Export to PDF" buttons.
-   [ ] Replace static text with the `EditableField` component in `AnalysisDisplay.tsx`.
-   [ ] Implement the `handleExportPDF` function.
-   [ ] Test the editing and PDF export functionality thoroughly.

---

Please review this implementation plan. If you approve, I will prepare to switch to "Code" mode to begin the implementation.