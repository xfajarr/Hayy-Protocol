module stacklend::protocol_liquidity;

use sui::{balance::{Self, Balance}, coin::{Self, Coin}, event};
use stacklend::mock_usdc::MOCK_USDC;
use stacklend::mock_sbtc::MOCK_SBTC;
use stacklend::usdc_lending_pool::{Self, UsdcLendingPool};

// ========================================
//  ERROR CODES
// ========================================
const E_NOT_ADMIN: u64 = 301;
const E_INSUFFICIENT_BOOTSTRAP_FUNDS: u64 = 302;
const E_BOOTSTRAP_TARGET_NOT_REACHED: u64 = 303;
const E_ALREADY_BOOTSTRAPPED: u64 = 304;

// ========================================
//  CONSTANTS
// ========================================
const BOOTSTRAP_THRESHOLD_BPS: u64 = 2000; // 20% of target liquidity
const PROTOCOL_LIQUIDITY_MULTIPLIER: u64 = 2; // Protocol adds 2x community contribution

// ========================================
//  STRUCTS
// ========================================

public struct PROTOCOL_LIQUIDITY has drop {}

/// Protocol treasury for bootstrap liquidity
public struct ProtocolTreasury has key {
    id: UID,
    usdc_reserve: Balance<MOCK_USDC>,
    sbtc_reserve: Balance<MOCK_SBTC>,
    admin: address,
    
    // Bootstrap tracking
    usdc_bootstrap_target: u64,
    sbtc_bootstrap_target: u64,
    usdc_bootstrapped: bool,
    sbtc_bootstrapped: bool,
}

/// Incentive rewards for early lenders
public struct BootstrapRewards has key {
    id: UID,
    // Mapping of early lenders to their reward amounts
    // In real implementation, would use Table<address, u64>
    total_usdc_rewards: u64,
    total_sbtc_rewards: u64,
    rewards_per_token: u64, // STACK tokens per 1 USDC/sBTC deposited during bootstrap
}

/// NFT given to bootstrap lenders
public struct BootstrapLenderNFT has key, store {
    id: UID,
    lender: address,
    token_type: vector<u8>, // "USDC" or "sBTC" 
    amount_contributed: u64,
    bootstrap_timestamp: u64,
    tier: u8, // 1 = Pioneer (first 10), 2 = Early (first 100), 3 = Supporter
}

// ========================================
//  EVENTS
// ========================================

public struct EventProtocolTreasuryCreated has copy, drop {
    treasury_id: ID,
    admin: address,
    usdc_initial: u64,
    sbtc_initial: u64,
}

public struct EventBootstrapContribution has copy, drop {
    lender: address,
    token_type: vector<u8>,
    amount: u64,
    total_pool_liquidity: u64,
    nft_tier: u8,
}

public struct EventProtocolLiquidityDeployed has copy, drop {
    pool_id: ID,
    token_type: vector<u8>,
    protocol_contribution: u64,
    bootstrap_threshold_reached: u64,
}

public struct EventBootstrapRewardsDistributed has copy, drop {
    lender: address,
    stack_tokens_earned: u64,
    bonus_apy_duration_days: u64,
}

// ========================================
//  ADMIN FUNCTIONS
// ========================================

fun init(_witness: PROTOCOL_LIQUIDITY, ctx: &mut TxContext) {
    // Initialize empty treasury - admin needs to fund it separately
    let treasury = ProtocolTreasury {
        id: object::new(ctx),
        usdc_reserve: balance::zero<MOCK_USDC>(),
        sbtc_reserve: balance::zero<MOCK_SBTC>(),
        admin: ctx.sender(),
        usdc_bootstrap_target: 10000_000000, // 10,000 USDC (6 decimals)
        sbtc_bootstrap_target: 1_000000000, // 1 sBTC (9 decimals)
        usdc_bootstrapped: false,
        sbtc_bootstrapped: false,
    };

    let rewards = BootstrapRewards {
        id: object::new(ctx),
        total_usdc_rewards: 50000_000000, // 50,000 STACK tokens for USDC bootstrap
        total_sbtc_rewards: 25000_000000, // 25,000 STACK tokens for sBTC bootstrap  
        rewards_per_token: 5_000000, // 5 STACK tokens per 1 USDC/sBTC deposited
    };

    event::emit(EventProtocolTreasuryCreated {
        treasury_id: object::id(&treasury),
        admin: treasury.admin,
        usdc_initial: 0,
        sbtc_initial: 0,
    });

    transfer::share_object(treasury);
    transfer::share_object(rewards);
}

/// Admin funds the protocol treasury
public entry fun fund_treasury_usdc(
    treasury: &mut ProtocolTreasury,
    usdc: Coin<MOCK_USDC>,
    ctx: &TxContext
) {
    assert!(ctx.sender() == treasury.admin, E_NOT_ADMIN);
    
    let amount = usdc.value();
    treasury.usdc_reserve.join(usdc.into_balance());
    
    // Emit event for transparency
    event::emit(EventProtocolTreasuryCreated {
        treasury_id: object::id(treasury),
        admin: treasury.admin,
        usdc_initial: amount,
        sbtc_initial: treasury.sbtc_reserve.value(),
    });
}

