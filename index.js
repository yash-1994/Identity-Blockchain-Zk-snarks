import { snarkjs } from "snarkjs"; 


async function createAgeProof(signer, doBTimestamp, currentTimestamp, ageThreshold) {
    const hash = await poseidonHash([signer.address, doBTimestamp]);
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      { doBTimestamp: doBTimestamp, address: signer.address, currentTimestamp: currentTimestamp, ageThreshold: ageThreshold, hash: hash }, 
      "build/age_proof_js/age_proof.wasm", 
      "circuit_age.zkey");

    return { proof, publicSignals };
}


async function verifyAgeProof(address, proof, publicSignals, dIdentityContract) {
    const id = await dIdentityContract.getID(address);
    const vKey = JSON.parse(fs.readFileSync("verification_key_age.json"));
    const res = await snarkjs.groth16.verify(vKey, publicSignals, proof);
    return (res && (id.dobHash == publicSignals[3]));
  }