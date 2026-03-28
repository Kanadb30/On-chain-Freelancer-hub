#![allow(non_snake_case)]
#![no_std]

use soroban_sdk::{contract, contracttype, contractimpl, log, Env, Symbol, String, symbol_short};

// ─────────────────────────────────────────────
//  Data Types
// ─────────────────────────────────────────────

/// Tracks aggregate platform-level stats
#[contracttype]
#[derive(Clone)]
pub struct HubStats {
    pub total_jobs: u64,
    pub total_bids: u64,
    pub total_completed: u64,
}

/// Status of a posted job
#[contracttype]
#[derive(Clone, PartialEq)]
pub enum JobStatus {
    Open,      // accepting bids
    Assigned,  // a freelancer has been hired
    Completed, // work delivered and job closed
}

/// A job posted by a client
#[contracttype]
#[derive(Clone)]
pub struct Job {
    pub job_id: u64,
    pub title: String,
    pub descrip: String,
    pub budget: u64,      // in stroops (1 XLM = 10_000_000 stroops)
    pub posted_at: u64,   // ledger timestamp
    pub status: JobStatus,
    pub assigned_bid: u64, // bid_id of the winning bid (0 = none)
}

/// A bid placed by a freelancer on an open job
#[contracttype]
#[derive(Clone)]
pub struct Bid {
    pub bid_id: u64,
    pub job_id: u64,
    pub proposal: String, // freelancer's pitch / proposal text
    pub ask_price: u64,   // freelancer's quoted price in stroops
    pub submitted_at: u64,
    pub accepted: bool,
}

// ─────────────────────────────────────────────
//  Storage Keys
// ─────────────────────────────────────────────

const HUB_STATS: Symbol = symbol_short!("HUB_STATS");
const COUNT_JOB: Symbol = symbol_short!("C_JOB");
const COUNT_BID: Symbol = symbol_short!("C_BID");

#[contracttype]
pub enum JobBook {
    Job(u64),
}

#[contracttype]
pub enum BidBook {
    Bid(u64),
}

// ─────────────────────────────────────────────
//  Contract
// ─────────────────────────────────────────────

#[contract]
pub struct FreelancerHubContract;

#[contractimpl]
impl FreelancerHubContract {

    // ── 1. POST A JOB ────────────────────────────────────────────────────────
    /// Called by a client to publish a new job on the hub.
    /// Returns the unique job_id of the newly created job.
    pub fn post_job(env: Env, title: String, descrip: String, budget: u64) -> u64 {
        // Validate inputs
        if budget == 0 {
            log!(&env, "Budget must be greater than zero");
            panic!("Budget must be greater than zero");
        }

        // Increment global job counter
        let mut count_job: u64 = env.storage().instance().get(&COUNT_JOB).unwrap_or(0);
        count_job += 1;

        let time = env.ledger().timestamp();

        // Build the Job record
        let job = Job {
            job_id: count_job,
            title,
            descrip,
            budget,
            posted_at: time,
            status: JobStatus::Open,
            assigned_bid: 0,
        };

        // Update hub-level stats
        let mut stats = Self::view_hub_stats(env.clone());
        stats.total_jobs += 1;

        // Persist
        env.storage().instance().set(&JobBook::Job(count_job), &job);
        env.storage().instance().set(&COUNT_JOB, &count_job);
        env.storage().instance().set(&HUB_STATS, &stats);
        env.storage().instance().extend_ttl(5000, 5000);

        log!(&env, "Job posted with ID: {}", count_job);
        count_job
    }

    // ── 2. SUBMIT A BID ──────────────────────────────────────────────────────
    /// Called by a freelancer to place a bid on an open job.
    /// Returns the unique bid_id.
    pub fn submit_bid(env: Env, job_id: u64, proposal: String, ask_price: u64) -> u64 {
        // Fetch the target job and ensure it is still open
        let job = Self::view_job(env.clone(), job_id);
        if job.status != JobStatus::Open {
            log!(&env, "Job {} is not open for bids", job_id);
            panic!("Job is not open for bids");
        }
        if ask_price == 0 {
            log!(&env, "Ask price must be greater than zero");
            panic!("Ask price must be greater than zero");
        }

        // Increment global bid counter
        let mut count_bid: u64 = env.storage().instance().get(&COUNT_BID).unwrap_or(0);
        count_bid += 1;

        let time = env.ledger().timestamp();

        let bid = Bid {
            bid_id: count_bid,
            job_id,
            proposal,
            ask_price,
            submitted_at: time,
            accepted: false,
        };

        // Update hub-level stats
        let mut stats = Self::view_hub_stats(env.clone());
        stats.total_bids += 1;

        // Persist
        env.storage().instance().set(&BidBook::Bid(count_bid), &bid);
        env.storage().instance().set(&COUNT_BID, &count_bid);
        env.storage().instance().set(&HUB_STATS, &stats);
        env.storage().instance().extend_ttl(5000, 5000);

        log!(&env, "Bid {} submitted on Job {}", count_bid, job_id);
        count_bid
    }

