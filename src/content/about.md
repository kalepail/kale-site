---
# TODO add an about page explaining what this is and how to use it
---

# About

Welcome to the KALE farming web application! 

This page explains everything you need to know to participate in the groundbreaking KALE revolution. At the end of this guide, you should have the necessary knowledge and inspiration to cultivate mounds of delicious KALE using the web farmer along with other dedicated farmers.

This app has quite a few moving parts and is a bit of a scrappy operation, so let’s dive in and get started.

## Quick overview

KALE is an asset issued on the Stellar blockchain that can be acquired through a [mining contract](https://stellar.expert/explorer/public/contract/CDL74RF5BLYR2YBLCCI7F5FB6TPSCLKEJUBSD2RSVWZ4YHF3VMFAIGWA). The more KALE you have, the higher you are on the [leaderboard](/leaderboard) and the more clout you have amongst your fellow KALE HODLers. 

Learn more about what to do with your KALE (kaletility) in subsequent sections.

## The KALE asset

Assets exist in two forms on Stellar: 1) as custom tokens created by smart contracts (`C…` addresses), and 2) as assets issued by classic Stellar accounts (`G…` addresses). Each asset issued by a `G…` address has a built-in Stellar Asset Contract (SAC) that allows it to be accessible to Stellar smart contracts.

KALE is an asset issued by a `G…` address and deployed as a SAC on the network, which is what farmers interact with to farm KALE. Currently, 2,500 KALE tokens are emitted per block, with emissions reducing by 5% every 30 days.

