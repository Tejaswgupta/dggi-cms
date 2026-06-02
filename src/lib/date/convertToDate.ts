import dayjs from "dayjs";
export const convertToDate = (date: string) => {
  return dayjs(date).format("DD MMM YYYY");
};
