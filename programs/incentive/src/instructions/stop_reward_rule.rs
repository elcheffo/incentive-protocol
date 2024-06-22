use anchor_lang::prelude::*;

use crate::states::{RewardRuleTimed, RuleTimedState};

#[derive(Accounts)]
pub struct StopRewardRule<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [
            b"rule_timed_state",
            rule.key().as_ref(),
            user.key().as_ref(),
        ],
        bump = reward_state.bump,
    )]
    pub reward_state: Account<'info, RuleTimedState>,

    #[account(
        seeds = [
            b"rule_timed",
            rule.admin.key().as_ref(),
            rule.name.as_bytes().as_ref(),
        ],
        bump = rule.bump,
    )]
    pub rule: Account<'info, RewardRuleTimed>,

    pub system_program: Program<'info, System>,
}

impl<'info> StopRewardRule<'info> {
    pub fn stop_reward_rule(&mut self, amount: u64) -> Result<()> {
        self.reward_state.last_withdraw_slot = Clock::get().unwrap().slot;
        self.reward_state.last_withdraw_amount = amount;

        let duration = self.reward_state.last_withdraw_slot - self.reward_state.last_deposit_slot;

        if duration < self.rule.minimum_duration {
            let penalty = self.reward_state.last_withdraw_amount * self.rule.penalty_multiplier;
            self.reward_state.points -= penalty;
        }

        Ok(())
    }
}

#[derive(AnchorDeserialize, AnchorSerialize)]
pub struct StopRewardRuleArgs {
    pub withdraw_amount: u64,
}