# Incentive Capstone project

- Incentive program
- Saving vault example program

## Incentives program

Incentives are created and managed by Incentives program

### Creating Incentive

As an admin I should be able to create an incentive with the following fields

- name
- minimum_lamports
- points_multiplier
- minimum_duration
- penalty_multiplier


## Saving vaults

A saving vault is a shared multiple users can deposit into and withdraw out of.

**Use LP tokens to represent the % user deposited into the vault**

```
Think how do we track the event for incentives

- CPI
  - Calling the incentive program via CPI with specific struct
- Instructions
  - Interacting with program using composable instructions
  - [Introspection](https://medium.com/@LeoOnSol/unleashing-the-power-of-instruction-chaining-with-instruction-introspection-f47ca8f5eab6) 
```

### Creating Vaults

As an admin, I should be able to create new Vaults

### Depositing into vault

As a user I should be able to deposit into the Vault.

**Mint LP tokens based on the proportion of the deposit amount compare to the amount in vault**