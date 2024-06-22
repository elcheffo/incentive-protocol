import { expect } from "chai";
import { PublicKey, Keypair } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { bootstrap } from "./utils/bootstrap";
import { SavingVault } from "../target/types/saving_vault";

describe("vault", () => {
  // Bootstrap the test
  const { admin, confirm, program, provider, connection, airdrop } =
    bootstrap<SavingVault>("SavingVault");

  const mockVaultName = "vault_v1";

  const [mockVaultStatePDA] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("vault_state"),
      admin.payer.publicKey.toBuffer(),
      Buffer.from(mockVaultName),
    ],
    program.programId
  );

  const [mockVaultPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), mockVaultStatePDA.toBuffer()],
    program.programId
  );

  describe("standard operations", () => {
    const user = Keypair.generate();
    const vaultAirdrop = new anchor.BN(1 * anchor.web3.LAMPORTS_PER_SOL);
    const depositAmount = new anchor.BN(5 * anchor.web3.LAMPORTS_PER_SOL);
    const withdrawAmount = new anchor.BN(2 * anchor.web3.LAMPORTS_PER_SOL);

    before(async () => {
      const createSignature = await program.methods
        .createVault(mockVaultName)
        .rpc()
        .then(confirm);
      expect(createSignature, "Mock rule creation").to.exist;

      await anchor
        .getProvider()
        .connection.requestAirdrop(
          user.publicKey,
          // 5x of deposit amount as balance
          depositAmount.mul(new anchor.BN(5)).toNumber()
        )
        .then(confirm);
    });

    it("can be created with default values", async () => {
      const vaultStates = await program.account.vaultState.all();
      const state = vaultStates.find(
        (state) => state.account.name === mockVaultName
      );
      expect(state).to.exist;
      expect(state.account.name).to.equal(mockVaultName);
    });

    it("can deposit", async () => {
      const vaultAirdrop = new anchor.BN(1 * anchor.web3.LAMPORTS_PER_SOL);
      const depositAmount = new anchor.BN(5 * anchor.web3.LAMPORTS_PER_SOL);

      await airdrop({
        amount: vaultAirdrop.toNumber(),
        destination: mockVaultPDA,
      });

      const signature = await program.methods
        .deposit({
          amount: depositAmount,
        })
        .accountsPartial({
          vaultState: mockVaultStatePDA,
          payer: user.publicKey,
        })
        .signers([user])
        .rpc()
        .then(confirm);

      expect(signature).to.exist;

      const lamports = await connection
        .getAccountInfo(mockVaultPDA)
        .then((info) => info.lamports);

      expect(lamports).to.equal(vaultAirdrop.add(depositAmount).toNumber());
    });

    it("can withdraw", async () => {
      const signature = await program.methods
        .withdraw({
          amount: withdrawAmount,
        })
        .accountsPartial({
          vaultState: mockVaultStatePDA,
          payer: user.publicKey,
        })
        .signers([user])
        .rpc()
        .then(confirm);

      expect(signature).to.exist;

      const lamports = await connection
        .getAccountInfo(mockVaultPDA)
        .then((info) => info.lamports);

      expect(lamports).to.equal(
        vaultAirdrop.add(depositAmount).sub(withdrawAmount).toNumber()
      );
    });
  });
});
