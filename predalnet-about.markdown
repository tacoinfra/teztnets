---
layout: page
title: Predalnet
permalink: /predalnet-about
---

Test Chain for DAL

| | |
|-------|---------------------|
| Public RPC endpoints | [https://rpc.predalnet.teztnets.com](https://rpc.predalnet.teztnets.com/chains/main/chain_id)<br/> |
| Faucet | [Predalnet faucet](https://faucet.predalnet.teztnets.com) |
| Full network name | `TEZOS_PREDALNET_2024-03-04T15:00:00Z` |
| Tezos docker build | [tezos/tezos:master](https://hub.docker.com/r/tezos/tezos/tags?page=1&ordering=last_updated&name=master) |
| Activated on | 2024-03-04T15:00:00Z |





### Install the software

⚠️  If you already have an existing Tezos installation, do not forget to backup and delete your `~/.tezos-node` and `~/.tezos-client`.



#### Alternative: Use docker

To join Predalnet with docker, open a shell in the container:

```
docker run -it --entrypoint=/bin/sh tezos/tezos:master
```

#### Alternative: Build the software

⚠️  If this is your first time installing Tezos, you may need to [install a few dependencies](https://tezos.gitlab.io/introduction/howtoget.html#setting-up-the-development-environment-from-scratch).

```
cd
git clone git@gitlab.com:tezos/tezos.git
cd tezos
git checkout master
opam init # if this is your first time using OPAM
make build-deps
eval $(opam env)
make
export PATH=$HOME/tezos:$PATH
```

### Join the Predalnet network

Run the following commands:

```
octez-node config init --network https://teztnets.com/predalnet

octez-node run --rpc-addr 127.0.0.1:8732
```




### Data Availability Layer

This network is running [Data Availability Layer](https://tezos.gitlab.io/shell/dal.html) nodes.


The DAL nodes are accessible with the following endpoints:

| | RPC | P2P Endpoint |
|------------|---------|--------------|
| DAL Bootstrap | [Link](https://dal-bootstrap-rpc.predalnet.teztnets.com/p2p/gossipsub/scores) | `dal.predalnet.teztnets.com:11732` |
| DAL Teztnets Attester | [Link](https://dal-attester-rpc.predalnet.teztnets.com/p2p/gossipsub/scores) | `dal1.predalnet.teztnets.com:11732` |


For more info, read this [blog post from Nomadic Labs](https://research-development.nomadic-labs.com/data-availability-layer-tezos.html).



