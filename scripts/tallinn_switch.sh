

NETWORK=tallinnnet
PROTO=PtTALLiNtPec7mE7yY4m3k26J8Qukef3E3ehzhfXgFZKGtDdAXu
KEY=qdictator
FAUCET=farrah
ENDPOINT="https://rpc.${NETWORK}.teztnets.com"

echo "Switching ${NETWORK} to $PROTO"
echo "CTRL+C now if wrong"
sleep 5

~/tezos/tezos/octez-client -E ${ENDPOINT} transfer 2 from ${FAUCET} to $KEY --burn-cap 0.06425
sleep 5
~/tezos/tezos/octez-client -E ${ENDPOINT} transfer 1 from ${KEY} to $FAUCET --burn-cap 0.06425
sleep 5

echo "octez-client -E ${ENDPOINT} submit proposals for $KEY $PROTO --force"
#octez-client -E ${ENDPOINT} submit proposals for $KEY $PROTO --force
