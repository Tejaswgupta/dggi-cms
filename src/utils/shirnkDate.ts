export const addOneDay = (dateString: any) => {
  // Create a new Date object from the given date string
  const date = new Date(dateString);

  // Add one day to the date
  date.setDate(date.getDate() + 1);

  // Format the new date to match the input format
  const newDateFormatted = date.toISOString().slice(0, 19);
  // Return the new date as a string
  return newDateFormatted;
};

const formattedDate = (dateString: any) => {
  // Create a new Date object from the given date string
  const date = new Date(dateString);

  // Add one day to the date
  date.setDate(date.getDate());

  // Format the new date to match the input format
  const newDateFormatted = date.toISOString().slice(0, 19);
  // Return the new date as a string
  return newDateFormatted;
};
