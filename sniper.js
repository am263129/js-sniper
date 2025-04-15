import * as bip39 from "bip39";
import { derivePath } from "ed25519-hd-key";
import { Keypair, Connection, clusterApiUrl, PublicKey } from "@solana/web3.js";
import * as fs from "fs";

// === CONFIG ===
const NUM_DERIVATIONS = 5; // Scan m/44'/501'/0'/0' to m/44'/501'/4'/0'

// === Generate Mnemonic ===


// === Derive N keypairs and check balances ===
const connection = new Connection(clusterApiUrl("mainnet-beta"), "confirmed");

async function scanWallets() {
  const mnemonic = bip39.generateMnemonic();
  const seed = bip39.mnemonicToSeedSync(mnemonic);
  console.log("Mnemonic:", mnemonic);
  let found = false;
  let logOutput = `Mnemonic: ${mnemonic}\n\n`;

  for (let i = 0; i < NUM_DERIVATIONS; i++) {
    const path = `m/44'/501'/${i}'/0'`;
    const derived = derivePath(path, seed.toString("hex"));
    const keypair = Keypair.fromSeed(derived.key);
    const pubkey = keypair.publicKey.toBase58();

    const balanceLamports = await connection.getBalance(new PublicKey(pubkey));
    const balanceSOL = balanceLamports / 1e9;

    console.log(`[${path}] ${pubkey} => ${balanceSOL} SOL`);
    logOutput += `[${path}] ${pubkey} => ${balanceSOL} SOL\n`;

    if (balanceSOL > 0) {
      found = true;
    }
  }

  if (found) {
    fs.writeFileSync("found_wallet.txt", logOutput);
    console.log("\n✅ Found a wallet with SOL. Saved to found_wallet.txt");
  } else {
    console.log("\n❌ No wallets with SOL found.");
  }
}

while (true) {
  scanWallets().catch(console.error);
  // Wait for 1 seconds before the next scan
  await new Promise(resolve => setTimeout(resolve, 5000));
}
