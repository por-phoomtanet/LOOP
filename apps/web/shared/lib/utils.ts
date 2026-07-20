import { API_ORIGIN } from "@/constants";

export function resolveUploadUrl(url: string) {
  return url.startsWith("/") ? `${API_ORIGIN}${url}` : url;
}
