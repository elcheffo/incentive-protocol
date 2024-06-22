import { expect } from "chai";
import { PublicKey } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { bootstrap } from "./utils/bootstrap";
import { findMockRulePDAs } from "./__mocks__/mock_rule_example_1";

describe("vault", () => {
  const {
    incentive,
    savingVault,
    admin,
    confirm,
    connection,
    airdrop,
    generateUsers,
  } = bootstrap();

  const mockVaultName = "vault_v1";

  const [mockVaultStatePDA] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("vault_state"),
      admin.payer.publicKey.toBuffer(),
      Buffer.from(mockVaultName),
    ],
    savingVault.programId
  );

  const [mockVaultPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), mockVaultStatePDA.toBuffer()],
    savingVault.programId
  );

  describe("standard operations", () => {
    // const user = Keypair.generate();
    // const user = admin.payer;
    const users: anchor.web3.Keypair[] = [];
    const getUser = () => users[0];
    const getUserRewardPDAs = () =>
      findMockRulePDAs({
        name: "timed_rule_v2",
        user: getUser().publicKey,
        admin: admin.payer.publicKey,
        programId: incentive.programId,
      });

    const vaultAirdrop = new anchor.BN(1 * anchor.web3.LAMPORTS_PER_SOL);
    const depositAmount = new anchor.BN(5 * anchor.web3.LAMPORTS_PER_SOL);
    const withdrawAmount = new anchor.BN(2 * anchor.web3.LAMPORTS_PER_SOL);

    before(async () => {
      const createSignature = await savingVault.methods
        .createVault(mockVaultName)
        .rpc()
        .then(confirm);
      expect(createSignature, "Mock rule creation").to.exist;

      const generated = await generateUsers({ count: 2 });
      users.push(...generated.users);

      /**
       * TODO: Figure out a way to lazy initialize reward state pda
       *
       * NOTE:
       * Even with init_if_need in "start_reward" method in "incentive" program,
       * reward state pda is still not initialized
       * (when called through cpi "deposit" method from "saving_vault" program )
       *
       * Even with calling "initialize_reward_state" method from
       * "deposit" method from "saving_vault" program through cpi
       * reward state pda is still not initialized
       *
       * Has to be manually called before depositing (if the deposit method use cpi for "incentive" program)
       */
      const user = getUser();
      const { mockRulePDA, mockRewardStatePDA } = getUserRewardPDAs();
      const initializeRewardStateSignature = await incentive.methods
        .initializeRewardState()
        .accountsPartial({
          user: user.publicKey,
          rule: mockRulePDA,
          rewardState: mockRewardStatePDA,
        })
        .signers([user])
        .rpc()
        .then(confirm);
      expect(initializeRewardStateSignature).to.exist;
    });

    it("can be created with default values", async () => {
      const vaultStates = await savingVault.account.vaultState.all();
      const state = vaultStates.find(
        (state) => state.account.name === mockVaultName
      );
      expect(state).to.exist;
      expect(state.account.name).to.equal(mockVaultName);
    });

    it("can deposit w/ points", async () => {
      const user = getUser();
      const { mockRulePDA, mockRewardStatePDA } = getUserRewardPDAs();

      const vaultAirdrop = new anchor.BN(1 * anchor.web3.LAMPORTS_PER_SOL);
      const depositAmount = new anchor.BN(5 * anchor.web3.LAMPORTS_PER_SOL);

      await airdrop({
        amount: vaultAirdrop.toNumber(),
        destination: mockVaultPDA,
      });

      const previousPoints = await incentive.account.ruleTimedState
        .fetch(mockRewardStatePDA)
        .then((state) => state.points.toNumber());

      const signature = await savingVault.methods
        .deposit({
          amount: depositAmount,
        })
        .accountsPartial({
          payer: user.publicKey,
          vaultState: mockVaultStatePDA,
          rule: mockRulePDA,
          rewardState: mockRewardStatePDA,
          incentiveProgram: incentive.programId,
        })
        .signers([user])
        .rpc()
        .then(confirm);

      expect(signature).to.exist;

      const lamports = await connection
        .getAccountInfo(mockVaultPDA)
        .then((info) => info.lamports);

      expect(lamports).to.equal(vaultAirdrop.add(depositAmount).toNumber());

      // Check the reward state
      const afterPoints = await incentive.account.ruleTimedState
        .fetch(mockRewardStatePDA)
        .then((state) => state.points.toNumber());

      const rule = await incentive.account.rewardRuleTimed.fetch(mockRulePDA);

      expect(afterPoints).to.be.greaterThan(
        previousPoints,
        "Points should increase after deposit"
      );
      expect(afterPoints).to.equal(
        depositAmount.mul(rule.pointsMultiplier).toNumber(),
        "Points should be equal to deposit amount * points multiplier"
      );
    });

    it("can withdraw", async () => {
      const user = getUser();
      const { mockRulePDA, mockRewardStatePDA } = getUserRewardPDAs();

      const signature = await savingVault.methods
        .withdraw({
          amount: withdrawAmount,
        })
        .accountsPartial({
          payer: user.publicKey,
          vaultState: mockVaultStatePDA,
          rule: mockRulePDA,
          rewardState: mockRewardStatePDA,
          incentiveProgram: incentive.programId,
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
