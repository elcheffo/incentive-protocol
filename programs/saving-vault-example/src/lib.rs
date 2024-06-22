use anchor_lang::prelude::*;

// pub mod errors;
pub mod instructions;
pub mod states;

pub use instructions::*;

declare_id!("HLCMYovVzdfy6is934NaAxa4XgCsGbqmEPyfHV8rzJta");

#[program]
pub mod saving_vault {
    use super::*;

    pub fn create_vault(ctx: Context<CreateVault>, name: String) -> Result<()> {
        ctx.accounts.create_vault(name, &ctx.bumps)?;
        Ok(())
    }

    pub fn deposit(ctx: Context<VaultUserOperation>, args: VaultUserOperationArgs) -> Result<()> {
        ctx.accounts.deposit(args.amount)?;
        Ok(())
    }

    pub fn withdraw(ctx: Context<VaultUserOperation>, args: VaultUserOperationArgs) -> Result<()> {
        ctx.accounts.withdraw(args.amount)?;
        Ok(())
    }
}
