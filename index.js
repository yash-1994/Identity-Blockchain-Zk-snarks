import { ethers } from "ethers";
import * as snarkjs from "snarkjs";
import fs from "fs";
const crypto = require('crypto');
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Poseidon hash function (assuming it's implemented somewhere)
async function poseidonHash(inputs) {
  // Placeholder implementation, replace with actual Poseidon hash function
  return "0x" + Buffer.from(inputs.join('')).toString('hex');
}

async function registerUser(address, doB, name, uid) {
  
}





// Encryption function
function encryptStringArray(stringArray, key) {
    const algorithm = 'aes-256-cbc'; // AES encryption algorithm
    const iv = crypto.randomBytes(16); // Initialization vector (random)

    // Create cipher with the key and initialization vector (iv)
    const cipher = crypto.createCipheriv(algorithm, crypto.scryptSync(key, 'salt', 32), iv);

    // Convert array to string, then encrypt it
    let encrypted = cipher.update(stringArray.join(','), 'utf-8', 'hex');
    encrypted += cipher.final('hex');

    // Combine the iv and encrypted content
    const encryptedData = iv.toString('hex') + ':' + encrypted;
    return encryptedData;
}

// Decryption function
function decryptStringArray(encryptedData, key) {
    const algorithm = 'aes-256-cbc';

    // Split the iv and encrypted content
    const [ivHex, encrypted] = encryptedData.split(':');
    const iv = Buffer.from(ivHex, 'hex');

    // Create decipher with the key and iv
    const decipher = crypto.createDecipheriv(algorithm, crypto.scryptSync(key, 'salt', 32), iv);

    // Decrypt the content
    let decrypted = decipher.update(encrypted, 'hex', 'utf-8');
    decrypted += decipher.final('utf-8');

    // Convert decrypted string back to an array
    const originalArray = decrypted.split(',');
    return originalArray;
}

async function createAgeProof(privateKey, doBTimestamp, currentTimestamp, ageThreshold) {
  // Initialize a wallet instance with the provided private key
  console.log(privateKey.length)

  if (privateKey.length !== 66) {
    privateKey = "0x" + privateKey;
  }
  const wallet = new ethers.Wallet(privateKey);
  // Generate the Poseidon hash
  const hash = await poseidonHash([wallet.address, doBTimestamp]);

  // Generate zk-SNARK proof and public signals
  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    {
      doBTimestamp: doBTimestamp,
      address: wallet.address,
      currentTimestamp: currentTimestamp,
      ageThreshold: ageThreshold,
      hash: hash,
    },
    "build/age_proof_js/age_proof.wasm",
    "circuit_age.zkey"
  );

  return { proof, publicSignals };
}

async function verifyAgeProof(address, proof, publicSignals, dIdentityContract) {
  // Get the user's identity data from the smart contract (e.g., date of birth hash)
  //const id = await dIdentityContract.getID(address);

  // Load the verification key for the zk-SNARK circuit
  const vKey = JSON.parse(fs.readFileSync("verification_key_age.json"));

  // Verify the zk-SNARK proof using snarkjs
  const res = await snarkjs.groth16.verify(vKey, publicSignals, proof);
  
  // ! Just Chcking the snark js verification result
  // Ensure the verification result is true and the date of birth hash matches the expected value
  return res;
}

async function main() {
  try {
    // Example inputs (replace with actual values)
    const privateKey = process.env.WALLET_PRIVATE_KEY?.trim();// Example: 0x123456789abcdef
    const doBTimestamp = 946684800; // Example: January 1, 2000 (in seconds)
    const currentTimestamp = Math.floor(Date.now() / 1000); // Current time in seconds
    const ageThreshold = 18 * 365 * 24 * 60 * 60; // Example: 18 years in seconds

    // Deploy a dummy dIdentityContract (replace with actual contract instance)
    const dIdentityContract = {
      getID: async (address) => {
        // Example: return a mock identity object
        return { dobHash: "0x123456789abcdef" };
      },
    };

    console.log(privateKey)
    // Step 1: Create Age Proof
    console.log("Creating age proof...");
    const { proof, publicSignals } = await createAgeProof(privateKey, doBTimestamp, currentTimestamp, ageThreshold);
    console.log("Proof:", proof);
    console.log("Public Signals:", publicSignals);

    // Step 2: Verify Age Proof
    console.log("Verifying age proof...");
    const verificationResult = await verifyAgeProof(new ethers.Wallet(privateKey).address, proof, publicSignals, dIdentityContract);
    console.log("Verification Result:", verificationResult);

  } catch (error) {
    console.error("Error:", error);
  }
}

// Run the main function
main();
