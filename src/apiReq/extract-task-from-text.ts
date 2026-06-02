import { clientBackendFetch } from "@/lib/client-backend-fetch";

export async function extractTasksFromText(text?: string) {
  try {
    console.log("Extracting tasks from text");
    if (!text) {
      throw new Error("No text provided");
    }
    // Extract the tasks from the text
    const suggestedTaskRes = await clientBackendFetch(
      "https://api.thevotum.com/extract_task_from_email/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
        }),
      }
    );

    if (!suggestedTaskRes.ok) {
      throw new Error("Failed to extract tasks from text");
    }

    const suggestedTasks = (await suggestedTaskRes.json())?.tasks;

    console.log("Suggested Tasks", suggestedTasks);

    return {
      success: true,
      data: suggestedTasks || [],
    };
  } catch (error) {
    console.log("Error in extractTasksFromText", error);
    return {
      success: false,
      error: error?.message || "Failed to extract tasks from text",
    };
  }
}
