use anchor_lang::prelude::*;

pub mod errors;
pub mod instructions;
pub mod states;

pub use instructions::*;

declare_id!("CK2YUNfec9XdLXYYHVhUChPoqLij3jLaTi1QJCfwgxPW");

#[program]
pub mod incentive {

    use super::*;

    pub fn create_reward_rule(ctx: Context<CreateRewardRuleTimed>, name: String) -> Result<()> {
        let bumps = ctx.bumps;
        ctx.accounts.new_rule(name, &bumps)?;
        Ok(())
    }

    pub fn update_reward_rule(
        ctx: Context<UpdateRewardRuleTimed>,
        args: UpdateRewardRuleTimedArgs,
    ) -> Result<()> {
        ctx.accounts.update_rule(
            args.minimum_amount,
            args.minimum_duration,
            args.points_multiplier,
            args.penalty_multiplier,
        )?;
        Ok(())
    }

    pub fn initialize_reward_state(ctx: Context<InitializeRewardState>) -> Result<()> {
        ctx.accounts.initialize_reward_state(&ctx.bumps)?;
        Ok(())
    }

    pub fn start_reward(ctx: Context<StartRewardRule>, args: StartRewardRuleArgs) -> Result<()> {
        ctx.accounts
            .start_reward_rule(args.deposit_amount, &ctx.bumps)?;
        Ok(())
    }

    pub fn stop_reward(ctx: Context<StopRewardRule>, args: StopRewardRuleArgs) -> Result<()> {
        ctx.accounts.stop_reward_rule(args.withdraw_amount)?;
        Ok(())
    }
}
