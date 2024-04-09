---
layout: page
title: ParisAnet
permalink: /parisanet-about
---

Exploratory Chain for Paris A protocol

| | |
|-------|---------------------|
| Public RPC endpoints | [https://rpc.parisanet.teztnets.com](https://rpc.parisanet.teztnets.com/chains/main/chain_id)<br/> |
| Faucet | [ParisAnet faucet](https://faucet.parisanet.teztnets.com) |
| Full network name | `TEZOS_PARIS_A_NET_2024-04-02T18:00:00Z` |
| Tezos docker build | [tezos/tezos:octez-v20.0-beta1_67bd1513_20240405135005](https://hub.docker.com/r/tezos/tezos/tags?page=1&ordering=last_updated&name=octez-v20.0-beta1_67bd1513_20240405135005) |
| Activated on | 2024-03-27T15:00:00Z |





### Install the software

⚠️  If you already have an existing Tezos installation, do not forget to backup and delete your `~/.tezos-node` and `~/.tezos-client`.



#### Alternative: Use docker

To join ParisAnet with docker, open a shell in the container:

```
docker run -it --entrypoint=/bin/sh tezos/tezos:octez-v20.0-beta1_67bd1513_20240405135005
```

#### Alternative: Build the software

⚠️  If this is your first time installing Tezos, you may need to [install a few dependencies](https://tezos.gitlab.io/introduction/howtoget.html#setting-up-the-development-environment-from-scratch).

```
cd
git clone git@gitlab.com:tezos/tezos.git
cd tezos
git checkout octez-v20.0-beta1_67bd1513_20240405135005
opam init # if this is your first time using OPAM
make build-deps
eval $(opam env)
make
export PATH=$HOME/tezos:$PATH
```

### Join the ParisAnet network

Run the following commands:

```
octez-node config init --network https://teztnets.com/parisanet

octez-node run --rpc-addr 127.0.0.1:8732
```






