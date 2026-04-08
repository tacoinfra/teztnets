---
layout: page
title: Ghostnet
permalink: /ghostnet-about
---

Ghostnet is the long-running testnet for Tezos, **but is deprecated - use Shadownet.**

| | |
|-------|---------------------|
| Public RPC endpoints | [https://rpc.ghostnet.teztnets.com](https://rpc.ghostnet.teztnets.com/chains/main/chain_id)<br/> |
| Full network name | `TEZOS_ITHACANET_2022-01-25T15:00:00Z` |
| Tezos docker build | [tezos/tezos:octez-v24.3](https://hub.docker.com/r/tezos/tezos/tags?page=1&ordering=last_updated&name=octez-v24.3) |
| Activated on | 2022-01-25T15:00:00Z |
| Rolling Snapshot | [Ghostnet snapshot](https://snapshots.tzinit.org/ghostnet/rolling) |






### Install the software

⚠️  If you already have an existing Tezos installation, do not forget to backup and delete your `~/.tezos-node` and `~/.tezos-client`.



#### Alternative: Use docker

To join Ghostnet with docker, open a shell in the container:

```
docker run -it --entrypoint=/bin/sh tezos/tezos:octez-v24.3
```


#### Alternative: Build the software

⚠️  If this is your first time installing Tezos, you may need to [install a few dependencies](https://tezos.gitlab.io/introduction/howtoget.html#setting-up-the-development-environment-from-scratch).

```
cd
git clone git@gitlab.com:tezos/tezos.git
cd tezos
git checkout octez-v24.3
opam init # if this is your first time using OPAM
make build-deps
eval $(opam env)
make
export PATH=$HOME/tezos:$PATH
```

### Join the Ghostnet network

Run the following commands:

```
octez-node config init --network ghostnet

```


### Recover from a snapshot

```
wget -O snapshot_file https://snapshots.tzinit.org/ghostnet/rolling
octez-node snapshot import snapshot_file
```


### Run the node

Use the following command:

```
octez-node run --rpc-addr 127.0.0.1:8732
```






