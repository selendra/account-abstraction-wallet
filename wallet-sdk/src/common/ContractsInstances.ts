import { SmartAccountType } from "../core-types";
import { JsonRpcProvider } from "@ethersproject/providers";
import { IEntryPoint } from "@account-abstraction/contracts";
import {
  EntryPoint_v006__factory,
  SmartAccount_v100,
  SmartAccountFactory_v100,
  SmartAccountFactory_v100__factory,
  SmartAccount_v100__factory,
} from "./typechain";

export type GetContractInstanceDto = {
  smartAccountType: SmartAccountType;
  version: string;
  contractAddress: string;
  provider: JsonRpcProvider;
};

// Note: Review return types while adding new implementations
export function getSAProxyContract(contractInstanceDto: GetContractInstanceDto): SmartAccount_v100 {
  const { smartAccountType, version, contractAddress, provider } = contractInstanceDto;
  switch (version) {
    case "V1_0_0":
      if (smartAccountType === SmartAccountType.BICONOMY) {
        return SmartAccount_v100__factory.connect(contractAddress, provider);
      }
      break;
    default:
      return SmartAccount_v100__factory.connect(contractAddress, provider);
  }
  throw new Error("Invalid version or smartAccountType provided for proxy contract instance");
}

export function getSAFactoryContract(contractInstanceDto: GetContractInstanceDto): SmartAccountFactory_v100 {
  const { smartAccountType, version, contractAddress, provider } = contractInstanceDto;

  switch (version) {
    case "V1_0_0":
      if (smartAccountType === SmartAccountType.BICONOMY) {
        return SmartAccountFactory_v100__factory.connect(contractAddress, provider);
      }
      break;
    default:
      return SmartAccountFactory_v100__factory.connect(contractAddress, provider);
  }
  throw new Error("Invalid version or smartAccountType provided for factory contract instance");
}

export function getEntryPointContract(contractInstanceDto: GetContractInstanceDto): IEntryPoint {
  const { smartAccountType, version, contractAddress, provider } = contractInstanceDto;

  switch (version) {
    case "V0_0_6":
      if (smartAccountType === SmartAccountType.BICONOMY) {
        return EntryPoint_v006__factory.connect(contractAddress, provider);
      }
      break;
    default:
      return EntryPoint_v006__factory.connect(contractAddress, provider);
  }
  throw new Error("Invalid version or smartAccountType provided for entrypoint contract instance");
}