# On-Chain Freelancer Hub

> A decentralized, trustless freelance marketplace smart contract built on the **Stellar blockchain** using the **Soroban SDK**.

---

## Table of Contents

- [Project Title](#on-chain-freelancer-hub)
- [Project Description](#project-description)
- [Project Vision](#project-vision)
- [Key Features](#key-features)
- [Future Scope](#future-scope)

---

## Project Description

**On-Chain Freelancer Hub** is a smart contract that brings freelance work coordination fully on-chain. Clients can post jobs with a defined budget, freelancers can submit competitive bids with their proposals and quoted price, and the client selects the best bid to assign the job. Once work is delivered, the client marks the job complete — all of this without any central authority, intermediary platform, or off-chain database.

The contract is written in **Rust** using the **Soroban SDK** and is designed to be deployed on the **Stellar Futurenet / Mainnet**. It models the entire job lifecycle — from posting → bidding → assignment → completion — in four core functions, keeping the on-chain footprint lean and gas-efficient.

### Contract Functions

| Function | Caller | Description |
|---|---|---|
| `post_job(title, descrip, budget)` | Client | Publishes a new job and returns its `job_id` |
| `submit_bid(job_id, proposal, ask_price)` | Freelancer | Places a bid on an open job; returns `bid_id` |
| `accept_bid(job_id, bid_id)` | Client | Selects a winning bid; moves job to **Assigned** |
| `complete_job(job_id)` | Client | Marks the job **Completed** after delivery |

Three additional **read-only** view functions let anyone inspect platform stats, job details, and bid details:

- `view_hub_stats()` — total jobs, bids, and completions on the platform
- `view_job(job_id)` — full details of a specific job
- `view_bid(bid_id)` — full details of a specific bid

### Job Lifecycle

```
post_job()
    │
    ▼
 [Open] ──── submit_bid() ──▶ [bids accumulate]
    │
    ▼ accept_bid()
 [Assigned]
    │
    ▼ complete_job()
 [Completed]
```

### Data Structures

```rust
struct Job {
    job_id: u64,
    title: String,
    descrip: String,
    budget: u64,       // in stroops
    posted_at: u64,    // ledger timestamp
    status: JobStatus, // Open | Assigned | Completed
    assigned_bid: u64,
}

struct Bid {
    bid_id: u64,
    job_id: u64,
    proposal: String,
    ask_price: u64,    // freelancer's quoted price
    submitted_at: u64,
    accepted: bool,
}

struct HubStats {
    total_jobs: u64,
    total_bids: u64,
    total_completed: u64,
}
```

---

## Project Vision

Traditional freelancing platforms (Upwork, Fiverr, Toptal) are powerful but come with real costs: **15–20% platform fees**, **payment delays**, **account bans without recourse**, and **centralized control** over disputes and policies.

The vision of **On-Chain Freelancer Hub** is to flip this model:

> **Replace platform trust with contract trust.** Every job, bid, and outcome is a verifiable, immutable transaction on the Stellar blockchain — visible to anyone, controlled by no one.

We believe the future of work is **permissionless**: any client anywhere should be able to post a job, any freelancer anywhere should be able to bid on it, and the terms of engagement should be enforced by code — not corporate policy. Stellar's low transaction fees and fast finality make it uniquely suited for this use case, enabling micro-contracts that would be economically unviable on other chains.

---

## Key Features

- **Fully On-Chain Job Lifecycle** — Every state transition (post → bid → assign → complete) is a blockchain transaction. No off-chain database, no backend server.

- **Competitive Bidding** — Jobs stay open to multiple bids simultaneously. Clients compare proposals and `ask_price` values before selecting the best fit, creating natural price discovery.

- **Immutable Audit Trail** — All job posts, bids, acceptances, and completions are stored permanently in Soroban instance storage. Any party can independently verify the history.

- **Lean 4-Function Design** — The core contract is intentionally minimal: four write functions cover the complete workflow, reducing attack surface and keeping gas costs predictable.

- **Platform-Wide Stats** — `HubStats` tracks aggregate platform health (total jobs, bids, completions) in a single storage slot, making it easy to build dashboards or leaderboards on top.

- **Soroban-Native Types** — All strings use `soroban_sdk::String`, all timestamps use the ledger clock (`env.ledger().timestamp()`), and storage TTLs are actively managed with `extend_ttl` to prevent data expiry.

- **Input Validation & Panic Guards** — Every write function validates preconditions (non-zero budget, correct job status, matching job/bid ownership) and panics with descriptive messages on violation.

---

## Future Scope

The current contract is a **minimal viable core**. The following extensions are planned or under research:

| Feature | Description |
|---|---|
| **Escrow Payments** | Integrate Stellar's native asset transfers so budget funds are locked in escrow at `post_job` and released to the freelancer at `complete_job` — eliminating payment risk entirely |
| **Reputation / Ratings** | Post-completion, both client and freelancer submit on-chain ratings. Cumulative scores become a portable, unkillable reputation profile |
| **Dispute Resolution** | A multi-sig arbitration mechanism where a panel of staked arbitrators can override job status in case of a dispute |
| **Milestone-Based Jobs** | Break large jobs into milestones, each with its own budget slice, bid, and completion step — enabling long-term projects without full upfront escrow |
| **Freelancer Profiles** | A separate `FreelancerProfile` contract or storage namespace storing skills, portfolio links (IPFS CIDs), and historical stats per address |
| **Category & Tag Indexing** | Off-chain indexers (The Graph / Stellar Horizon) consuming contract events to enable search and filtering by job category without bloating on-chain storage |
| **DAO Governance** | Platform fee parameters and dispute rules governed by a token-weighted DAO, giving the community control over the protocol |
| **Multi-Currency Support** | Accept bids and payments in any Stellar-issued asset (USDC, EUR stablecoins, etc.) via Soroban's token interface |

---
## Contract Details

Contract ID - CCV2N6JKKNQUKZIKNJPBHD7GICZESEXHQ73Q2CHBN5W5DSXXI36NG6NN

<img width="1865" height="725" alt="image" src="https://github.com/user-attachments/assets/52e44381-8bd0-4c37-8bcb-8c5c677ec7d1" />


*Built with ❤️ on Stellar · Powered by Soroban SDK*