View the [KALE asset](https://stellar.expert/explorer/public/asset/KALE-GBDVX4VELCDSQ54KQJYTNHXAHFLBCA77ZY2USQBM4CSHTTV7DME7KALE-1) and its [SAC address](https://stellar.expert/explorer/public/contract/CB23WRDQWGSP6YPMY4UV5C4OW5CBTXKYN3XEATG7KJEZCXMJBYEHOUOV) on the Stellar Expert block explorer.

## Performing actions with passkeys

Any action performed in the KALE application requires you to input a passkey. You can learn more about passkeys in [this article](https://stellar.org/blog/developers/passkeys-a-light-introduction-to-improving-blockchain-s-ux), but essentially, they are a powerful and secure authentication method commonly used in Web2 that has recently been incorporated into the Web3 and blockchain space. 

Passkeys significantly improve the user experience in blockchain by replacing public and private keys and passphrases typically used for user authentication. Instead, passkeys use biometrics (like fingerprints) or a device PIN to authorize transactions.

In the KALE web application, you use passkeys to:

* Create a new account to become a farmer (this will be a `C…` address, also called a [smart wallet](https://stellar.org/learn/crypto-smart-contract-wallets))
* Login to your account
* Automate farming
* Climb the leaderboard
* Send a message in the Chat
* Transfer KALE to another address

## A peek under the hood

Farming KALE requires you to perform three main actions: plant, work, and harvest. You can perform each of these actions once per block.

1. `Plant`

This is the staking component. You must stake KALE to commit your interest in farming a block and to increase your KALE bounty. A stake of 0 KALE is allowed and is the only way to start the farming process. The more KALE you stake, the more your potential rewards.

You can select the amount of your KALE to stake by adjusting the “Stake %” bar at the top of the screen. Keep in mind that staking your KALE will move it from your overall KALE amount to the staked amount.

2. `Work`

This is the mining step that happens once you’ve planted (or staked) your KALE. The mining process involves hash mining, where the goal is to generate a valid hash with the maximum number of prefix zeros. The more prefix zeros in the hash you submit, the more KALE you’ll be able to harvest. 

Each generated hash contains the following data: your wallet address, the last hash of the previous block (called Entropy in the KALE universe), and a nonce (this variable changes for every hash attempt, which is handled automatically by the KALE web application).

While you can customize your mining process outside the web application, the application itself generates a fixed number of hashes based on your device's available CPUs and automatically selects the hash with the most prefix zeros to submit.

3. `Harvest`

Once you’ve planted and worked your KALE in a block, you can proceed to harvest it. The harvest function calculates your share of the KALE reward based on your contributions to the block against the total contributions of the other farmers. Contributions are based on:

* How much KALE you staked;
* The time between planting and working (shown as the “Gap” in the Work column, which represents the number of ledgers that closed between planting and working);
* The number of prefix zeros in the submitted hash (also displayed in the Work column, where you can see how many prefix zeros were generated per hash).

You can see the total amount of KALE you have successfully harvested by viewing the green bar in the upper-right corner of the screen.

## Risks, rewards, & automation

There are several factors that determine how much KALE you will harvest in each block:

* Planting (or staking) more KALE increases your potential rewards;
* Waiting longer between planting and working allows your KALE to ripen, resulting in higher rewards;
* However, if you wait too long to work the KALE after planting, you may miss the block closure and risk losing all your staked KALE and any potential rewards; 
* Submitting a hash with more prefix zeros increases your potential KALE rewards;
* Be sure to harvest your KALE in a timely manner! Rewards are [temporary storage entries](https://developers.stellar.org/docs/learn/encyclopedia/storage/state-archival#temporary) and will expire after 24 hours. Don’t let that KALE sit out and rot!

Don’t want to be stuck pushing a ton of buttons? No worries! Enable the “lazy farmer” automation feature by selecting the “Automate” checkbox in the upper-left corner of the screen. Once activated, this feature will automatically handle the planting, working, and harvesting processes for you, eliminating the need for manually clicking the buttons.

**Caution:** There is some inherent risk in staking KALE and having the automation feature enabled. However, we’ve implemented some features to help lower that risk, including:

* If any automation task fails, the stake amount will drop back to 0%
* If automation fails >= 12 times, automation will be disabled
* If automation is disabled, you must manually click the checkbox again for it to restart

## Common harvest hazards

Things don’t work sometimes; that’s just the way of the world. Here are some common pitfalls and potential solutions to try if your farming operation just isn’t doing it for ya.

* Keep your farming tab active so the automation feature stays on. This can be tricky, seeing as many of us are clicking around a lot during the day. Fortunately, we’ve got a snappy tune to help. Just play the kale song at the bottom of the page to keep your tab active. Don’t want to listen to it on repeat? Mute your computer. Not the song. For some reason, muting the song doesn’t work. I told you, it’s a scrappy operation.
* If your automation feature still isn’t staying on, try clearing your cache, opening and closing your browser, and logging in and out of your KALE account.
* Be sure you’re farming KALE from this site: [https://kalefarm.xyz/](https://kalefarm.xyz/). 
* If you hit a snag in your farming and missed a couple of harvests, you can use the [KaleFail Tractor](https://kalefail.elliotfriend.com/tractor) to find and harvest any non-expired KALE you may have missed.

## Other fun, leafy green-related goodness

Boast about your KALE harvest in the [#kale channel in the Stellar Global Discord](https://discord.com/channels/761985725453303838/1346146802990186589).

Delve into the [KALE lore](https://kalepail.com/kale); more chapters will be released as the KALE adventure continues.

To learn how to farm KALE without the web application, visit the KALEpail Project [GitHub page](https://github.com/kalepail/KALE-sc). You’ll most likely want to use Launchtube tokens when farming KALE outside of the web application. Get Launchtube tokens by asking for one in Discord or buying a token with your hard-earned KALE by clicking the [Buy a Launchtube token link](https://kalefarm.xyz/launchtube/) at the bottom of the web application page.

Trade your KALE for other vegetables at the [KaleFail Trading Post](https://kalefail.elliotfriend.com/)! Then trade your vegetables for a salad NFT in the [KaleFail Kitchen](https://kalefail.elliotfriend.com/kitchen)! 

Now get out there and farm that delicious and nutritious KALE 🥬! 
