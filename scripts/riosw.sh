

PROTO=PsRiotumaAMotcRoDWW1bysEhQy2n1M5fy8JgRp8jjRfHGmfeA7
KEY=qdictator
FAUCET=oxford_rich_fund 
ENDPOINT="https://rpc.rionet.teztnets.com"

echo "Switching to $PROTO"

~/tezos/tezos/octez-client -E ${ENDPOINT} transfer 2 from ${FAUCET} to $KEY --burn-cap 0.06425

~/tezos/tezos/octez-client -E ${ENDPOINT} transfer 1 from ${KEY} to $FAUCET --burn-cap 0.06425


echo "octez-client -E ${ENDPOINT} submit proposals for $KEY $PROTO --force"
#octez-client -E ${ENDPOINT} submit proposals for $KEY $PROTO --force
