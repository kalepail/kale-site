<script lang="ts">
    import { Asset, Horizon } from "@stellar/stellar-sdk";
    import { onMount } from "svelte";
    import { truncate } from "../utils/base";

    const horizon = new Horizon.Server(import.meta.env.PUBLIC_HORIZON_URL);

    let accounts: Horizon.ServerApi.AccountRecord[] = [];

    onMount(() => {
        getLeaderboard();
    });

    async function getLeaderboard() {
        accounts = await horizon
            .accounts()
            .limit(200)
            .forAsset(new Asset("KALE", import.meta.env.PUBLIC_KALE_ISSUER))
            .order("desc")
            .call()
            .then(({ records }) => records);

        accounts = accounts.filter(({ balances }) =>
            balances.some(
                ({ asset_code, asset_issuer, balance }: any) =>
                    asset_code === "KALE" &&
                    asset_issuer === import.meta.env.PUBLIC_KALE_ISSUER &&
                    Number(balance) > 0,
            ),
        ).sort((a, b) => {
            const aBalance = a.balances.find(
                ({ asset_code, asset_issuer }: any) =>
                    asset_code === "KALE" &&
                    asset_issuer === import.meta.env.PUBLIC_KALE_ISSUER,
            )?.balance ?? 0;
            const bBalance = b.balances.find(
                ({ asset_code, asset_issuer }: any) =>
                    asset_code === "KALE" &&
                    asset_issuer === import.meta.env.PUBLIC_KALE_ISSUER,
            )?.balance ?? 0;

            return Number(bBalance) - Number(aBalance);
        });
    }
</script>

<h1 class="text-xl font-bold mb-2">
    Leaderboard
    <aside class="text-xs font-normal">(G-address only for now)</aside>
</h1>

<ul>
    {#each accounts as account}
        <li class="font-mono">
            <a class="underline" href={`https://stellar.expert/explorer/public/account/${account.id}`} target="_blank">{truncate(account.id, 4)}</a>
            : {account.balances.find(
                ({ asset_code, asset_issuer }: any) =>
                    asset_code === "KALE" &&
                    asset_issuer === import.meta.env.PUBLIC_KALE_ISSUER,
            )?.balance ?? 0}
        </li>
    {/each}
</ul>
