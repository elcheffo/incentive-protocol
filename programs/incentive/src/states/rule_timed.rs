use anchor_lang::prelude::*;

// TODO: Determine the correct multiplier and duration variable type

#[account]
pub struct RewardRuleTimed {
    pub name: String,
    pub admin: Pubkey,
    pub minimum_amount: u64,
    pub points_multiplier: u64,
    pub minimum_duration: u64,
    pub penalty_multiplier: u64,
    pub bump: u8,
}

impl Space for RewardRuleTimed {
    const INIT_SPACE: usize = 8 + 24 + PUB_KEY + U64 + U64 + U64 + U64 + U8;
}

const U64: usize = 8;
const PUB_KEY: usize = 32;
const U8: usize = 1;
