use anchor_lang::prelude::*;

#[error_code]
pub enum RewardErrors {

  #[msg("Minimum amount required is not met")]
  MinimumAmountUnmet,
}