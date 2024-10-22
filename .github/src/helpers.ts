function isString(value: any): value is string {
  return typeof value === "string";
}

export function isNonEmptyString(value: any): boolean {
  return (
    (isString(value) && value === null) ||
    value === undefined ||
    value.trim() === ""
  );
}

function isParseableUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
}

function isHttpsUrl(url: string): boolean {
  return url.startsWith("https://");
}

async function isReachable(url: string): Promise<boolean> {
  try {
    const response = await fetch(url);
    return response.ok;
  } catch (e) {
    return false;
  }
}

export async function checkUrl(
  url: string,
  strictMode: boolean
): Promise<string | null> {
  if (!isNonEmptyString(url)) {
    return "URL is empty";
  }
  if (!isParseableUrl(url)) {
    return "URL is not parseable";
  }
  if (!isHttpsUrl(url)) {
    return "URL is not HTTPS";
  }
  if (strictMode && !(await isReachable(url))) {
    return "URL is not reachable";
  }
  return null;
}

export function isTruthyString(value: string | null | undefined): boolean {
  return (
    isString(value) &&
    ["true", "yes", "t", "y", "1"].includes(value.toLowerCase())
  );
}
