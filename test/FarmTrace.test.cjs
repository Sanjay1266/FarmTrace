const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("FarmTrace Smart Contract", function () {
  let farmTrace;
  let owner;
  let org1;
  let processor;
  let distributor;
  let retailer;
  let unauthorizedUser;

  // Stages enum mapping matching Solidity contract:
  // Harvested = 0, ProcessingReceived = 1, ProcessingCompleted = 2,
  // Packaged = 3, Dispatched = 4, DistributorReceived = 5, RetailerReceived = 6
  const Stage = {
    Harvested: 0,
    ProcessingReceived: 1,
    ProcessingCompleted: 2,
    Packaged: 3,
    Dispatched: 4,
    DistributorReceived: 5,
    RetailerReceived: 6,
  };

  beforeEach(async function () {
    [owner, org1, processor, distributor, retailer, unauthorizedUser] =
      await ethers.getSigners();

    const FarmTraceFactory = await ethers.getContractFactory("FarmTrace");
    farmTrace = await FarmTraceFactory.deploy();
    await farmTrace.waitForDeployment();

    // Authorize org1 as an agricultural organization
    await farmTrace.setOrganization(org1.address, true);

    // Authorize processor for ProcessingReceived and ProcessingCompleted
    await farmTrace.authorizeParticipant(
      processor.address,
      [Stage.ProcessingReceived, Stage.ProcessingCompleted],
      "Processing Unit - Green Valley Agro Mill"
    );

    // Authorize distributor for Dispatched and DistributorReceived
    await farmTrace.authorizeParticipant(
      distributor.address,
      [Stage.Dispatched, Stage.DistributorReceived],
      "Logistics & Distribution - AgriFreight Hub"
    );

    // Authorize retailer for RetailerReceived
    await farmTrace.authorizeParticipant(
      retailer.address,
      [Stage.RetailerReceived],
      "Retail Partner - Organic Fresh Market"
    );
  });

  describe("Deployment and Access Control Setup", function () {
    it("should set deployer as owner and organization", async function () {
      expect(await farmTrace.owner()).to.equal(owner.address);
      expect(await farmTrace.isOrganization(owner.address)).to.be.true;
      expect(await farmTrace.isOrganization(org1.address)).to.be.true;
    });

    it("should allow owner to authorize and revoke organizations", async function () {
      await farmTrace.setOrganization(unauthorizedUser.address, true);
      expect(await farmTrace.isOrganization(unauthorizedUser.address)).to.be.true;

      await farmTrace.setOrganization(unauthorizedUser.address, false);
      expect(await farmTrace.isOrganization(unauthorizedUser.address)).to.be.false;
    });

    it("should reject non-owners from setting organization status", async function () {
      await expect(
        farmTrace.connect(unauthorizedUser).setOrganization(org1.address, false)
      ).to.be.revertedWithCustomError(farmTrace, "Unauthorized");
    });

    it("should allow owner to transfer ownership", async function () {
      await farmTrace.transferOwnership(org1.address);
      expect(await farmTrace.owner()).to.equal(org1.address);
    });

    it("should reject transferring ownership to zero address", async function () {
      await expect(
        farmTrace.transferOwnership(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(farmTrace, "ZeroAddressNotAllowed");
    });
  });

  describe("Farmer Registration", function () {
    it("should allow an authorized organization to register a farmer", async function () {
      const tx = await farmTrace.connect(org1).registerFarmer(
        "FARMER-101",
        "Ramesh Patel",
        "Wayanad, Kerala, India",
        "Wayanad Organic Farmers Cooperative",
        ethers.ZeroAddress
      );

      await expect(tx)
        .to.emit(farmTrace, "FarmerRegistered")
        .withArgs(
          "FARMER-101",
          "Ramesh Patel",
          "Wayanad Organic Farmers Cooperative",
          org1.address,
          (ts) => ts > 0
        );

      const farmer = await farmTrace.getFarmer("FARMER-101");
      expect(farmer.farmerId).to.equal("FARMER-101");
      expect(farmer.name).to.equal("Ramesh Patel");
      expect(farmer.location).to.equal("Wayanad, Kerala, India");
      expect(farmer.organization).to.equal("Wayanad Organic Farmers Cooperative");
      expect(farmer.registeredBy).to.equal(org1.address);
      expect(farmer.exists).to.be.true;

      const allFarmers = await farmTrace.getAllFarmerIds();
      expect(allFarmers).to.deep.equal(["FARMER-101"]);
    });

    it("should reject duplicate farmer IDs", async function () {
      await farmTrace.registerFarmer(
        "FARMER-101",
        "Ramesh Patel",
        "Wayanad, Kerala, India",
        "Cooperative",
        ethers.ZeroAddress
      );

      await expect(
        farmTrace.registerFarmer(
          "FARMER-101",
          "Duplicate Name",
          "Different Location",
          "Cooperative",
          ethers.ZeroAddress
        )
      ).to.be.revertedWithCustomError(farmTrace, "FarmerAlreadyExists")
        .withArgs("FARMER-101");
    });

    it("should reject unauthorized callers from registering farmers", async function () {
      await expect(
        farmTrace.connect(unauthorizedUser).registerFarmer(
          "FARMER-102",
          "Sita Devi",
          "Shimla, HP, India",
          "Apple Growers FPO",
          ethers.ZeroAddress
        )
      ).to.be.revertedWithCustomError(farmTrace, "Unauthorized");
    });

    it("should reject empty required fields when registering farmers", async function () {
      await expect(
        farmTrace.registerFarmer("", "Name", "Loc", "Org", ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(farmTrace, "InvalidInput");

      await expect(
        farmTrace.registerFarmer("F-1", "", "Loc", "Org", ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(farmTrace, "InvalidInput");
    });

    it("should revert getFarmer for non-existent farmer ID", async function () {
      await expect(
        farmTrace.getFarmer("NON-EXISTENT")
      ).to.be.revertedWithCustomError(farmTrace, "FarmerNotFound");
    });
  });

  describe("Product Batch Registration", function () {
    let now;

    beforeEach(async function () {
      now = await time.latest();
      await farmTrace.registerFarmer(
        "FARMER-101",
        "Ramesh Patel",
        "Wayanad, Kerala, India",
        "Wayanad Organic Farmers Cooperative",
        ethers.ZeroAddress
      );
    });

    it("should allow an authorized organization to register a batch", async function () {
      const harvestDate = now - 3600; // 1 hour ago
      const tx = await farmTrace.connect(org1).registerBatch(
        "FT-000001",
        "Single Origin Arabica Coffee",
        "Coffee & Tea",
        "FARMER-101",
        "Wayanad Organic Farmers Cooperative",
        "Wayanad, Kerala, India",
        harvestDate,
        "Shade grown, hand picked"
      );

      await expect(tx)
        .to.emit(farmTrace, "BatchRegistered")
        .withArgs(
          "FT-000001",
          "Single Origin Arabica Coffee",
          "FARMER-101",
          org1.address,
          harvestDate,
          (ts) => ts > 0
        );

      const batch = await farmTrace.getBatch("FT-000001");
      expect(batch.batchId).to.equal("FT-000001");
      expect(batch.productName).to.equal("Single Origin Arabica Coffee");
      expect(batch.category).to.equal("Coffee & Tea");
      expect(batch.farmerId).to.equal("FARMER-101");
      expect(batch.currentStage).to.equal(Stage.Harvested);
      expect(batch.exists).to.be.true;

      // Check initial event automatically appended
      const events = await farmTrace.getBatchEvents("FT-000001");
      expect(events.length).to.equal(1);
      expect(events[0].stage).to.equal(Stage.Harvested);
      expect(events[0].stageName).to.equal("Harvested");
      expect(events[0].location).to.equal("Wayanad, Kerala, India");
      expect(events[0].actor).to.equal(org1.address);
      expect(events[0].notes).to.equal("Shade grown, hand picked");

      // Check counts
      const counts = await farmTrace.getCounts();
      expect(counts.totalFarmers).to.equal(1);
      expect(counts.totalBatches).to.equal(1);
      expect(counts.totalEvents).to.equal(1);
    });

    it("should reject future harvest dates", async function () {
      const futureHarvest = (await time.latest()) + 7200; // 2 hours ahead
      await expect(
        farmTrace.registerBatch(
          "FT-000002",
          "Robusta Coffee",
          "Coffee",
          "FARMER-101",
          "Org",
          "Loc",
          futureHarvest,
          "Future batch"
        )
      ).to.be.revertedWithCustomError(farmTrace, "FutureHarvestDate");
    });

    it("should reject batch registration with unknown farmer ID", async function () {
      const harvestDate = await time.latest();
      await expect(
        farmTrace.registerBatch(
          "FT-000003",
          "Coffee",
          "Coffee",
          "UNKNOWN-FARMER",
          "Org",
          "Loc",
          harvestDate,
          ""
        )
      ).to.be.revertedWithCustomError(farmTrace, "FarmerNotFound");
    });

    it("should reject duplicate batch IDs", async function () {
      const harvestDate = await time.latest();
      await farmTrace.registerBatch(
        "FT-000001",
        "Coffee",
        "Coffee",
        "FARMER-101",
        "Org",
        "Loc",
        harvestDate,
        ""
      );

      await expect(
        farmTrace.registerBatch(
          "FT-000001",
          "Another Coffee",
          "Coffee",
          "FARMER-101",
          "Org",
          "Loc",
          harvestDate,
          ""
        )
      ).to.be.revertedWithCustomError(farmTrace, "BatchAlreadyExists")
        .withArgs("FT-000001");
    });

    it("should reject unauthorized callers from registering batches", async function () {
      const harvestDate = await time.latest();
      await expect(
        farmTrace.connect(unauthorizedUser).registerBatch(
          "FT-000004",
          "Coffee",
          "Coffee",
          "FARMER-101",
          "Org",
          "Loc",
          harvestDate,
          ""
        )
      ).to.be.revertedWithCustomError(farmTrace, "Unauthorized");
    });
  });

  describe("Supply-Chain Event Tracking & Stage Transitions", function () {
    beforeEach(async function () {
      await farmTrace.registerFarmer(
        "FARMER-101",
        "Ramesh Patel",
        "Wayanad, Kerala, India",
        "Wayanad Organic Farmers Cooperative",
        ethers.ZeroAddress
      );
      const harvestDate = await time.latest();
      await farmTrace.registerBatch(
        "FT-000001",
        "Single Origin Arabica Coffee",
        "Coffee & Tea",
        "FARMER-101",
        "Wayanad Organic Farmers Cooperative",
        "Wayanad, Kerala, India",
        harvestDate,
        "Harvested"
      );
    });

    it("should allow authorized participants to record authorized stages", async function () {
      const eventTime = await time.latest();

      // Processor records Stage.ProcessingReceived
      await expect(
        farmTrace.connect(processor).appendSupplyChainEvent(
          "FT-000001",
          Stage.ProcessingReceived,
          "Green Valley Processing Facility, Calicut",
          eventTime,
          "Batch received, moisture level 11.2%"
        )
      ).to.emit(farmTrace, "SupplyChainEventAppended");

      // Processor records Stage.ProcessingCompleted
      await farmTrace.connect(processor).appendSupplyChainEvent(
        "FT-000001",
        Stage.ProcessingCompleted,
        "Green Valley Processing Facility, Calicut",
        eventTime,
        "Hulled, graded Grade-A, roasted light-medium"
      );

      // Org/Admin packages the batch
      await farmTrace.connect(org1).appendSupplyChainEvent(
        "FT-000001",
        Stage.Packaged,
        "Packaging Unit 4, Kochi",
        eventTime,
        "Nitrogen flushed 250g valve bags"
      );

      // Distributor records Dispatched
      await farmTrace.connect(distributor).appendSupplyChainEvent(
        "FT-000001",
        Stage.Dispatched,
        "Kochi Logistics Hub",
        eventTime,
        "Loaded into temperature-controlled truck TN-45-A-1234"
      );

      // Distributor records DistributorReceived
      await farmTrace.connect(distributor).appendSupplyChainEvent(
        "FT-000001",
        Stage.DistributorReceived,
        "Bengaluru Central Depot",
        eventTime,
        "Received at distribution center in good condition"
      );

      // Retailer records RetailerReceived
      await farmTrace.connect(retailer).appendSupplyChainEvent(
        "FT-000001",
        Stage.RetailerReceived,
        "Organic Fresh Market, Indiranagar, Bengaluru",
        eventTime,
        "Shelved on organic coffee aisle"
      );

      const batch = await farmTrace.getBatch("FT-000001");
      expect(batch.currentStage).to.equal(Stage.RetailerReceived);

      const events = await farmTrace.getBatchEvents("FT-000001");
      expect(events.length).to.equal(7); // 1 harvest + 6 transitions
      expect(events[6].stage).to.equal(Stage.RetailerReceived);
      expect(events[6].actor).to.equal(retailer.address);
      expect(events[6].notes).to.equal("Shelved on organic coffee aisle");
    });

    it("should reject unauthorized participant for a stage", async function () {
      const eventTime = await time.latest();
      // Retailer is only authorized for RetailerReceived, not ProcessingReceived
      await expect(
        farmTrace.connect(retailer).appendSupplyChainEvent(
          "FT-000001",
          Stage.ProcessingReceived,
          "Retailer Warehouse",
          eventTime,
          "Invalid attempt"
        )
      ).to.be.revertedWithCustomError(farmTrace, "UnauthorizedForStage")
        .withArgs(retailer.address, Stage.ProcessingReceived);
    });

    it("should reject invalid stage transitions (e.g. dispatch before packaged)", async function () {
      const eventTime = await time.latest();
      // Currently at Stage.Harvested; trying to jump directly to Dispatched without Packaged
      await expect(
        farmTrace.connect(distributor).appendSupplyChainEvent(
          "FT-000001",
          Stage.Dispatched,
          "Kochi Hub",
          eventTime,
          "Skipping packaging"
        )
      ).to.be.revertedWithCustomError(farmTrace, "InvalidStageTransition")
        .withArgs(Stage.Dispatched, Stage.Harvested);
    });

    it("should reject repeating or moving backward in stages", async function () {
      const eventTime = await time.latest();
      await farmTrace.connect(processor).appendSupplyChainEvent(
        "FT-000001",
        Stage.ProcessingReceived,
        "Calicut Mill",
        eventTime,
        "Received"
      );

      // Attempting to record ProcessingReceived again
      await expect(
        farmTrace.connect(processor).appendSupplyChainEvent(
          "FT-000001",
          Stage.ProcessingReceived,
          "Calicut Mill",
          eventTime,
          "Duplicate stage"
        )
      ).to.be.revertedWithCustomError(farmTrace, "InvalidStageTransition");
    });

    it("should allow revoking participant stage permissions and block them afterwards", async function () {
      const eventTime = await time.latest();
      // Revoke processor's permission for ProcessingReceived
      await farmTrace.revokeParticipantStages(processor.address, [Stage.ProcessingReceived]);

      await expect(
        farmTrace.connect(processor).appendSupplyChainEvent(
          "FT-000001",
          Stage.ProcessingReceived,
          "Calicut Mill",
          eventTime,
          "Unauthorized attempt after revoke"
        )
      ).to.be.revertedWithCustomError(farmTrace, "UnauthorizedForStage");
    });

    it("should accurately track farmer associated batch IDs and all batch IDs", async function () {
      const allBatches = await farmTrace.getAllBatchIds();
      expect(allBatches).to.deep.equal(["FT-000001"]);

      const farmerBatches = await farmTrace.getFarmerBatchIds("FARMER-101");
      expect(farmerBatches).to.deep.equal(["FT-000001"]);
    });
  });

  describe("Corrections and Traceability", function () {
    beforeEach(async function () {
      await farmTrace.registerFarmer(
        "FARMER-101",
        "Ramesh Patel",
        "Wayanad, Kerala, India",
        "Wayanad Organic Farmers Cooperative",
        ethers.ZeroAddress
      );
      const harvestDate = await time.latest();
      await farmTrace.registerBatch(
        "FT-000001",
        "Arabica Coffee Beans",
        "Coffee",
        "FARMER-101",
        "Wayanad Organic Farmers Cooperative",
        "Wayanad, Kerala, India",
        harvestDate,
        "Harvested"
      );
    });

    it("should allow an authorized organization to record a transparent correction", async function () {
      const tx = await farmTrace.connect(org1).recordBatchCorrection(
        "FT-000001",
        "productName",
        "Single Origin Premium Arabica AA Coffee",
        "Grading revised after moisture & screen sizing analysis"
      );

      await expect(tx)
        .to.emit(farmTrace, "BatchCorrectionRecorded")
        .withArgs(
          "FT-000001",
          0,
          "productName",
          "Arabica Coffee Beans",
          "Single Origin Premium Arabica AA Coffee",
          "Grading revised after moisture & screen sizing analysis",
          org1.address,
          (ts) => ts > 0
        );

      // Verify the batch effective field was updated
      const batch = await farmTrace.getBatch("FT-000001");
      expect(batch.productName).to.equal("Single Origin Premium Arabica AA Coffee");

      // Verify historical audit trail was recorded and preserved
      const corrections = await farmTrace.getBatchCorrections("FT-000001");
      expect(corrections.length).to.equal(1);
      expect(corrections[0].fieldName).to.equal("productName");
      expect(corrections[0].previousValue).to.equal("Arabica Coffee Beans");
      expect(corrections[0].newValue).to.equal("Single Origin Premium Arabica AA Coffee");
      expect(corrections[0].reason).to.equal(
        "Grading revised after moisture & screen sizing analysis"
      );
      expect(corrections[0].correctedBy).to.equal(org1.address);
    });

    it("should reject unauthorized users from recording corrections", async function () {
      await expect(
        farmTrace.connect(unauthorizedUser).recordBatchCorrection(
          "FT-000001",
          "productName",
          "Tampered Name",
          "Unauthorized change"
        )
      ).to.be.revertedWithCustomError(farmTrace, "Unauthorized");
    });

    it("should reject correction on unsupported field or non-existent batch", async function () {
      await expect(
        farmTrace.recordBatchCorrection(
          "FT-000001",
          "unsupportedField",
          "Val",
          "Reason"
        )
      ).to.be.revertedWithCustomError(farmTrace, "InvalidInput");

      await expect(
        farmTrace.recordBatchCorrection(
          "FT-NONEXISTENT",
          "productName",
          "Val",
          "Reason"
        )
      ).to.be.revertedWithCustomError(farmTrace, "BatchNotFound");
    });
  });
});
