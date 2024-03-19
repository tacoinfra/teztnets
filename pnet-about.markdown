---
layout: page
title: Pnet
permalink: /pnet-about
---

Test Chain for P protocol

| | |
|-------|---------------------|
| Public RPC endpoints | [https://rpc.pnet.teztnets.com](https://rpc.pnet.teztnets.com/chains/main/chain_id)<br/> |
| Faucet | [Pnet faucet](https://faucet.pnet.teztnets.com) |
| Full network name | `TEZOS_PARISENET_2024-03-19T20:00:00Z` |
| Tezos docker build | [tezos/tezos:master](https://hub.docker.com/r/tezos/tezos/tags?page=1&ordering=last_updated&name=master) |
| Activated on | 2024-03-19T20:00:00Z |





### Install the software

⚠️  If you already have an existing Tezos installation, do not forget to backup and delete your `~/.tezos-node` and `~/.tezos-client`.



#### Alternative: Use docker

To join Pnet with docker, open a shell in the container:

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

### Join the Pnet network

Run the following commands:

```
octez-node config init --network https://teztnets.com/pnet

octez-node run --rpc-addr 127.0.0.1:8732
```






