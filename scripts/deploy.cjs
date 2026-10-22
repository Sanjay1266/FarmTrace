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

  // Seed on-chain data if deploying to localhost/hardhat
  if (networkName === "localhost" || networkName === "hardhat") {
    console.log("\n🌱 Seeding initial on-chain farmers and batches on local blockchain...");

    // Register 3 Farmers on-chain
    await (await farmTrace.registerFarmer(
      "FARMER-101",
      "Ramesh Patel",
      "Mananthavady, Wayanad, Kerala, India",
      "Wayanad Organic Farmers Cooperative (WOFC)",
      "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
    )).wait();
    console.log("  ✓ Seeded on-chain Farmer: FARMER-101 (Ramesh Patel)");

    await (await farmTrace.registerFarmer(
      "FARMER-102",
      "Sunita Sharma",
      "Palampur, Kangra District, Himachal Pradesh, India",
      "Himalayan Agro Ecology FPO",
      "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"
    )).wait();
    console.log("  ✓ Seeded on-chain Farmer: FARMER-102 (Sunita Sharma)");

    await (await farmTrace.registerFarmer(
      "FARMER-103",
      "Anand Kulkarni",
      "Devgad, Ratnagiri District, Maharashtra, India",
      "Konkan Heritage Fruit Producers Collective",
      "0x90F79bf6EB2c4f870365E785982E1f101E93b906"
    )).wait();
    console.log("  ✓ Seeded on-chain Farmer: FARMER-103 (Anand Kulkarni)");

    // Register 3 Product Batches and progress their stages on-chain
    const nowSec = Math.floor(Date.now() / 1000);
    const daySec = 86400;

    await (await farmTrace.registerBatch(
      "FT-000001",
      "Single Origin Premium Arabica AA Coffee",
      "Coffee & Tea",
      "FARMER-101",
      "Wayanad Organic Farmers Cooperative (WOFC)",
      "Mananthavady, Wayanad, Kerala, India",
      nowSec - 10 * daySec,
      "Hand-picked ripe red Arabica cherries at 1100m elevation. Shade grown beneath native forest canopy."
    )).wait();

    await (await farmTrace.appendSupplyChainEvent(
      "FT-000001",
      1, // ProcessingReceived
      "Wayanad Wet Mill #2, Sultan Bathery, Kerala",
      nowSec - 8 * daySec,
      "Inward consignment inspection: moisture level 11.2%, defect count < 1.5%."
    )).wait();

    await (await farmTrace.appendSupplyChainEvent(
      "FT-000001",
      2, // ProcessingCompleted
      "Wayanad Wet Mill #2, Sultan Bathery, Kerala",
      nowSec - 7 * daySec,
      "Pulping, 36h wet fermentation, sun-dried on raised African beds to 10.5% moisture. Graded AA screen 18+."
    )).wait();

    await (await farmTrace.appendSupplyChainEvent(
      "FT-000001",
      3, // Packaged
      "WOFC Central Packing House, Kalpetta, Wayanad",
      nowSec - 5 * daySec,
      "Vacuum-sealed in 250g nitrogen-flushed multilayer foil pouches with one-way degassing valves."
    )).wait();

    await (await farmTrace.appendSupplyChainEvent(
      "FT-000001",
      4, // Dispatched
      "WOFC Logistics Depot, Kozhikode Highway",
      nowSec - 4 * daySec,
      "Handed to refrigerated logistics carrier consignment #KL-WY-94812. Target temperature 18°C-22°C."
    )).wait();

    await (await farmTrace.appendSupplyChainEvent(
      "FT-000001",
      5, // DistributorReceived
      "South India Agro Hub, Peenya Industrial Area, Bengaluru, Karnataka",
      nowSec - 2 * daySec,
      "Received and scanned into warehouse rack B-14. Temperature logging sensor data verified intact."
    )).wait();

    await (await farmTrace.appendSupplyChainEvent(
      "FT-000001",
      6, // RetailerReceived
      "The Roastery & Co. Artisan Retail, Indiranagar, Bengaluru, Karnataka",
      nowSec - 1 * daySec,
      "Placed on retail display shelf. QR shelf-talker affixed. Retail verification active."
    )).wait();
    console.log("  ✓ Seeded on-chain Batch: FT-000001 (Fully verified - RetailerReceived)");

    await (await farmTrace.registerBatch(
      "FT-000002",
      "Traditional Himalayan Organic Basmati Rice",
      "Grains & Cereals",
      "FARMER-102",
      "Himalayan Agro Ecology FPO",
      "Palampur, Kangra District, Himachal Pradesh, India",
      nowSec - 15 * daySec,
      "Glacier water irrigated, zero synthetic fertilizers. Aromatic Taraori traditional variety."
    )).wait();

    await (await farmTrace.appendSupplyChainEvent(
      "FT-000002",
      1,
      "Kangra Valley Agro Processing Facility, Nagrota Bagwan, HP",
      nowSec - 12 * daySec,
      "Paddy inward batch verified. Average grain elongation ratio 2.1x after test cooking."
    )).wait();

    await (await farmTrace.appendSupplyChainEvent(
      "FT-000002",
      2,
      "Kangra Valley Agro Processing Facility, Nagrota Bagwan, HP",
      nowSec - 10 * daySec,
      "Dehusked, polished using cold-roller tech, sorted by optical color sorter."
    )).wait();

    await (await farmTrace.appendSupplyChainEvent(
      "FT-000002",
      3,
      "Himalayan FPO Packaging Center, Dharamshala, HP",
      nowSec - 6 * daySec,
      "Packaged in 1kg tamper-evident breathable woven jute bags with inner food-grade liner."
    )).wait();
    console.log("  ✓ Seeded on-chain Batch: FT-000002 (Packaged & Labeled)");

    await (await farmTrace.registerBatch(
      "FT-000003",
      "GI-Tagged Devgad Alphonso (Hapus) Mangoes",
      "Fresh Fruits",
      "FARMER-103",
      "Konkan Heritage Fruit Producers Collective",
      "Devgad, Ratnagiri District, Maharashtra, India",
      nowSec - 3 * daySec,
      "Naturally ripened using rice hay. Zero carbide or chemical ripening agents. Certified Geographical Indication."
    )).wait();
    console.log("  ✓ Seeded on-chain Batch: FT-000003 (Harvested at farm)");
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
export const FARMTRACE_DEFAULT_CHAIN_ID = ${networkName === "sepolia" ? 11155111 : 31337};
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
