---
layout: page
title: Foolsnet-2026
permalink: /foolsnet-2026-about
---

I'm testing something - don't worry!

<table>
<tbody>

<tr>
<td>Public RPC endpoints</td>
<td><a href="https://rpc.foolsnet-2026.teztnets.com/chains/main/chain_id">https://rpc.foolsnet-2026.teztnets.com</a><br></td>
</tr>

<tr>
<td>Full network name</td>
<td><code class="language-plaintext highlighter-rouge">TEZOS_FOOLSNET_2026-04-01T00:00:00Z</code></td>
</tr>

<tr>
<td>Tezos docker build</td>
<td>
  <div markdown="1">[tezos/tezos:v15.1](https://hub.docker.com/r/tezos/tezos/tags?page=1&ordering=last_updated&name=v15.1)</div>
</td>
</tr>

<tr>
<td>Activated on</td>
<td>2026-04-01T00:00:00Z</td>
</tr>

<tr>
<td>Faucet</td>
<td>
  <div markdown="1">[Foolsnet-2026 faucet](https://faucet.foolsnet-2026.teztnets.com)</div>
</td>
</tr>

<tr>
<td>Rolling Snapshot</td>
<td>
  <div markdown="1">[Foolsnet-2026 snapshot](https://snapshots.tzinit.org/foolsnet-2026/rolling)</div>
</td>
</tr>



</tbody>
</table>


For the first 8192 blocks, Limanet ran the Kathmandu protocol then it switched to Lima.


### Install the software

⚠️  If you already have an existing Tezos installation, do not forget to backup and delete your `~/.tezos-node` and `~/.tezos-client`.


#### Download and install Tezos version v15.1

Follow instructions from the [Tezos documentation](https://tezos.gitlab.io/introduction/howtoget.html#installing-binaries).


#### Alternative: Use docker

To join Foolsnet-2026 with docker, open a shell in the container:

```
docker run -it --entrypoint=/bin/sh tezos/tezos:v15.1
```


#### Alternative: Build the software

⚠️  If this is your first time installing Tezos, you may need to [install a few dependencies](https://tezos.gitlab.io/introduction/howtoget.html#setting-up-the-development-environment-from-scratch).

```
cd
git clone git@gitlab.com:tezos/tezos.git
cd tezos
git checkout v15.1
opam init # if this is your first time using OPAM
make build-deps
eval $(opam env)
make
export PATH=$HOME/tezos:$PATH
```

### Join the Foolsnet-2026 network

Run the following commands:

```
octez-node config init --network https://teztnets.com/foolsnet-2026

```


### Recover from a snapshot

```
wget -O snapshot_file https://snapshots.tzinit.org/foolsnet-2026/rolling
octez-node snapshot import snapshot_file
```


### Run the node

Use the following command:

```
octez-node run --rpc-addr 127.0.0.1:8732
```






### Bake on the Foolsnet-2026 network

To improve reliability of the chain, you can take part in the consensus by becoming a baker. In that case, you will need some test tokens from the [faucet](https://faucet.foolsnet-2026.teztnets.com).

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


