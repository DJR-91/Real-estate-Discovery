import { findPlaceTool } from "./src/services/google-maps";

async function testPlace() {
  try {
    const result = await findPlaceTool({ query: "Demosthenian Hall", placeId: "ChIJsVkO6t5s9ogRu7tgbEkwXXw" });
    console.log("TOOL RESULT FOR DEMOSTHENIAN HALL:", JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("Test failed:", error);
  }
}

testPlace();
