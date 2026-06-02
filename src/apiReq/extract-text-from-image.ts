export async function extractTextFromImage(file?: File, lang: string = "en") {
  try {
    console.log("Extracting text from image using OCR");
    if (!file) {
      throw new Error("No file provided");
    }

    const formData = new FormData();
    formData.append("in_file", file);

    const ocrRes = await fetch(`https://ai.thevotum.com/ocr?langs=${lang}`, {
      method: "POST",
      body: formData,
    });

    if (!ocrRes.ok) {
      throw new Error("OCR processing failed");
    }

    const ocrData = await ocrRes.json();

    // Extract plain text from OCR data
    const extractedText = ocrData.results
      ? ocrData.results.map((page) => page.texts.join("\n")).join("\n\n")
      : null;

    return {
      success: true,
      data: extractedText,
      rawData: ocrData,
    };
  } catch (error) {
    console.log("Error in extractTextFromImage", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to extract text from image",
    };
  }
}
