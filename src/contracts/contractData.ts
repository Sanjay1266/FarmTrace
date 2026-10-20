// Auto-generated from Hardhat deployment
export const FARMTRACE_CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
export const FARMTRACE_DEFAULT_CHAIN_ID = 11155111;
export const FARMTRACE_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "batchId",
        "type": "string"
      }
    ],
    "name": "BatchAlreadyExists",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "batchId",
        "type": "string"
      }
    ],
    "name": "BatchNotFound",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "farmerId",
        "type": "string"
      }
    ],
    "name": "FarmerAlreadyExists",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "farmerId",
        "type": "string"
      }
    ],
    "name": "FarmerNotFound",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "providedDate",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "currentTimestamp",
        "type": "uint256"
      }
    ],
    "name": "FutureHarvestDate",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "reason",
        "type": "string"
      }
    ],
    "name": "InvalidInput",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "enum FarmTrace.Stage",
        "name": "attemptedStage",
        "type": "uint8"
      },
      {
        "internalType": "enum FarmTrace.Stage",
        "name": "currentStage",
        "type": "uint8"
      }
    ],
    "name": "InvalidStageTransition",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "Unauthorized",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "actor",
        "type": "address"
      },
      {
        "internalType": "enum FarmTrace.Stage",
        "name": "stage",
        "type": "uint8"
      }
    ],
    "name": "UnauthorizedForStage",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ZeroAddressNotAllowed",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "string",
        "name": "batchId",
        "type": "string"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "correctionId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "fieldName",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "previousValue",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "newValue",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "reason",
        "type": "string"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "correctedBy",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "BatchCorrectionRecorded",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "string",
        "name": "batchId",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "productName",
        "type": "string"
      },
      {
        "indexed": true,
        "internalType": "string",
        "name": "farmerId",
        "type": "string"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "registeredBy",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "harvestDate",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "BatchRegistered",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "string",
        "name": "farmerId",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "organization",
        "type": "string"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "registeredBy",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "FarmerRegistered",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "organization",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "authorized",
        "type": "bool"
      }
    ],
    "name": "OrganizationStatusUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "previousOwner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "OwnershipTransferred",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "participant",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "enum FarmTrace.Stage",
        "name": "stage",
        "type": "uint8"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "authorized",
        "type": "bool"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "roleName",
        "type": "string"
      }
    ],
    "name": "ParticipantStageAuthorizationUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "string",
        "name": "batchId",
        "type": "string"
      },
      {
        "indexed": true,
        "internalType": "enum FarmTrace.Stage",
        "name": "stage",
        "type": "uint8"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "stageName",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "location",
        "type": "string"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "actor",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "eventTimestamp",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "blockTimestamp",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "notes",
        "type": "string"
      }
    ],
    "name": "SupplyChainEventAppended",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "batchId",
        "type": "string"
      },
      {
        "internalType": "enum FarmTrace.Stage",
        "name": "stage",
        "type": "uint8"
      },
      {
        "internalType": "string",
        "name": "location",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "eventTimestamp",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "notes",
        "type": "string"
      }
    ],
    "name": "appendSupplyChainEvent",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "participant",
        "type": "address"
      },
      {
        "internalType": "enum FarmTrace.Stage[]",
        "name": "stages",
        "type": "uint8[]"
      },
      {
        "internalType": "string",
        "name": "roleName",
        "type": "string"
      }
    ],
    "name": "authorizeParticipant",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAllBatchIds",
    "outputs": [
      {
        "internalType": "string[]",
        "name": "",
        "type": "string[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAllFarmerIds",
    "outputs": [
      {
        "internalType": "string[]",
        "name": "",
        "type": "string[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "batchId",
        "type": "string"
      }
    ],
    "name": "getBatch",
    "outputs": [
      {
        "components": [
          {
            "internalType": "string",
            "name": "batchId",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "productName",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "category",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "farmerId",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "organizationName",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "originLocation",
            "type": "string"
          },
          {
            "internalType": "uint256",
            "name": "harvestDate",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "registrationTime",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "registeredBy",
            "type": "address"
          },
          {
            "internalType": "enum FarmTrace.Stage",
            "name": "currentStage",
            "type": "uint8"
          },
          {
            "internalType": "bool",
            "name": "exists",
            "type": "bool"
          }
        ],
        "internalType": "struct FarmTrace.Batch",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "batchId",
        "type": "string"
      }
    ],
    "name": "getBatchCorrections",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "correctionId",
            "type": "uint256"
          },
          {
            "internalType": "string",
            "name": "fieldName",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "previousValue",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "newValue",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "reason",
            "type": "string"
          },
          {
            "internalType": "address",
            "name": "correctedBy",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "timestamp",
            "type": "uint256"
          }
        ],
        "internalType": "struct FarmTrace.Correction[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "batchId",
        "type": "string"
      }
    ],
    "name": "getBatchEvents",
    "outputs": [
      {
        "components": [
          {
            "internalType": "enum FarmTrace.Stage",
            "name": "stage",
            "type": "uint8"
          },
          {
            "internalType": "string",
            "name": "stageName",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "location",
            "type": "string"
          },
          {
            "internalType": "uint256",
            "name": "eventTimestamp",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "blockTimestamp",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "actor",
            "type": "address"
          },
          {
            "internalType": "string",
            "name": "notes",
            "type": "string"
          }
        ],
        "internalType": "struct FarmTrace.SupplyChainEvent[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getCounts",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "totalFarmers",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "totalBatches",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "totalEvents",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "farmerId",
        "type": "string"
      }
    ],
    "name": "getFarmer",
    "outputs": [
      {
        "components": [
          {
            "internalType": "string",
            "name": "farmerId",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "name",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "location",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "organization",
            "type": "string"
          },
          {
            "internalType": "address",
            "name": "walletAddress",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "registrationTime",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "registeredBy",
            "type": "address"
          },
          {
            "internalType": "bool",
            "name": "exists",
            "type": "bool"
          }
        ],
        "internalType": "struct FarmTrace.Farmer",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "farmerId",
        "type": "string"
      }
    ],
    "name": "getFarmerBatchIds",
    "outputs": [
      {
        "internalType": "string[]",
        "name": "",
        "type": "string[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "enum FarmTrace.Stage",
        "name": "stage",
        "type": "uint8"
      }
    ],
    "name": "getStageLabel",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "pure",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "actor",
        "type": "address"
      },
      {
        "internalType": "enum FarmTrace.Stage",
        "name": "stage",
        "type": "uint8"
      }
    ],
    "name": "isAuthorizedForStage",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "isOrganization",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      },
      {
        "internalType": "enum FarmTrace.Stage",
        "name": "",
        "type": "uint8"
      }
    ],
    "name": "isParticipantAuthorizedForStage",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "participantRoleName",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "batchId",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "fieldName",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "newValue",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "reason",
        "type": "string"
      }
    ],
    "name": "recordBatchCorrection",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "batchId",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "productName",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "category",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "farmerId",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "organizationName",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "originLocation",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "harvestDate",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "harvestNotes",
        "type": "string"
      }
    ],
    "name": "registerBatch",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "farmerId",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "location",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "organization",
        "type": "string"
      },
      {
        "internalType": "address",
        "name": "walletAddress",
        "type": "address"
      }
    ],
    "name": "registerFarmer",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "participant",
        "type": "address"
      },
      {
        "internalType": "enum FarmTrace.Stage[]",
        "name": "stages",
        "type": "uint8[]"
      }
    ],
    "name": "revokeParticipantStages",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "org",
        "type": "address"
      },
      {
        "internalType": "bool",
        "name": "status",
        "type": "bool"
      }
    ],
    "name": "setOrganization",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalEventsCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "transferOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;
