import type { TimezoneOption } from "@/types/voice-profile";

const timezoneCountryLabels: Record<string, string> = {
  "America/Bogota": "Colombia/Perú/Ecuador/Panamá",
  "America/Lima": "Colombia/Perú/Ecuador/Panamá",
  "America/Guayaquil": "Colombia/Perú/Ecuador/Panamá",
  "America/Panama": "Colombia/Perú/Ecuador/Panamá",
};

export const PREDEFINED_TIMEZONES: TimezoneOption[] = [
  { value: "Pacific/Midway", label: "Midway, American Samoa (UTC-11)" },
  { value: "Pacific/Honolulu", label: "Hawaii (UTC-10)" },
  { value: "America/Anchorage", label: "Alaska (UTC-9)" },
  { value: "America/Los_Angeles", label: "United States (Pacific), Canada (Pacific) (UTC-8)" },
  { value: "America/Denver", label: "United States (Mountain), Canada (Mountain) (UTC-7)" },
  { value: "America/Chicago", label: "United States (Central), Canada (Central) (UTC-6)" },
  { value: "America/Mexico_City", label: "México (Central), Costa Rica, El Salvador, Guatemala, Honduras, Nicaragua (UTC-6)" },
  { value: "America/New_York", label: "United States (Eastern), Canada (Eastern) (UTC-5)" },
  { value: "America/Bogota", label: "Colombia, Perú, Ecuador, Panamá (UTC-5)" },
  { value: "America/Caracas", label: "Venezuela, Bolivia, República Dominicana, Puerto Rico (UTC-4)" },
  { value: "America/Santiago", label: "Chile, Paraguay (UTC-4)" },
  { value: "America/Argentina/Buenos_Aires", label: "Argentina, Uruguay, Brasil (Brasilia) (UTC-3)" },
  { value: "America/Sao_Paulo", label: "Brasil (São Paulo) (UTC-3)" },
  { value: "Atlantic/Azores", label: "Azores (UTC-1)" },
  { value: "Europe/London", label: "United Kingdom, Ireland, Portugal (UTC+0)" },
  { value: "Atlantic/Canary", label: "Islas Canarias (UTC+0)" },
  { value: "Europe/Madrid", label: "España (Peninsular), France, Deutschland, Italia (UTC+1)" },
  { value: "Europe/Paris", label: "France, Belgique, Nederland, Schweiz (UTC+1)" },
  { value: "Europe/Berlin", label: "Deutschland, Österreich, Polska, Česká republika (UTC+1)" },
  { value: "Europe/Athens", label: "Ελλάδα, România, Türkiye, مصر (UTC+2)" },
  { value: "Africa/Johannesburg", label: "South Africa (UTC+2)" },
  { value: "Europe/Moscow", label: "Россия, السعودية, Kenya (UTC+3)" },
  { value: "Asia/Dubai", label: "دبي, الإمارات العربية المتحدة (UTC+4)" },
  { value: "Asia/Karachi", label: "Pakistan (UTC+5)" },
  { value: "Asia/Kolkata", label: "India (UTC+5:30)" },
  { value: "Asia/Dhaka", label: "Bangladesh (UTC+6)" },
  { value: "Asia/Bangkok", label: "Thailand, Việt Nam, Indonesia (UTC+7)" },
  { value: "Asia/Shanghai", label: "中国, Singapore, Philippines, Malaysia (UTC+8)" },
  { value: "Asia/Taipei", label: "台灣 (UTC+8)" },
  { value: "Australia/Perth", label: "Australia (Western) (UTC+8)" },
  { value: "Asia/Tokyo", label: "日本, 대한민국 (UTC+9)" },
  { value: "Australia/Sydney", label: "Australia (Eastern) (UTC+10)" },
  { value: "Pacific/Auckland", label: "New Zealand (UTC+12)" },
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
  const predefined = PREDEFINED_TIMEZONES.find((tz) => tz.value === timezone);
  if (predefined) {
    return predefined.label;
  }

  const groupedLabel = timezoneCountryLabels[timezone];
  const baseLabel = groupedLabel || timezone.replace(/_/g, " ");
  const utcOffset = getUtcOffsetLabel(timezone);

  if (!utcOffset) {
    return baseLabel;
  }

  return `${baseLabel} (${utcOffset})`;
};
