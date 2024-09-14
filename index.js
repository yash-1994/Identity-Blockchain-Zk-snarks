import { ethers } from "ethers";
import * as snarkjs from "snarkjs";
import fs from "fs";
import crypto from 'crypto';
import { buildPoseidon } from 'circomlibjs';
import { AuthContractABI, AuthContractAddress, DocumentAddress, DocumentABI } from './Constant.js';

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
const provider = new ethers.providers.JsonRpcProvider(providerUrl);

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

async function registerUser(Waddress, doB, name, uid) {
    // Create contract instance
    const authContract = new ethers.Contract(AuthContractAddress, AuthContractABI, wallet);

    // // Call authUser to assign an auth key to the user
      // const authUserTra = await authContract.authUser(Waddress);  // no need to store this in `res` since it doesn't return anything
      // authUserTra.wait();
    // Get the auth key for the user
    const key = await authContract.getAuthKey(Waddress);  // Await the result from the contract call

    // const encryptedData = encryptStringArray([Waddress, doB,uid,name], key);
    // const decrptedData = decryptStringArray(encryptedData, key);

    return key;
    const enName = encryptString(name, key);
    const enDoB = encryptString(doB, key);
    const enUid = encryptString(uid, key);

    
    //console.log("Encrypted Data: ", encryptedData);

    const documentContract = new ethers.Contract(DocumentAddress, DocumentABI, wallet);
    const tr = await documentContract.safeMint(Waddress, enUid, enDoB, enName);
    await tr.wait();
    console.log("Safeminted Succefully: ",tr);

    //Check if a key was successfully assigned
    if (key && key.length > 0) {
      console.log("Auth key assigned:", key);
    } else {
      console.log("No auth key assigned or something went wrong.");
    }
}


function encryptString(data, key) {
    const algorithm = 'aes-256-cbc'; // AES encryption algorithm
    const iv = crypto.randomBytes(16); // Initialization vector (random)

    // Create cipher with the key and iv
    const cipher = crypto.createCipheriv(algorithm, crypto.scryptSync(key, 'salt', 32), iv);

    // Encrypt the data
    let encrypted = cipher.update(data, 'utf-8', 'hex');
    encrypted += cipher.final('hex');

    // Combine iv and encrypted content
    const encryptedData = iv.toString('hex') + ':' + encrypted;
    return encryptedData;
}

function decryptString(encryptedData, key) {
    const algorithm = 'aes-256-cbc';

    // Split the iv and encrypted content
    const [ivHex, encrypted] = encryptedData.split(':');
    const iv = Buffer.from(ivHex, 'hex');

    // Create decipher with the key and iv
    const decipher = crypto.createDecipheriv(algorithm, crypto.scryptSync(key, 'salt', 32), iv);

    // Decrypt the content
    let decrypted = decipher.update(encrypted, 'hex', 'utf-8');
    decrypted += decipher.final('utf-8');
    return decrypted;
}


async function getData(address){
  const authContract = new ethers.Contract(AuthContractAddress, AuthContractABI, wallet);
  const key = await authContract.getAuthKey(address);  // Await the result from the contract call

  console.log("the key is : ", key);
  const documentContract = new ethers.Contract(DocumentAddress, DocumentABI, wallet);
  const data = await documentContract.fetchDocument(address);

  const { uid, dob, name } = data;
  orginalUID = decryptString(uid, key)
  orginalDoB = decryptString(dob, key)
  orginalName = decryptString(name, key)

  console.log("Uid is : ", orginalUID);
  console.log("Dob is : ", orginalDoB);
  console.log("Name is : ", orginalName);

  const currentTimestamp = Math.floor(Date.now() / 1000); 
  const ageThreshold = 18 * 365 * 24 * 60 * 60; // Example: 18 years in seconds
   console.log("Creating age proof...");
    const { proof, publicSignals } = await createAgeProof(address, orginalDoB, currentTimestamp, ageThreshold,orginalUID,orginalName);
    console.log("Proof:", proof);
    console.log("Public Signals:", publicSignals);


    console.log("Verifying age proof...");
    const verificationResult = await verifyAgeProof(proof, publicSignals);
    console.log("Verification Result:", verificationResult);
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

async function verifyAgeProof(proof, publicSignals) {
  // Load the verification key for the zk-SNARK circuit
   const vKey = JSON.parse(fs.readFileSync("verification_key_age.json"));


  // // Verify the zk-SNARK proof using snarkjs
  const res = await snarkjs.groth16.verify(vKey, publicSignals, proof);
  
  return res;
}

async function main() {
  try {
    console.log(contract.address);
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
    // console.log("Creating age proof...");
    // const { proof, publicSignals } = await createAgeProof(address, doBTimestamp, currentTimestamp, ageThreshold,uid,name);
    // console.log("Proof:", proof);
    // console.log("Public Signals:", publicSignals);

    // // Step 2: Verify Age Proof
    
    // console.log("Verifying age proof...");
    // const verificationResult = await verifyAgeProof(address, proof, publicSignals, dIdentityContract);
    // console.log("Verification Result:", verificationResult);


    // const data = "yash";
    // const encryptedData = encryptString(data, "6a8007b5abf3e49924bf05bd52fc9dffa4b28a839360be1bfce47bb38f108963");
    // console.log("Encrypted Data: ", encryptedData);
    // const decrptedData = decryptString("04020191266857ab991945310c0073ff:062cc193d772e4a3634cb156556de776", );
    // console.log("Decrypted Data: ", decrptedData);


    // const k = await registerUser("0xDca60Cb8F4E7409e2FC4b028973bbFA56caD2578", "dob", "name", "uid");
    // const decrptedData = decryptString("04020191266857ab991945310c0073ff:062cc193d772e4a3634cb156556de776", k);
    // console.log("Decrypted Data: ", decrptedData);

    
    getData("0xDca60Cb8F4E7409e2FC4b028973bbFA56caD2578");


  
  } catch (error) {
    console.error("Error:", error);
  }
}

// Run the main function
main();
