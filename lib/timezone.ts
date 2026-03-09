import type { TimezoneOption } from "@/types/voice-profile";

const timezoneCountryLabels: Record<string, string> = {
  "America/Bogota": "Colombia/Perú/Ecuador/Panamá",
  "America/Lima": "Colombia/Perú/Ecuador/Panamá",
  "America/Guayaquil": "Colombia/Perú/Ecuador/Panamá",
  "America/Panama": "Colombia/Perú/Ecuador/Panamá",
};

export const PREDEFINED_TIMEZONES: TimezoneOption[] = [
  { value: "Pacific/Midway", label: "Midway, Samoa Americana (UTC-11)" },
  { value: "Pacific/Honolulu", label: "Hawái (UTC-10)" },
  { value: "America/Anchorage", label: "Alaska (UTC-9)" },
  { value: "America/Los_Angeles", label: "Estados Unidos (Pacífico), Canadá (Pacífico) (UTC-8)" },
  { value: "America/Denver", label: "Estados Unidos (Montaña), Canadá (Montaña) (UTC-7)" },
  { value: "America/Chicago", label: "Estados Unidos (Central), Canadá (Central) (UTC-6)" },
  { value: "America/Mexico_City", label: "México (Central), Costa Rica, El Salvador, Guatemala, Honduras, Nicaragua (UTC-6)" },
  { value: "America/New_York", label: "Estados Unidos (Este), Canadá (Este) (UTC-5)" },
  { value: "America/Bogota", label: "Colombia, Perú, Ecuador, Panamá (UTC-5)" },
  { value: "America/Caracas", label: "Venezuela, Bolivia, República Dominicana, Puerto Rico (UTC-4)" },
  { value: "America/Santiago", label: "Chile, Paraguay (UTC-4)" },
  { value: "America/Argentina/Buenos_Aires", label: "Argentina, Uruguay, Brasil (Brasilia) (UTC-3)" },
  { value: "America/Sao_Paulo", label: "Brasil (São Paulo) (UTC-3)" },
  { value: "Atlantic/Azores", label: "Azores (UTC-1)" },
  { value: "Europe/London", label: "Reino Unido, Irlanda, Portugal (UTC+0)" },
  { value: "Atlantic/Canary", label: "Islas Canarias (UTC+0)" },
  { value: "Europe/Madrid", label: "España (Peninsular), Francia, Alemania, Italia (UTC+1)" },
  { value: "Europe/Paris", label: "Francia, Bélgica, Países Bajos, Suiza (UTC+1)" },
  { value: "Europe/Berlin", label: "Alemania, Austria, Polonia, República Checa (UTC+1)" },
  { value: "Europe/Athens", label: "Grecia, Rumania, Turquía, Egipto (UTC+2)" },
  { value: "Africa/Johannesburg", label: "Sudáfrica (UTC+2)" },
  { value: "Europe/Moscow", label: "Moscú, Arabia Saudita, Kenia (UTC+3)" },
  { value: "Asia/Dubai", label: "Dubái, Emiratos Árabes Unidos (UTC+4)" },
  { value: "Asia/Karachi", label: "Pakistán (UTC+5)" },
  { value: "Asia/Kolkata", label: "India (UTC+5:30)" },
  { value: "Asia/Dhaka", label: "Bangladesh (UTC+6)" },
  { value: "Asia/Bangkok", label: "Tailandia, Vietnam, Indonesia (Oeste) (UTC+7)" },
  { value: "Asia/Shanghai", label: "China, Singapur, Filipinas, Malasia (UTC+8)" },
  { value: "Asia/Taipei", label: "Taiwán (UTC+8)" },
  { value: "Australia/Perth", label: "Australia (Oeste) (UTC+8)" },
  { value: "Asia/Tokyo", label: "Japón, Corea del Sur (UTC+9)" },
  { value: "Australia/Sydney", label: "Australia (Este) (UTC+10)" },
  { value: "Pacific/Auckland", label: "Nueva Zelanda (UTC+12)" },
];

const getUtcOffsetLabel = (timezone: string): string => {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    timeZoneName: "shortOffset",
  });
  const timezoneName = formatter
    .formatToParts(new Date())
    .find((part) => part.type === "timeZoneName")
    ?.value;

  if (!timezoneName) {
    return "";
  }

  return timezoneName.replace("GMT", "UTC");
};

export const getTimezoneSelectLabel = (timezone: string): string => {
  const groupedLabel = timezoneCountryLabels[timezone];
  const baseLabel = groupedLabel || timezone.replace(/_/g, " ");
  const utcOffset = getUtcOffsetLabel(timezone);

  if (!utcOffset) {
    return baseLabel;
  }

  return `${baseLabel} (${utcOffset})`;
};
