// Bank name lookup from an IFSC code, using the data files shipped with Razorpay's
// `ifsc` package (its JS entry point is Node-only). Works offline; the data is
// loaded on first use so it stays out of the main bundle.

type Lookup = Record<string, string>;

let dataPromise: Promise<{ names: Lookup; sublets: Lookup; customSublets: Lookup }> | null = null;

const loadData = () => {
  dataPromise ??= Promise.all([
    import('ifsc/src/banknames.json'),
    import('ifsc/src/sublet.json'),
    import('ifsc/src/custom-sublets.json'),
  ]).then(([names, sublets, customSublets]) => ({
    names: names.default as Lookup,
    sublets: sublets.default as Lookup,
    customSublets: customSublets.default as Lookup,
  }));
  return dataPromise;
};

export function isIfscFormat(code: string): boolean {
  return /^[A-Z]{4}0[A-Z0-9]{6}$/.test(code.trim().toUpperCase());
}

// "SBIN0001234" -> "State Bank of India"; null if the code is malformed or the bank unknown.
export async function bankNameFromIfsc(code: string): Promise<string | null> {
  const ifsc = code.trim().toUpperCase();
  if (!isIfscFormat(ifsc)) return null;
  const { names, sublets, customSublets } = await loadData();

  // Sublet branches belong to a different bank than their 4-letter prefix says
  // (e.g. co-operative banks running on a sponsor bank's IFSC range).
  const customPrefix = Object.keys(customSublets).find(prefix => ifsc.startsWith(prefix));
  const bankCode = sublets[ifsc] ?? (customPrefix ? customSublets[customPrefix] : ifsc.slice(0, 4));
  return names[bankCode] ?? null;
}
