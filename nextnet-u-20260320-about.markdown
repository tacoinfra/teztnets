---
layout: page
title: Nextnet-U-20260320
permalink: /nextnet-u-20260320-about
---

Test Chain for Next (U) protocol

| | |
|-------|---------------------|
| Public RPC endpoints | [https://rpc.nextnet-u-20260320.teztnets.com](https://rpc.nextnet-u-20260320.teztnets.com/chains/main/chain_id)<br/> |
| Full network name | `TEZOS_NEXTUNET_2026-03-20T14:00:00Z` |
| Tezos docker build | [tezos/tezos:master_aa1d7358_20260320111418](https://hub.docker.com/r/tezos/tezos/tags?page=1&ordering=last_updated&name=master_aa1d7358_20260320111418) |
| Activated on | 2026-03-20T14:00:00Z |
| Rolling Snapshot | [Nextnet-U-20260320 snapshot](https://snapshots.tzinit.org/nextnet/rolling) |
| Faucet | [Nextnet-U-20260320 faucet](https://faucet.nextnet-u-20260320.teztnets.com) |





### Install the software

⚠️  If you already have an existing Tezos installation, do not forget to backup and delete your `~/.tezos-node` and `~/.tezos-client`.



#### Alternative: Use docker

To join Nextnet-U-20260320 with docker, open a shell in the container:

```
docker run -it --entrypoint=/bin/sh tezos/tezos:master_aa1d7358_20260320111418
```


#### Alternative: Build the software

⚠️  If this is your first time installing Tezos, you may need to [install a few dependencies](https://tezos.gitlab.io/introduction/howtoget.html#setting-up-the-development-environment-from-scratch).

```
cd
git clone git@gitlab.com:tezos/tezos.git
cd tezos
git checkout aa1d7358
opam init # if this is your first time using OPAM
make build-deps
eval $(opam env)
make
export PATH=$HOME/tezos:$PATH
```

### Join the Nextnet-U-20260320 network

Run the following commands:

```
octez-node config init --network https://teztnets.com/nextnet-u-20260320

```


### Recover from a snapshot

```
wget -O snapshot_file https://snapshots.tzinit.org/nextnet/rolling
octez-node snapshot import snapshot_file
```


### Run the node

Use the following command:

```
octez-node run --rpc-addr 127.0.0.1:8732
```




### Data Availability Layer

This network is running [Data Availability Layer](https://tezos.gitlab.io/shell/dal.html) nodes.


The DAL nodes are accessible with the following endpoints:

| | RPC | P2P Endpoint |
|------------|---------|--------------|
| DAL Bootstrap | [Link](https://dal-bootstrap-rpc.nextnet-u-20260320.teztnets.com/p2p/gossipsub/scores) | `dal.nextnet-u-20260320.teztnets.com:11732` |
| DAL Teztnets Attester | [Link](https://dal-attester-rpc.nextnet-u-20260320.teztnets.com/p2p/gossipsub/scores) | `dal1.nextnet-u-20260320.teztnets.com:11732` |


For more info, read this [blog post from Nomadic Labs](https://research-development.nomadic-labs.com/data-availability-layer-tezos.html).



