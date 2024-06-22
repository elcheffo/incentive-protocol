use anchor_lang::prelude::*;

#[account]
pub struct VaultState {
    admin: Pubkey,
    bump: u8,
}

impl Space for VaultState {
    const INIT_SPACE: usize = 8 + 32 + 1;
}
