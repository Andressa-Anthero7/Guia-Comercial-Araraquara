export function whatsappNumber(value: string) {
  const digits = value.replace(/\D/g, "");
  // Local Brazilian contacts need the country code in wa.me links.
  return digits.length === 10 || digits.length === 11 ? `55${digits}` : digits;
}
