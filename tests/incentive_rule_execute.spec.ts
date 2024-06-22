import { expect, assert } from "chai";
import PDAUtils from "./utils/pda-utils";
import { MockRuleExample1 } from "./__mocks__/mock_rule_example_1";
import { bootstrap } from "./utils/bootstrap";
import { Incentive } from "../target/types/incentive";
import { BN } from "bn.js";
import * as anchor from "@coral-xyz/anchor";

describe("incentive", () => {
  // Bootstrap the test
  const { admin, confirm, program, provider, generateUsers } =
    bootstrap<Incentive>("Incentive");

  const users: anchor.web3.Keypair[] = [];

  // Rule name
  const ruleName = "timed_rule_v2";

  // Rule PDA (derived from rule name)
  const [rulePDA] = PDAUtils.findRewardRuleTimedPDAs({
    name: ruleName,
    admin: admin.payer.publicKey,
    programId: program.programId,
  });

  // Rule state PDA (derived from rule and user)
  const [rewardStatePDA] = PDAUtils.findRewardStatePDAs({
    user: admin.payer.publicKey,
    rule: rulePDA,
    programId: program.programId,
  });

  before(async () => {
    const generated = await generateUsers({ count: 1 });
    users.push(...generated.users);
    expect(users.length).to.equal(1);
  });

  describe("timed rule execute", () => {
    before(async () => {
      const createSignature = await program.methods
        .createRewardRule(ruleName)
        .signers([admin.payer])
        .rpc()
        .then(confirm);

      expect(createSignature, "Mock rule creation").to.exist;

      const updateSignature = await program.methods
        .updateRewardRule(MockRuleExample1.mockRuleValues)
        .accountsPartial({
          rule: rulePDA,
        })
        .signers([admin.payer])
        .rpc()
        .then(confirm);
      expect(updateSignature, "Mock rule update").to.exist;
    });

    it("can start a rule w/ points multiplier", async () => {
      const signature = await program.methods
        .startReward({
          depositAmount: MockRuleExample1.mockDepositAmount,
        })
        .accountsPartial({
          rule: rulePDA,
        })
        .signers([admin.payer])
        .rpc()
        .then(confirm);

      expect(signature).to.exist;

      // Fetch the latest block time
      const clock = await provider.connection.getSlot();
      const state = await program.account.ruleTimedState.fetch(rewardStatePDA);

      expect(state.lastDepositSlot.toNumber()).to.equal(clock);
      expect(state.lastDepositAmount.toNumber()).to.equal(
        MockRuleExample1.mockDepositAmount.toNumber()
      );
      expect(state.points.toNumber()).to.equal(
        MockRuleExample1.mockDepositAmount
          .mul(MockRuleExample1.mockRuleValues.pointsMultiplier)
          .toNumber()
      );
    });

    it("can end a rule w/ penalty multiplier", async () => {
      const diff = MockRuleExample1.mockDepositAmount.sub(
        MockRuleExample1.mockWithdrawAmount
      );
      const remainingPoints = diff.mul(
        MockRuleExample1.mockRuleValues.penaltyMultiplier
      );

      const signature = await program.methods
        .stopReward({
          withdrawAmount: MockRuleExample1.mockWithdrawAmount,
        })
        .accountsPartial({
          rewardState: rewardStatePDA,
          rule: rulePDA,
        })
        .signers([admin.payer])
        .rpc()
        .then(confirm);

      expect(signature).to.exist;

      const state = await program.account.ruleTimedState.fetch(rewardStatePDA);
      expect(state.lastDepositAmount.toNumber()).to.equal(
        MockRuleExample1.mockDepositAmount.toNumber()
      );
      expect(state.lastWithdrawAmount.toNumber()).to.equal(
        MockRuleExample1.mockWithdrawAmount.toNumber()
      );
      expect(state.points.toNumber()).to.equal(remainingPoints.toNumber());
    });
  });

  describe("errors", async () => {
    it("can throw minimum amount unmet error", async () => {
      const user = users.at(0);
      const [userRewardStatePDA] = PDAUtils.findRewardStatePDAs({
        user: user.publicKey,
        rule: rulePDA,
        programId: program.programId,
      });
      try {
        await program.methods
          .startReward({
            depositAmount: new BN(0),
          })
          .accountsPartial({
            user: user.publicKey,
            rewardState: userRewardStatePDA,
            rule: rulePDA,
          })
          .signers([user])
          .rpc()
          .then(confirm);
        assert.fail("Expected an error be thrown");
      } catch (error) {
        expect(error).to.be.an.instanceOf(anchor.AnchorError);
        expect((error as anchor.AnchorError).error.errorMessage).to.be.equal(
          "Minimum amount required is not met"
        );
      }
    });
  });
});
