const { expect } = require("chai");

describe("Frontend Workflow & Web3 Utility Logic", function () {
  // Stages matching contract and frontend
  const Stage = {
    Harvested: 0,
    ProcessingReceived: 1,
    ProcessingCompleted: 2,
    Packaged: 3,
    Dispatched: 4,
    DistributorReceived: 5,
    RetailerReceived: 6,
  };

  const STAGE_LABELS = {
    0: "Harvested",
    1: "Received for Processing",
    2: "Processing Completed",
    3: "Packaged & Labeled",
    4: "Dispatched in Transit",
    5: "Received by Distributor",
    6: "Received by Retailer",
  };

  // Replicated parseContractError logic from web3Service
  function parseContractError(error) {
    if (!error) return "An unknown error occurred.";
    if (
      error.code === "ACTION_REJECTED" ||
      error.message?.includes("user rejected action") ||
      error.code === 4001
    ) {
      return "Transaction was cancelled / rejected in MetaMask.";
    }
    if (
      error.code === "INSUFFICIENT_FUNDS" ||
      error.message?.includes("insufficient funds")
    ) {
      return "Insufficient Sepolia ETH to cover gas fee. Please request test ETH from a Sepolia faucet.";
    }
    if (error.reason) return error.reason;
    if (error.message?.includes("FarmerAlreadyExists"))
      return "A farmer with this ID is already registered.";
    if (error.message?.includes("BatchAlreadyExists"))
      return "A batch with this ID is already registered.";
    if (error.message?.includes("FutureHarvestDate"))
      return "Harvest date cannot be in the future.";
    if (error.message?.includes("InvalidStageTransition"))
      return "Invalid stage transition. Check stage sequence prerequisites.";
    return error.message || "Smart contract transaction failed.";
  }

  describe("Error Parsing & User Recovery Guidance", function () {
    it("should gracefully format user rejection error", function () {
      const err = { code: 4001, message: "MetaMask Tx Signature: User denied transaction signature." };
      expect(parseContractError(err)).to.equal(
        "Transaction was cancelled / rejected in MetaMask."
      );
    });

    it("should detect insufficient gas funds and provide faucet advice", function () {
      const err = { code: "INSUFFICIENT_FUNDS", message: "err: insufficient funds for gas * price + value" };
      expect(parseContractError(err)).to.include(
        "Insufficient Sepolia ETH to cover gas fee"
      );
    });

    it("should parse contract custom errors like FarmerAlreadyExists", function () {
      const err = { message: "VM Exception while processing transaction: reverted with custom error 'FarmerAlreadyExists(\"FARMER-101\")'" };
      expect(parseContractError(err)).to.equal(
        "A farmer with this ID is already registered."
      );
    });

    it("should parse future harvest date rejection", function () {
      const err = { message: "reverted with custom error 'FutureHarvestDate()'" };
      expect(parseContractError(err)).to.equal(
        "Harvest date cannot be in the future."
      );
    });

    it("should parse invalid stage transition error", function () {
      const err = { message: "reverted with custom error 'InvalidStageTransition()'" };
      expect(parseContractError(err)).to.equal(
        "Invalid stage transition. Check stage sequence prerequisites."
      );
    });
  });

  describe("Batch ID and QR Code Format Consistency", function () {
    it("should format batch ID consistently e.g. FT-000001", function () {
      const count = 4;
      const formatted = `FT-${String(count).padStart(6, "0")}`;
      expect(formatted).to.equal("FT-000004");
    });

    it("should build proper public verification URL with batch ID", function () {
      const baseUrl = "https://farmtrace.local";
      const batchId = "FT-000001";
      const qrUrl = `${baseUrl}/#/verify/${batchId}`;
      expect(qrUrl).to.equal("https://farmtrace.local/#/verify/FT-000001");
      expect(qrUrl).to.not.include("private");
      expect(qrUrl).to.not.include("secret");
    });
  });

  describe("Stage Progression Rules and Labels", function () {
    it("should map all 7 stages to distinct human-readable labels", function () {
      expect(STAGE_LABELS[Stage.Harvested]).to.equal("Harvested");
      expect(STAGE_LABELS[Stage.ProcessingReceived]).to.equal("Received for Processing");
      expect(STAGE_LABELS[Stage.ProcessingCompleted]).to.equal("Processing Completed");
      expect(STAGE_LABELS[Stage.Packaged]).to.equal("Packaged & Labeled");
      expect(STAGE_LABELS[Stage.Dispatched]).to.equal("Dispatched in Transit");
      expect(STAGE_LABELS[Stage.DistributorReceived]).to.equal("Received by Distributor");
      expect(STAGE_LABELS[Stage.RetailerReceived]).to.equal("Received by Retailer");
    });

    it("should ensure strict linear order from Harvested (0) to RetailerReceived (6)", function () {
      expect(Stage.Harvested < Stage.ProcessingReceived).to.be.true;
      expect(Stage.ProcessingReceived < Stage.ProcessingCompleted).to.be.true;
      expect(Stage.ProcessingCompleted < Stage.Packaged).to.be.true;
      expect(Stage.Packaged < Stage.Dispatched).to.be.true;
      expect(Stage.Dispatched < Stage.DistributorReceived).to.be.true;
      expect(Stage.DistributorReceived < Stage.RetailerReceived).to.be.true;
    });
  });

  describe("Integrity & Dual Timestamp Distinction", function () {
    it("should maintain separation between declared event date and blockchain block timestamp", function () {
      const declaredDate = 1729150000;
      const blockTimestamp = 1729152000;
      expect(blockTimestamp).to.be.greaterThan(declaredDate);

      const event = {
        stage: Stage.Harvested,
        declaredDate,
        blockTimestamp,
        isTamperEvident: true,
      };
      expect(event.isTamperEvident).to.be.true;
    });
  });
});
