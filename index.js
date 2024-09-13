import { ethers } from "ethers";
import * as snarkjs from "snarkjs";
import fs from "fs";
import crypto from 'crypto';
import { buildPoseidon } from 'circomlibjs';

// Load environment variables from .env file
// dotenv.config();
// Define contract details (replace with your actual values)
const providerUrl = "https://node.ghostnet.etherlink.com"; // or other Ethereum provider URL
const contractAddress = "0x1c784D77C49060187808391c3d188025a983A3C5";  // Replace with your deployed contract address
const contractABI = [
	{
		"inputs": [
			{
				"internalType": "uint256[2]",
				"name": "_pA",
				"type": "uint256[2]"
			},
			{
				"internalType": "uint256[2][2]",
				"name": "_pB",
				"type": "uint256[2][2]"
			},
			{
				"internalType": "uint256[2]",
				"name": "_pC",
				"type": "uint256[2]"
			},
			{
				"internalType": "uint256[6]",
				"name": "_pubSignals",
				"type": "uint256[6]"
			}
		],
		"name": "verifyProof",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
];

// Create a provider (Infura, Alchemy, or a local node)
const provider = new ethers.JsonRpcProvider(providerUrl);

// Create a signer (optional, only needed for write operations)
// This can be a wallet with a private key or connected to MetaMask
const privateKey = "6a8007b5abf3e49924bf05bd52fc9dffa4b28a839360be1bfce47bb38f108963";  // Replace with your private key if signing transactions
const wallet = new ethers.Wallet(privateKey, provider);

// Create a contract instance
const contract = new ethers.Contract(contractAddress, contractABI, wallet);
// Poseidon hash function (assuming it's implemented somewhere)
async function poseidonHash(inputs) {
  const poseidon = await buildPoseidon();
  const hash = poseidon.F.toString(poseidon(inputs.map(BigInt)));
  return hash;
}

// async function registerUser(Waddress, doB, name, uid) {
  
// }

// Encryption function
function encryptStringArray(stringArray, key) {
    const algorithm = 'aes-256-cbc'; // AES encryption algorithm
    const iv = crypto.randomBytes(16); // Initialization vector (random)

    const cipher = crypto.createCipheriv(algorithm, crypto.scryptSync(key, 'salt', 32), iv);

    let encrypted = cipher.update(stringArray.join(','), 'utf-8', 'hex');
    encrypted += cipher.final('hex');

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

async function createAgeProof(address, doBTimestamp, currentTimestamp, ageThreshold,uid,name) {
  // Generate the Poseidon hash
  const hash = await poseidonHash([address, doBTimestamp,uid,name]);
  console.log("wieniec");
  // Generate zk-SNARK proof and public signals
  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    {
      doBTimestamp: doBTimestamp,
      address: address,
      currentTimestamp: currentTimestamp,
      ageThreshold: ageThreshold,
      hash: hash,
      uid: uid,
      name: name,
    },
    "build/age_proof_js/age_proof.wasm",
    "circuit_age.zkey"
  );

  return { proof, publicSignals };
}

async function verifyAgeProof(address, proof, publicSignals, dIdentityContract) {
  // Load the verification key for the zk-SNARK circuit
  // const vKey = JSON.parse(fs.readFileSync("verification_key_age.json"));

  // // Verify the zk-SNARK proof using snarkjs
  // const res = await snarkjs.groth16.verify(vKey, publicSignals, proof);
  
  // // ! Just Chcking the snark js verification result
  // // Ensure the verification result is true and the date of birth hash matches the expected value
  // return res;


  try {
    // Extract proof components
    const [a, b, c] = [proof.pi_a, proof.pi_b, proof.pi_c];
    const formattedProof = {
      a: [BigInt(a[0]), BigInt(a[1])],
      b: [
        [BigInt(b[0][0]), BigInt(b[0][1])],
        [BigInt(b[1][0]), BigInt(b[1][1])]
      ],
      c: [BigInt(c[0]), BigInt(c[1])]
    };

    // Ensure public signals are in the correct format
    const formattedPublicSignals = publicSignals.map(BigInt);

    // Call the on-chain verifier contract
    const result = await contract.verifyProof(
      formattedProof.a,
      formattedProof.b,
      formattedProof.c,
      formattedPublicSignals
    );

    return result;
  } catch (error) {
    console.error("Error verifying proof:", error);
    throw error;
  }
}

async function main() {
  try {
    // Example inputs (replace with actual values)
    const address = "0x123456789abcdef";
    const doBTimestamp = 946684800; // Example: January 1, 2000 (in seconds)
    const currentTimestamp = Math.floor(Date.now() / 1000); // Current time in seconds
    const ageThreshold = 18 * 365 * 24 * 60 * 60; // Example: 18 years in seconds
    const uid = "12345";
    const name = "0x123456789abcdef";
    // Deploy a dummy dIdentityContract (replace with actual contract instance)
    const dIdentityContract = {
      getID: async (address) => {
        // Example: return a mock identity object
        return { dobHash: "0x123456789abcdef" };
      },
    };

    // Step 1: Create Age Proof
    console.log("Creating age proof...");
    const { proof, publicSignals } = await createAgeProof(address, doBTimestamp, currentTimestamp, ageThreshold,uid,name);
    console.log("Proof:", proof);
    console.log("Public Signals:", publicSignals);

    // Step 2: Verify Age Proof
    console.log("Verifying age proof...");
    const verificationResult = await verifyAgeProof(address, proof, publicSignals, dIdentityContract);
    console.log("Verification Result:", verificationResult);

  } catch (error) {
    console.error("Error:", error);
  }
}

// Run the main function
main();
