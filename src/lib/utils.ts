import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generates a random password of the specified length
 * with at least one uppercase letter, one lowercase letter,
 * one number, and one special character
 */
export function generatePassword(length: number = 12): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

const getActiveHostname = () => {
  if (typeof window !== "undefined") {
    return window.location.hostname;
  }
  return "";
};

export const getAuthenticatorOptions = () => {
  //TODO: Hardcode values of origin as an array https://simplewebauthn.dev/docs/packages/server
  const rpName = process.env.NEXT_PUBLIC_RP_NAME;
  const rpId = process.env.NEXT_PUBLIC_RP_ID;
  const origin = process.env.NEXT_PUBLIC_ORIGIN;

  console.log("rpName: ", rpName);
  console.log("rpId: ", rpId);
  console.log("origin: ", origin);

  return {
    rpName,
    rpId,
    origin,
  };
};

export function formatCurrency(amount: number, currency = "SGD"): string {
  return new Intl.NumberFormat("en-SG", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