public entry fun fund_treasury_sbtc(
    treasury: &mut ProtocolTreasury,
    sbtc: Coin<MOCK_SBTC>,
    ctx: &TxContext
) {
    assert!(ctx.sender() == treasury.admin, E_NOT_ADMIN);
    
    let amount = sbtc.value();
    treasury.sbtc_reserve.join(sbtc.into_balance());
}

// ========================================
//  BOOTSTRAP FUNCTIONS
// ========================================

/// Check if bootstrap threshold is reached for USDC pool
public fun is_usdc_bootstrap_ready(
    treasury: &ProtocolTreasury,
    pool: &UsdcLendingPool
): bool {
    let current_liquidity = usdc_lending_pool::get_total_balance(pool);
    let threshold = (treasury.usdc_bootstrap_target * BOOTSTRAP_THRESHOLD_BPS) / 10000;
    current_liquidity >= threshold && !treasury.usdc_bootstrapped
}

/// Protocol deploys liquidity once bootstrap threshold is reached
public entry fun deploy_protocol_liquidity_usdc(
    treasury: &mut ProtocolTreasury,
    pool: &mut UsdcLendingPool,
    ctx: &mut TxContext
) {
    assert!(ctx.sender() == treasury.admin, E_NOT_ADMIN);
    assert!(is_usdc_bootstrap_ready(treasury, pool), E_BOOTSTRAP_TARGET_NOT_REACHED);
    assert!(!treasury.usdc_bootstrapped, E_ALREADY_BOOTSTRAPPED);
    
    let current_community_liquidity = usdc_lending_pool::get_total_balance(pool);
    let protocol_contribution = current_community_liquidity * PROTOCOL_LIQUIDITY_MULTIPLIER;
    
    // Ensure treasury has enough funds
    assert!(treasury.usdc_reserve.value() >= protocol_contribution, E_INSUFFICIENT_BOOTSTRAP_FUNDS);
    
    // Deploy protocol liquidity
    let protocol_usdc = coin::from_balance(
        treasury.usdc_reserve.split(protocol_contribution), 
        ctx
    );
    
    // Deposit protocol funds into the pool
    usdc_lending_pool::deposit_usdc(pool, protocol_usdc, ctx);
    
    // Mark as bootstrapped
    treasury.usdc_bootstrapped = true;
    
    event::emit(EventProtocolLiquidityDeployed {
        pool_id: object::id(pool),
        token_type: b"USDC",
        protocol_contribution,
        bootstrap_threshold_reached: current_community_liquidity,
    });
}

/// Users contribute to bootstrap and earn NFT + rewards
public entry fun bootstrap_contribute_usdc(
    treasury: &ProtocolTreasury,
    pool: &mut UsdcLendingPool,
    usdc: Coin<MOCK_USDC>,
    ctx: &mut TxContext
) {
    let amount = usdc.value();
    let lender = ctx.sender();
    
    // Deposit into pool normally
    usdc_lending_pool::deposit_usdc(pool, usdc, ctx);
    
    // Determine NFT tier based on pool liquidity
    let current_liquidity = usdc_lending_pool::get_total_balance(pool);
    let tier = if (current_liquidity <= 1000_000000) { 1 } // Pioneer: first 1k USDC
        else if (current_liquidity <= 5000_000000) { 2 } // Early: first 5k USDC  
        else { 3 }; // Supporter: rest
    
    // Mint bootstrap NFT
    let nft = BootstrapLenderNFT {
        id: object::new(ctx),
        lender,
        token_type: b"USDC",
        amount_contributed: amount,
        bootstrap_timestamp: ctx.epoch_timestamp_ms(),
        tier,
    };
    
    event::emit(EventBootstrapContribution {
        lender,
        token_type: b"USDC",
        amount,
        total_pool_liquidity: current_liquidity,
        nft_tier: tier,
    });
    
    transfer::transfer(nft, lender);
}

// ========================================
//  READ-ONLY FUNCTIONS
// ========================================

public fun get_bootstrap_progress_usdc(treasury: &ProtocolTreasury, pool: &UsdcLendingPool): (u64, u64, u64) {
    let current = usdc_lending_pool::get_total_balance(pool);
    let target = treasury.usdc_bootstrap_target;
    let threshold = (target * BOOTSTRAP_THRESHOLD_BPS) / 10000;
    (current, target, threshold)
}

public fun get_treasury_reserves(treasury: &ProtocolTreasury): (u64, u64) {
    (treasury.usdc_reserve.value(), treasury.sbtc_reserve.value())
}

public fun is_bootstrap_active(treasury: &ProtocolTreasury): (bool, bool) {
    (!treasury.usdc_bootstrapped, !treasury.sbtc_bootstrapped)
}