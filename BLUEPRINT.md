# Blueprint & Specification: Integrating Grounded Gemini

This document provides a blueprint for integrating the "Grounded Gemini" functionality into an existing Next.js application.

## 1. Overview

The goal is to add a feature where a user can input a query, and the application will use the Gemini API with Google Search grounding to provide an accurate, up-to-date answer with verifiable source citations.

The integration involves three main parts:
1.  **Backend AI Flow**: A server-side function using Genkit to communicate with the Gemini API.
2.  **Frontend Component**: A React component for user input and for triggering the AI flow.
3.  **Results Display**: A component to render the structured response from the AI, including the answer, citations, and search queries.

---

## 2. Backend: Genkit AI Flow

The core of the functionality resides in a Genkit flow. This flow is responsible for taking a user's query and returning a structured, grounded response.

### File Structure:
Create a file for your flow, for example: `src/ai/flows/generate-grounded-response.ts`.

### Key Components:
- **Input Schema (Zod)**: Defines the expected input. For this, it's a simple object with a `query` string.
  ```typescript
  const GenerateGroundedResponseInputSchema = z.object({
    query: z.string(),
  });
  ```

- **Output Schema (Zod)**: Defines the structured output from the flow. This is crucial for the frontend to correctly parse and display the information.
  ```typescript
  const GenerateGroundedResponseOutputSchema = z.object({
    response: z.string(),
    webSearchQueries: z.array(z.string()).optional(),
    groundingChunks: z.array(z.object({ web: z.object({ uri: z.string(), title: z.string() }) })).optional(),
    groundingSupports: z.array(z.object({ /* ... */ })).optional(),
  });
  ```

- **Genkit Flow (`ai.defineFlow`)**:
  - The flow receives the `query`.
  - It configures and calls the Gemini model (`googleai/gemini-2.5-flash` is a good choice) using `ai.generate()`.
  - Crucially, it enables the Google Search tool by passing it in the `config` object:
    ```typescript
    const config = {
        tools: [{ google_search: {} }]
    };
    ```
  - It then extracts the `text` (the answer) and `groundingMetadata` from the model's response and returns it in the shape defined by the output schema.

- **Exported Function**: An async wrapper function that makes the flow callable from your frontend components.
  ```typescript
  export async function generateGroundedResponse(input: GenerateGroundedResponseInput): Promise<GenerateGroundedResponseOutput> {
    return generateGroundedResponseFlow(input);
  }
  ```

---

## 3. Frontend: Search Component

You'll need a client-side component (`"use client"`) to handle user interaction.

### File Structure:
This can be integrated into any page of your app, for example `src/app/your-page/page.tsx`.

### Key Components:
- **State Management (`useState`)**:
  - `isLoading` (boolean): To show a loading indicator while waiting for the API.
  - `response` (GenerateGroundedResponseOutput | null): To store the result from the AI flow.
  - `error` (string | null): To handle and display any potential errors.

- **Form Handling (`react-hook-form` & `zod`)**:
  - A form with a single text `Input` for the user's query.
  - A `Button` to submit the form.
  - Use `zodResolver` for simple client-side validation (e.g., query must not be empty).

- **`onSubmit` Function**:
  - This function is called when the form is submitted.
  - It sets `isLoading` to `true`.
  - It calls the exported `generateGroundedResponse` function from your AI flow.
  - It stores the result in the `response` state.
  - It handles errors using a `try...catch` block.
  - It sets `isLoading` back to `false` in a `finally` block.

---

## 4. Frontend: Results Display Component

To keep your code clean, create a separate component to render the results.

### File Structure:
Create a dedicated component, for example: `src/components/results-display.tsx`.

### Key Logic:
- **Props**: This component accepts the `data` (the `response` object from the AI flow) as a prop.
- **Rendering the Main Response**:
  - The main `response` text contains segments that need to be linked to sources.
  - You'll need to parse the `groundingSupports` array. Each item in this array tells you which part of the text (using `startIndex` and `endIndex`) corresponds to which sources (using `groundingChunkIndices`).
  - Iterate through the sorted `groundingSupports` and reconstruct the response string, wrapping the cited segments in a `<span>` or similar element. Use a tooltip (`<Tooltip>`) on these spans to show the source details on hover.
- **Displaying Search Queries**: If `webSearchQueries` exists, map over the array and display each query, perhaps using a `<Badge>` component.
- **Displaying Sources**: If `groundingChunks` exists, map over the array to create a numbered list of source links. Each item in the list should show the source `title` and link to its `uri`.

---

## 5. Dependencies & Setup

Ensure the following packages are in your `package.json`:
```json
"dependencies": {
  "genkit": "...",
  "@genkit-ai/googleai": "...",
  "@genkit-ai/next": "...",
  "zod": "...",
  "react-hook-form": "...",
  "@hookform/resolvers": "...",
  "lucide-react": "..."
}
```
You will also need various `@radix-ui/react-*` components used by `shadcn/ui` for UI elements like Cards, Buttons, and Tooltips.

### Environment Variables:
- Create a `.env` file in your project root.
- Add your Google AI API key:
  ```
  GOOGLE_API_KEY=your_api_key_here
  ```
