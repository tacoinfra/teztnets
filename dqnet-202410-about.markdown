---
layout: page
title: DQnet-202410
permalink: /dqnet-202410-about
---

Invitation only test chain for a pure DAL baking network. Please DM the Chief Baker.

| | |
|-------|---------------------|
| Public RPC endpoints | [https://rpc.dqnet-202410.teztnets.com](https://rpc.dqnet-202410.teztnets.com/chains/main/chain_id)<br/> |
| Faucet | [DQnet-202410 faucet](https://faucet.dqnet-202410.teztnets.com) |
| Rolling Snapshot | [DQnet-202410 snapshot](https://snapshots.tzinit.org/dqnet-202410/rolling) |
| Full network name | `TEZOS_DQNET_2024-10-17T08:00:00Z` |
| Tezos docker build | [tezos/tezos:master_64df48cf_20241017065944](https://hub.docker.com/r/tezos/tezos/tags?page=1&ordering=last_updated&name=master_64df48cf_20241017065944) |
| Activated on | 2024-10-17T08:00:00Z |





### Install the software

⚠️  If you already have an existing Tezos installation, do not forget to backup and delete your `~/.tezos-node` and `~/.tezos-client`.



#### Alternative: Use docker

To join DQnet-202410 with docker, open a shell in the container:

```
docker run -it --entrypoint=/bin/sh tezos/tezos:master_64df48cf_20241017065944
```


#### Alternative: Build the software

⚠️  If this is your first time installing Tezos, you may need to [install a few dependencies](https://tezos.gitlab.io/introduction/howtoget.html#setting-up-the-development-environment-from-scratch).

```
cd
git clone git@gitlab.com:tezos/tezos.git
cd tezos
git checkout 64df48cf
opam init # if this is your first time using OPAM
make build-deps
eval $(opam env)
make
export PATH=$HOME/tezos:$PATH
```

### Join the DQnet-202410 network

Run the following commands:

```
octez-node config init --network https://teztnets.com/dqnet-202410

```


### Recover from a snapshot

```
wget -O snapshot_file https://snapshots.tzinit.org/dqnet-202410/rolling
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
| DAL Bootstrap | [Link](https://dal-bootstrap-rpc.dqnet-202410.teztnets.com/p2p/gossipsub/scores) | `dal.dqnet-202410.teztnets.com:11732` |
| DAL Teztnets Attester | [Link](https://dal-attester-rpc.dqnet-202410.teztnets.com/p2p/gossipsub/scores) | `dal1.dqnet-202410.teztnets.com:11732` |


For more info, read this [blog post from Nomadic Labs](https://research-development.nomadic-labs.com/data-availability-layer-tezos.html).



