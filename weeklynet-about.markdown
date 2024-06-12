---
layout: page
title: Weeklynet
permalink: /weeklynet-about
---

A testnet that restarts every Wednesday launched from tezos/tezos master branch. It runs Oxford for 4 cycles then upgrades to proto Alpha.

| | |
|-------|---------------------|
| Public RPC endpoints | [https://rpc.weeklynet-2024-06-12.teztnets.com](https://rpc.weeklynet-2024-06-12.teztnets.com/chains/main/chain_id)<br/> |
| Faucet | [Weeklynet faucet](https://faucet.weeklynet-2024-06-12.teztnets.com) |
| Full network name | `TEZOS-WEEKLYNET-2024-06-12T00:00:00.000Z` |
| Tezos docker build | [tezos/tezos:master_f11b74fc_20240611183150](https://hub.docker.com/r/tezos/tezos/tags?page=1&ordering=last_updated&name=master_f11b74fc_20240611183150) |
| Activated on | 2024-06-12T00:00:00.000Z |





### Install the software

⚠️  If you already have an existing Tezos installation, do not forget to backup and delete your `~/.tezos-node` and `~/.tezos-client`.



#### Alternative: Use docker

To join Weeklynet with docker, open a shell in the container:

```
docker run -it --entrypoint=/bin/sh tezos/tezos:master_f11b74fc_20240611183150
```


#### Alternative: Build the software

⚠️  If this is your first time installing Tezos, you may need to [install a few dependencies](https://tezos.gitlab.io/introduction/howtoget.html#setting-up-the-development-environment-from-scratch).

```
cd
git clone git@gitlab.com:tezos/tezos.git
cd tezos
git checkout f11b74fc
opam init # if this is your first time using OPAM
make build-deps
eval $(opam env)
make
export PATH=$HOME/tezos:$PATH
```

### Join the Weeklynet network

Run the following commands:

```
octez-node config init --network https://teztnets.com/weeklynet-2024-06-12

octez-node run --rpc-addr 127.0.0.1:8732
```


### Ethereum Virtual Machine Rollup

This network is running a bleeding-edge [EVM Rollup](https://docs.etherlink.com/welcome/what-is-etherlink) from the most recent [kernel code](https://gitlab.com/tezos/tezos/-/tree/master/etherlink) in the Octez repository.

This is not to be confused with [Etherlink](https://docs.etherlink.com/get-started/connect-your-wallet-to-etherlink) which currently runs on Ghostnet.

[For Etherlink test network, go here](https://docs.etherlink.com/get-started/connect-your-wallet-to-etherlink).

| | |
|-------|---------------------|
| EVM RPC URL | [`https://evm.weeklynet-2024-06-12.teztnets.com`](https://evm.weeklynet-2024-06-12.teztnets.com) |
| Bare Rollup RPC URL | [`https://evm-rollup-node.weeklynet-2024-06-12.teztnets.com`](https://evm-rollup-node.weeklynet-2024-06-12.teztnets.com/global/block/head) |






