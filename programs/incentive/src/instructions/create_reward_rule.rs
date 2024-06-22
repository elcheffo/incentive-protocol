use crate::states::RewardRuleTimed;

use anchor_lang::prelude::*;

#[derive(Accounts)]
#[instruction(name: String)]
pub struct CreateRewardRuleTimed<'info> {
    #[account(mut)]
    admin: Signer<'info>,

    #[account(
        init,
        payer = admin,
        seeds = [
            b"rule_timed",
            admin.key().as_ref(),
            name.as_bytes().as_ref(),
        ],
        bump,
        space = RewardRuleTimed::INIT_SPACE,
    )]
    pub rule: Account<'info, RewardRuleTimed>,

    pub system_program: Program<'info, System>,
}

impl<'info> CreateRewardRuleTimed<'info> {
    pub fn new_rule(&mut self, name: String, bumps: &CreateRewardRuleTimedBumps) -> Result<()> {
        self.rule.set_inner({
            RewardRuleTimed {
                name,
                admin: *self.admin.key,
                minimum_amount: 0,
                points_multiplier: 0,
                minimum_duration: 0,
                penalty_multiplier: 0,
                bump: bumps.rule,
            }
        });
        Ok(())
    }
}
