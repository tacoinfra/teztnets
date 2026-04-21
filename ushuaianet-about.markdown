---
layout: page
title: Ushuaianet
permalink: /ushuaianet-about
---

Test Chain for Ushuaia protocol proposal

| | |
|-------|---------------------|
| Public RPC endpoints | [https://rpc.ushuaianet.teztnets.com](https://rpc.ushuaianet.teztnets.com/chains/main/chain_id)<br/> |
| Full network name | `TEZOS_USHUAIANET_2026-04-21T14:00:00Z` |
| Tezos docker build | [tezos/tezos:master_43dd36f3_20260421091111](https://hub.docker.com/r/tezos/tezos/tags?page=1&ordering=last_updated&name=master_43dd36f3_20260421091111) |
| Activated on | 2026-04-21T14:00:00Z |
| Rolling Snapshot | [Ushuaianet snapshot](https://snapshots.tzinit.org/ushuaianet/rolling) |
| Faucet | [Ushuaianet faucet](https://faucet.ushuaianet.teztnets.com) |





### Install the software

⚠️  If you already have an existing Tezos installation, do not forget to backup and delete your `~/.tezos-node` and `~/.tezos-client`.



#### Alternative: Use docker

To join Ushuaianet with docker, open a shell in the container:

```
docker run -it --entrypoint=/bin/sh tezos/tezos:master_43dd36f3_20260421091111
```


#### Alternative: Build the software

⚠️  If this is your first time installing Tezos, you may need to [install a few dependencies](https://tezos.gitlab.io/introduction/howtoget.html#setting-up-the-development-environment-from-scratch).

```
cd
git clone git@gitlab.com:tezos/tezos.git
cd tezos
git checkout 43dd36f3
opam init # if this is your first time using OPAM
make build-deps
eval $(opam env)
make
export PATH=$HOME/tezos:$PATH
```

### Join the Ushuaianet network

Run the following commands:

```
octez-node config init --network https://teztnets.com/ushuaianet

```


### Recover from a snapshot

```
wget -O snapshot_file https://snapshots.tzinit.org/ushuaianet/rolling
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
| DAL Bootstrap | [Link](https://dal-bootstrap-rpc.ushuaianet.teztnets.com/p2p/gossipsub/scores) | `dal.ushuaianet.teztnets.com:11732` |
| DAL Teztnets Attester | [Link](https://dal-attester-rpc.ushuaianet.teztnets.com/p2p/gossipsub/scores) | `dal1.ushuaianet.teztnets.com:11732` |


For more info, read this [blog post from Nomadic Labs](https://research-development.nomadic-labs.com/data-availability-layer-tezos.html).



### Bake on the Ushuaianet network

To improve reliability of the chain, you can take part in the consensus by becoming a baker. In that case, you will need some test tokens from the [faucet](https://faucet.ushuaianet.teztnets.com).

If you are not a bootstrap baker, you need to register your key as a delegate using your alias or `pkh`. For instance:
```bash=2
octez-client register key mykey as delegate
```

On a modern Tezos network, you will need to stake to declare your security bond.  You will need to have access to at least 6000tz of stake to get baking rights. For instance:
```
octez-client stake <amount> for mykey
```

Ideally you should run a DAL node.
```
octez-dal-node config init
octez-dal-node run
```

You may now launch the baker process (connecting to the DAL node).
```bash=3
octez-baker run with local node ~/.tezos-node mykey --liquidity-baking-toggle-vote pass --dal-node http://localhost:10732
```

You may run the accuser as well:
```bash=3
octez-accuser run
```

Note that you need a minimum amount of tez to get baking rights. If you are not a bootstrap baker, it will take you several cycles to start baking.

> 💡 Now that you are baking, you are responsible for the network health. Please ensure that the baking processes will keep running in the background. You may want to use screen, tmux, nohup or systemd. Also make sure that the baking processes will restart when your machine restarts.


