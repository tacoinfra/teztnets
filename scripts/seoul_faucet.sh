

KEY=qdictator
FAUCET=farrah
ENDPOINT="https://rpc.seoulnet.teztnets.com"

~/tezos/tezos/octez-client -E ${ENDPOINT} transfer 2 from ${FAUCET} to $KEY --burn-cap 0.06425

