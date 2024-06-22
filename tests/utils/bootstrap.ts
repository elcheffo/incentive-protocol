import * as anchor from "@coral-xyz/anchor";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";

const DEFAULT_MOCK_USER_BALANCE = 10 * LAMPORTS_PER_SOL;

export function bootstrap<ProgramType extends anchor.Idl>(programKey: string) {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace[programKey] as anchor.Program<ProgramType>;
  const provider = anchor.AnchorProvider.env();
  const connection = provider.connection;
  const admin = provider.wallet as NodeWallet;

  const confirm = async (signature: string): Promise<string> => {
    const block = await connection.getLatestBlockhash();
    await connection.confirmTransaction({
      signature,
      ...block,
    });
    return signature;
  };

  const airdrop = async (inputs: {
    amount?: number;
    destination: anchor.web3.PublicKey;
  }): Promise<void> => {
    const { amount = 1 * LAMPORTS_PER_SOL } = inputs;
    await anchor
      .getProvider()
      .connection.requestAirdrop(inputs.destination, amount)
      .then(confirm);
  };

  const generateUsers = async (inputs?: {
    count: number;
    defaultBalance?: number;
  }) => {
    const count = inputs.count || 5;
    const defaultBalance = inputs.defaultBalance || 10 * LAMPORTS_PER_SOL;
    const users = Array.from({ length: count }).map(() => Keypair.generate());
    for (const user of users) {
      await airdrop({
        destination: user.publicKey,
        amount: defaultBalance,
      });
    }
    return {
      users,
    };
  };
  return {
    program,
    provider,
    connection,
    admin,
    airdrop,
    confirm,
    generateUsers
  };
}
