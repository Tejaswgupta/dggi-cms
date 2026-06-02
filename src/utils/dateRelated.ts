import { format } from "date-fns";

export const addTimeToDate = (dateString: any, startTime: any) => {
  dateString = dateString.toString();
  const parts: any[] = dateString.split(/[\s:]+/);
  const monthIndex = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ].indexOf(parts[1]);

  const date = new Date(
    parts[3],
    monthIndex,
    parts[2],
    parts[4],
    parts[5],
    parts[6]
  );

  const startTimeParts = startTime.split(":");
  const desiredHours = parseInt(startTimeParts[0], 10);
  const desiredMinutes = parseInt(startTimeParts[1], 10);

  date.setHours(desiredHours);
  date.setMinutes(desiredMinutes);

  console.log(date);
  const ISOString = date.toISOString();
  console.log(ISOString);
  return ISOString;
};

export const formatDate = (date: Date): string => {
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "2-digit",
  };
  return new Intl.DateTimeFormat("en-US", options).format(date);
};

export const customizeLastUpdated = (currentDate: any) => {
  const date = new Date(currentDate);
  return format(date, "dd MMM, hh:mm aa");
};

export const customizeDateCreated = (currentDate: any) => {
  const date = new Date(currentDate);
  return format(date, "MMM dd | hh:mm aa");
};
