import { Field, AccountUpdate, Mina, PrivateKey } from 'snarkyjs';
import { IncrementSecret } from './IncrementSecret.js';

const localChain = Mina.LocalBlockchain({ proofsEnabled: false });
Mina.setActiveInstance(localChain);

const { privateKey: deployerPrivatekey, publicKey: deployerAccount } =
  localChain.testAccounts[0];
const { privateKey: senderPrivateKey, publicKey: senderAccount } =
  localChain.testAccounts[1];

const salt = Field.random();

const contractPrivateKey = PrivateKey.random();
const contractAddress = contractPrivateKey.toPublicKey();

const contractInstance = new IncrementSecret(contractAddress);

const deployTxn = await Mina.transaction(deployerAccount, () => {
  AccountUpdate.fundNewAccount(deployerAccount);
  contractInstance.deploy();
  contractInstance.initState(salt, Field(750));
});

await deployTxn.prove();
await deployTxn.sign([deployerPrivatekey, contractPrivateKey]).send();

const number0 = contractInstance.x.get();
console.log('state after init', number0.toString());

const txn1 = await Mina.transaction(senderAccount, () => {
  contractInstance.incrementSecret(salt, Field(750));
});

await txn1.prove();
await txn1.sign([senderPrivateKey]).send();

const num1 = contractInstance.x.get();
console.log('state after txn1:', num1.toString());
