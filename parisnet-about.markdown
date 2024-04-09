---
layout: page
title: Parisnet
permalink: /parisnet-about
---

Test Chain for Paris protocol

| | |
|-------|---------------------|
| Public RPC endpoints | [https://rpc.parisnet.teztnets.com](https://rpc.parisnet.teztnets.com/chains/main/chain_id)<br/> |
| Faucet | [Parisnet faucet](https://faucet.parisnet.teztnets.com) |
| Full network name | `TEZOS_PARISNET_2024-04-10T15:00:00Z` |
| Tezos docker build | [tezos/tezos:octez-v20.0-rc1](https://hub.docker.com/r/tezos/tezos/tags?page=1&ordering=last_updated&name=octez-v20.0-rc1) |
| Activated on | 2024-04-10T15:00:00Z |





### Install the software

⚠️  If you already have an existing Tezos installation, do not forget to backup and delete your `~/.tezos-node` and `~/.tezos-client`.



#### Alternative: Use docker

To join Parisnet with docker, open a shell in the container:

```
docker run -it --entrypoint=/bin/sh tezos/tezos:octez-v20.0-rc1
```

#### Alternative: Build the software

⚠️  If this is your first time installing Tezos, you may need to [install a few dependencies](https://tezos.gitlab.io/introduction/howtoget.html#setting-up-the-development-environment-from-scratch).

```
cd
git clone git@gitlab.com:tezos/tezos.git
cd tezos
git checkout octez-v20.0-rc1
opam init # if this is your first time using OPAM
make build-deps
eval $(opam env)
make
export PATH=$HOME/tezos:$PATH
```

### Join the Parisnet network

Run the following commands:

```
octez-node config init --network https://teztnets.com/parisnet

octez-node run --rpc-addr 127.0.0.1:8732
```






