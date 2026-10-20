// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/**
 * @title FarmTrace
 * @notice Blockchain-based agricultural product traceability and authenticity verification platform.
 * @dev Records declared agricultural data and supply-chain events on Ethereum Sepolia.
 * 
 * IMPORTANT INTEGRITY NOTICE:
 * Blockchain preserves submitted records immutably and guarantees tamper-evident provenance
 * of data after submission. It does NOT independently verify physical truth, organic authenticity,
 * or farmer cultivating actions in the real world. It verifies who submitted what and when.
 */
contract FarmTrace {
    // --- Custom Errors ---
    error Unauthorized();
    error UnauthorizedForStage(address actor, Stage stage);
    error FarmerAlreadyExists(string farmerId);
    error FarmerNotFound(string farmerId);
    error BatchAlreadyExists(string batchId);
    error BatchNotFound(string batchId);
    error InvalidInput(string reason);
    error FutureHarvestDate(uint256 providedDate, uint256 currentTimestamp);
    error InvalidStageTransition(Stage attemptedStage, Stage currentStage);
    error ZeroAddressNotAllowed();

    // --- Supply Chain Stages ---
    enum Stage {
        Harvested,           // 0 - Harvest recorded by farmer/FPO
        ProcessingReceived,  // 1 - Received at processing facility
        ProcessingCompleted, // 2 - Quality checks & processing completed
        Packaged,            // 3 - Packaged and sealed with batch label
        Dispatched,          // 4 - Dispatched for distribution
        DistributorReceived, // 5 - Received at regional distributor hub
        RetailerReceived     // 6 - Received at retail outlet / consumer point
    }

    // --- Struct Definitions ---
    struct Farmer {
        string farmerId;
        string name;
        string location;        // Village, District, State, Country
        string organization;    // Associated FPO / cooperative
        address walletAddress;  // Optional farmer wallet
        uint256 registrationTime;
        address registeredBy;
        bool exists;
    }

    struct SupplyChainEvent {
        Stage stage;
        string stageName;
        string location;
        uint256 eventTimestamp; // Declared date of event (epoch in seconds)
        uint256 blockTimestamp; // Tamper-evident blockchain block.timestamp
        address actor;
        string notes;
    }

    struct Correction {
        uint256 correctionId;
        string fieldName;
        string previousValue;
        string newValue;
        string reason;
        address correctedBy;
        uint256 timestamp;
    }

    struct Batch {
        string batchId;
        string productName;
        string category;
        string farmerId;
        string organizationName;
        string originLocation;
        uint256 harvestDate;
        uint256 registrationTime;
        address registeredBy;
        Stage currentStage;
        bool exists;
    }

    // --- State Variables ---
    address public owner;

    // Authorized organizations (FPOs, cooperatives, agricultural boards)
    mapping(address => bool) public isOrganization;

    // Granular stage authorization for supply-chain participants
    mapping(address => mapping(Stage => bool)) public isParticipantAuthorizedForStage;
    mapping(address => string) public participantRoleName;

    // Farmers storage
    mapping(string => Farmer) private _farmers;
    string[] private _allFarmerIds;

    // Product batches storage
    mapping(string => Batch) private _batches;
    string[] private _allBatchIds;

    // Batch ID -> Array of SupplyChainEvents
    mapping(string => SupplyChainEvent[]) private _batchEvents;

    // Batch ID -> Array of Corrections
    mapping(string => Correction[]) private _batchCorrections;

    // Farmer ID -> Array of associated Batch IDs
    mapping(string => string[]) private _farmerBatches;

    // Global counters
    uint256 public totalEventsCount;

    // --- Events ---
    event FarmerRegistered(
        string indexed farmerId,
        string name,
        string organization,
        address indexed registeredBy,
        uint256 timestamp
    );

    event BatchRegistered(
        string indexed batchId,
        string productName,
        string indexed farmerId,
        address indexed registeredBy,
        uint256 harvestDate,
        uint256 timestamp
    );

    event SupplyChainEventAppended(
        string indexed batchId,
        Stage indexed stage,
        string stageName,
        string location,
        address indexed actor,
        uint256 eventTimestamp,
        uint256 blockTimestamp,
        string notes
    );

    event BatchCorrectionRecorded(
        string indexed batchId,
        uint256 indexed correctionId,
        string fieldName,
        string previousValue,
        string newValue,
        string reason,
        address indexed correctedBy,
        uint256 timestamp
    );

    event OrganizationStatusUpdated(address indexed organization, bool authorized);
    event ParticipantStageAuthorizationUpdated(address indexed participant, Stage indexed stage, bool authorized, string roleName);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    // --- Modifiers ---
    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    modifier onlyAdminOrOrg() {
        if (msg.sender != owner && !isOrganization[msg.sender]) revert Unauthorized();
        _;
    }

    constructor() {
        owner = msg.sender;
        isOrganization[msg.sender] = true;
    }

    // --- Access Control Functions ---

    /**
     * @notice Transfer ownership of the contract.
     */
    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddressNotAllowed();
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    /**
     * @notice Authorize or revoke an organization (FPO, agricultural board).
     */
    function setOrganization(address org, bool status) external onlyOwner {
        if (org == address(0)) revert ZeroAddressNotAllowed();
        isOrganization[org] = status;
        emit OrganizationStatusUpdated(org, status);
    }

    /**
     * @notice Authorize a participant address for specific supply-chain stages.
     */
    function authorizeParticipant(
        address participant,
        Stage[] calldata stages,
        string calldata roleName
    ) external onlyAdminOrOrg {
        if (participant == address(0)) revert ZeroAddressNotAllowed();
        if (bytes(roleName).length == 0) revert InvalidInput("Role name required");

        participantRoleName[participant] = roleName;
        for (uint256 i = 0; i < stages.length; i++) {
            isParticipantAuthorizedForStage[participant][stages[i]] = true;
            emit ParticipantStageAuthorizationUpdated(participant, stages[i], true, roleName);
        }
    }

    /**
     * @notice Revoke participant authorization for specific stages.
     */
    function revokeParticipantStages(
        address participant,
        Stage[] calldata stages
    ) external onlyAdminOrOrg {
        if (participant == address(0)) revert ZeroAddressNotAllowed();

        for (uint256 i = 0; i < stages.length; i++) {
            isParticipantAuthorizedForStage[participant][stages[i]] = false;
            emit ParticipantStageAuthorizationUpdated(participant, stages[i], false, participantRoleName[participant]);
        }
    }

    /**
     * @notice Check if an actor is authorized to record an event for a given stage.
     */
    function isAuthorizedForStage(address actor, Stage stage) public view returns (bool) {
        if (actor == owner || isOrganization[actor]) {
            return true;
        }
        return isParticipantAuthorizedForStage[actor][stage];
    }

    // --- Farmer Registration ---

    /**
     * @notice Register a new farmer.
     * @dev Only authorized administrators or organizations can register farmers.
     */
    function registerFarmer(
        string calldata farmerId,
        string calldata name,
        string calldata location,
        string calldata organization,
        address walletAddress
    ) external onlyAdminOrOrg {
        if (bytes(farmerId).length == 0) revert InvalidInput("Farmer ID is required");
        if (bytes(name).length == 0) revert InvalidInput("Farmer name is required");
        if (bytes(location).length == 0) revert InvalidInput("Location is required");
        if (bytes(organization).length == 0) revert InvalidInput("Organization is required");
        if (_farmers[farmerId].exists) revert FarmerAlreadyExists(farmerId);

        _farmers[farmerId] = Farmer({
            farmerId: farmerId,
            name: name,
            location: location,
            organization: organization,
            walletAddress: walletAddress,
            registrationTime: block.timestamp,
            registeredBy: msg.sender,
            exists: true
        });

        _allFarmerIds.push(farmerId);

        emit FarmerRegistered(farmerId, name, organization, msg.sender, block.timestamp);
    }

    // --- Product Batch Registration ---

    /**
     * @notice Register a new agricultural product batch.
     * @dev Validates that harvest date is not in the future, creates initial Harvested event.
     */
    function registerBatch(
        string calldata batchId,
        string calldata productName,
        string calldata category,
        string calldata farmerId,
        string calldata organizationName,
        string calldata originLocation,
        uint256 harvestDate,
        string calldata harvestNotes
    ) external onlyAdminOrOrg {
        if (bytes(batchId).length == 0) revert InvalidInput("Batch ID is required");
        if (bytes(productName).length == 0) revert InvalidInput("Product name is required");
        if (bytes(category).length == 0) revert InvalidInput("Category is required");
        if (bytes(farmerId).length == 0) revert InvalidInput("Farmer ID is required");
        if (!_farmers[farmerId].exists) revert FarmerNotFound(farmerId);
        if (_batches[batchId].exists) revert BatchAlreadyExists(batchId);

        // Allow up to 1 hour buffer for timezone/miner clock variation
        if (harvestDate > block.timestamp + 3600) {
            revert FutureHarvestDate(harvestDate, block.timestamp);
        }

        Batch storage newBatch = _batches[batchId];
        newBatch.batchId = batchId;
        newBatch.productName = productName;
        newBatch.category = category;
        newBatch.farmerId = farmerId;
        newBatch.organizationName = organizationName;
        newBatch.originLocation = originLocation;
        newBatch.harvestDate = harvestDate;
        newBatch.registrationTime = block.timestamp;
        newBatch.registeredBy = msg.sender;
        newBatch.currentStage = Stage.Harvested;
        newBatch.exists = true;

        _allBatchIds.push(batchId);
        _farmerBatches[farmerId].push(batchId);

        // Append the baseline Stage.Harvested event
        string memory stageLabel = getStageLabel(Stage.Harvested);
        _batchEvents[batchId].push(SupplyChainEvent({
            stage: Stage.Harvested,
            stageName: stageLabel,
            location: originLocation,
            eventTimestamp: harvestDate,
            blockTimestamp: block.timestamp,
            actor: msg.sender,
            notes: bytes(harvestNotes).length > 0 ? harvestNotes : "Harvest recorded and registered by organization"
        }));

        totalEventsCount++;

        emit BatchRegistered(
            batchId,
            productName,
            farmerId,
            msg.sender,
            harvestDate,
            block.timestamp
        );

        emit SupplyChainEventAppended(
            batchId,
            Stage.Harvested,
            stageLabel,
            originLocation,
            msg.sender,
            harvestDate,
            block.timestamp,
            harvestNotes
        );
    }

    // --- Supply-Chain Event Tracking ---

    /**
     * @notice Append a subsequent supply-chain event to a batch.
     * @dev Validates role authorization and stage transition rules.
     */
    function appendSupplyChainEvent(
        string calldata batchId,
        Stage stage,
        string calldata location,
        uint256 eventTimestamp,
        string calldata notes
    ) external {
        if (!_batches[batchId].exists) revert BatchNotFound(batchId);
        if (!isAuthorizedForStage(msg.sender, stage)) {
            revert UnauthorizedForStage(msg.sender, stage);
        }

        Batch storage batch = _batches[batchId];

        // Validating strict forward stage transition
        if (stage == Stage.Harvested) {
            revert InvalidStageTransition(stage, batch.currentStage);
        }

        // Must not duplicate or regress stage
        if (uint8(stage) <= uint8(batch.currentStage)) {
            revert InvalidStageTransition(stage, batch.currentStage);
        }

        // Enforce valid supply-chain prerequisites
        if (stage == Stage.ProcessingCompleted && batch.currentStage < Stage.ProcessingReceived) {
            revert InvalidStageTransition(stage, batch.currentStage);
        }
        if (stage == Stage.Dispatched && batch.currentStage < Stage.Packaged) {
            revert InvalidStageTransition(stage, batch.currentStage);
        }
        if (stage == Stage.DistributorReceived && batch.currentStage < Stage.Dispatched) {
            revert InvalidStageTransition(stage, batch.currentStage);
        }
        if (stage == Stage.RetailerReceived && batch.currentStage < Stage.DistributorReceived) {
            revert InvalidStageTransition(stage, batch.currentStage);
        }

        // Prevent dates far in the future
        if (eventTimestamp > block.timestamp + 3600) {
            revert InvalidInput("Event date cannot be in the future");
        }

        batch.currentStage = stage;
        string memory stageLabel = getStageLabel(stage);

        _batchEvents[batchId].push(SupplyChainEvent({
            stage: stage,
            stageName: stageLabel,
            location: bytes(location).length > 0 ? location : "Location unspecified",
            eventTimestamp: eventTimestamp > 0 ? eventTimestamp : block.timestamp,
            blockTimestamp: block.timestamp,
            actor: msg.sender,
            notes: notes
        }));

        totalEventsCount++;

        emit SupplyChainEventAppended(
            batchId,
            stage,
            stageLabel,
            location,
            msg.sender,
            eventTimestamp,
            block.timestamp,
            notes
        );
    }

    // --- Corrections and Traceability ---

    /**
     * @notice Record a transparent correction to a product batch.
     * @dev Never overwrites historical event log. Preserves audit trail of old value, new value,
     * reason, correcting wallet, and timestamp.
     */
    function recordBatchCorrection(
        string calldata batchId,
        string calldata fieldName,
        string calldata newValue,
        string calldata reason
    ) external onlyAdminOrOrg {
        if (!_batches[batchId].exists) revert BatchNotFound(batchId);
        if (bytes(fieldName).length == 0) revert InvalidInput("Field name required");
        if (bytes(newValue).length == 0) revert InvalidInput("New value required");
        if (bytes(reason).length == 0) revert InvalidInput("Correction reason required");

        Batch storage batch = _batches[batchId];
        string memory previousValue;

        bytes32 fieldHash = keccak256(bytes(fieldName));
        if (fieldHash == keccak256(bytes("productName"))) {
            previousValue = batch.productName;
            batch.productName = newValue;
        } else if (fieldHash == keccak256(bytes("category"))) {
            previousValue = batch.category;
            batch.category = newValue;
        } else if (fieldHash == keccak256(bytes("originLocation"))) {
            previousValue = batch.originLocation;
            batch.originLocation = newValue;
        } else if (fieldHash == keccak256(bytes("organizationName"))) {
            previousValue = batch.organizationName;
            batch.organizationName = newValue;
        } else {
            revert InvalidInput("Unsupported field for correction");
        }

        uint256 correctionId = _batchCorrections[batchId].length;

        _batchCorrections[batchId].push(Correction({
            correctionId: correctionId,
            fieldName: fieldName,
            previousValue: previousValue,
            newValue: newValue,
            reason: reason,
            correctedBy: msg.sender,
            timestamp: block.timestamp
        }));

        emit BatchCorrectionRecorded(
            batchId,
            correctionId,
            fieldName,
            previousValue,
            newValue,
            reason,
            msg.sender,
            block.timestamp
        );
    }

    // --- Query Functions ---

    function getFarmer(string calldata farmerId) external view returns (Farmer memory) {
        if (!_farmers[farmerId].exists) revert FarmerNotFound(farmerId);
        return _farmers[farmerId];
    }

    function getBatch(string calldata batchId) external view returns (Batch memory) {
        if (!_batches[batchId].exists) revert BatchNotFound(batchId);
        return _batches[batchId];
    }

    function getBatchEvents(string calldata batchId) external view returns (SupplyChainEvent[] memory) {
        if (!_batches[batchId].exists) revert BatchNotFound(batchId);
        return _batchEvents[batchId];
    }

    function getBatchCorrections(string calldata batchId) external view returns (Correction[] memory) {
        if (!_batches[batchId].exists) revert BatchNotFound(batchId);
        return _batchCorrections[batchId];
    }

    function getAllBatchIds() external view returns (string[] memory) {
        return _allBatchIds;
    }

    function getAllFarmerIds() external view returns (string[] memory) {
        return _allFarmerIds;
    }

    function getFarmerBatchIds(string calldata farmerId) external view returns (string[] memory) {
        return _farmerBatches[farmerId];
    }

    function getCounts() external view returns (
        uint256 totalFarmers,
        uint256 totalBatches,
        uint256 totalEvents
    ) {
        return (_allFarmerIds.length, _allBatchIds.length, totalEventsCount);
    }

    // --- Helper Functions ---

    function getStageLabel(Stage stage) public pure returns (string memory) {
        if (stage == Stage.Harvested) return "Harvested";
        if (stage == Stage.ProcessingReceived) return "Received for Processing";
        if (stage == Stage.ProcessingCompleted) return "Processing Completed";
        if (stage == Stage.Packaged) return "Packaged";
        if (stage == Stage.Dispatched) return "Dispatched";
        if (stage == Stage.DistributorReceived) return "Received by Distributor";
        if (stage == Stage.RetailerReceived) return "Received by Retailer";
        return "Unknown Stage";
    }
}
