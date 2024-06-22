import * as anchor from "@coral-xyz/anchor";

export const MockRuleExample1 = {
  mockRuleValues: {
    minimumAmount: new anchor.BN(111),
    minimumDuration: new anchor.BN(222),
    pointsMultiplier: new anchor.BN(3),
    penaltyMultiplier: new anchor.BN(3),
  },
  mockDepositAmount: new anchor.BN(120),
  mockWithdrawAmount: new anchor.BN(100),
};
