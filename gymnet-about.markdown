---
layout: page
title: gymnet
permalink: /gymnet-about
---

Gymnet Internal Test Network

| | |
|-------|---------------------|
| Public RPC endpoints | [https://rpc.gymnet.teztnets.com](https://rpc.gymnet.teztnets.com/chains/main/chain_id)<br/> |
| Faucet | [gymnet faucet](https://faucet.gymnet.teztnets.com) |
| Rolling Snapshot | [gymnet snapshot](https://snapshots.tzinit.org/gymnet/rolling) |
| Full network name | `TEZOS_RIONET_2025-07-23T07:00:00Z` |
| Tezos docker build | [tezos/tezos:picdc_account_registry](https://hub.docker.com/r/tezos/tezos/tags?page=1&ordering=last_updated&name=picdc_account_registry) |
| Activated on | 2025-07-23T07:00:00Z |





### Install the software

⚠️  If you already have an existing Tezos installation, do not forget to backup and delete your `~/.tezos-node` and `~/.tezos-client`.



#### Alternative: Use docker

To join gymnet with docker, open a shell in the container:

```
docker run -it --entrypoint=/bin/sh tezos/tezos:picdc_account_registry
```


#### Alternative: Build the software

⚠️  If this is your first time installing Tezos, you may need to [install a few dependencies](https://tezos.gitlab.io/introduction/howtoget.html#setting-up-the-development-environment-from-scratch).

```
cd
git clone git@gitlab.com:tezos/tezos.git
cd tezos
git checkout picdc_account_registry
opam init # if this is your first time using OPAM
make build-deps
eval $(opam env)
make
export PATH=$HOME/tezos:$PATH
```

### Join the gymnet network

Run the following commands:

```
octez-node config init --network https://teztnets.com/gymnet

```


### Recover from a snapshot

```
wget -O snapshot_file https://snapshots.tzinit.org/gymnet/rolling
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
| DAL Bootstrap | [Link](https://dal-bootstrap-rpc.gymnet.teztnets.com/p2p/gossipsub/scores) | `dal.gymnet.teztnets.com:11732` |
| DAL Teztnets Attester | [Link](https://dal-attester-rpc.gymnet.teztnets.com/p2p/gossipsub/scores) | `dal1.gymnet.teztnets.com:11732` |


For more info, read this [blog post from Nomadic Labs](https://research-development.nomadic-labs.com/data-availability-layer-tezos.html).



