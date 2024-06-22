use anchor_lang::prelude::*;

use crate::states::{RewardRuleTimed, RuleTimedState};

#[derive(Accounts)]
pub struct InitializeRewardState<'info> {
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

impl<'info> InitializeRewardState<'info> {
    pub fn initialize_reward_state(&mut self, bumps: &InitializeRewardStateBumps) -> Result<()> {
        self.reward_state.last_deposit_slot = 0;
        self.reward_state.last_deposit_amount = 0;
        self.reward_state.last_withdraw_slot = 0;
        self.reward_state.last_withdraw_amount = 0;
        self.reward_state.points = 0;
        self.reward_state.bump = bumps.reward_state;
        Ok(())
    }
}
