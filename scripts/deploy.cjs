const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const networkName = hre.network.name;

  console.log("=================================================");
  console.log("🚜 FarmTrace Contract Deployment");
  console.log("=================================================");
  console.log(`Network:   ${networkName}`);
  console.log(`Deployer:  ${deployer.address}`);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log(`Balance:   ${hre.ethers.formatEther(balance)} ETH`);

  if (balance === 0n && networkName === "sepolia") {
    console.warn("⚠️ Warning: Deployer balance is 0 Sepolia ETH. Deployment may fail if gas cannot be covered.");
  }

  console.log("\nDeploying FarmTrace smart contract...");
  const FarmTraceFactory = await hre.ethers.getContractFactory("FarmTrace");
  const farmTrace = await FarmTraceFactory.deploy();

  await farmTrace.waitForDeployment();
  const contractAddress = await farmTrace.getAddress();
  const deployTx = farmTrace.deploymentTransaction();

  console.log(`\n✅ FarmTrace deployed successfully!`);
  console.log(`Contract Address: ${contractAddress}`);
  if (deployTx) {
    console.log(`Deployment Tx:    ${deployTx.hash}`);
  }

  // Extract ABI from the compiled artifact
  const artifactPath = path.join(__dirname, "../artifacts/contracts/FarmTrace.sol/FarmTrace.json");
  let contractArtifact;
  if (fs.existsSync(artifactPath)) {
    contractArtifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  } else {
    throw new Error(`Artifact not found at ${artifactPath}. Please run hardhat compile first.`);
  }

  // Ensure src/contracts directory exists
  const contractsDir = path.join(__dirname, "../src/contracts");
  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir, { recursive: true });
  }

  // Save frontend configuration
  const config = {
    address: contractAddress,
    network: networkName,
    chainId: networkName === "sepolia" ? 11155111 : 31337,
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
    txHash: deployTx ? deployTx.hash : null,
    abi: contractArtifact.abi
  };

  const configPath = path.join(contractsDir, "contractConfig.json");
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log(`\nFrontend contract config saved to: ${configPath}`);

  // Also write FarmTraceABI.ts for strong typing in frontend
  const tsAbiContent = `// Auto-generated from Hardhat deployment
export const FARMTRACE_CONTRACT_ADDRESS = "${contractAddress}";
export const FARMTRACE_DEFAULT_CHAIN_ID = ${networkName === "sepolia" ? 11155111 : 11155111};
export const FARMTRACE_ABI = ${JSON.stringify(contractArtifact.abi, null, 2)} as const;
`;
  fs.writeFileSync(path.join(contractsDir, "contractData.ts"), tsAbiContent);
  console.log(`TypeScript ABI helper saved to: ${path.join(contractsDir, "contractData.ts")}`);

  if (networkName === "sepolia") {
    console.log("\n=================================================");
    console.log("🔍 To verify contract on Sepolia Etherscan:");
    console.log(`npx hardhat verify --network sepolia ${contractAddress}`);
    console.log(`Etherscan: https://sepolia.etherscan.io/address/${contractAddress}`);
    console.log("=================================================");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
