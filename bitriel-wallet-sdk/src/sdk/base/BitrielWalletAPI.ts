import { BigNumber, BigNumberish, Contract } from 'ethers';
import {
  BitrielWallet,
  BitrielWallet__factory,
  BitrielWalletFactory,
  BitrielWalletFactory__factory,
} from '../contracts';
import { arrayify, hexConcat } from 'ethers/lib/utils';
import { BaseApiParams, BaseAccountAPI } from './BaseAccountAPI';

/**
 * constructor params, added no top of base params:
 * @param owner the signer object for the account owner
 * @param factoryAddress address of contract "factory" to deploy new contracts (not needed if account already deployed)
 * @param index nonce value used when creating multiple accounts for the same owner
 */
export interface BitrielWalletApiParams extends BaseApiParams {
  factoryAddress?: string;
  index?: number;
  predefinedAccountAddress?: string;
}

/**
 * An implementation of the BaseAccountAPI using the BitrielWallet contract.
 * - contract deployer gets "entrypoint", "owner" addresses and "index" nonce
 * - owner signs requests using normal "Ethereum Signed Message" (ether's signer.signMessage())
 * - nonce method is "nonce()"
 * - execute method is "execFromEntryPoint()"
 */
export class BitrielWalletAPI extends BaseAccountAPI {
  factoryAddress?: string;
  index: number;
  accountAddress?: string;
  predefinedAccountAddress?: string;

  /**
   * our account contract.
   * should support the "execFromEntryPoint" and "nonce" methods
   */
  accountContract?: BitrielWallet;

  factory?: BitrielWalletFactory;

  constructor(params: BitrielWalletApiParams) {
    super(params);
    this.factoryAddress = params.factoryAddress;
    this.index = params.index ?? 0;
    this.predefinedAccountAddress = params.predefinedAccountAddress ?? null;
  }

  async checkAccountAddress(address: string): Promise<void> {
    const accountContract = BitrielWallet__factory.connect(address, this.provider);
    if (!(await accountContract.isOwner(this.services.walletService.EOAAddress))) {
      throw new Error('the specified accountAddress does not belong to the given EOA provider');
    } else {
      this.accountAddress = address;
    }
  }

  async _getAccountContract(): Promise<BitrielWallet | Contract> {
    if (this.accountContract == null) {
      this.accountContract = BitrielWallet__factory.connect(await this.getAccountAddress(), this.provider);
    }
    return this.accountContract;
  }

  /**
   * return the value to put into the "initCode" field, if the account is not yet deployed.
   * this value holds the "factory" address, followed by this account's information
   */
  async getAccountInitCode(): Promise<string> {
    if (this.factoryAddress != null && this.factoryAddress !== '') {
      this.factory = BitrielWalletFactory__factory.connect(this.factoryAddress, this.provider);
    } else {
      throw new Error('no factory to get initCode');
    }

    return hexConcat([
      this.factoryAddress,
      this.factory.interface.encodeFunctionData('createAccount', [this.services.walletService.EOAAddress, this.index]),
    ]);
  }

  async getCounterFactualAddress(): Promise<string> {
    if (this.predefinedAccountAddress) {
      await this.checkAccountAddress(this.predefinedAccountAddress);
    }
    if (!this.accountAddress) {
      this.factory = BitrielWalletFactory__factory.connect(this.factoryAddress, this.provider);
      this.accountAddress = await this.factory.getAddress(this.services.walletService.EOAAddress, this.index);
    }
    return this.accountAddress;
  }

  async getNonce(): Promise<BigNumber> {
    console.log('checking nonce...');
    if (await this.checkAccountPhantom()) {
      return BigNumber.from(0);
    }
    const accountContract = await this._getAccountContract();
    return accountContract.getNonce();
  }

  /**
   * encode a method call from entryPoint to our contract
   * @param target
   * @param value
   * @param data
   */
  async encodeExecute(target: string, value: BigNumberish, data: string): Promise<string> {
    const accountContract = await this._getAccountContract();
    return accountContract.interface.encodeFunctionData('execute', [target, value, data]);
  }

  async signUserOpHash(userOpHash: string): Promise<string> {
    const signature = await this.services.walletService.signMessage(arrayify(userOpHash));
    return signature;
  }

  get epView() {
    return this.entryPointView;
  }

  async encodeBatch(targets: string[], values: BigNumberish[], datas: string[]): Promise<string> {
    const accountContract = await this._getAccountContract();
    return accountContract.interface.encodeFunctionData('executeBatch', [targets, values, datas]);
  }
}