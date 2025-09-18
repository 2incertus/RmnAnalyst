# PDF Generation Library Research

This document analyzes and compares popular libraries for generating PDFs in a React application.

## Requirements

1.  **Client-Side Generation**: The library must be able to generate PDFs directly in the browser.
2.  **React Compatibility**: It should integrate well with a React-based component structure.
3.  **Styling and Layout**: The library must provide robust options for styling and layout to create a professional-looking, single-page report.
4.  **Image Support**: It needs to be able to embed images, specifically the trend chart from our analysis.

---

## Option 1: jspdf

`jspdf` is one of the most popular and mature libraries for client-side PDF generation.

*   **Pros**:
    *   **Feature-Rich**: Offers a wide range of functionalities, including text, images, shapes, and metadata.
    *   **Good Documentation**: Extensive documentation and a large community.
    *   **`html2canvas` Integration**: Can convert HTML elements directly into a PDF, which is ideal for capturing our report's structure.

*   **Cons**:
    *   **Imperative API**: Its API is not declarative, which can make it less intuitive to use with React's component model.

---

## Option 2: @react-pdf/renderer

`@react-pdf/renderer` allows you to build PDF documents using React components, offering a more declarative and intuitive approach.

*   **Pros**:
    *   **React-Native API**: Uses React components (`<View>`, `<Text>`, `<Image>`) to build the PDF structure, which is very familiar.
    *   **Excellent for Styling**: Provides a robust styling system based on Flexbox, making it easy to create complex layouts.

*   **Cons**:
    *   **No Direct HTML to PDF**: It cannot convert existing HTML into a PDF. You have to rebuild the document structure using its specific components.

---

## Option 3: pdf-lib

`pdf-lib` is a powerful, low-level library for creating and modifying PDF documents.

*   **Pros**:
    *   **High Performance**: Known for being fast and efficient.
    *   **Modification Capabilities**: Can be used to modify existing PDFs, although that's not our primary use case.

*   **Cons**:
    *   **Low-Level API**: The API is very verbose and complex, making it difficult to create layouts and style documents.

---

## Recommendation

For this project, **jspdf** combined with **html2canvas** is the clear winner.

While `@react-pdf/renderer` has a more "React-like" API, it would require us to completely rebuild our existing `AnalysisDisplay` component using a different set of components.

With `jspdf` and `html2canvas`, we can leverage our existing component structure. We'll add an "Edit Mode" that replaces the text elements with `textarea` inputs. When the user clicks "Export to PDF," we'll use `html2canvas` to capture the entire report component as an image and then use `jspdf` to place that image onto a single-page PDF. This approach is faster to implement and reuses the most code.