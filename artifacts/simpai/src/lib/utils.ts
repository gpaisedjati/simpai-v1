import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatGuruName(username: string): string {
  const normalizedUser = username.trim().toLowerCase();
  
  // Rule for admin and ridwan
  if (normalizedUser === "admin" || normalizedUser === "ridwan") {
    return "Ustadz Ridwan";
  }

  const baseName = username;
  const lowerBase = baseName.trim().toLowerCase();

  // Helper to capitalize words nicely
  const capitalize = (str: string) => {
    return str
      .replace(/[._-]/g, " ") // replace dots, underscores, dashes with space
      .split(" ")
      .filter(Boolean)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Check prefixes
  if (lowerBase.startsWith("pak.") || lowerBase.startsWith("pak ")) {
    const cleaned = baseName.slice(4).trim();
    return `Ustadz ${capitalize(cleaned)}`;
  } else if (lowerBase.startsWith("pak")) {
    const cleaned = baseName.slice(3).trim();
    return `Ustadz ${capitalize(cleaned)}`;
  } else if (lowerBase.startsWith("bu.") || lowerBase.startsWith("bu ")) {
    const cleaned = baseName.slice(3).trim();
    return `Ustadzah ${capitalize(cleaned)}`;
  } else if (lowerBase.startsWith("bu")) {
    const cleaned = baseName.slice(2).trim();
    return `Ustadzah ${capitalize(cleaned)}`;
  } else if (lowerBase.startsWith("ustadz ") || lowerBase.startsWith("ustad ")) {
    return capitalize(baseName);
  } else if (lowerBase.startsWith("ustadzah ") || lowerBase.startsWith("ustazah ")) {
    return capitalize(baseName);
  }

  // Default: capitalize baseName
  return capitalize(baseName);
}