    // ── 3. ACCEPT A BID ──────────────────────────────────────────────────────
    /// Called by the client who owns a job to accept one of its bids,
    /// moving the job from Open → Assigned.
    pub fn accept_bid(env: Env, job_id: u64, bid_id: u64) {
        // Validate job
        let mut job = Self::view_job(env.clone(), job_id);
        if job.status != JobStatus::Open {
            log!(&env, "Job {} is not open", job_id);
            panic!("Job is not open");
        }

        // Validate bid belongs to this job and is not already accepted
        let mut bid = Self::view_bid(env.clone(), bid_id);
        if bid.job_id != job_id {
            log!(&env, "Bid {} does not belong to Job {}", bid_id, job_id);
            panic!("Bid does not belong to this job");
        }
        if bid.accepted {
            log!(&env, "Bid {} is already accepted", bid_id);
            panic!("Bid is already accepted");
        }

        // Update job → Assigned
        job.status = JobStatus::Assigned;
        job.assigned_bid = bid_id;

        // Mark bid as accepted
        bid.accepted = true;

        // Persist
        env.storage().instance().set(&JobBook::Job(job_id), &job);
        env.storage().instance().set(&BidBook::Bid(bid_id), &bid);
        env.storage().instance().extend_ttl(5000, 5000);

        log!(&env, "Bid {} accepted for Job {}", bid_id, job_id);
    }

    // ── 4. COMPLETE A JOB ────────────────────────────────────────────────────
    /// Called by the client after delivery to mark the job Completed.
    /// Moves job from Assigned → Completed and updates hub stats.
    pub fn complete_job(env: Env, job_id: u64) {
        let mut job = Self::view_job(env.clone(), job_id);
        if job.status != JobStatus::Assigned {
            log!(&env, "Job {} must be Assigned before completion", job_id);
            panic!("Job must be in Assigned state to complete");
        }

        job.status = JobStatus::Completed;

        let mut stats = Self::view_hub_stats(env.clone());
        stats.total_completed += 1;

        env.storage().instance().set(&JobBook::Job(job_id), &job);
        env.storage().instance().set(&HUB_STATS, &stats);
        env.storage().instance().extend_ttl(5000, 5000);

        log!(&env, "Job {} marked as Completed", job_id);
    }

    // ── READ-ONLY VIEWS ───────────────────────────────────────────────────────

    /// Returns platform-wide statistics.
    pub fn view_hub_stats(env: Env) -> HubStats {
        env.storage().instance().get(&HUB_STATS).unwrap_or(HubStats {
            total_jobs: 0,
            total_bids: 0,
            total_completed: 0,
        })
    }

    /// Returns the full details of a job by its ID.
    pub fn view_job(env: Env, job_id: u64) -> Job {
        env.storage()
            .instance()
            .get(&JobBook::Job(job_id))
            .unwrap_or(Job {
                job_id: 0,
                title: String::from_str(&env, "Not_Found"),
                descrip: String::from_str(&env, "Not_Found"),
                budget: 0,
                posted_at: 0,
                status: JobStatus::Completed, // sentinel: no open slot
                assigned_bid: 0,
            })
    }

    /// Returns the full details of a bid by its ID.
    pub fn view_bid(env: Env, bid_id: u64) -> Bid {
        env.storage()
            .instance()
            .get(&BidBook::Bid(bid_id))
            .unwrap_or(Bid {
                bid_id: 0,
                job_id: 0,
                proposal: String::from_str(&env, "Not_Found"),
                ask_price: 0,
                submitted_at: 0,
                accepted: false,
            })
    }
}