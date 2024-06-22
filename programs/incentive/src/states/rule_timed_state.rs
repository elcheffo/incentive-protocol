use anchor_lang::prelude::*;

#[account]
pub struct RuleTimedState {

    // Amounts
    pub last_deposit_amount: u64,
    pub last_withdraw_amount: u64,
    
    // Clock
    pub last_deposit_slot: u64,
    pub last_withdraw_slot: u64,

    // Points
    pub points: u64,

    pub bump: u8,
}

impl Space for RuleTimedState {
    const INIT_SPACE: usize = 8 + 8 + 8 + 8 + 8 + 8 + 1;
}