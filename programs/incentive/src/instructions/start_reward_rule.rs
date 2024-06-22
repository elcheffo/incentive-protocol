use anchor_lang::prelude::*;

use crate::{
    errors::RewardErrors,
    states::{RewardRuleTimed, RuleTimedState},
};

#[derive(Accounts)]
pub struct StartRewardRule<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        init_if_needed,
        payer = user,
        seeds = [
            b"rule_timed_state",
            rule.key().as_ref(),
            user.key().as_ref(),
        ],
        bump,
        space = RuleTimedState::INIT_SPACE,
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

impl<'info> StartRewardRule<'info> {
    pub fn start_reward_rule(&mut self, amount: u64, bumps: &StartRewardRuleBumps) -> Result<()> {
        require!(
            self.rule.minimum_amount <= amount,
            RewardErrors::MinimumAmountUnmet
        );
        // TODO: Check minimum amount
        let clock = Clock::get().unwrap();
        self.reward_state.last_deposit_slot = clock.slot;
        self.reward_state.last_deposit_amount = amount;
        self.reward_state.points = amount * self.rule.points_multiplier;
        self.reward_state.bump = bumps.reward_state;
        Ok(())
    }
}

#[derive(AnchorDeserialize, AnchorSerialize)]
pub struct StartRewardRuleArgs {
    pub deposit_amount: u64,
}
