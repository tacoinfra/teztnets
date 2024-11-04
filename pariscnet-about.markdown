---
layout: page
title: ParisCnet
permalink: /pariscnet-about
---

Test Chain for Paris replacement protocol

| | |
|-------|---------------------|
| Public RPC endpoints | [https://rpc.pariscnet.teztnets.com](https://rpc.pariscnet.teztnets.com/chains/main/chain_id)<br/> |
| Faucet | [ParisCnet faucet](https://faucet.pariscnet.teztnets.com) |
| Rolling Snapshot | [ParisCnet snapshot](https://snapshots.tzinit.org/parisnet/rolling) |
| Full network name | `TEZOS_PARISCNET_2024-06-18T12:00:00Z` |
| Tezos docker build | [tezos/tezos:octez-v20.3](https://hub.docker.com/r/tezos/tezos/tags?page=1&ordering=last_updated&name=octez-v20.3) |
| Activated on | 2024-06-18T12:00:00Z |





### Install the software

⚠️  If you already have an existing Tezos installation, do not forget to backup and delete your `~/.tezos-node` and `~/.tezos-client`.



#### Alternative: Use docker

To join ParisCnet with docker, open a shell in the container:

```
docker run -it --entrypoint=/bin/sh tezos/tezos:octez-v20.3
```


#### Alternative: Build the software

⚠️  If this is your first time installing Tezos, you may need to [install a few dependencies](https://tezos.gitlab.io/introduction/howtoget.html#setting-up-the-development-environment-from-scratch).

```
cd
git clone git@gitlab.com:tezos/tezos.git
cd tezos
git checkout octez-v20.3
opam init # if this is your first time using OPAM
make build-deps
eval $(opam env)
make
export PATH=$HOME/tezos:$PATH
```

### Join the ParisCnet network

Run the following commands:

```
octez-node config init --network https://teztnets.com/pariscnet

octez-node run --rpc-addr 127.0.0.1:8732
```






### Bake on the ParisCnet network

To improve reliability of the chain, you can take part in the consensus by becoming a baker. In that case, you will need some test tokens from the [faucet](https://faucet.pariscnet.teztnets.com).

If you are not a bootstrap baker, you need to register your key as a delegate using your alias or `pkh`. For instance:
```bash=2
octez-client register key mykey as delegate
```

On a modern Tezos network, you will need to stake to declare your security bond.  You will need to have access to at least 6000tz of stake to get baking rights. For instance:
```
octez-client stake <amount> for mykey
```	

You may now launch the baker process.
```bash=3
octez-baker-PsParisC run with local node ~/.tezos-node mykey --liquidity-baking-toggle-vote pass
```

You may run the accuser as well:
```bash=3
octez-accuser-PsParisC run
```

Note that you need a minimum amount of tez to get baking rights. If you are not a bootstrap baker, it will take you several cycles to start baking.

> 💡 Now that you are baking, you are responsible for the network health. Please ensure that the baking processes will keep running in the background. You may want to use screen, tmux, nohup or systemd. Also make sure that the baking processes will restart when your machine restarts.


