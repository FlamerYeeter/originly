const PI_NETWORK = process.env.NEXT_PUBLIC_PI_NETWORK || "testnet";

if (PI_NETWORK !== "testnet" && PI_NETWORK !== "mainnet") {
  throw new Error(
    `Invalid NEXT_PUBLIC_PI_NETWORK "${PI_NETWORK}". Use "testnet" or "mainnet".`
  );
}

export const PI_SANDBOX = PI_NETWORK === "testnet";
