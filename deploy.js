import { ethers } from "ethers";

// RPC URL for Etherlink Ghosnet testnet
const rpcURL = 'https://node.ghostnet.etherlink.com'; // Correct RPC URL
const provider = new ethers.JsonRpcProvider(rpcURL);

// Replace with your Ethereum address and private key
const account = '0x7308f1e2E8F4FD608fBF029c2D71F5669770d4E0'; // Your account address here
const privateKey = '6a8007b5abf3e49924bf05bd52fc9dffa4b28a839360be1bfce47bb38f108963'; // Your private key here

// Create a wallet with the private key and connect it to the provider
const wallet = new ethers.Wallet(privateKey, provider);

// Contract ABI and Bytecode
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

// Replace with the bytecode of the compiled contract
const contractBytecode = "608060405234801561001057600080fd5b506107c5806100206000396000f3fe608060405234801561001057600080fd5b506004361061002b5760003560e01c8063f398789b14610030575b600080fd5b61004a600480360381019061004591906106f4565b610060565b6040516100579190610768565b60405180910390f35b600061061d565b7f30644e72e131a029b85045b68181585d2833e84879b9709143e1f593f00000018110610098576000805260206000f35b50565b600060405183815284602082015285604082015260408160608360076107d05a03fa9150816100ce576000805260206000f35b825160408201526020830151606082015260408360808360066107d05a03fa9150816100fe576000805260206000f35b505050505050565b600060808601600087017f1a32840f346b9ce36bc30b0dcf7eb94a2b1ffe4191dd35a761c9ac5d95da516a81527f056f95b6fdd7118e5654f3fb0b463a54df364fd86b2de656a53550b18b50a54c60208201526101a960008801357f28cf4bd2065be402915d9149fbd409a256aa6e83b8740af321ee1ce6b2c8b6227f1c98f46f9ab398d044203486e2a6a3b51770995474dbb409af4f84fd12935a7e8461009b565b6101f960208801357f10af48969617a8df1e667dfd9855591dcaf0a58ad1a9cfca7124e80cc4da1ae97f2ebe454459c733328e02d375c3d83824566878e46ef6aecf6b8bc5433059cdcd8461009b565b61024960408801357f2f1185271cfc7ef9664e46d86e39c29ad8dfa17f949aa63ddf92428af4fc1f527f2b3338c296da3c6bbd1a1972a19c8d6f0c0dcaa30262854e6984d38adb172ab98461009b565b61029960608801357f12be94e1c9289aba89fd2099618859d9cf260e1a20f7ad89811e382a03188b4a7f0b6bfcbd84341bc005a196bebc6caff5d524d945adac09e44502b0c17a592aee8461009b565b6102e960808801357f19371afc485933c5aaf64fa3e52a12f2e08f99a86c6c597d3d45e440421226347f0f391a818e33a71157bb3cd213fcc8bb7eee5c323ff09d74c160fd007af9638b8461009b565b61033960a08801357f0cdedd5435a81d71140a23e56e84287e0bd42c694f975c0b11cbe24f30e7bc167f137a4828c79d22ee8a277f1a8ede43df3e347f8bdce6bdf8e81c7f81b94719da8461009b565b833582527f30644e72e131a029b85045b68181585d97816a916871ca8d3c208c16d87cfd4760208501357f30644e72e131a029b85045b68181585d97816a916871ca8d3c208c16d87cfd4703066020830152843560408301526020850135606083015260408501356080830152606085013560a08301527f2d4d9aa7e302d9df41749d5507949d05dbea33fbb16c643b22f599a2be6df2e260c08301527f14bedd503c37ceb061d8ec60209fe345ce89830a19230301f076caff004d192660e08301527f0967032fcbf776d1afc985f88877f182d38480a653f2decaa9794cbc3bf3060c6101008301527f0e187847ad4c798374d0d6732bf501847dd68bc0e071241e0213bc7fc13db7ab6101208301527f304cfbd1e08a704a99f5e847d93f8c3caafddec46b7a0d379da69a4d112346a76101408301527f1739c1b1a457a8c7313123d24d2f9192f896b7c63eea05a9d57f06547ad0cec8610160830152600088015161018083015260206000018801516101a08301527f198e9393920d483a7260bfb731fb5d25f1aa493335a9e71297e485b7aef312c26101c08301527f1800deef121f1e76426a00665e5c4479674322d4f75edadd46debd5cd992f6ed6101e08301527f090689d0585ff075ec9e99ad690c3395bc4b313370b38ef355acdadcd122975b6102008301527f12c85ea5db8c6deb4aab71808dcb408fe3d1e7690c43d37b4ce6cc0166fa7daa610220830152853561024083015260208601356102608301527f198e9393920d483a7260bfb731fb5d25f1aa493335a9e71297e485b7aef312c26102808301527f1800deef121f1e76426a00665e5c4479674322d4f75edadd46debd5cd992f6ed6102a08301527f090689d0585ff075ec9e99ad690c3395bc4b313370b38ef355acdadcd122975b6102c08301527f12c85ea5db8c6deb4aab71808dcb408fe3d1e7690c43d37b4ce6cc0166fa7daa6102e08301526020826103008460086107d05a03fa82518116935050505095945050505050565b60405161038081016040526106356000840135610067565b6106426020840135610067565b61064f6040840135610067565b61065c6060840135610067565b6106696080840135610067565b61067660a0840135610067565b61068360c0840135610067565b610690818486888a610106565b8060005260206000f35b6000819050826040600202820111156106b257600080fd5b92915050565b6000819050826020600202820111156106d057600080fd5b92915050565b6000819050826020600602820111156106ee57600080fd5b92915050565b6000806000806101c0858703121561070b57600080fd5b6000610719878288016106b8565b945050604061072a8782880161069a565b93505060c061073b878288016106b8565b92505061010061074d878288016106d6565b91505092959194509250565b61076281610783565b82525050565b600060208201905061077d6000830184610759565b92915050565b6000811515905091905056fea264697066735822122014465785251cbfe64967f7737655be8d95b351d2bf4f0354fe913a1d664b359664736f6c63430008000033"; // Replace with the bytecode of the compiled contract

// Create a contract factory
const contractFactory = new ethers.ContractFactory(contractABI, contractBytecode, wallet);

// Deploy the contract
async function deployContract() {
    try {
        console.log('Deploying contract...');
        const contract = await contractFactory.deploy();
        console.log('Contract deployment transaction hash:', contract);

        // Wait for deployment to be mined
        // await contract.wait();
		const adddd = contract.address;
        console.log('Contract deployed at:', adddd);
        console.log('Contract deployed in block:', (await provider.getBlockNumber()).toString());

        return contract;
    } catch (error) {
        console.error('Error deploying contract:', error.message);
        throw error; // Rethrow error to handle in the main function
    }
}



// Main function
(async () => {
    try {
        const contract = await deployContract();
        await contract.wait();
    } catch (error) {
        console.error('Error in main function:', error.message);
	}
})();