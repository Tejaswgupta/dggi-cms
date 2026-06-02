export function mergeFirstLetters(inputString: string): string {
  // Split the input string based on spaces
  const words = inputString.split(" ");

  // Check if there are no words
  if (words.length === 0) {
    return "";
  }

  // Extract the first letter of the first word
  let mergedLetters = words[0].charAt(0);

  // If there's more than one word, extract the first letter of the second word and merge
  if (words.length > 1) {
    mergedLetters += words[1].charAt(0);
  }

  return mergedLetters;
}
