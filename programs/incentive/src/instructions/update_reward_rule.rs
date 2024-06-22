use anchor_lang::prelude::*;

use crate::states::RewardRuleTimed;

#[derive(Accounts)]
pub struct UpdateRewardRuleTimed<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        mut,
        seeds = [
            b"rule_timed",
            admin.key().as_ref(),
            rule.name.as_bytes().as_ref(),
        ],
        bump = rule.bump,
    )]
    pub rule: Account<'info, RewardRuleTimed>,

    pub system_program: Program<'info, System>,
}

impl<'info> UpdateRewardRuleTimed<'info> {
    pub fn update_rule(
        &mut self,
        minimum_amount: u64,
        minimum_duration: u64,
        points_multiplier: u64,
        penalty_multiplier: u64,
    ) -> Result<()> {
        self.rule.minimum_amount = minimum_amount;
        self.rule.points_multiplier = points_multiplier;
        self.rule.minimum_duration = minimum_duration;
        self.rule.penalty_multiplier = penalty_multiplier;
        Ok(())
    }
}

#[derive(AnchorDeserialize, AnchorSerialize)]
pub struct UpdateRewardRuleTimedArgs {
    pub minimum_amount: u64,
    pub minimum_duration: u64,
    pub points_multiplier: u64,
    pub penalty_multiplier: u64,
}