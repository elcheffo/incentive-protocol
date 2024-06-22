import { expect } from "chai";
import PDAUtils from "./utils/pda-utils";
import { MockRuleExample1 } from "./__mocks__/mock_rule_example_1";
import { bootstrap } from "./utils/bootstrap";
import { Incentive } from "../target/types/incentive";

describe("incentive", () => {
  // Bootstrap the test
  const { admin, confirm, program, provider } = bootstrap<Incentive>('Incentive');

  // Rule name
  const ruleName = "random_timed_rule";

  // Rule PDA (derived from rule name)
  const [rulePDA] = PDAUtils.findRewardRuleTimedPDAs({
    name: ruleName,
    admin: admin.payer.publicKey,
    programId: program.programId,
  });

  describe("timed rule config", () => {
    before(async () => {
      const createSignature = await program.methods
        .createRewardRule(ruleName)
        .signers([admin.payer])
        .rpc()
        .then(confirm);

      expect(createSignature, "Mock rule creation").to.exist;
    });

    it("can be created with default values", async () => {
      const rules = await program.account.rewardRuleTimed.all();
      const rule = rules[0];
      expect(rule).to.exist;
      expect(rule.account.name).to.equal(ruleName);
      expect(rule.account.minimumAmount.toNumber()).to.equal(0);
      expect(rule.account.minimumDuration.toNumber()).to.equal(0);
      expect(rule.account.pointsMultiplier.toNumber()).to.equal(0);
      expect(rule.account.penaltyMultiplier.toNumber()).to.equal(0);
    });

    it("can update", async () => {
      const signature = await program.methods
        .updateRewardRule(MockRuleExample1.mockRuleValues)
        .accountsPartial({
          rule: rulePDA,
        })
        .signers([admin.payer])
        .rpc()
        .then(confirm);
      expect(signature).to.exist;

      const events = await program.account.rewardRuleTimed.all();
      const event = events.find((e) => e.account.name === ruleName);
      expect(event.account.name).to.equal(ruleName);
      expect(event.account.minimumAmount.toNumber()).to.equal(
        MockRuleExample1.mockRuleValues.minimumAmount.toNumber()
      );
      expect(event.account.minimumDuration.toNumber()).to.equal(
        MockRuleExample1.mockRuleValues.minimumDuration.toNumber()
      );
      expect(event.account.pointsMultiplier.toNumber()).to.equal(
        MockRuleExample1.mockRuleValues.pointsMultiplier.toNumber()
      );
      expect(event.account.penaltyMultiplier.toNumber()).to.equal(
        MockRuleExample1.mockRuleValues.penaltyMultiplier.toNumber()
      );
    });
  });
});
